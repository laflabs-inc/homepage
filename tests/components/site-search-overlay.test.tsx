import { render, screen, waitFor } from "@testing-library/react"
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

    expect(screen.getByText("두 글자 이상 입력해 주세요.")).toBeInTheDocument()
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
})
