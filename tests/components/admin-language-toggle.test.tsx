import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const navigationMocks = vi.hoisted(() => ({ routerRefresh: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: navigationMocks.routerRefresh }),
}))

vi.mock("@/app/admin/admin.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { AdminLanguageToggle } from "@/components/admin/admin-language-toggle"
import { LocaleProvider } from "@/components/i18n/locale-provider"

describe("AdminLanguageToggle", () => {
  beforeEach(() => {
    navigationMocks.routerRefresh.mockReset()
    document.cookie = "laf_locale=; path=/; max-age=0"
    document.documentElement.lang = "ko"
  })

  it("updates the shared locale cookie, document language, and current server route", async () => {
    const user = userEvent.setup()

    render(
      <LocaleProvider initialLocale="ko">
        <AdminLanguageToggle />
      </LocaleProvider>,
    )

    const korean = screen.getByRole("button", { name: "한국어" })
    const english = screen.getByRole("button", { name: "English" })
    expect(korean).toHaveAttribute("aria-pressed", "true")
    expect(english).toHaveAttribute("aria-pressed", "false")

    await user.click(english)

    expect(document.cookie).toContain("laf_locale=en")
    expect(navigationMocks.routerRefresh).toHaveBeenCalledOnce()
    expect(document.documentElement.lang).toBe("en")
    expect(english).toHaveAttribute("aria-pressed", "true")
  })

  it("uses Admin-local thumb styling rather than the homepage language selector", () => {
    render(
      <LocaleProvider initialLocale="ko">
        <AdminLanguageToggle />
      </LocaleProvider>,
    )

    const thumb = screen.getByTestId("admin-language-thumb")
    expect(thumb).toHaveClass("adminLanguageThumb")
    expect(thumb).not.toHaveClass("lang-thumb")
  })
})
