import "server-only"

import { randomUUID } from "node:crypto"

import type { AdminActor } from "@/lib/auth/admin-api"
import { AssetError } from "@/lib/assets/errors"
import { processAsset as defaultProcessAsset, type ProcessedAsset } from "@/lib/assets/image-processor"
import { parseUploadIntent } from "@/lib/assets/policy"
import { assetStore, AssetStoreError, type AssetMetadataInput, type MediaAssetRepository } from "@/lib/assets/store"
import { BlobStore, BlobStoreError, type PublicBlob } from "@/lib/assets/blob-store"
import { mediaTelemetry, type MediaTelemetry } from "@/lib/assets/telemetry"
import type { MediaAsset, MediaAssetListFilter, MediaAssetPage, UploadIntent, UploadIntentInput } from "@/lib/assets/types"

export type AssetServiceErrorCode =
  | "not_found"
  | "invalid_state"
  | "asset_referenced"
  | "conflict"
  | "unavailable"

export class AssetServiceError extends Error {
  constructor(public readonly code: AssetServiceErrorCode) {
    super(code)
    this.name = "AssetServiceError"
  }
}

type BlobStoreBoundary = Pick<
  BlobStore,
  "readPrivate" | "putPublic" | "headPublic" | "deletePrivate" | "deletePublic"
>

export type AssetServiceDependencies = {
  repository: MediaAssetRepository
  blobStore: BlobStoreBoundary
  processAsset: (bytes: Uint8Array, originalFilename: string) => Promise<ProcessedAsset>
  telemetry: MediaTelemetry
  now: () => Date
}

export interface AssetService {
  createIntent(input: unknown, actor: AdminActor): Promise<UploadIntent>
  recordUploadCompleted(
    id: string,
    pathname: string,
    url: string,
    actor: AdminActor,
  ): Promise<MediaAsset>
  finalize(id: string, actor: AdminActor): Promise<MediaAsset>
  list(filter: MediaAssetListFilter): Promise<MediaAssetPage>
  get(id: string): Promise<MediaAsset>
  updateMetadata(id: string, input: AssetMetadataInput, actor: AdminActor): Promise<MediaAsset>
  archive(id: string, actor: AdminActor): Promise<MediaAsset>
  restore(id: string, actor: AdminActor): Promise<MediaAsset>
  delete(id: string, actor: AdminActor): Promise<MediaAsset>
  cleanup(now: Date): Promise<AssetCleanupResult>
}

export type AssetCleanupResult = {
  processingTimedOut: number
  stagingDeleted: number
  deletionsCompleted: number
  failures: number
}

const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"] as const
const maxBytes = 10 * 1024 * 1024

function normalizeError(error: unknown): AssetServiceError {
  if (error instanceof AssetServiceError) return error
  if (error instanceof AssetStoreError) {
    return new AssetServiceError(error.code)
  }
  if (error instanceof BlobStoreError) {
    if (error.code === "not_found") return new AssetServiceError("not_found")
    if (error.code === "conflict" || error.code === "invalid_callback") {
      return new AssetServiceError("conflict")
    }
  }
  return new AssetServiceError("unavailable")
}

function cleanMetadata(input: AssetMetadataInput): AssetMetadataInput {
  const normalizeAlt = (value: string | null) => {
    if (value === null) return null
    const clean = value.trim()
    if (Array.from(clean).length > 500) throw new AssetServiceError("conflict")
    return clean || null
  }
  const tags = [...new Set(input.tags.map((tag) => tag.trim().toLocaleLowerCase("en-US")).filter(Boolean))]
  if (tags.length > 20 || tags.some((tag) => Array.from(tag).length > 40)) {
    throw new AssetServiceError("conflict")
  }
  return { altKo: normalizeAlt(input.altKo), altEn: normalizeAlt(input.altEn), tags }
}

async function cleanupStaging(
  id: string,
  pathname: string,
  actor: AdminActor,
  repository: MediaAssetRepository,
  blobStore: BlobStoreBoundary,
): Promise<void> {
  try {
    await blobStore.deletePrivate(pathname)
    await repository.clearStaging(id, actor)
  } catch {
    // Cleanup is intentionally retried independently by the recovery job.
  }
}

