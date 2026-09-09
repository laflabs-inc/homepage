import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const navigationMocks = vi.hoisted(() => ({ replace: vi.fn() }))

vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NEXT_NOT_FOUND") },
  usePathname: () => window.location.pathname,
  useRouter: () => ({ replace: navigationMocks.replace }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}))

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
import { SiteHeader } from "@/components/layout/site-header"
import { buildSitemap } from "@/app/sitemap"
import DocumentLayout from "@/app/(documents)/layout"
import DocumentError from "@/app/(documents)/error"
import DocumentNotFound from "@/app/(documents)/not-found"
import { documentSections, siteUrl } from "@/lib/content"
import type { DocumentCategorySnapshot } from "@/lib/document-categories/types"
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

const managedCategories: DocumentCategorySnapshot[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    kind: "notice",
    slug: "service",
    labelKo: "서비스",
    labelEn: "Service",
    sortOrder: 0,
    active: true,
    version: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    kind: "notice",
    slug: "engineering",
    labelKo: "기술",
    labelEn: "Engineering",
    sortOrder: 1,
    active: true,
    version: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    kind: "notice",
    slug: "retired",
    labelKo: "종료됨",
    labelEn: "Retired",
    sortOrder: 2,
    active: false,
    version: 1,
  },
]

function repository(overrides: Partial<Pick<DocumentRepository, "listPublished" | "getPublished">> = {}) {
  return {
    listPublished: vi.fn().mockResolvedValue([published]),
    getPublished: vi.fn().mockResolvedValue({ document: published, availableLocales: ["ko"] }),
    ...overrides,
  } as Pick<DocumentRepository, "listPublished" | "getPublished">
}

