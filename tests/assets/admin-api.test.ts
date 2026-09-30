import { describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import {
  handleDeleteAsset,
  handleGetAsset,
  handleUpdateAsset,
} from "@/app/api/admin/assets/[id]/route"
import { handleListAssets } from "@/app/api/admin/assets/route"
import { handleListAssetReferences } from "@/app/api/admin/assets/[id]/references/route"
import { AssetServiceError } from "@/lib/assets/service"
import type { MediaAsset } from "@/lib/assets/types"
import type { AdminAssetDependencies } from "@/lib/http/admin-assets"

const actor = { githubId: "github:42", name: "Laf Admin" }
const id = "00000000-0000-4000-8000-000000000001"

function asset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id,
    visibility: "public",
    status: "ready",
    originalFilename: "hero.png",
    safeFilename: "hero.png",
    declaredMediaType: "image/png",
    mediaType: "image/png",
    byteSize: 100,
    width: 10,
    height: 10,
    checksumSha256: "a".repeat(64),
    stagingPathname: null,
    stagingUrl: null,
    publicPathname: `media/${id}/hero.png`,
    publicUrl: "https://public.example/hero.png",
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
    readyAt: new Date("2026-09-27T00:00:00Z"),
    archivedAt: null,
    deletedAt: null,
    archivedBy: null,
    deletedBy: null,
    ...overrides,
  }
}

function dependencies(overrides: Partial<AdminAssetDependencies> = {}): AdminAssetDependencies {
  return {
    authorize: vi.fn(async () => ({ ok: true as const, actor })),
    sameOrigin: vi.fn(() => true),
    readBody: vi.fn(async (request: Request) => ({ ok: true as const, value: await request.json() })),
    service: {
      createIntent: vi.fn(),
      recordUploadCompleted: vi.fn(),
      finalize: vi.fn(),
      get: vi.fn(async () => asset()),
      list: vi.fn(async () => ({ items: [asset()], nextCursor: null })),
      updateMetadata: vi.fn(async (_id, input) => asset(input)),
      archive: vi.fn(async () => asset({ status: "archived" })),
      restore: vi.fn(async () => asset()),
      delete: vi.fn(async () => asset({ status: "deleted" })),
      listUsage: vi.fn(async () => [{
        revisionId: "11111111-1111-4111-8111-111111111111",
        kind: "notice" as const,
        locale: "ko" as const,
        title: "서비스 공지",
        status: "draft" as const,
        field: "body_markdown",
        updatedAt: new Date("2026-09-29T10:00:00Z"),
      }]),
    },
    blobStore: { handlePrivateClientUpload: vi.fn() },
    ...overrides,
  }
}

describe("Admin asset management API", () => {
  it.each([
    "?unknown=1",
    "?status=ready&status=archived",
    "?limit=0",
    "?limit=101",
  ])("rejects invalid list query %s", async (query) => {
    const deps = dependencies()
    const response = await handleListAssets(new Request(`https://laflabs.co/api/admin/assets${query}`), deps)

    expect(response.status).toBe(400)
    expect(deps.service.list).not.toHaveBeenCalled()
  })

  it("maps validated list filters and serializes stable paths", async () => {
    const deps = dependencies()
    const response = await handleListAssets(new Request(
      "https://laflabs.co/api/admin/assets?search=hero&type=image%2Fpng&status=ready&tag=company&limit=20",
    ), deps)

    expect(response.status).toBe(200)
    expect(deps.service.list).toHaveBeenCalledWith({
      search: "hero",
      mediaType: "image/png",
      status: "ready",
      tag: "company",
      limit: 20,
    })
    await expect(response.json()).resolves.toMatchObject({
      assets: [{ id, src: `/media/${id}/hero.png` }],
      nextCursor: null,
    })
  })

  it("rejects mutable storage fields in metadata updates", async () => {
    const deps = dependencies()
    const request = new Request(`https://laflabs.co/api/admin/assets/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ altKo: "설명", altEn: null, tags: [], safeFilename: "changed.png" }),
    })

    const response = await handleUpdateAsset(request, id, deps)

    expect(response.status).toBe(400)
    expect(deps.service.updateMetadata).not.toHaveBeenCalled()
  })

  it("refuses deletion while references exist", async () => {
    const deps = dependencies()
    vi.mocked(deps.service.delete).mockRejectedValueOnce(new AssetServiceError("asset_referenced"))
    const request = new Request(`https://laflabs.co/api/admin/assets/${id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    })

    const response = await handleDeleteAsset(request, id, deps)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: "asset_referenced" })
  })

  it("keeps detail responses no-store", async () => {
    const response = await handleGetAsset(
      new Request(`https://laflabs.co/api/admin/assets/${id}`),
      id,
      dependencies(),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("returns safe authenticated document usage", async () => {
    const deps = dependencies()
    const response = await handleListAssetReferences(
      new Request(`https://laflabs.co/api/admin/assets/${id}/references`),
      id,
      deps,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ references: [{
      revisionId: "11111111-1111-4111-8111-111111111111",
      kind: "notice",
      locale: "ko",
      title: "서비스 공지",
      status: "draft",
      field: "body_markdown",
      updatedAt: "2026-09-29T10:00:00.000Z",
    }] })
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("rejects malformed usage IDs before reading storage", async () => {
    const deps = dependencies()
    const response = await handleListAssetReferences(
      new Request("https://laflabs.co/api/admin/assets/nope/references"),
      "nope",
      deps,
    )

    expect(response.status).toBe(400)
    expect(deps.service.listUsage).not.toHaveBeenCalled()
  })
})
