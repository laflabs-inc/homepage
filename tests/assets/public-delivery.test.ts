import { describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import {
  handleMediaDelivery,
  type MediaDeliveryDependencies,
} from "@/app/media/[assetId]/[safeFilename]/route"
import type { MediaAsset, MediaAssetStatus, MediaAssetVisibility } from "@/lib/assets/types"

const id = "00000000-0000-4000-8000-000000000001"

function mediaAsset(
  status: MediaAssetStatus,
  visibility: MediaAssetVisibility = "public",
): MediaAsset {
  return {
    id,
    visibility,
    status,
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
    createdBy: "github:42",
    updatedBy: "github:42",
    createdByName: "Admin",
    updatedByName: "Admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    readyAt: new Date(),
    archivedAt: null,
    deletedAt: null,
    archivedBy: null,
    deletedBy: null,
  }
}

function depsFor(status: MediaAssetStatus, visibility: MediaAssetVisibility = "public"): MediaDeliveryDependencies {
  return { getAsset: vi.fn(async () => mediaAsset(status, visibility)) }
}

describe("stable media delivery", () => {
  it.each(["pending", "processing", "failed", "deleting", "deleted"] as const)(
    "does not deliver %s assets",
    async (status) => {
      const response = await handleMediaDelivery(id, "hero.png", depsFor(status))
      expect(response.status).toBe(404)
      expect(response.headers.get("cache-control")).toBe("no-store")
    },
  )

  it("does not deliver private assets", async () => {
    expect((await handleMediaDelivery(id, "hero.png", depsFor("ready", "private"))).status).toBe(404)
  })

  it.each(["ready", "archived"] as const)("permanently redirects exact %s paths", async (status) => {
    const response = await handleMediaDelivery(id, "hero.png", depsFor(status))

    expect(response.status).toBe(308)
    expect(response.headers.get("location")).toBe("https://public.example/hero.png")
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
  })

  it("does not normalize or redirect a mismatched filename", async () => {
    expect((await handleMediaDelivery(id, "HERO.png", depsFor("ready"))).status).toBe(404)
  })
})
