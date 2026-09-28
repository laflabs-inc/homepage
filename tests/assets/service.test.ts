import { describe, expect, it, vi } from "vitest"

import { AssetError } from "@/lib/assets/errors"
import { createAssetService, type AssetServiceDependencies } from "@/lib/assets/service"
import type { MediaAsset } from "@/lib/assets/types"

const actor = { githubId: "github:42", name: "Laf Admin" }
const id = "00000000-0000-4000-8000-000000000001"
const stagingPathname = `${"staging"}/${id}/00000000-0000-4000-8000-000000000002`

function asset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id,
    visibility: "public",
    status: "pending",
    originalFilename: "hero.png",
    safeFilename: null,
    declaredMediaType: "image/png",
    mediaType: null,
    byteSize: null,
    width: null,
    height: null,
    checksumSha256: null,
    stagingPathname,
    stagingUrl: "https://private.example/staged",
    publicPathname: null,
    publicUrl: null,
    altKo: null,
    altEn: null,
    tags: [],
    failureCode: null,
    familyId: id,
    previousAssetId: null,
    version: 1,
    createdBy: actor.githubId,
    updatedBy: actor.githubId,
    createdByName: actor.name,
    updatedByName: actor.name,
    createdAt: new Date("2026-09-27T00:00:00Z"),
    updatedAt: new Date("2026-09-27T00:00:00Z"),
    readyAt: null,
    archivedAt: null,
    deletedAt: null,
    archivedBy: null,
    deletedBy: null,
    ...overrides,
  }
}

function dependencies(overrides: Partial<AssetServiceDependencies> = {}): AssetServiceDependencies {
  let current = asset()
  const repository = {
    get: vi.fn(async () => current),
    acquireProcessing: vi.fn(async () => ({ status: "acquired" as const, asset: current })),
    recordProcessed: vi.fn(async (_id, processed) => {
      current = asset({
        ...current,
        mediaType: processed.mediaType,
        byteSize: processed.byteSize,
        checksumSha256: processed.checksumSha256,
        safeFilename: processed.safeFilename,
      })
      return current
    }),
    findDuplicate: vi.fn(async () => null),
    markReady: vi.fn(async (_id, input) => {
      current = asset({ ...current, ...input, status: "ready", readyAt: new Date() })
      return current
    }),
    markFailed: vi.fn(async (_id, code) => {
      current = asset({ ...current, status: "failed", failureCode: code })
      return current
    }),
    releaseProcessing: vi.fn(async () => {
      current = asset({ ...current, status: "pending" })
      return current
    }),
    clearStaging: vi.fn(async () => {
      current = asset({ ...current, stagingPathname: null, stagingUrl: null })
      return current
    }),
    createPending: vi.fn(),
    recordUploadCompleted: vi.fn(),
    list: vi.fn(),
    updateMetadata: vi.fn(),
    archive: vi.fn(),
    restore: vi.fn(),
    acquireDeletion: vi.fn(),
    markDeleted: vi.fn(),
    addReference: vi.fn(),
  }
  return {
    repository: repository as unknown as AssetServiceDependencies["repository"],
    blobStore: {
      readPrivate: vi.fn(async () => new Uint8Array([1, 2, 3])),
      putPublic: vi.fn(async (pathname, bytes, contentType) => ({
        pathname,
        url: "https://public.example/hero.png",
        contentType,
        size: bytes.byteLength,
      })),
      headPublic: vi.fn(async () => null),
      deletePrivate: vi.fn(async () => undefined),
      deletePublic: vi.fn(async () => undefined),
    },
    processAsset: vi.fn(async () => ({
      bytes: new Uint8Array([7, 8]),
      mediaType: "image/png" as const,
      byteSize: 2,
      width: 10,
      height: 20,
      checksumSha256: "a".repeat(64),
      safeFilename: "hero.png",
    })),
    telemetry: { record: vi.fn() },
    now: () => new Date("2026-09-27T01:00:00Z"),
    ...overrides,
  }
}

describe("asset lifecycle service", () => {
  it("finalizes once and returns the stored ready asset on repeat", async () => {
    const deps = dependencies()
    const service = createAssetService(deps)

    expect(await service.finalize(id, actor)).toMatchObject({ id, status: "ready" })
    expect(await service.finalize(id, actor)).toMatchObject({ id, status: "ready" })
    expect(deps.blobStore.putPublic).toHaveBeenCalledTimes(1)
    expect(deps.blobStore.deletePrivate).toHaveBeenCalledWith(stagingPathname)
    expect(deps.telemetry.record).toHaveBeenCalledWith("media.finalized", expect.objectContaining({
      assetId: id,
      byteSize: 2,
      mediaType: "image/png",
    }))
  })

  it("marks validation failures safely and attempts staging cleanup", async () => {
    const deps = dependencies({
      processAsset: vi.fn(async () => { throw new AssetError("invalid_image") }),
    })
    const service = createAssetService(deps)

    await expect(service.finalize(id, actor)).rejects.toMatchObject({ code: "invalid_image" })
    expect(deps.repository.markFailed).toHaveBeenCalledWith(id, "invalid_image", actor)
    expect(deps.blobStore.deletePrivate).toHaveBeenCalledWith(stagingPathname)
    expect(deps.telemetry.record).toHaveBeenCalledWith(
      "media.finalize_failed",
      expect.not.objectContaining({ privateUrl: expect.anything(), providerError: expect.anything() }),
    )
  })

  it("releases processing after a provider failure so finalization can retry", async () => {
    const deps = dependencies()
    vi.mocked(deps.blobStore.putPublic).mockRejectedValueOnce(new Error("provider payload"))
    const service = createAssetService(deps)

    await expect(service.finalize(id, actor)).rejects.toMatchObject({ code: "unavailable" })
    expect(deps.repository.releaseProcessing).toHaveBeenCalledWith(id, "storage_unavailable", actor)
    expect(deps.telemetry.record).toHaveBeenCalledWith("media.finalize_failed", {
      assetId: id,
      code: "storage_unavailable",
    })
  })

  it("warns about a ready checksum duplicate without replacing either asset", async () => {
    const deps = dependencies()
    vi.mocked(deps.repository.findDuplicate).mockResolvedValueOnce(asset({
      id: "00000000-0000-4000-8000-000000000099",
      status: "ready",
      checksumSha256: "a".repeat(64),
    }))
    const service = createAssetService(deps)

    await service.finalize(id, actor)
    expect(deps.telemetry.record).toHaveBeenCalledWith("media.duplicate_detected", {
      assetId: id,
      duplicateAssetId: "00000000-0000-4000-8000-000000000099",
    })
  })
})