beforeEach(() => {
  navigationMocks.replace.mockReset()
  window.history.replaceState({}, "", "/")
})

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
    expect(screen.getByRole("link", { name: "← 목록으로" })).toHaveAttribute("href", "/notices?locale=ko")
  })

  it("preserves the selected locale in document detail links", async () => {
    const english = { ...published, locale: "en" as const, title: "Service update" }

    render(await DocumentIndex({
      kind: "notice",
      locale: "en",
      section: documentSections.notice,
      repository: repository({ listPublished: vi.fn().mockResolvedValue([english]) }),
    }))

    expect(screen.getByRole("link", { name: /Service update/ })).toHaveAttribute(
      "href",
      "/notices/service-update?locale=en",
    )
  })

  it("renders managed active categories in the localized discovery toolbar", async () => {
    render(await DocumentIndex({
      kind: "notice",
      locale: "en",
      section: documentSections.notice,
      categories: managedCategories,
      repository: repository({ listPublished: vi.fn().mockResolvedValue([]) }),
    }))

    const category = screen.getByRole("combobox", { name: "Category" })
    expect(within(category).getByRole("option", { name: "Engineering" })).toBeInTheDocument()
    expect(within(category).queryByRole("option", { name: "Retired" })).not.toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveValue("latest")
    expect(screen.getByRole("searchbox", { name: "Search notices" })).toBeInTheDocument()
  })

  it("visibly groups legal documents by category", async () => {
    const kind = "legal"
    const locale = "en"
    const category = "privacy"
    render(await DocumentIndex({
      kind,
      locale,
      section: documentSections[kind],
      categories: [{
        ...managedCategories[0],
        kind,
        slug: category,
        labelKo: "개인정보",
        labelEn: "Privacy",
      }],
      repository: repository({ listPublished: vi.fn().mockResolvedValue([{ ...published, kind, locale, category }]) }),
    }))

    expect(screen.getByRole("heading", { level: 2, name: "Privacy" })).toBeInTheDocument()
  })

  it("ignores an invalid page category before cache/repository lookup and link creation", async () => {
    const store = repository()
    render(await DocumentIndex({
      kind: "notice",
      locale: "ko",
      section: documentSections.notice,
      category: "financial",
      categories: managedCategories,
      repository: store,
    }))

    expect(store.listPublished).toHaveBeenCalledWith(expect.objectContaining({ category: undefined }))
    expect(screen.getAllByRole("link", { name: /서비스 업데이트/ })[0]).toHaveAttribute(
      "href",
      "/notices/service-update?locale=ko",
    )
  })

  it("preserves a valid category through detail, pagination, and back links", async () => {
    const documents = Array.from({ length: 21 }, (_, index) => ({
      ...published,
      id: `8ca55b3d-a4fc-4a41-b922-${String(index + 1).padStart(12, "0")}`,
      slug: `service-update-${index + 1}`,
      publishedAt: new Date(published.publishedAt.getTime() - index * 1_000),
    }))
    render(await DocumentIndex({
      kind: "notice",
      locale: "ko",
      section: documentSections.notice,
      category: "service",
      categories: managedCategories,
      repository: repository({ listPublished: vi.fn().mockResolvedValue(documents) }),
    }))

    expect(screen.getAllByRole("link", { name: /서비스 업데이트/ })[0]).toHaveAttribute(
      "href",
      "/notices/service-update-1?locale=ko&category=service",
    )
    expect(screen.getByRole("link", { name: "다음 문서" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/notices\?locale=ko&cursor=.*&category=service$/),
    )

    render(await DocumentDetail({
      kind: "notice",
      slug: "service-update",
      locale: "ko",
      section: documentSections.notice,
      category: "service",
      categories: managedCategories,
      repository: repository(),
    }))
    expect(screen.getByRole("link", { name: "← 목록으로" })).toHaveAttribute(
      "href",
      "/notices?locale=ko&category=service",
    )
  })

  it("keeps a selected inactive category valid without exposing other inactive categories", async () => {
    const store = repository({ listPublished: vi.fn().mockResolvedValue([]) })
    render(await DocumentIndex({
      kind: "notice",
      locale: "ko",
      section: documentSections.notice,
      category: "retired",
      categories: managedCategories,
      repository: store,
    }))

    expect(store.listPublished).toHaveBeenCalledWith(expect.objectContaining({ category: "retired" }))
    const category = screen.getByRole("combobox", { name: "카테고리" })
    expect(category).toHaveValue("retired")
    expect(within(category).getByRole("option", { name: "종료됨" })).toBeDisabled()
  })

  it("preserves a newly managed category in document detail back links", async () => {
    render(await DocumentDetail({
      kind: "notice",
      slug: "service-update",
      locale: "ko",
      section: documentSections.notice,
      category: "engineering",
      categories: managedCategories,
      repository: repository(),
    }))

    expect(screen.getByRole("link", { name: "← 목록으로" })).toHaveAttribute(
      "href",
      "/notices?locale=ko&category=engineering",
    )
  })

  it("passes bounded search and oldest sorting through pagination", async () => {
    const documents = Array.from({ length: 21 }, (_, index) => ({
      ...published,
      id: `8ca55b3d-a4fc-4a41-b922-${String(index + 1).padStart(12, "0")}`,
      slug: `service-update-${index + 1}`,
      publishedAt: new Date(published.publishedAt.getTime() + index * 1_000),
    }))
    const store = repository({ listPublished: vi.fn().mockResolvedValue(documents) })

    render(await DocumentIndex({
      kind: "notice",
      locale: "ko",
      section: documentSections.notice,
      category: "service",
      sort: "oldest",
      q: "  운영 소식  ",
      categories: managedCategories,
      repository: store,
    }))

    expect(store.listPublished).toHaveBeenCalledWith(expect.objectContaining({
      category: "service",
      sort: "oldest",
      search: "운영 소식",
    }))
    const next = screen.getByRole("link", { name: "다음 문서" })
    expect(next).toHaveAttribute("href", expect.stringContaining("sort=oldest"))
    expect(next).toHaveAttribute("href", expect.stringContaining("q=%EC%9A%B4%EC%98%81+%EC%86%8C%EC%8B%9D"))
  })

  it("updates URL-backed discovery controls and clears the cursor", async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, "", "/notices?locale=en&cursor=old")
    render(await DocumentIndex({
      kind: "notice",
      locale: "en",
      section: documentSections.notice,
      categories: managedCategories,
      repository: repository({ listPublished: vi.fn().mockResolvedValue([]) }),
    }))

    await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "engineering")
    expect(navigationMocks.replace).toHaveBeenLastCalledWith(
      "/notices?locale=en&category=engineering",
      { scroll: false },
    )

    await user.type(screen.getByRole("searchbox", { name: "Search notices" }), "routing")
    await user.click(screen.getByRole("button", { name: "Search" }))
    expect(navigationMocks.replace).toHaveBeenLastCalledWith(
      "/notices?locale=en&q=routing",
      { scroll: false },
    )
  })

  it("preserves the selected locale in cursor pagination links", async () => {
    const documents = Array.from({ length: 21 }, (_, index) => ({
      ...published,
      id: `8ca55b3d-a4fc-4a41-b922-${String(index + 1).padStart(12, "0")}`,
      locale: "en" as const,
      slug: `service-update-${index + 1}`,
      title: `Service update ${index + 1}`,
      publishedAt: new Date(published.publishedAt.getTime() - index * 1_000),
    }))

    render(await DocumentIndex({
      kind: "notice",
      locale: "en",
      section: documentSections.notice,
      repository: repository({ listPublished: vi.fn().mockResolvedValue(documents) }),
    }))

    expect(screen.getByRole("link", { name: "More documents" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/notices\?locale=en&cursor=/),
    )
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

  it("links the three document indexes and static design guide from the localized footer", () => {
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

  it("keeps homepage chrome fragment navigation unchanged", () => {
    render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="essential" dnt={false}>
          <SiteHeader />
          <SiteFooter />
        </ConsentProvider>
      </LocaleProvider>,
    )

    expect(screen.getByRole("link", { name: "LafLabs" })).toHaveAttribute("href", "#top")
    expect(screen.getByRole("link", { name: "Company" })).toHaveAttribute("href", "#company")
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("href", "#work")
    expect(screen.getByRole("link", { name: "How we work" })).toHaveAttribute("href", "#work-method")
  })

  it("uses homepage URLs for document-layout chrome navigation", () => {
    render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="essential" dnt={false}>
          <DocumentLayout><p>Document</p></DocumentLayout>
        </ConsentProvider>
      </LocaleProvider>,
    )

    expect(screen.getByRole("link", { name: "LafLabs" })).toHaveAttribute("href", "/")
    expect(screen.getByRole("link", { name: "Company" })).toHaveAttribute("href", "/#company")
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("href", "/#work")
    expect(screen.getByRole("link", { name: "Open source" })).toHaveAttribute("href", "/#open-source")
    expect(screen.getByRole("link", { name: "How we work" })).toHaveAttribute("href", "/#work-method")
    expect(screen.getByRole("link", { name: "Laf ID" })).toHaveAttribute("href", "/#work")
  })

  it("navigates document routes to the selected locale and drops the old cursor", async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, "", "/notices/service-update?locale=en&cursor=old&category=service")
    render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="essential" dnt={false}>
          <DocumentLayout><p>Document</p></DocumentLayout>
        </ConsentProvider>
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "KO" }))

    expect(navigationMocks.replace).toHaveBeenCalledWith(
      "/notices/service-update?locale=ko&category=service",
      { scroll: false },
    )
  })

  it("gives a valid explicit locale precedence over the Korean root context in document boundaries", () => {
    window.history.replaceState({}, "", "/notices/missing?locale=en")
    render(
      <LocaleProvider initialLocale="ko">
        <DocumentError error={new Error("hidden")} reset={vi.fn()} />
        <DocumentNotFound />
      </LocaleProvider>,
    )

    expect(screen.getByRole("heading", { name: "We could not load this document." }).closest("section")).toHaveAttribute("lang", "en")
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Document not found." }).closest("section")).toHaveAttribute("lang", "en")
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/")
  })

  it("falls back to the root locale when the explicit boundary locale is invalid", () => {
    window.history.replaceState({}, "", "/notices/missing?locale=fr")
    render(
      <LocaleProvider initialLocale="ko">
        <DocumentError error={new Error("hidden")} reset={vi.fn()} />
        <DocumentNotFound />
      </LocaleProvider>,
    )

    expect(screen.getByRole("heading", { name: "문서를 불러오지 못했습니다." }).closest("section")).toHaveAttribute("lang", "ko")
    expect(screen.getByRole("heading", { name: "문서를 찾을 수 없습니다." }).closest("section")).toHaveAttribute("lang", "ko")
  })

  it("keeps the homepage in the sitemap when document storage is unavailable", async () => {
    const store = repository({ listPublished: vi.fn().mockRejectedValue(new Error("database unavailable")) })

    await expect(buildSitemap(store)).resolves.toEqual([{
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    }, {
      url: `${siteUrl}/design`,
      changeFrequency: "monthly",
      priority: 0.6,
    }])
  })

  it("adds published Korean document series to the sitemap", async () => {
    const store = repository({
      listPublished: vi.fn().mockImplementation(async (filter: PublishedDocumentFilter) => filter.kind === "notice" ? [published] : []),
    })

    const entries = await buildSitemap(store)

    expect(entries).toEqual([
      { url: siteUrl, changeFrequency: "monthly", priority: 1 },
      { url: `${siteUrl}/design`, changeFrequency: "monthly", priority: 0.6 },
      {
        url: `${siteUrl}/notices/service-update`,
        lastModified: published.publishedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ])
  })

  it("paginates the sitemap past fifty published series", async () => {
    const documents = Array.from({ length: 51 }, (_, index) => ({
      ...published,
      id: `8ca55b3d-a4fc-4a41-b922-${String(index + 1).padStart(12, "0")}`,
      slug: `service-update-${index + 1}`,
      publishedAt: new Date(published.publishedAt.getTime() - index * 1_000),
    }))
    const store = repository({
      listPublished: vi.fn().mockImplementation(async (filter: PublishedDocumentFilter) => {
        if (filter.kind !== "notice") return []
        return filter.before ? documents.slice(50) : documents.slice(0, 50)
      }),
    })

    const entries = await buildSitemap(store)

    expect(entries).toHaveLength(53)
    expect(entries.at(-1)?.url).toBe(`${siteUrl}/notices/service-update-51`)
  })
})
