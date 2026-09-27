import { describe, expect, it, vi } from "vitest"

import { createAssetService, type AssetServiceDependencies } from "@/lib/assets/service"
import type { MediaAsset } from "@/lib/assets/types"

const now = new Date("2026-09-27T04:00:00Z")
const actor = { githubId: "system:cron", name: "Asset cleanup" }

function asset(id: string, status: MediaAsset["status"], staging = true): MediaAsset {
  return {
    id,
    visibility: "public",
    status,
    originalFilename: "image.png",
    safeFilename: status === "deleting" ? "image.png" : null,
    declaredMediaType: "image/png",
    mediaType: status === "deleting" ? "image/png" : null,
    byteSize: null,
    width: null,
    height: null,
    checksumSha256: null,
    stagingPathname: staging ? `staging/${id}/00000000-0000-4000-8000-000000000099` : null,
    stagingUrl: staging ? "https://private.example/staged" : null,
    publicPathname: status === "deleting" ? `media/${id}/image.png` : null,
    publicUrl: status === "deleting" ? "https://public.example/image.png" : null,
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
    createdAt: new Date("2026-09-25T00:00:00Z"),
    updatedAt: new Date("2026-09-25T00:00:00Z"),
    readyAt: null,
    archivedAt: null,
    deletedAt: null,
    archivedBy: null,
    deletedBy: null,
  }
}

function dependencies(): AssetServiceDependencies {
  const timedOut = asset("00000000-0000-4000-8000-000000000001", "processing")
  const pending = asset("00000000-0000-4000-8000-000000000002", "pending")
  const failed = asset("00000000-0000-4000-8000-000000000003", "failed")
  const deleting = asset("00000000-0000-4000-8000-000000000004", "deleting", false)
  const repository = {
    listStaleProcessing: vi.fn(async () => [timedOut]),
    markProcessingTimedOut: vi.fn(async () => asset(timedOut.id, "failed")),
    listExpiredStaging: vi.fn(async () => [pending, failed]),
    expirePending: vi.fn(async (id) => asset(id, "failed")),
    listDeleting: vi.fn(async () => [deleting]),
    clearStaging: vi.fn(async (id) => asset(id, "failed", false)),
    markDeleted: vi.fn(async (id) => asset(id, "deleted", false)),
  }
  return {
    repository: repository as unknown as AssetServiceDependencies["repository"],
    blobStore: {
      readPrivate: vi.fn(),
      putPublic: vi.fn(),
      headPublic: vi.fn(),
      deletePrivate: vi.fn(async () => undefined),
      deletePublic: vi.fn(async () => undefined),
    },
    processAsset: vi.fn(),
    telemetry: { record: vi.fn() },
    now: () => now,
  }
}

describe("asset cleanup", () => {
  it("settles timed-out processing before removing expired staging objects", async () => {
    const deps = dependencies()
    const service = createAssetService(deps)

    const result = await service.cleanup(now)

    expect(result).toEqual({
      processingTimedOut: 1,
      stagingDeleted: 2,
      deletionsCompleted: 1,
      failures: 0,
    })
    expect(deps.repository.markProcessingTimedOut).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      new Date("2026-09-27T03:00:00Z"),
    )
    expect(deps.repository.expirePending).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000002",
      new Date("2026-09-26T04:00:00Z"),
    )
    expect(deps.telemetry.record).toHaveBeenCalledWith("media.cleanup_completed", result)
  })

  it("counts provider failures and leaves rows retryable", async () => {
    const deps = dependencies()
    vi.mocked(deps.blobStore.deletePrivate).mockRejectedValue(new Error("provider detail"))

    const result = await createAssetService(deps).cleanup(now)

    expect(result.failures).toBe(2)
    expect(result.stagingDeleted).toBe(0)
    expect(deps.repository.clearStaging).not.toHaveBeenCalled()
  })
})
