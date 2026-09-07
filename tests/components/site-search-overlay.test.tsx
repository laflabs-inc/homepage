import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LocaleProvider } from "@/components/i18n/locale-provider"
import type { SiteSearchResponse } from "@/lib/search/types"

const { analyticsTrackMock, fetchMock } = vi.hoisted(() => ({
  analyticsTrackMock: vi.fn(),
  fetchMock: vi.fn(),
}))

vi.mock("@/components/search/site-search-overlay.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/analytics/consent-provider", () => ({
  useAnalytics: () => ({ track: analyticsTrackMock }),
}))
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, id, role, ...props }: React.ComponentProps<"div"> & Record<string, unknown>) => (
      <div
        className={className}
        id={id}
        role={role}
        aria-labelledby={props["aria-labelledby"] as string | undefined}
      >{children}</div>
    ),
    span: ({ children, className, ...props }: React.ComponentProps<"span"> & Record<string, unknown>) => (
      <span className={className} aria-hidden={props["aria-hidden"] as boolean | undefined}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useReducedMotion: () => true,
}))
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}))

import { SiteHeader } from "@/components/layout/site-header"

const searchResponse: SiteSearchResponse = {
  query: "Laf ID",
  partial: false,
  results: [
    { id: "home", group: "page", title: "LafLabs", description: "Company home.", href: "/" },
    { id: "laf-id", group: "product", title: "Laf ID", description: "Identity.", href: "/#products" },
    { id: "lafetch", group: "open-source", title: "lafetch", description: "HTTP client.", href: "https://github.com/laflabs-inc/lafetch" },
    { id: "notice-1", group: "notice", title: "Notice", description: "Update.", href: "/notices/update?locale=ko" },
    { id: "legal-1", group: "legal", title: "Legal", description: "Terms.", href: "/legal/terms?locale=ko" },
    { id: "disclosure-1", group: "disclosure", title: "Disclosure", description: "Record.", href: "/disclosures/record?locale=ko" },
  ],
}

function renderHeader(locale: "ko" | "en" = "ko") {
  const main = document.createElement("main")
  const footer = document.createElement("footer")
  document.body.append(main, footer)
  return { ...render(<LocaleProvider initialLocale={locale}><SiteHeader /></LocaleProvider>), main, footer }
}

async function openSearch(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", { name: "검색" })
  await user.click(trigger)
  return { trigger, searchbox: screen.getByRole("searchbox") }
}

beforeEach(() => {
  document.body.innerHTML = ""
  vi.clearAllMocks()
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => searchResponse,
  })
  vi.stubGlobal("fetch", fetchMock)
})

