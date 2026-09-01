import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const serviceMocks = vi.hoisted(() => ({
  listAdmin: vi.fn(),
  listAdminSummaries: vi.fn(),
  getRevision: vi.fn(),
}))
const authMocks = vi.hoisted(() => ({ requireAdmin: vi.fn() }))
const localeMocks = vi.hoisted(() => ({ getAdminLocale: vi.fn() }))

vi.mock("@/lib/auth/require-admin", () => authMocks)
vi.mock("@/lib/admin/locale", () => localeMocks)
vi.mock("@/lib/documents/service", () => ({ documentService: serviceMocks }))
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => { throw new Error("not found") }),
  useRouter: () => ({ replace: vi.fn() }),
}))
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))
vi.mock("@/app/admin/admin.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/content/content.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import DocumentsPage from "@/app/admin/(protected)/documents/page"
import DocumentRevisionPage from "@/app/admin/(protected)/documents/[revisionId]/page"
import MarkdownGuidePage, { generateMetadata as generateMarkdownGuideMetadata } from "@/app/admin/(protected)/documents/markdown-guide/page"
import NewDocumentPage from "@/app/admin/(protected)/documents/new/page"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import type { DocumentRevision } from "@/lib/documents/types"

const revision: DocumentRevision = {
  id: "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131",
  seriesId: "c5bcf607-a48f-42b9-af99-55c70ef48640",
  kind: "notice",
  locale: "ko",
  slug: "service-update",
  category: "service",
  pinned: false,
  revision: 1,
  title: "서비스 업데이트",
  summary: "full summary",
  bodyMarkdown: "private full body",
  status: "draft",
  effectiveAt: null,
  scheduledAt: null,
  publishedAt: null,
  createdBy: "4242",
  updatedBy: "4242",
  publishedBy: null,
  createdAt: new Date("2026-08-23T09:00:00.000Z"),
  updatedAt: new Date("2026-08-23T09:00:00.000Z"),
}
const summary = {
  id: revision.id,
  kind: revision.kind,
  locale: revision.locale,
  revision: revision.revision,
  title: revision.title,
  status: revision.status,
  scheduledAt: revision.scheduledAt,
  publishedAt: revision.publishedAt,
  updatedAt: revision.updatedAt,
  updatedBy: revision.updatedBy,
  publishedBy: revision.publishedBy,
}

beforeEach(() => {
  vi.restoreAllMocks()
  serviceMocks.listAdmin.mockReset().mockResolvedValue([])
  serviceMocks.listAdminSummaries.mockReset().mockResolvedValue({ items: [summary], nextCursor: null })
  serviceMocks.getRevision.mockReset().mockResolvedValue(revision)
  localeMocks.getAdminLocale.mockReset().mockResolvedValue("en")
})

describe("protected admin document queries", () => {
  it("localizes the route-owned Markdown guide metadata", async () => {
    localeMocks.getAdminLocale.mockResolvedValue("ko")
    expect(await generateMarkdownGuideMetadata()).toEqual(expect.objectContaining({
      title: "Markdown 작성 가이드 | Admin",
    }))

    localeMocks.getAdminLocale.mockResolvedValue("en")
    expect(await generateMarkdownGuideMetadata()).toEqual(expect.objectContaining({
      title: "Markdown guide | Admin",
    }))
  })

  it("renders the Markdown guide behind the admin boundary", async () => {
    render(<LocaleProvider initialLocale="en">{await MarkdownGuidePage()}</LocaleProvider>)

    expect(authMocks.requireAdmin).toHaveBeenCalled()
    expect(screen.getByText("Markdown writing guide", { selector: "h1" })).toBeInTheDocument()
    expect(screen.getByText("Back to documents").closest("a")).toHaveAttribute("href", "/admin/documents")
    const aiGuideLink = screen.queryByText("Markdown source for AI")?.closest("a")
    expect(aiGuideLink).toHaveAttribute("href", "/markdown-guide.md")
    expect(aiGuideLink).toHaveAttribute("target", "_blank")
  })

  it("renders the index from the bounded minimal summary query", async () => {
    render(<LocaleProvider initialLocale="en">{await DocumentsPage()}</LocaleProvider>)

    expect(screen.getByRole("link", { name: /서비스 업데이트/ })).toBeInTheDocument()
    expect(screen.queryByText("private full body")).not.toBeInTheDocument()
    expect(serviceMocks.listAdminSummaries).toHaveBeenCalledWith({ limit: 50 })
    expect(serviceMocks.listAdmin).not.toHaveBeenCalled()
  })

  it("uses the resolved Korean locale for the document list shell and filters", async () => {
    localeMocks.getAdminLocale.mockResolvedValue("ko")

    render(<LocaleProvider initialLocale="ko">{await DocumentsPage()}</LocaleProvider>)

    expect(screen.getByRole("heading", { name: "문서" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "새 문서" })).toHaveAttribute("href", "/admin/documents/new")
    expect(screen.getByRole("link", { name: "카테고리 관리" })).toHaveAttribute(
      "href",
      "/admin/documents/categories",
    )
    expect(screen.getByRole("searchbox", { name: "문서 검색" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "필터 적용" })).toHaveAttribute("href", "/admin/documents?limit=50")
  })

  it("passes filters/search/cursor to the summary query and preserves them in pagination", async () => {
    const beforeId = "f1f0c3ce-4b5f-46a0-b63d-f964b194d4d4"
    const beforeDate = "2026-08-22T08:30:00.000Z"
    const cursor = Buffer.from(JSON.stringify({ updatedAt: beforeDate, id: beforeId }), "utf8").toString("base64url")
    const nextId = "2558f5d0-2f26-44a2-a901-ad4e961bd248"
    const nextDate = new Date("2026-08-21T07:00:00.000Z")
    const nextCursor = Buffer.from(JSON.stringify({
      updatedAt: nextDate.toISOString(),
      id: nextId,
    }), "utf8").toString("base64url")
    serviceMocks.listAdminSummaries.mockResolvedValue({
      items: [summary],
      nextCursor: { updatedAt: nextDate, id: nextId },
    })
    const renderPage = DocumentsPage as unknown as (props: {
      searchParams: Promise<Record<string, string>>
    }) => ReturnType<typeof DocumentsPage>

    render(<LocaleProvider initialLocale="en">{await renderPage({
      searchParams: Promise.resolve({
        kind: "notice",
        locale: "ko",
        status: "draft",
        search: "서비스",
        limit: "25",
        cursor,
      }),
    })}</LocaleProvider>)

    expect(serviceMocks.listAdminSummaries).toHaveBeenCalledWith({
      kind: "notice",
      locale: "ko",
      status: "draft",
      search: "서비스",
      limit: 25,
      before: { updatedAt: new Date(beforeDate), id: beforeId },
    })
    expect(screen.getByRole("searchbox", { name: "Search documents" })).toHaveValue("서비스")
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      `/admin/documents?search=${encodeURIComponent("서비스")}&kind=notice&status=draft&locale=ko&limit=25&cursor=${nextCursor}`,
    )
  })

  it("canonicalizes whitespace-only search to an absent filter", async () => {
    const renderPage = DocumentsPage as unknown as (props: {
      searchParams: Promise<Record<string, string>>
    }) => ReturnType<typeof DocumentsPage>

    render(<LocaleProvider initialLocale="en">{await renderPage({ searchParams: Promise.resolve({ search: "   " }) })}</LocaleProvider>)

    expect(serviceMocks.listAdminSummaries).toHaveBeenCalledWith({ limit: 50 })
    expect(screen.getByRole("searchbox", { name: "Search documents" })).toHaveValue("")
  })

  it("loads a revision detail directly by ID", async () => {
    render(
      <LocaleProvider initialLocale="en">
        {await DocumentRevisionPage({ params: Promise.resolve({ revisionId: revision.id }) })}
      </LocaleProvider>,
    )

    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue(revision.title)
    expect(serviceMocks.getRevision).toHaveBeenCalledWith(revision.id)
    expect(serviceMocks.listAdmin).not.toHaveBeenCalled()
  })

  it("rejects a malformed revision detail ID before querying storage", async () => {
    await expect(DocumentRevisionPage({ params: Promise.resolve({ revisionId: "not-a-uuid" }) }))
      .rejects.toThrow("not found")

    expect(serviceMocks.getRevision).not.toHaveBeenCalled()
  })

  it("loads the Korean English-template source directly by ID", async () => {
    render(
      <LocaleProvider initialLocale="en">
        {await NewDocumentPage({
          searchParams: Promise.resolve({
            seriesId: revision.seriesId,
            sourceRevisionId: revision.id,
          }),
        })}
      </LocaleProvider>,
    )

    expect(screen.getByRole("combobox", { name: "Locale" })).toHaveValue("en")
    expect(serviceMocks.getRevision).toHaveBeenCalledWith(revision.id)
    expect(serviceMocks.listAdmin).not.toHaveBeenCalled()
  })
})
