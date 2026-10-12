import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const navigationMocks = vi.hoisted(() => ({
  pathname: "/admin/documents",
  refresh: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
  useRouter: () => ({ refresh: navigationMocks.refresh }),
}))

import { AdminNav } from "@/components/admin/admin-nav"
import { AdminWorkspace } from "@/components/admin/admin-workspace"
import { LocaleProvider } from "@/components/i18n/locale-provider"

function renderWorkspace(locale: "ko" | "en" = "en") {
  return render(
    <LocaleProvider initialLocale={locale}>
      <AdminWorkspace><p>Workspace content</p></AdminWorkspace>
    </LocaleProvider>,
  )
}

describe("AdminWorkspace", () => {
  beforeEach(() => {
    navigationMocks.pathname = "/admin/documents"
    navigationMocks.refresh.mockReset()
  })

  it("presents the grouped desktop hierarchy and public site link", () => {
    renderWorkspace()

    const navigation = screen.getByRole("navigation", { name: "Admin" })
    expect(within(navigation).getByText("Content")).toBeInTheDocument()
    expect(within(navigation).getByText("Operations")).toBeInTheDocument()
    expect(within(navigation).getByText("System")).toBeInTheDocument()
    expect(within(navigation).getByRole("link", { name: "Documents" }))
      .toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Public site" })).toHaveAttribute("href", "/")
  })

  it("keeps nested document routes active and categories keyboard reachable", async () => {
    const user = userEvent.setup()
    navigationMocks.pathname = "/admin/documents/markdown-guide"
    const { rerender } = render(
      <LocaleProvider initialLocale="en"><AdminNav /></LocaleProvider>,
    )

    expect(screen.getByRole("link", { name: "Documents" }))
      .toHaveAttribute("aria-current", "page")

    navigationMocks.pathname = "/admin/documents/categories"
    rerender(<LocaleProvider initialLocale="en"><AdminNav /></LocaleProvider>)
    const categories = screen.getByRole("link", { name: "Categories" })
    expect(categories).toHaveAttribute("aria-current", "page")
    expect(categories.closest("li")).toHaveAttribute("data-parent", "documents")
    await user.tab()
    await user.tab()
    expect(categories).toHaveFocus()
  })

  it("opens and dismisses the localized mobile navigation", async () => {
    const user = userEvent.setup()
    renderWorkspace("ko")

    const trigger = screen.getByRole("button", { name: "관리자 메뉴 열기" })
    await user.click(trigger)
    const panel = screen.getByRole("dialog", { name: "관리자" })
    expect(panel).toHaveAttribute("data-side", "left")
    expect(within(panel).getByRole("button", { name: "관리자 메뉴 닫기" })).toBeInTheDocument()
    expect(within(panel).getByText("콘텐츠")).toBeInTheDocument()
    expect(within(panel).getByRole("link", { name: "미디어" })).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it("closes the mobile surface after selecting a destination", async () => {
    const user = userEvent.setup()
    renderWorkspace()

    await user.click(screen.getByRole("button", { name: "Open admin menu" }))
    const panel = screen.getByRole("dialog", { name: "Admin" })
    await user.click(within(panel).getByRole("link", { name: "Analytics" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("invokes the navigation callback when a destination is selected", async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(
      <LocaleProvider initialLocale="en">
        <AdminNav onNavigate={onNavigate} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("link", { name: "Agent" }))
    expect(onNavigate).toHaveBeenCalledOnce()
  })
})