function ensureExistingPublicBlob(
  blob: PublicBlob,
  expectedPathname: string,
  processed: ProcessedAsset,
): void {
  if (
    blob.size !== processed.byteSize ||
    blob.pathname !== expectedPathname ||
    blob.checksumSha256 !== processed.checksumSha256
  ) {
    throw new AssetServiceError("conflict")
  }
}

export function createAssetService(dependencies: AssetServiceDependencies): AssetService {
  const { repository, blobStore, processAsset, telemetry, now } = dependencies

  return {
    async createIntent(input, actor) {
      const parsed: UploadIntentInput = parseUploadIntent(input)
      const assetId = randomUUID()
      const pathname = `staging/${assetId}/${randomUUID()}`
      try {
        await repository.createPending({
          id: assetId,
          familyId: assetId,
          ...(parsed.replaceAssetId ? { previousAssetId: parsed.replaceAssetId } : {}),
          originalFilename: parsed.originalFilename,
          declaredMediaType: parsed.declaredMediaType,
          stagingPathname: pathname,
        }, actor)
      } catch (error) {
        throw normalizeError(error)
      }
      telemetry.record("media.intent_created", { assetId, byteSize: parsed.byteSize })
      return { assetId, pathname, acceptedTypes, maxBytes }
    },

    async recordUploadCompleted(id, pathname, url, actor) {
      try {
        const asset = await repository.recordUploadCompleted(id, pathname, url, actor)
        telemetry.record("media.upload_completed", { assetId: id })
        return asset
      } catch (error) {
        throw normalizeError(error)
      }
    },

    async finalize(id, actor) {
      const existing = await repository.get(id)
      if (!existing) throw new AssetServiceError("not_found")
      if (existing.status === "ready" || existing.status === "archived") return existing

      const acquisition = await repository.acquireProcessing(id, actor)
      if (acquisition.status === "missing") throw new AssetServiceError("not_found")
      if (acquisition.status === "current") {
        if (acquisition.asset.status === "ready" || acquisition.asset.status === "archived") {
          return acquisition.asset
        }
        throw new AssetServiceError("invalid_state")
      }
      const pending = acquisition.asset
      if (!pending.stagingPathname || !pending.stagingUrl) {
        await repository.releaseProcessing(id, "staging_missing", actor)
        throw new AssetServiceError("invalid_state")
      }

      let processed: ProcessedAsset
      try {
        const bytes = await blobStore.readPrivate(pending.stagingPathname)
        processed = await processAsset(bytes, pending.originalFilename)
      } catch (error) {
        if (error instanceof AssetError) {
          await repository.markFailed(id, error.code, actor)
          telemetry.record("media.finalize_failed", { assetId: id, code: error.code })
          await cleanupStaging(id, pending.stagingPathname, actor, repository, blobStore)
          throw error
        }
        await repository.releaseProcessing(id, "storage_unavailable", actor)
        telemetry.record("media.finalize_failed", { assetId: id, code: "storage_unavailable" })
        throw normalizeError(error)
      }

      const publicPathname = `media/${id}/${processed.safeFilename}`
      try {
        await repository.recordProcessed(id, processed, actor)
        const duplicate = await repository.findDuplicate(processed.checksumSha256, id)
        if (duplicate) {
          telemetry.record("media.duplicate_detected", {
            assetId: id,
            duplicateAssetId: duplicate.id,
          })
        }

        const currentPublic = await blobStore.headPublic(publicPathname)
        let publicBlob: PublicBlob
        if (currentPublic) {
          ensureExistingPublicBlob(currentPublic, publicPathname, processed)
          publicBlob = currentPublic
        } else {
          publicBlob = await blobStore.putPublic(publicPathname, processed.bytes, processed.mediaType)
        }
        const ready = await repository.markReady(id, {
          safeFilename: processed.safeFilename,
          mediaType: processed.mediaType,
          byteSize: processed.byteSize,
          width: processed.width,
          height: processed.height,
          checksumSha256: processed.checksumSha256,
          publicPathname,
          publicUrl: publicBlob.url,
          readyAt: now(),
        }, actor)
        telemetry.record("media.finalized", {
          assetId: id,
          mediaType: processed.mediaType,
          byteSize: processed.byteSize,
        })
        await cleanupStaging(id, pending.stagingPathname, actor, repository, blobStore)
        return ready
      } catch (error) {
        try {
          await repository.releaseProcessing(id, "storage_unavailable", actor)
        } catch {
          // Preserve the original failure; stale processing recovery handles this case.
        }
        telemetry.record("media.finalize_failed", { assetId: id, code: "storage_unavailable" })
        throw normalizeError(error)
      }
    },

    list(filter) {
      return repository.list(filter)
    },

    async get(id) {
      const asset = await repository.get(id)
      if (!asset) throw new AssetServiceError("not_found")
      return asset
    },

    updateMetadata(id, input, actor) {
      return repository.updateMetadata(id, cleanMetadata(input), actor)
    },

    archive(id, actor) {
      return repository.archive(id, actor)
    },

    restore(id, actor) {
      return repository.restore(id, actor)
    },

    async delete(id, actor) {
      const acquisition = await repository.acquireDeletion(id, actor)
      if (acquisition.status === "missing") throw new AssetServiceError("not_found")
      if (acquisition.status === "blocked") throw new AssetServiceError(acquisition.reason)
      if (acquisition.status === "current" && acquisition.asset.status === "deleted") {
        return acquisition.asset
      }
      const deleting = acquisition.asset
      try {
        if (deleting.stagingPathname) await blobStore.deletePrivate(deleting.stagingPathname)
        if (deleting.publicPathname) await blobStore.deletePublic(deleting.publicPathname)
        const deleted = await repository.markDeleted(id, actor)
        telemetry.record("media.deleted", { assetId: id })
        return deleted
      } catch (error) {
        throw normalizeError(error)
      }
    },

    async cleanup(cleanupNow) {
      const result: AssetCleanupResult = {
        processingTimedOut: 0,
        stagingDeleted: 0,
        deletionsCompleted: 0,
        failures: 0,
      }
      const processingBefore = new Date(cleanupNow.getTime() - 60 * 60 * 1000)
      const stagingBefore = new Date(cleanupNow.getTime() - 24 * 60 * 60 * 1000)
      const cleanupActor: AdminActor = { githubId: "system:cron", name: "Asset cleanup" }

      const processing = await repository.listStaleProcessing(processingBefore, 50)
      for (const candidate of processing) {
        try {
          if (await repository.markProcessingTimedOut(candidate.id, processingBefore)) {
            result.processingTimedOut += 1
          }
        } catch {
          result.failures += 1
        }
      }

      const staging = await repository.listExpiredStaging(stagingBefore, 50)
      for (const candidate of staging) {
        try {
          if (candidate.status === "pending") {
            await repository.expirePending(candidate.id, stagingBefore)
          }
          if (!candidate.stagingPathname) continue
          await blobStore.deletePrivate(candidate.stagingPathname)
          await repository.clearStaging(candidate.id, cleanupActor)
          result.stagingDeleted += 1
        } catch {
          result.failures += 1
        }
      }

      const deleting = await repository.listDeleting(50)
      for (const candidate of deleting) {
        try {
          if (candidate.stagingPathname) await blobStore.deletePrivate(candidate.stagingPathname)
          if (candidate.publicPathname) await blobStore.deletePublic(candidate.publicPathname)
          await repository.markDeleted(candidate.id, cleanupActor)
          result.deletionsCompleted += 1
        } catch {
          result.failures += 1
        }
      }

      telemetry.record("media.cleanup_completed", result)
      return result
    },
  }
}

export const assetService = createAssetService({
  repository: assetStore,
  blobStore: new BlobStore(),
  processAsset: defaultProcessAsset,
  telemetry: mediaTelemetry,
  now: () => new Date(),
})
