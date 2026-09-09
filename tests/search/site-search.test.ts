import { describe, expect, it, vi } from "vitest"

import { searchSite } from "@/lib/search/site-search"
import type { PublishedDocumentReader } from "@/lib/documents/cache"
import type { PublishedDocument } from "@/lib/documents/types"

function publishedDocument(overrides: Partial<PublishedDocument> = {}): PublishedDocument {
  return {
    id: "notice-1",
    seriesId: "series-1",
    kind: "notice",
    locale: "en",
    slug: "identity-update",
    category: null,
    pinned: false,
    revision: 1,
    title: "Identity update",
    summary: "An update to Laf ID.",
    bodyMarkdown: "",
    effectiveAt: null,
    publishedAt: new Date("2026-09-02T00:00:00.000Z"),
    ...overrides,
  }
}

function createRepository(
  listPublished: PublishedDocumentReader["listPublished"],
): PublishedDocumentReader {
  return {
    listPublished,
    getPublished: vi.fn(),
  }
}

describe("searchSite", () => {
  it("ranks an exact product title before a product-description match", async () => {
    const repository = createRepository(vi.fn().mockResolvedValue([]))

    const result = await searchSite("Laf ID", "en", repository)

    expect(result.results[0]).toMatchObject({
      group: "product",
      title: "Laf ID",
    })
  })

  it("returns localized static product copy", async () => {
    const repository = createRepository(vi.fn().mockResolvedValue([]))

    const result = await searchSite("인증", "ko", repository)

    expect(result.results).toContainEqual(expect.objectContaining({
      group: "product",
      title: "Laf ID",
      description: expect.stringContaining("인증 플랫폼"),
    }))
  })

  it("keeps products and repositories in their corresponding result groups", async () => {
    const repository = createRepository(vi.fn().mockResolvedValue([]))

    const productResults = await searchSite("Laf ID", "en", repository)
    const repositoryResults = await searchSite("lafetch", "en", repository)

    expect(productResults.results).toContainEqual(expect.objectContaining({
      group: "product",
      title: "Laf ID",
    }))
    expect(repositoryResults.results).toContainEqual(expect.objectContaining({
      group: "open-source",
      title: "lafetch",
    }))
  })

  it("queries every published document kind with the localized search filter", async () => {
    const listPublished = vi.fn().mockResolvedValue([])
    const repository = createRepository(listPublished)

    await searchSite("인증", "ko", repository)

    expect(listPublished).toHaveBeenCalledTimes(3)
    expect(listPublished).toHaveBeenCalledWith(expect.objectContaining({
      kind: "notice",
      locale: "ko",
      search: "인증",
      limit: 6,
    }))
    expect(listPublished).toHaveBeenCalledWith(expect.objectContaining({
      kind: "legal",
      locale: "ko",
      search: "인증",
      limit: 6,
    }))
    expect(listPublished).toHaveBeenCalledWith(expect.objectContaining({
      kind: "disclosure",
      locale: "ko",
      search: "인증",
      limit: 6,
    }))
  })

  it("returns published document links with the requested locale", async () => {
    const repository = createRepository(vi.fn().mockImplementation(async ({ kind }) => [publishedDocument({
      id: `${kind}-1`,
      kind,
      slug: `${kind}-update`,
      title: `${kind} update`,
    })]))

    const result = await searchSite("update", "en", repository)

    expect(result.results).toContainEqual(expect.objectContaining({
      group: "notice",
      href: "/notices/notice-update?locale=en",
    }))
    expect(result.results).toContainEqual(expect.objectContaining({
      group: "legal",
      href: "/legal/legal-update?locale=en",
    }))
    expect(result.results).toContainEqual(expect.objectContaining({
      group: "disclosure",
      href: "/disclosures/disclosure-update?locale=en",
    }))
  })

  it("preserves static results when document aggregation fails", async () => {
    const repository = createRepository(vi.fn().mockRejectedValue(new Error("database unavailable")))

    const partial = await searchSite("Laf ID", "en", repository)

    expect(partial.partial).toBe(true)
    expect(partial.results).toContainEqual(expect.objectContaining({
      group: "product",
      title: "Laf ID",
    }))
  })

  it.each([
    ["ko", "제품과 그 아래의 기술", "company", "/#company"],
    ["en", "technology underneath", "company", "/#company"],
    ["ko", "직접 운영", "work-method", "/#work-method"],
    ["en", "Operate what we ship", "work-method", "/#work-method"],
    ["ko", "코드가 결과", "engineering", "/#engineering"],
    ["en", "code is part", "engineering", "/#engineering"],
    ["ko", "최근 작업과 회사 소식", "latest-signals", "/#latest-signals"],
    ["en", "Recent work", "latest-signals", "/#latest-signals"],
  ] as const)("indexes the displayed %s homepage section content for %s", async (
    locale,
    query,
    id,
    href,
  ) => {
    const repository = createRepository(vi.fn().mockResolvedValue([]))

    const result = await searchSite(query, locale, repository)

    expect(result.results).toContainEqual(expect.objectContaining({
      id,
      group: "page",
      href,
    }))
  })

})