describe("SiteHeader search overlay", () => {
  it("opens the localized dialog and focuses its search input", async () => {
    const user = userEvent.setup()
    renderHeader()

    const { trigger, searchbox } = await openSearch(user)

    expect(screen.getByRole("dialog", { name: "사이트 검색" })).toBeInTheDocument()
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-modal")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(trigger).toHaveAttribute("aria-controls", "site-search-overlay")
    await waitFor(() => expect(searchbox).toHaveFocus())
    expect(analyticsTrackMock).toHaveBeenCalledWith("search_open", null)
  })

  it("submits the active locale and groups returned results", async () => {
    const user = userEvent.setup()
    renderHeader()
    await openSearch(user)

    await user.type(screen.getByRole("searchbox"), "Laf ID")
    await user.click(screen.getByRole("button", { name: "검색 실행" }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/search?q=Laf+ID&locale=ko",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(await screen.findByRole("heading", { name: "페이지" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "제품·오픈소스" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "공지·공시·약관" })).toBeInTheDocument()
    expect(analyticsTrackMock).toHaveBeenCalledWith("search_submit", "q6:r6")
  })

  it("shows a local validation message instead of fetching a short query", async () => {
    const user = userEvent.setup()
    renderHeader()
    await openSearch(user)

    await user.type(screen.getByRole("searchbox"), "a")
    await user.click(screen.getByRole("button", { name: "검색 실행" }))

    expect(screen.getByText("검색어는 2자 이상 100자 이하로 입력해 주세요.")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("explains the full query length range in English", async () => {
    const user = userEvent.setup()
    renderHeader("en")
    const trigger = screen.getByRole("button", { name: "Search" })
    await user.click(trigger)

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "a".repeat(101) } })
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(screen.getByText("Enter a search query between 2 and 100 characters.")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("restores the covered page and trigger focus when Escape closes search", async () => {
    const user = userEvent.setup()
    const { main, footer } = renderHeader()
    const trigger = screen.getByRole("button", { name: "검색" })
    await user.click(trigger)

    await waitFor(() => expect(document.body.style.overflow).toBe("hidden"))
    expect(main).toHaveAttribute("inert")
    expect(footer).toHaveAttribute("inert")

    await user.keyboard("{Escape}")

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(document.body.style.overflow).toBe("")
    expect(main).not.toHaveAttribute("inert")
    expect(footer).not.toHaveAttribute("inert")
    expect(trigger).toHaveFocus()
  })

  it("accepts one hundred astral code points and rejects a longer query in component validation", async () => {
    const user = userEvent.setup()
    renderHeader()
    const { searchbox } = await openSearch(user)
    const boundaryQuery = "😀".repeat(100)

    expect(searchbox).not.toHaveAttribute("maxlength")
    fireEvent.change(searchbox, { target: { value: boundaryQuery } })
    await user.click(screen.getByRole("button", { name: "검색 실행" }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(analyticsTrackMock).toHaveBeenCalledWith("search_submit", "q100:r6")

    fireEvent.change(searchbox, { target: { value: "a".repeat(101) } })
    await user.click(screen.getByRole("button", { name: "검색 실행" }))
    expect(screen.getByText("검색어는 2자 이상 100자 이하로 입력해 주세요.")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("does not resurrect results after a locale round trip", async () => {
    const user = userEvent.setup()
    renderHeader()
    const { searchbox } = await openSearch(user)
    await user.type(searchbox, "Laf ID")
    await user.click(screen.getByRole("button", { name: "검색 실행" }))
    expect(await screen.findByRole("link", { name: /Laf ID/ })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "EN" }))
    expect(screen.queryByRole("link", { name: /Laf ID/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "KO" }))

    expect(screen.getByRole("searchbox")).toHaveValue("Laf ID")
    expect(screen.queryByRole("link", { name: /Laf ID/ })).not.toBeInTheDocument()
  })

  it("clears prior results when a submitted query is invalid", async () => {
    const user = userEvent.setup()
    renderHeader()
    const { searchbox } = await openSearch(user)
    await user.type(searchbox, "Laf ID")
    await user.click(screen.getByRole("button", { name: "검색 실행" }))
    expect(await screen.findByRole("link", { name: /Laf ID/ })).toBeInTheDocument()

    fireEvent.change(searchbox, { target: { value: "a" } })
    await user.click(screen.getByRole("button", { name: "검색 실행" }))

    expect(screen.getByText("검색어는 2자 이상 100자 이하로 입력해 주세요.")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Laf ID/ })).not.toBeInTheDocument()
  })

  it("clears prior results on failure and retries the retained query", async () => {
    const user = userEvent.setup()
    renderHeader()
    const { searchbox } = await openSearch(user)
    await user.type(searchbox, "Laf ID")
    await user.click(screen.getByRole("button", { name: "검색 실행" }))
    expect(await screen.findByRole("link", { name: /Laf ID/ })).toBeInTheDocument()

    fetchMock
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "unavailable" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => searchResponse })
    fireEvent.change(searchbox, { target: { value: "failure" } })
    await user.click(screen.getByRole("button", { name: "검색 실행" }))

    expect(await screen.findByText("검색을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Laf ID/ })).not.toBeInTheDocument()
    expect(searchbox).toHaveValue("failure")

    await user.click(screen.getByRole("button", { name: "다시 시도" }))
    expect(await screen.findByRole("link", { name: /Laf ID/ })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("keeps the newest response when an aborted request resolves late", async () => {
    const user = userEvent.setup()
    let resolveFirst!: (value: { ok: boolean; json: () => Promise<SiteSearchResponse> }) => void
    const firstRequest = new Promise<{ ok: boolean; json: () => Promise<SiteSearchResponse> }>((resolve) => {
      resolveFirst = resolve
    })
    const firstResponse: SiteSearchResponse = {
      query: "first",
      partial: false,
      results: [{ id: "first", group: "page", title: "First stale", description: "Old.", href: "/first" }],
    }
    const secondResponse: SiteSearchResponse = {
      query: "second",
      partial: false,
      results: [{ id: "second", group: "page", title: "Second current", description: "New.", href: "/second" }],
    }
    fetchMock
      .mockImplementationOnce(() => firstRequest)
      .mockResolvedValueOnce({ ok: true, json: async () => secondResponse })
    renderHeader()
    const { searchbox } = await openSearch(user)

    fireEvent.change(searchbox, { target: { value: "first" } })
    await user.click(screen.getByRole("button", { name: "검색 실행" }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    fireEvent.change(searchbox, { target: { value: "second" } })
    await user.click(screen.getByRole("button", { name: "검색 실행" }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole("link", { name: /Second current/ })).toBeInTheDocument()

    resolveFirst({ ok: true, json: async () => firstResponse })
    await waitFor(() => expect(screen.queryByRole("link", { name: /First stale/ })).not.toBeInTheDocument())
    expect(screen.getByRole("link", { name: /Second current/ })).toBeInTheDocument()
  })

  it("renders no-result fallbacks and partial-result warnings", async () => {
    const user = userEvent.setup()
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query: "missing", partial: false, results: [] } satisfies SiteSearchResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...searchResponse, partial: true }),
      })
    renderHeader()
    const { searchbox } = await openSearch(user)

    fireEvent.change(searchbox, { target: { value: "missing" } })
    await user.click(screen.getByRole("button", { name: "검색 실행" }))
    expect(await screen.findByText("검색 결과가 없습니다.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "공지사항" })).toHaveAttribute("href", "/notices")
    expect(screen.getByRole("link", { name: "디자인 가이드" })).toHaveAttribute("href", "/design")
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/laflabs-inc")

    fireEvent.change(searchbox, { target: { value: "Laf ID" } })
    await user.click(screen.getByRole("button", { name: "검색 실행" }))
    expect(await screen.findByText("문서 검색은 일시적으로 사용할 수 없습니다. 나머지 결과를 표시합니다.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Laf ID/ })).toBeInTheDocument()
  })

  it("ignores Command/Ctrl+K from every editable target", async () => {
    const user = userEvent.setup()
    renderHeader()
    const contentEditable = document.createElement("div")
    contentEditable.setAttribute("contenteditable", "true")
    contentEditable.tabIndex = 0
    const editableTargets = [
      document.createElement("input"),
      document.createElement("textarea"),
      document.createElement("select"),
      contentEditable,
    ]

    for (const editable of editableTargets) {
      document.body.append(editable)
      editable.focus()
      await user.keyboard("{Control>}k{/Control}")
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      editable.blur()
    }

    const nonEditable = document.createElement("button")
    document.body.append(nonEditable)
    nonEditable.focus()
    await user.keyboard("{Control>}k{/Control}")
    expect(screen.getByRole("dialog", { name: "사이트 검색" })).toBeInTheDocument()
  })

  it("scrolls the complete inner surface on short-height viewports", () => {
    const css = readFileSync(
      resolve(process.cwd(), "components/search/site-search-overlay.module.css"),
      "utf8",
    )

    expect(css).toMatch(/@media \(max-height: 600px\)[\s\S]*?\.overlay\s*\{[\s\S]*?overflow-y: auto/)
    expect(css).toMatch(/@media \(max-height: 600px\)[\s\S]*?\.inner\s*\{[\s\S]*?height: auto[\s\S]*?display: block/)
    expect(css).toMatch(/@media \(max-height: 600px\)[\s\S]*?\.results\s*\{[\s\S]*?overflow-y: visible/)
  })
})
