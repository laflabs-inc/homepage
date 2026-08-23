import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const navigationMocks = vi.hoisted(() => ({ replace: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigationMocks.replace }),
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

import { AdminNav } from "@/components/admin/admin-nav"
import { DocumentEditor } from "@/components/admin/document-editor"
import { DocumentList } from "@/components/admin/document-list"
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
  summary: "변경 사항을 안내합니다.",
  bodyMarkdown: "## 변경 사항\n본문입니다.",
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

function okResponse(nextRevision: DocumentRevision = revision) {
  return Promise.resolve(new Response(JSON.stringify({ revision: nextRevision }), {
    status: 200,
    headers: { "content-type": "application/json" },
  }))
}

function okDeleteResponse() {
  return Promise.resolve(new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  }))
}

beforeEach(() => {
  vi.restoreAllMocks()
  navigationMocks.replace.mockReset()
  window.history.replaceState({}, "", `/admin/documents/${revision.id}`)
  vi.stubGlobal("fetch", vi.fn((input: string | URL | Request, init?: RequestInit) => {
    const path = String(input)
    if (init?.method === "DELETE") return okDeleteResponse()
    if (path.endsWith("/schedule")) return okResponse({ ...revision, status: "scheduled", scheduledAt: new Date("2099-01-01") })
    if (path.endsWith("/unschedule")) return okResponse(revision)
    if (path.endsWith("/publish")) return okResponse({ ...revision, status: "published", publishedAt: new Date() })
    if (path.endsWith("/archive")) return okResponse({ ...revision, status: "archived" })
    if (path.endsWith("/new-revision")) return okResponse({ ...revision, revision: 2 })
    return okResponse()
  }))
  vi.spyOn(window, "confirm").mockReturnValue(true)
})

