import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/content/content.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/analytics/consent-panel.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { DocumentDetail, buildDocumentMetadata } from "@/components/content/document-detail"
import { DocumentIndex } from "@/components/content/document-index"
import { ConsentProvider } from "@/components/analytics/consent-provider"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import { SiteFooter } from "@/components/layout/site-footer"
import { buildSitemap } from "@/app/sitemap"
import { documentSections, siteUrl } from "@/lib/content"
import type { DocumentRepository, PublishedDocument, PublishedDocumentFilter } from "@/lib/documents/types"

const published: PublishedDocument = {
  id: "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131",
  seriesId: "c5bcf607-a48f-42b9-af99-55c70ef48640",
  kind: "notice",
  locale: "ko",
  slug: "service-update",
  category: "service",
  pinned: false,
  revision: 2,
  title: "서비스 업데이트",
  summary: "변경 사항을 안내합니다.",
  bodyMarkdown: "## 변경 사항\n본문입니다.\n\n### 적용 대상\n모든 사용자",
  effectiveAt: new Date("2026-09-01T00:00:00.000Z"),
  publishedAt: new Date("2026-08-23T12:00:00.000Z"),
}

function repository(overrides: Partial<Pick<DocumentRepository, "listPublished" | "getPublished">> = {}) {
  return {
    listPublished: vi.fn().mockResolvedValue([published]),
    getPublished: vi.fn().mockResolvedValue({ document: published, availableLocales: ["ko"] }),
    ...overrides,
  } as Pick<DocumentRepository, "listPublished" | "getPublished">
}

describe("public document pages", () => {
  it("renders an honest Korean empty state when nothing is published", async () => {
    const store = repository({ listPublished: vi.fn().mockResolvedValue([]) })

    render(await DocumentIndex({
      kind: "legal",
      locale: "ko",
      section: documentSections.legal,
      repository: store,
    }))

    expect(screen.getByRole("heading", { level: 1, name: "법적 고지" })).toBeInTheDocument()
    expect(screen.getByText("아직 게시된 법적 고지가 없습니다.")).toBeInTheDocument()
  })

  it("renders an English-unavailable state with a deliberate Korean link", async () => {
    const store = repository({
      getPublished: vi.fn().mockResolvedValue({ document: null, availableLocales: ["ko"] }),
    })

    render(await DocumentDetail({
      kind: "notice",
      slug: "service-update",
      locale: "en",
      section: documentSections.notice,
      repository: store,
    }))

    expect(screen.getByRole("heading", { level: 1, name: "This document is not available in English." })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Read the Korean version" })).toHaveAttribute(
      "href",
      "/notices/service-update?locale=ko",
    )
    expect(screen.queryByText("본문입니다.")).not.toBeInTheDocument()
  })

  it("renders publication metadata, contents links, and the shared Markdown output", async () => {
    render(await DocumentDetail({
      kind: "notice",
      slug: "service-update",
      locale: "ko",
      section: documentSections.notice,
      repository: repository(),
    }))

    const article = screen.getByRole("article")
    expect(within(article).getByText("2026년 8월 23일 게시")).toBeInTheDocument()
    expect(within(article).getByText("2026년 9월 1일 시행")).toBeInTheDocument()
    const contents = screen.getByRole("navigation", { name: "목차" })
    expect(within(contents).getByRole("link", { name: "변경 사항" })).toHaveAttribute("href", "#변경-사항")
    expect(within(contents).getByRole("link", { name: "적용 대상" })).toHaveAttribute("href", "#적용-대상")
    expect(within(article).getByRole("heading", { level: 2, name: "변경 사항" })).toHaveAttribute("id", "변경-사항")
    expect(within(article).getByText("본문입니다.")).toBeInTheDocument()
  })

  it("builds localized metadata only from the requested published revision", async () => {
    const english = {
      ...published,
      locale: "en" as const,
      title: "Service update",
      summary: "What changed in the service.",
    }
    const metadata = await buildDocumentMetadata({
      kind: "notice",
      slug: "service-update",
      locale: "en",
      section: documentSections.notice,
      repository: repository({
        getPublished: vi.fn().mockResolvedValue({ document: english, availableLocales: ["en", "ko"] }),
      }),
    })

    expect(metadata).toMatchObject({
      title: "Service update",
      description: "What changed in the service.",
      alternates: { canonical: "/notices/service-update" },
      openGraph: { locale: "en_US", title: "Service update" },
    })
  })

  it("links all four public document indexes from the localized footer", () => {
    render(
      <LocaleProvider initialLocale="ko">
        <ConsentProvider initialState="essential" dnt={false}>
          <SiteFooter />
        </ConsentProvider>
      </LocaleProvider>,
    )

    expect(screen.getByRole("link", { name: "공지사항" })).toHaveAttribute("href", "/notices")
    expect(screen.getByRole("link", { name: "법적 고지" })).toHaveAttribute("href", "/legal")
    expect(screen.getByRole("link", { name: "공시" })).toHaveAttribute("href", "/disclosures")
    expect(screen.getByRole("link", { name: "디자인 가이드" })).toHaveAttribute("href", "/design")
  })

  it("keeps the homepage in the sitemap when document storage is unavailable", async () => {
    const store = repository({ listPublished: vi.fn().mockRejectedValue(new Error("database unavailable")) })

    await expect(buildSitemap(store)).resolves.toEqual([{
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    }])
  })

  it("adds published Korean document series to the sitemap", async () => {
    const store = repository({
      listPublished: vi.fn().mockImplementation(async (filter: PublishedDocumentFilter) => filter.kind === "notice" ? [published] : []),
    })

    const entries = await buildSitemap(store)

    expect(entries).toEqual([
      { url: siteUrl, changeFrequency: "monthly", priority: 1 },
      {
        url: `${siteUrl}/notices/service-update`,
        lastModified: published.publishedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ])
  })
})
