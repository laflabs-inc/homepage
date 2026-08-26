import { beforeEach, describe, expect, it, vi } from "vitest"

import type { PublishedDocument } from "@/lib/documents/types"

const mocks = vi.hoisted(() => ({
  listPublished: vi.fn(),
  getPublished: vi.fn(),
  unstableCache: vi.fn((callback: () => Promise<unknown>) => async () => (
    JSON.parse(JSON.stringify(await callback()))
  )),
}))

vi.mock("next/cache", () => ({
  unstable_cache: mocks.unstableCache,
}))

vi.mock("@/lib/documents/store", () => ({
  documentStore: {
    listPublished: mocks.listPublished,
    getPublished: mocks.getPublished,
  },
}))

import { getPublishedDocument, listPublishedDocuments } from "@/lib/documents/cache"
import { buildSitemap } from "@/app/sitemap"

const published: PublishedDocument = {
  id: "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131",
  seriesId: "c5bcf607-a48f-42b9-af99-55c70ef48640",
  kind: "notice",
  locale: "ko",
  slug: "service-update",
  category: "service",
  pinned: true,
  revision: 2,
  title: "서비스 업데이트",
  summary: "변경 사항을 안내합니다.",
  bodyMarkdown: "## 변경 사항\n본문",
  effectiveAt: new Date("2026-09-01T00:00:00.000Z"),
  publishedAt: new Date("2026-08-23T12:00:00.000Z"),
}

beforeEach(() => {
  mocks.listPublished.mockReset()
  mocks.getPublished.mockReset()
  mocks.unstableCache.mockClear()
})

describe("published document cache boundary", () => {
  it("restores repository dates after a serialized list cache hit", async () => {
    mocks.listPublished.mockResolvedValue([published])

    const [result] = await listPublishedDocuments({ kind: "notice", locale: "ko" })

    expect(result.publishedAt).toEqual(published.publishedAt)
    expect(result.publishedAt).toBeInstanceOf(Date)
    expect(result.effectiveAt).toEqual(published.effectiveAt)
    expect(result.effectiveAt).toBeInstanceOf(Date)
  })

  it("restores repository dates after a serialized detail cache hit", async () => {
    mocks.getPublished.mockResolvedValue({ document: published, availableLocales: ["ko"] })

    const result = await getPublishedDocument("notice", "service-update", "ko")

    expect(result.document?.publishedAt).toBeInstanceOf(Date)
    expect(result.document?.effectiveAt).toBeInstanceOf(Date)
    expect(result.availableLocales).toEqual(["ko"])
  })

  it("configures list reads with only exact kind and locale tags", async () => {
    mocks.listPublished.mockResolvedValue([published])

    await listPublishedDocuments({ kind: "notice", locale: "ko", limit: 20 })

    expect(mocks.unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ["published-documents", "notice", "ko", "", "20", "", "", ""],
      {
        revalidate: 60,
        tags: ["documents:index:notice", "documents:index:notice:ko"],
      },
    )
  })

  it("configures detail reads with only exact slug and locale tags", async () => {
    mocks.getPublished.mockResolvedValue({ document: published, availableLocales: ["ko"] })

    await getPublishedDocument("notice", "service-update", "ko")

    expect(mocks.unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ["published-document", "notice", "service-update", "ko"],
      {
        revalidate: 60,
        tags: [
          "documents:detail:notice:service-update",
          "documents:detail:notice:service-update:ko",
        ],
      },
    )
  })

  it("uses one dedicated sitemap cache dependency and tag", async () => {
    mocks.listPublished.mockResolvedValue([])

    await buildSitemap()

    expect(mocks.unstableCache).toHaveBeenCalledTimes(1)
    expect(mocks.unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ["published-document-sitemap"],
      { revalidate: 60, tags: ["documents:sitemap"] },
    )
  })
})
