import { describe, expect, it, vi } from "vitest"

import { searchSite } from "@/lib/search/site-search"
import { designDiscoveryEntries } from "@/lib/design-system/catalog"
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
  it.each([
    ["타이포그래피", "design-foundations", "기초 원칙", "/design/foundations"],
    ["컴포넌트", "design-components", "컴포넌트", "/design/components"],
    ["AI 디자인", "design-ai", "AI에서 사용하기", "/design/ai"],
  ] as const)("surfaces the specific Korean design page for %s", async (
    query,
    id,
    title,
    href,
  ) => {
    const repository = createRepository(vi.fn().mockResolvedValue([]))

    const result = await searchSite(query, "ko", repository)

    expect(result.results[0]).toMatchObject({
      id,
      group: "page",
      title,
      href,
    })
  })

  it("surfaces a concrete component detail page by component name", async () => {
    const repository = createRepository(vi.fn().mockResolvedValue([]))

    const result = await searchSite("Segmented Toggle", "en", repository)

    expect(result.results[0]).toMatchObject({
      id: "design-component-segmented-toggle",
      group: "page",
      title: "Segmented Toggle",
      description: "Switches between two mutually exclusive values in place.",
      href: "/design/components/segmented-toggle",
    })
  })

  it("makes every human design URL discoverable exactly once", async () => {
    const repository = createRepository(vi.fn().mockResolvedValue([]))

    for (const entry of designDiscoveryEntries) {
      const result = await searchSite(entry.title.ko, "ko", repository)
      const matches = result.results.filter((item) => item.id === `design-${entry.id}`)

      expect(matches).toEqual([
        expect.objectContaining({
          group: "page",
          href: entry.href,
        }),
      ])
    }
  })

  it("points machine-resource searches at the human AI guide only", async () => {
    const repository = createRepository(vi.fn().mockResolvedValue([]))

    const results = await Promise.all([
      searchSite("Markdown", "en", repository),
      searchSite("token", "en", repository),
      searchSite("Skill", "en", repository),
    ])
    const designHrefs = results.flatMap((result) => result.results)
      .filter((result) => result.href.startsWith("/design"))
      .map((result) => result.href)

    expect(designHrefs).toEqual(["/design/ai", "/design/ai", "/design/ai"])
    expect(designHrefs).not.toContain(expect.stringMatching(/\.(?:md|json|zip)$/))
    expect(designHrefs).not.toContain(expect.stringContaining("[slug]"))
  })

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

  it("does not expose undisclosed repository names", async () => {
    const repository = createRepository(vi.fn().mockResolvedValue([]))

    const lafwall = await searchSite("lafwall", "en", repository)
    const lafinvest = await searchSite("lafinvest", "en", repository)

    expect(lafwall.results).not.toContainEqual(expect.objectContaining({ title: "lafwall" }))
    expect(lafinvest.results).not.toContainEqual(expect.objectContaining({ title: "lafinvest" }))
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
    ["ko", "새 소식", "latest-signals", "/#latest-signals"],
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
