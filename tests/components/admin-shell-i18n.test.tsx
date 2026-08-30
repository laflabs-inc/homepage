import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const localeMocks = vi.hoisted(() => ({ getAdminLocale: vi.fn() }))

vi.mock("@/lib/admin/locale", () => localeMocks)
vi.mock("@/auth", () => ({ signIn: vi.fn() }))
vi.mock("@/app/admin/admin.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import AnalyticsError from "@/app/admin/(protected)/analytics/error"
import AdminSignInPage from "@/app/admin/sign-in/page"
import { AdminNav } from "@/components/admin/admin-nav"
import { LocaleProvider } from "@/components/i18n/locale-provider"

describe("Admin shell localization", () => {
  beforeEach(() => {
    localeMocks.getAdminLocale.mockReset().mockResolvedValue("ko")
  })

  it("renders navigation and recovery actions in Korean without combined copy", async () => {
    const user = userEvent.setup()
    const reset = vi.fn()

    render(
      <LocaleProvider initialLocale="ko">
        <AdminNav />
        <AnalyticsError error={new Error("unavailable")} reset={reset} />
      </LocaleProvider>,
    )

    expect(screen.getByRole("link", { name: "문서" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "분석" })).toBeInTheDocument()
    expect(screen.queryByText(/Analytics \/ 분석/)).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "다시 시도" }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it("renders the sign-in call to action for the resolved server locale", async () => {
    render(await AdminSignInPage())

    expect(screen.getByRole("heading", { name: "조용히 관찰하고, 명확하게 결정합니다." })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "멤버십 확인" })).toBeInTheDocument()
  })

  it("renders the English sign-in action when the server locale is English", async () => {
    localeMocks.getAdminLocale.mockResolvedValue("en")

    render(await AdminSignInPage())

    expect(screen.getByRole("heading", { name: "Observe quietly. Decide clearly." })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Verify membership" })).toBeInTheDocument()
  })

  it("keeps English rendering available from the shared locale provider", () => {
    render(
      <LocaleProvider initialLocale="en">
        <AdminNav />
        <AnalyticsError error={new Error("unavailable")} reset={vi.fn()} />
      </LocaleProvider>,
    )

    expect(screen.getByRole("link", { name: "Documents" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
  })
})
