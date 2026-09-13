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

    const korean = screen.getByRole("button", { name: "KO" })
    const english = screen.getByRole("button", { name: "EN" })
    expect(korean).toHaveAttribute("aria-pressed", "true")
    expect(english).toHaveAttribute("aria-pressed", "false")

    await user.click(english)

    expect(document.cookie).toContain("laf_locale=en")
    expect(navigationMocks.routerRefresh).toHaveBeenCalledOnce()
    expect(document.documentElement.lang).toBe("en")
    expect(english).toHaveAttribute("aria-pressed", "true")
  })

  it("moves the shared segmented thumb with the selected language", async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider initialLocale="ko">
        <AdminLanguageToggle />
      </LocaleProvider>,
    )

    const toggle = screen.getByRole("group", { name: "언어" })
    expect(toggle).toHaveAttribute("data-active-index", "0")

    await user.click(screen.getByRole("button", { name: "EN" }))

    expect(toggle).toHaveAttribute("data-active-index", "1")
  })
})
