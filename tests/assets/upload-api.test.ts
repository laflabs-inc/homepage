import { describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import type { AdminApiAuthorization } from "@/lib/auth/admin-api"
import type { MediaAsset } from "@/lib/assets/types"
import {
  handleAssetUpload,
  handleCreateAssetIntent,
  handleFinalizeAsset,
  toAdminAsset,
  type AdminAssetDependencies,
} from "@/lib/http/admin-assets"

const actor = { githubId: "github:42", name: "Laf Admin" }
const id = "00000000-0000-4000-8000-000000000001"
const nonce = "00000000-0000-4000-8000-000000000002"
const pathname = `staging/${id}/${nonce}`

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
    stagingPathname: pathname,
    stagingUrl: null,
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

function dependencies(overrides: Partial<AdminAssetDependencies> = {}): AdminAssetDependencies {
  return {
    authorize: vi.fn(async (): Promise<AdminApiAuthorization> => ({ ok: true, actor })),
    sameOrigin: vi.fn(() => true),
    readBody: vi.fn(async () => ({
      ok: true as const,
      value: { originalFilename: "hero.png", declaredMediaType: "image/png", byteSize: 123 },
    })),
    service: {
      createIntent: vi.fn(async () => ({
        assetId: id,
        pathname,
        acceptedTypes: ["image/png"] as const,
        maxBytes: 10 * 1024 * 1024,
      })),
      get: vi.fn(async () => asset()),
      recordUploadCompleted: vi.fn(async () => asset({ stagingUrl: "https://private.example/staged" })),
      finalize: vi.fn(async () => asset({
        status: "ready",
        safeFilename: "hero.png",
        mediaType: "image/png",
        publicPathname: `media/${id}/hero.png`,
        publicUrl: "https://public.example/hero.png",
      })),
    },
    blobStore: {
      handlePrivateClientUpload: vi.fn(),
    },
    ...overrides,
  }
}

describe("Admin asset upload API", () => {
  it("rejects cross-origin intent creation before reading JSON", async () => {
    const deps = dependencies({ sameOrigin: vi.fn(() => false) })
    const request = new Request("https://laflabs.co/api/admin/assets/intents", { method: "POST" })

    const response = await handleCreateAssetIntent(request, deps)

    expect(response.status).toBe(403)
    expect(deps.readBody).not.toHaveBeenCalled()
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("creates a bounded upload intent", async () => {
    const deps = dependencies()
    const request = new Request("https://laflabs.co/api/admin/assets/intents", { method: "POST" })

    const response = await handleCreateAssetIntent(request, deps)

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      intent: {
        assetId: id,
        pathname,
        acceptedTypes: ["image/png"],
        maxBytes: 10 * 1024 * 1024,
      },
    })
  })

  it("accepts a signed completion callback without an Admin session", async () => {
    const deps = dependencies()
    vi.mocked(deps.blobStore.handlePrivateClientUpload).mockImplementation(async (_request, callbacks) => {
      await callbacks.onUploadCompleted({
        blob: { pathname, url: "https://private.example/staged", contentType: "image/png" },
        tokenPayload: JSON.stringify({ assetId: id, pathname, actorId: actor.githubId }),
      })
      return { type: "blob.upload-completed", response: "ok" }
    })
    const request = new Request("https://laflabs.co/api/admin/assets/upload", { method: "POST" })

    const response = await handleAssetUpload(request, deps)

    expect(response.status).toBe(200)
    expect(deps.authorize).not.toHaveBeenCalled()
    expect(deps.service.recordUploadCompleted).toHaveBeenCalledWith(
      id,
      pathname,
      "https://private.example/staged",
      actor,
    )
  })

  it("rejects an invalid finalize ID before calling the service", async () => {
    const deps = dependencies()
    const request = new Request("https://laflabs.co/api/admin/assets/nope/finalize", { method: "POST" })

    const response = await handleFinalizeAsset(request, "nope", deps)

    expect(response.status).toBe(400)
    expect(deps.service.finalize).not.toHaveBeenCalled()
  })

  it("serializes only stable Admin-safe asset fields", () => {
    const serialized = toAdminAsset(asset({
      status: "ready",
      safeFilename: "hero.png",
      publicPathname: `media/${id}/hero.png`,
      publicUrl: "https://provider.example/private-value",
      stagingUrl: "https://provider.example/staging",
      failureCode: "provider-secret",
    }))

    expect(serialized).toMatchObject({ id, src: `/media/${id}/hero.png` })
    expect(JSON.stringify(serialized)).not.toMatch(/provider|staging|failureCode|createdByName/i)
  })
})