describe("document admin", () => {
  it("links the protected admin areas and lists document revisions", () => {
    render(
      <>
        <AdminNav />
        <DocumentList revisions={[revision, { ...revision, id: "published-id", status: "published" }]} />
      </>,
    )

    const navigation = screen.getByRole("navigation", { name: "Admin" })
    expect(within(navigation).getByRole("link", { name: "Analytics" })).toHaveAttribute("href", "/admin/analytics")
    expect(within(navigation).getByRole("link", { name: "Documents" })).toHaveAttribute("href", "/admin/documents")
    expect(screen.getByRole("link", { name: /서비스 업데이트.*draft/i })).toHaveAttribute(
      "href",
      `/admin/documents/${revision.id}`,
    )
    expect(screen.getByText("published")).toBeInTheDocument()
  })

  it("offers kind and locale fields plus accessible source and preview tabs", () => {
    render(<DocumentEditor />)

    expect(screen.getByRole("combobox", { name: "Kind" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Locale" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "English" })).not.toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Source" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveAttribute("aria-selected", "false")
    expect(screen.getByRole("tabpanel", { name: "Source" })).toBeInTheDocument()
  })

  it("renders the current Markdown through the shared preview", async () => {
    const user = userEvent.setup()
    render(<DocumentEditor revision={revision} />)

    const body = screen.getByRole("textbox", { name: "Markdown body" })
    await user.clear(body)
    await user.type(body, "## 새 제목\n새 본문")
    await user.click(screen.getByRole("tab", { name: "Preview" }))

    const preview = screen.getByRole("tabpanel", { name: "Preview" })
    expect(within(preview).getByRole("heading", { level: 2, name: "새 제목" })).toBeInTheDocument()
    expect(within(preview).getByText("새 본문")).toBeInTheDocument()
  })

  it("saves a validated draft payload to the revision endpoint", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    render(<DocumentEditor revision={revision} />)

    await user.clear(screen.getByRole("textbox", { name: "Title" }))
    await user.type(screen.getByRole("textbox", { name: "Title" }), "업데이트 안내")
    await user.click(screen.getByRole("button", { name: "Save draft" }))

    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/documents/${revision.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "notice",
        locale: "ko",
        slug: "service-update",
        category: "service",
        pinned: false,
        title: "업데이트 안내",
        summary: "변경 사항을 안내합니다.",
        bodyMarkdown: "## 변경 사항\n본문입니다.",
        effectiveAt: null,
      }),
    })
    expect(await screen.findByText("Draft saved.")).toBeInTheDocument()
  })

  it("posts a new Korean draft to the collection endpoint", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    render(<DocumentEditor />)

    await user.type(screen.getByRole("textbox", { name: "Slug" }), "new-notice")
    await user.type(screen.getByRole("textbox", { name: "Title" }), "새 공지")
    await user.type(screen.getByRole("textbox", { name: "Markdown body" }), "본문")
    await user.click(screen.getByRole("button", { name: "Save draft" }))

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/documents", expect.objectContaining({ method: "POST" }))
  })

  it("prevents accidental browser navigation while the draft is dirty", async () => {
    const user = userEvent.setup()
    render(<DocumentEditor revision={revision} />)

    await user.type(screen.getByRole("textbox", { name: "Summary" }), " 추가")
    const event = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it("blocks a real persistent admin-link click when dirty and the user cancels", async () => {
    const user = userEvent.setup()
    vi.mocked(window.confirm).mockReturnValue(false)
    render(<><AdminNav /><DocumentEditor revision={revision} /></>)

    await user.type(screen.getByRole("textbox", { name: "Summary" }), " 추가")
    await user.click(screen.getByRole("link", { name: "Analytics" }))

    expect(window.confirm).toHaveBeenCalledWith("You have unsaved document changes. Leave this page?")
    expect(window.location.pathname).toBe(`/admin/documents/${revision.id}`)
  })

  it("guards browser back navigation while dirty", async () => {
    const user = userEvent.setup()
    vi.mocked(window.confirm).mockReturnValue(false)
    window.history.replaceState({}, "", "/admin/documents")
    window.history.pushState({}, "", `/admin/documents/${revision.id}`)
    render(<DocumentEditor revision={revision} />)

    await user.type(screen.getByRole("textbox", { name: "Summary" }), " 추가")
    window.history.back()

    await waitFor(() => expect(window.confirm).toHaveBeenCalledWith(
      "You have unsaved document changes. Leave this page?",
    ))
    expect(window.location.pathname).toBe(`/admin/documents/${revision.id}`)
  })

  it("disables schedule and publish while edits are dirty and explains why", async () => {
    const user = userEvent.setup()
    render(<DocumentEditor revision={revision} />)

    fireEvent.change(screen.getByLabelText("Schedule time"), { target: { value: "2099-01-01T00:00" } })
    await user.type(screen.getByRole("textbox", { name: "Summary" }), " 추가")

    expect(screen.getByRole("button", { name: "Schedule" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Publish now" })).toBeDisabled()
    expect(screen.getByText("Save the draft before scheduling or publishing.")).toBeInTheDocument()
  })

  it("creates an English draft from explicit Korean-series context", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    render(<DocumentEditor seriesId={revision.seriesId} templateRevision={revision} />)

    expect(screen.getByRole("combobox", { name: "Locale" })).toHaveValue("en")
    expect(screen.getByRole("combobox", { name: "Locale" })).toBeDisabled()
    expect(screen.getByRole("combobox", { name: "Kind" })).toBeDisabled()
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue(revision.slug)
    await user.type(screen.getByRole("textbox", { name: "Title" }), "Service update")
    await user.type(screen.getByRole("textbox", { name: "Markdown body" }), "English body")
    await user.click(screen.getByRole("button", { name: "Save draft" }))

    const request = fetchMock.mock.calls.at(-1)
    expect(request?.[0]).toBe("/api/admin/documents")
    expect(JSON.parse(String((request?.[1] as RequestInit).body))).toMatchObject({
      seriesId: revision.seriesId,
      locale: "en",
      kind: revision.kind,
      slug: revision.slug,
    })
  })

  it("links Korean revisions to explicit English creation context", () => {
    render(<DocumentEditor revision={revision} />)

    expect(screen.getByRole("link", { name: "Create English revision" })).toHaveAttribute(
      "href",
      `/admin/documents/new?seriesId=${revision.seriesId}&sourceRevisionId=${revision.id}`,
    )
  })

  it("warns that English publication requires a published Korean counterpart", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<DocumentEditor revision={{ ...revision, locale: "en" }} />)

    expect(screen.getByText("English publication requires a published Korean counterpart.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Publish now" }))
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("published Korean counterpart"))

    vi.mocked(window.confirm).mockClear()
    rerender(<DocumentEditor
      key="scheduled-english"
      revision={{ ...revision, locale: "en", status: "scheduled", scheduledAt: new Date("2099-01-01") }}
    />)
    expect(screen.getByText("English publication requires a published Korean counterpart.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Publish now" }))
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("published Korean counterpart"))
  })

  it("filters loaded revisions and shows publisher plus the relevant date", async () => {
    const user = userEvent.setup()
    const published = {
      ...revision,
      id: "8ca55b3d-a4fc-4a41-b922-a0a9c32d7999",
      kind: "legal" as const,
      locale: "en" as const,
      title: "Privacy policy",
      status: "published" as const,
      publishedBy: "publisher-77",
      publishedAt: new Date("2026-08-24T12:00:00.000Z"),
    }
    render(<DocumentList revisions={[revision, published]} />)

    expect(screen.getByRole("searchbox", { name: "Search documents" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Kind filter" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Status filter" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Locale filter" })).toBeInTheDocument()
    expect(screen.getByText("By publisher-77")).toBeInTheDocument()
    expect(screen.getByText("Published 2026-08-24")).toBeInTheDocument()

    await user.selectOptions(screen.getByRole("combobox", { name: "Kind filter" }), "legal")
    expect(screen.queryByRole("link", { name: /서비스 업데이트/ })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Privacy policy/ })).toBeInTheDocument()
    await user.type(screen.getByRole("searchbox", { name: "Search documents" }), "missing")
    expect(screen.getByText("No documents match these filters.")).toBeInTheDocument()
  })

  it("confirms draft deletion and navigates safely to the document list", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    render(<DocumentEditor revision={revision} />)

    await user.click(screen.getByRole("button", { name: "Delete draft" }))

    expect(window.confirm).toHaveBeenCalledWith("Delete this draft permanently?")
    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/documents/${revision.id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: "{}",
    })
    expect(navigationMocks.replace).toHaveBeenCalledWith("/admin/documents")
  })

  it("renders published content as immutable metadata with revision actions", () => {
    render(<DocumentEditor revision={{
      ...revision,
      status: "published",
      publishedAt: new Date("2026-08-23T12:00:00.000Z"),
      publishedBy: "4242",
    }} />)

    expect(screen.queryByRole("textbox", { name: "Title" })).not.toBeInTheDocument()
    expect(screen.getAllByText("서비스 업데이트")).toHaveLength(2)
    expect(screen.getAllByText(/Published/)).toHaveLength(2)
    expect(screen.getByRole("button", { name: "Create new revision" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument()
  })

  it("confirms schedule, publish, unschedule, archive, and new-revision mutations", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const { rerender } = render(<DocumentEditor revision={revision} />)

    fireEvent.change(screen.getByLabelText("Schedule time"), { target: { value: "2099-01-01T00:00" } })
    await user.click(screen.getByRole("button", { name: "Schedule" }))
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/admin/documents/${revision.id}/schedule`,
      expect.objectContaining({ body: JSON.stringify({ scheduledAt: "2099-01-01T00:00:00.000Z" }) }),
    )

    rerender(<DocumentEditor key="draft" revision={revision} />)
    await user.click(screen.getByRole("button", { name: "Publish now" }))
    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/documents/${revision.id}/publish`, expect.any(Object))

    rerender(<DocumentEditor key="scheduled" revision={{ ...revision, status: "scheduled", scheduledAt: new Date("2099-01-01") }} />)
    await user.click(screen.getByRole("button", { name: "Return to draft" }))
    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/documents/${revision.id}/unschedule`, expect.any(Object))

    rerender(<DocumentEditor key="published" revision={{ ...revision, status: "published", publishedAt: new Date() }} />)
    await user.click(screen.getByRole("button", { name: "Archive" }))
    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/documents/${revision.id}/archive`, expect.any(Object))
    await user.click(screen.getByRole("button", { name: "Create new revision" }))
    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/documents/${revision.id}/new-revision`, expect.any(Object))
    expect(window.confirm).toHaveBeenCalledTimes(5)
  })

  it("announces safe API failures without exposing response content", async () => {
    const user = userEvent.setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: "unavailable", internal: "secret document contents" }),
      { status: 503, headers: { "content-type": "application/json" } },
    )))
    render(<DocumentEditor revision={revision} />)

    await user.click(screen.getByRole("button", { name: "Save draft" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("The document could not be updated. Please try again.")
    expect(alert).not.toHaveTextContent("secret document contents")
  })
})
