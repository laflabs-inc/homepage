import { act, fireEvent, render as renderBase, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const navigationMocks = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
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
import { LocaleProvider } from "@/components/i18n/locale-provider"
import { toAdminDocumentListRow } from "@/lib/documents/admin-list"
import type { DocumentRevision } from "@/lib/documents/types"

function EnglishLocaleTestProvider({ children }: { children: React.ReactNode }) {
  return <LocaleProvider initialLocale="en">{children}</LocaleProvider>
}

function render(ui: React.ReactElement) {
  return renderBase(ui, { wrapper: EnglishLocaleTestProvider })
}

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
const revisionPath = `/admin/documents/${revision.id}`

function AppRouterTreeHarness() {
  const [tree, setTree] = useState({ path: revisionPath, traversals: 0 })

  useEffect(() => {
    navigationMocks.push.mockImplementation((href: string) => {
      window.history.pushState(window.history.state, "", href)
      setTree((current) => ({ ...current, path: new URL(href, window.location.href).pathname }))
    })
    navigationMocks.replace.mockImplementation((href: string) => {
      window.history.replaceState(window.history.state, "", href)
      setTree((current) => ({ ...current, path: new URL(href, window.location.href).pathname }))
    })
    const traverse = () => setTree((current) => ({
      path: window.location.pathname,
      traversals: current.traversals + 1,
    }))
    window.addEventListener("popstate", traverse)
    return () => window.removeEventListener("popstate", traverse)
  }, [])

  return (
    <div data-testid="app-router-tree" data-path={tree.path} data-traversals={tree.traversals}>
      {tree.path === revisionPath
        ? <DocumentEditor revision={revision} />
        : <p>Destination route tree</p>}
    </div>
  )
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
  navigationMocks.push.mockReset()
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
  it("renders the Korean editor workflow without changing the loaded document values", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <LocaleProvider key="ko" initialLocale="ko">
        <DocumentEditor revision={revision} />
      </LocaleProvider>,
    )

    expect(screen.getByRole("textbox", { name: "제목" })).toHaveValue("서비스 업데이트")
    await user.click(screen.getByRole("tab", { name: "미리보기" }))
    expect(screen.getByRole("tabpanel", { name: "미리보기" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "지금 발행" }))
    expect(window.confirm).toHaveBeenCalledWith("지금 이 문서를 발행할까요?")
    expect(await screen.findByRole("status")).toHaveTextContent("문서를 발행했습니다.")

    rerender(
      <LocaleProvider key="en" initialLocale="en">
        <DocumentEditor revision={revision} />
      </LocaleProvider>,
    )

    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("서비스 업데이트")
  })

  it("uses the Korean permanent-deletion confirmation", async () => {
    const user = userEvent.setup()
    vi.spyOn(window, "prompt").mockReturnValue(null)
    render(
      <LocaleProvider initialLocale="ko">
        <AdminNav />
        <DocumentEditor revision={{ ...revision, status: "archived" }} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "완전히 삭제" }))
    expect(window.prompt).toHaveBeenCalledWith("완전히 삭제하려면 문서 제목을 입력하세요:", "")
  })

  it("uses the Korean dirty-navigation confirmation", async () => {
    const user = userEvent.setup()
    vi.mocked(window.confirm).mockReturnValue(false)
    render(
      <LocaleProvider initialLocale="ko">
        <AdminNav />
        <DocumentEditor revision={revision} />
      </LocaleProvider>,
    )

    await user.type(screen.getByRole("textbox", { name: "요약" }), " 수정")
    await user.click(screen.getByRole("link", { name: "분석" }))

    expect(window.confirm).toHaveBeenCalledWith("저장하지 않은 문서 변경 사항이 있습니다. 이 페이지를 나갈까요?")
  })

  it("links the protected admin areas and lists document revisions", () => {
    render(
      <LocaleProvider initialLocale="en">
        <AdminNav />
        <DocumentList rows={[revision, { ...revision, id: "published-id", status: "published" as const }].map(toAdminDocumentListRow)} />
      </LocaleProvider>,
    )

    const navigation = screen.getByRole("navigation", { name: "Admin" })
    expect(within(navigation).getByRole("link", { name: "Analytics" })).toHaveAttribute("href", "/admin/analytics")
    expect(within(navigation).getByRole("link", { name: "Documents" })).toHaveAttribute("href", "/admin/documents")
    expect(within(navigation).getByRole("link", { name: "Agent" })).toHaveAttribute("href", "/admin/agent")
    expect(screen.getByRole("link", { name: /서비스 업데이트.*draft/i })).toHaveAttribute(
      "href",
      `/admin/documents/${revision.id}`,
    )
    expect(screen.getAllByText("Published")).toHaveLength(2)
  })

  it("offers kind and locale fields plus accessible source and preview tabs", () => {
    render(<DocumentEditor />)

    expect(screen.getByRole("combobox", { name: "Kind" })).toBeInTheDocument()
    expect(within(screen.getByRole("combobox", { name: "Kind" })).queryByRole("option", { name: "Design" })).not.toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Locale" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "English" })).not.toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Source" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveAttribute("aria-selected", "false")
    expect(screen.getByRole("tabpanel", { name: "Source" })).toBeInTheDocument()
  })

  it("shows localized category labels while preserving canonical option values", () => {
    const { unmount } = render(
      <LocaleProvider initialLocale="ko"><DocumentEditor /></LocaleProvider>,
    )
    const koreanCategories = screen.getByRole("combobox", { name: "카테고리" })
    expect(within(koreanCategories).getByRole("option", { name: "일반" })).toHaveValue("general")
    expect(within(koreanCategories).getByRole("option", { name: "서비스" })).toHaveValue("service")

    unmount()
    render(<DocumentEditor />)
    const englishCategories = screen.getByRole("combobox", { name: "Category" })
    expect(within(englishCategories).getByRole("option", { name: "General" })).toHaveValue("general")
    expect(within(englishCategories).getByRole("option", { name: "Service" })).toHaveValue("service")
  })

  it("opens the Markdown writing guide without leaving an unsaved draft", () => {
    render(<DocumentEditor />)

    expect(screen.getByRole("link", { name: "Markdown writing guide" })).toHaveAttribute(
      "href",
      "/admin/documents/markdown-guide",
    )
    expect(screen.getByRole("link", { name: "Markdown writing guide" })).toHaveAttribute("target", "_blank")
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

  it("generates and server-saves an editable summary for a saved draft", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockImplementationOnce(async () => new Response(JSON.stringify({
      summary: "AI generated summary",
      remainingMonthlyBudget: {
        month: "2026-08",
        limitMicrousd: 50_000_000,
        actualCostMicrousd: 1_000,
        reservedCostMicrousd: 0,
        remainingMicrousd: 49_999_000,
        exhausted: false,
      },
    }), { status: 200, headers: { "content-type": "application/json" } }))
    render(<DocumentEditor revision={revision} />)

    await user.click(screen.getByRole("button", { name: "Generate with AI" }))

    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/documents/${revision.id}/summary`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    })
    const summary = await screen.findByRole("textbox", { name: "Summary" })
    expect(summary).toHaveValue("AI generated summary")
    expect(screen.getByText("Summary generated and saved. Estimated monthly budget remaining: $49.999.")).toBeInTheDocument()

    await user.type(summary, " edited")
    expect(summary).toHaveValue("AI generated summary edited")
    expect(screen.getByRole("button", { name: "Generate with AI" })).toBeDisabled()
  })

  it("announces loading and safe summary failures", async () => {
    const user = userEvent.setup()
    let resolveGeneration!: (response: Response) => void
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((resolve) => {
      resolveGeneration = resolve
    }))
    render(<DocumentEditor revision={revision} />)

    await user.click(screen.getByRole("button", { name: "Generate with AI" }))
    expect(screen.getByRole("button", { name: "Generating…" })).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("button", { name: "Generating…" })).toBeDisabled()

    await act(async () => resolveGeneration(Response.json({ error: "provider_unavailable" }, { status: 503 })))
    expect(await screen.findByRole("alert")).toHaveTextContent("The summary could not be generated. Save the draft and try again.")
  })

  it("keeps a generated summary successful when the budget estimate is unavailable", async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementationOnce(async () => Response.json({
      summary: "Saved AI summary",
      remainingMonthlyBudget: null,
    }))
    render(<DocumentEditor revision={revision} />)

    await user.click(screen.getByRole("button", { name: "Generate with AI" }))

    expect(await screen.findByRole("textbox", { name: "Summary" })).toHaveValue("Saved AI summary")
    expect(screen.getByRole("status")).toHaveTextContent(
      "Summary generated and saved. Estimated monthly budget is temporarily unavailable.",
    )
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
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
    render(<LocaleProvider initialLocale="en"><AdminNav /><DocumentEditor revision={revision} /></LocaleProvider>)

    await user.type(screen.getByRole("textbox", { name: "Summary" }), " 추가")
    await user.click(screen.getByRole("link", { name: "Analytics" }))

    expect(window.confirm).toHaveBeenCalledWith("You have unsaved document changes. Leave this page?")
    expect(window.location.pathname).toBe(`/admin/documents/${revision.id}`)
  })

  it("retires the sentinel before confirmed persistent admin-link navigation", async () => {
    const user = userEvent.setup()
    window.history.replaceState({ __NA: true, tree: "list" }, "", "/admin/documents")
    window.history.pushState({ __NA: true, tree: "editor" }, "", revisionPath)
    render(<LocaleProvider initialLocale="en"><AdminNav /><AppRouterTreeHarness /></LocaleProvider>)

    await user.type(screen.getByRole("textbox", { name: "Summary" }), " discard")
    await user.click(screen.getByRole("link", { name: "Analytics" }))

    await waitFor(() => expect(window.location.pathname).toBe("/admin/analytics"))
    expect(screen.getByText("Destination route tree")).toBeInTheDocument()
    expect(window.history.state).not.toHaveProperty("__laf_document_dirty_sentinel")
    expect(navigationMocks.push).toHaveBeenCalledWith("/admin/analytics")
  })

  it("cancels Back without destroying its destination and replays it after confirmation", async () => {
    const user = userEvent.setup()
    vi.mocked(window.confirm).mockReturnValueOnce(false).mockReturnValueOnce(true)
    const guardedUrl = `${revisionPath}?tab=source#markdown`
    window.history.replaceState({ __NA: true, tree: "list" }, "", "/admin/documents")
    window.history.pushState({ __NA: true, tree: "editor" }, "", guardedUrl)
    const lengthBeforeDirty = window.history.length
    render(<AppRouterTreeHarness />)

    await user.type(screen.getByRole("textbox", { name: "Summary" }), " 추가")
    await waitFor(() => expect(window.history.length).toBe(lengthBeforeDirty + 1))
    window.history.back()

    await waitFor(() => expect(screen.getByTestId("app-router-tree")).toHaveAttribute("data-traversals", "2"))
    expect(screen.getByTestId("app-router-tree")).toHaveAttribute("data-path", revisionPath)
    expect(screen.getByRole("textbox", { name: "Summary" })).toHaveValue("변경 사항을 안내합니다. 추가")
    expect(screen.queryByText("Destination route tree")).not.toBeInTheDocument()
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(guardedUrl)

    window.history.back()

    await waitFor(() => expect(window.location.pathname).toBe("/admin/documents"))
    expect(screen.getByTestId("app-router-tree")).toHaveAttribute("data-path", "/admin/documents")
    expect(screen.getByText("Destination route tree")).toBeInTheDocument()
    expect(window.confirm).toHaveBeenCalledTimes(2)
  })

  it("keeps dirty data when sentinel installation replaces a pre-existing Forward branch", async () => {
    const user = userEvent.setup()
    vi.mocked(window.confirm).mockReturnValue(false)
    window.history.replaceState({ __NA: true, tree: "editor" }, "", revisionPath)
    window.history.pushState({ __NA: true, tree: "analytics" }, "", "/admin/analytics")
    window.history.back()
    await waitFor(() => expect(window.location.pathname).toBe(revisionPath))
    render(<AppRouterTreeHarness />)

    await user.type(screen.getByRole("textbox", { name: "Summary" }), " 추가")
    vi.mocked(window.confirm).mockClear()
    await act(async () => {
      window.history.forward()
      await new Promise((resolve) => setTimeout(resolve, 20))
    })

    expect(screen.getByTestId("app-router-tree")).toHaveAttribute("data-path", revisionPath)
    expect(screen.getByRole("textbox", { name: "Summary" })).toHaveValue("변경 사항을 안내합니다. 추가")
    expect(screen.queryByText("Destination route tree")).not.toBeInTheDocument()
    expect(window.location.pathname).toBe(revisionPath)
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it("allows confirmed browser navigation away from a dirty draft", async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, "", "/admin/documents")
    window.history.pushState({}, "", `/admin/documents/${revision.id}`)
    render(<DocumentEditor revision={revision} />)

    await user.type(screen.getByRole("textbox", { name: "Summary" }), " 추가")
    window.history.back()

    await waitFor(() => expect(window.location.pathname).toBe("/admin/documents"))
    expect(window.confirm).toHaveBeenCalledWith("You have unsaved document changes. Leave this page?")
  })

  it("disables schedule and publish while edits are dirty and explains why", async () => {
    const user = userEvent.setup()
    render(<DocumentEditor revision={revision} />)

    fireEvent.change(screen.getByLabelText("Schedule time"), { target: { value: "2099-01-01T00:00" } })
    await user.type(screen.getByRole("textbox", { name: "Summary" }), " 추가")

    expect(screen.getByRole("button", { name: "Schedule" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Publish now" })).toBeDisabled()
    expect(screen.getByText("Save the draft before generating a summary, scheduling, or publishing.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Generate with AI" })).toBeDisabled()
  })

  it("preserves newer edits when an earlier save response arrives late", async () => {
    const user = userEvent.setup()
    let resolveSave!: (response: Response) => void
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((resolve) => {
      resolveSave = resolve
    }))
    render(<DocumentEditor revision={revision} />)

    const title = screen.getByRole("textbox", { name: "Title" })
    await user.clear(title)
    await user.type(title, "Submitted title")
    await user.click(screen.getByRole("button", { name: "Save draft" }))
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    await user.type(title, " with newer edits")
    await act(async () => resolveSave(new Response(JSON.stringify({
      revision: { ...revision, title: "Submitted title" },
    }), { status: 200, headers: { "content-type": "application/json" } })))

    expect(title).toHaveValue("Submitted title with newer edits")
    expect(screen.getByText("Draft saved. Newer edits are not saved.")).toBeInTheDocument()
    expect(screen.getByText("Save the draft before generating a summary, scheduling, or publishing.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Publish now" })).toBeDisabled()
  })

  it("retires the dirty sentinel after save so one Back reaches the original destination", async () => {
    const user = userEvent.setup()
    window.history.replaceState({ __NA: true, tree: "analytics" }, "", "/admin/analytics")
    window.history.pushState({ __NA: true, tree: "editor" }, "", revisionPath)
    render(<AppRouterTreeHarness />)

    await user.type(screen.getByRole("textbox", { name: "Summary" }), " saved")
    await user.click(screen.getByRole("button", { name: "Save draft" }))
    expect(await screen.findByText("Draft saved.")).toBeInTheDocument()
    await waitFor(() => expect(window.history.state).not.toHaveProperty("__laf_document_dirty_sentinel"))

    window.history.back()

    await waitFor(() => expect(window.location.pathname).toBe("/admin/analytics"))
    expect(screen.getByText("Destination route tree")).toBeInTheDocument()
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it("creates an English draft from explicit Korean-series context", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const englishRevision: DocumentRevision = {
      ...revision,
      id: "f1f0c3ce-4b5f-46a0-b63d-f964b194d4d4",
      locale: "en",
      title: "Service update",
      summary: "",
      bodyMarkdown: "English body",
    }
    fetchMock.mockImplementationOnce(() => okResponse(englishRevision))
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
    expect(await screen.findByText("Draft saved.")).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Kind" })).toBeDisabled()
    expect(screen.getByRole("textbox", { name: "Slug" })).toBeDisabled()
    expect(screen.getByRole("combobox", { name: "Category" })).toBeDisabled()
    expect(screen.getByRole("checkbox", { name: "Pinned" })).toBeDisabled()
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
    render(<LocaleProvider initialLocale="en"><DocumentList rows={[revision, published].map(toAdminDocumentListRow)} /></LocaleProvider>)

    expect(screen.getByRole("searchbox", { name: "Search documents" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Kind filter" })).toBeInTheDocument()
    expect(within(screen.getByRole("combobox", { name: "Kind filter" })).queryByRole("option", { name: "Design" })).not.toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Status filter" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Locale filter" })).toBeInTheDocument()
    expect(screen.getByText("By publisher-77")).toBeInTheDocument()
    expect(screen.getByText(`Published ${new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(published.publishedAt)}`)).toBeInTheDocument()

    await user.selectOptions(screen.getByRole("combobox", { name: "Kind filter" }), "legal")
    expect(screen.queryByRole("link", { name: /서비스 업데이트/ })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Privacy policy/ })).toBeInTheDocument()
    await user.type(screen.getByRole("searchbox", { name: "Search documents" }), "missing")
    expect(screen.getByText("No documents match these filters.")).toBeInTheDocument()
  })

  it("localizes list row locales and dates while keeping canonical list values", () => {
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
    const rows = [published].map(toAdminDocumentListRow)
    const koreanDate = new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(published.publishedAt)
    const englishDate = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(published.publishedAt)
    const { unmount } = render(
      <LocaleProvider initialLocale="ko"><DocumentList rows={rows} /></LocaleProvider>,
    )

    expect(screen.getByText("법적 고지 / 영어 / r1")).toBeInTheDocument()
    expect(screen.getByText(`발행됨 ${koreanDate}`)).toBeInTheDocument()
    expect(rows[0].locale).toBe("en")
    expect(rows[0].relevantAt).toBe("2026-08-24T12:00:00.000Z")
    unmount()

    render(<LocaleProvider initialLocale="en"><DocumentList rows={rows} /></LocaleProvider>)

    expect(screen.getByText("Legal / English / r1")).toBeInTheDocument()
    expect(screen.getByText(`Published ${englishDate}`)).toBeInTheDocument()
  })

  it("keeps Next pagination on applied filters while controls have unapplied edits", async () => {
    const user = userEvent.setup()
    render(<LocaleProvider initialLocale="en"><DocumentList
      rows={[revision].map(toAdminDocumentListRow)}
      nextCursor="opaque-next"
      limit={25}
      initialFilters={{ search: "service", kind: "notice", locale: "ko", status: "draft" }}
    /></LocaleProvider>)

    await user.selectOptions(screen.getByRole("combobox", { name: "Kind filter" }), "legal")
    await user.clear(screen.getByRole("searchbox", { name: "Search documents" }))
    await user.type(screen.getByRole("searchbox", { name: "Search documents" }), "privacy")

    expect(screen.getByRole("link", { name: "Apply filters" })).toHaveAttribute(
      "href",
      "/admin/documents?search=privacy&kind=legal&status=draft&locale=ko&limit=25",
    )
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/admin/documents?search=service&kind=notice&status=draft&locale=ko&limit=25&cursor=opaque-next",
    )
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

  it("retires a dirty sentinel before delete navigation so Back cannot reopen the deleted editor", async () => {
    const user = userEvent.setup()
    window.history.replaceState({ __NA: true, tree: "analytics" }, "", "/admin/analytics")
    window.history.pushState({ __NA: true, tree: "editor" }, "", revisionPath)
    render(<AppRouterTreeHarness />)

    await user.type(screen.getByRole("textbox", { name: "Summary" }), " delete me")
    await user.click(screen.getByRole("button", { name: "Delete draft" }))
    await waitFor(() => expect(window.location.pathname).toBe("/admin/documents"))

    window.history.back()

    await waitFor(() => expect(window.location.pathname).toBe("/admin/analytics"))
    expect(screen.queryByRole("textbox", { name: "Title" })).not.toBeInTheDocument()
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
    expect(screen.queryByRole("button", { name: "Generate with AI" })).not.toBeInTheDocument()
  })

  it.each([
    ["archive_dependency", "Archive the published English revision first."],
    ["revision_changed", "This revision changed while the archive was running. Reload and try again."],
    ["invalid_state", "This revision is no longer published and cannot be archived."],
  ])("shows and focuses the actionable %s archive error", async (error, message) => {
    const user = userEvent.setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error, internal: "private document details" }),
      { status: 409, headers: { "content-type": "application/json" } },
    )))
    render(<DocumentEditor revision={{
      ...revision,
      status: "published",
      publishedAt: new Date("2026-08-23T12:00:00.000Z"),
    }} />)

    await user.click(screen.getByRole("button", { name: "Archive" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(message)
    expect(alert).toHaveFocus()
    expect(alert).not.toHaveTextContent("private document details")
  })

  it("permanently deletes an archived revision after title confirmation", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    vi.spyOn(window, "prompt").mockReturnValue(revision.title)
    render(<DocumentEditor revision={{ ...revision, status: "archived" }} />)

    await user.click(screen.getByRole("button", { name: "Delete permanently" }))

    expect(window.prompt).toHaveBeenCalledWith("Type the document title to delete it permanently:", "")
    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/documents/${revision.id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ permanent: true, confirmation: revision.title }),
    })
    expect(navigationMocks.replace).toHaveBeenCalledWith("/admin/documents")
  })

  it("cancels permanent deletion without making a request", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    vi.spyOn(window, "prompt").mockReturnValue(null)
    render(<DocumentEditor revision={{ ...revision, status: "archived" }} />)

    await user.click(screen.getByRole("button", { name: "Delete permanently" }))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(navigationMocks.replace).not.toHaveBeenCalled()
  })

  it.each(["published", "scheduled"] as const)(
    "does not offer permanent deletion for a %s revision",
    (status) => {
      render(<DocumentEditor revision={{
        ...revision,
        status,
        scheduledAt: status === "scheduled" ? new Date("2099-01-01") : null,
        publishedAt: status === "published" ? new Date("2026-08-23") : null,
      }} />)

      expect(screen.queryByRole("button", { name: "Delete permanently" })).not.toBeInTheDocument()
    },
  )

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

  it("explains how to resolve an incomplete summary before publishing", async () => {
    const user = userEvent.setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({
        error: "incomplete_document",
        fields: ["summary"],
        internal: "secret document contents",
      }),
      { status: 422, headers: { "content-type": "application/json" } },
    )))
    render(<DocumentEditor revision={revision} />)

    await user.click(screen.getByRole("button", { name: "Publish now" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Add a one-line summary of 1–240 characters, save the draft, and publish again.")
    expect(alert).not.toHaveTextContent("secret document contents")
  })

  it.each([
    ["provider_unavailable", "AI summary is unavailable."],
    ["monthly_limit", "The AI monthly limit has been reached."],
  ])("offers a manual summary fallback for the %s publish failure", async (error, reason) => {
    const user = userEvent.setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error }),
      { status: 503, headers: { "content-type": "application/json" } },
    )))
    render(<DocumentEditor revision={revision} />)

    await user.click(screen.getByRole("button", { name: "Publish now" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      `${reason} Enter a one-line summary manually, save the draft, and publish again.`,
    )
  })

  it("labels the summary publication requirements and enforces its visible limit", () => {
    render(<DocumentEditor revision={revision} />)

    expect(screen.getByRole("textbox", { name: "Summary" })).toHaveAttribute("maxlength", "240")
    expect(screen.getByText("Required for publication · one line · 1–240 characters")).toBeInTheDocument()
  })
})
