import { render, screen, within } from "@testing-library/react"
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

    const korean = screen.getByRole("radio", { name: "KO" })
    const english = screen.getByRole("radio", { name: "EN" })
    expect(korean).toHaveAttribute("aria-checked", "true")
    expect(english).toHaveAttribute("aria-checked", "false")

    await user.click(english)

    expect(document.cookie).toContain("laf_locale=en")
    expect(navigationMocks.routerRefresh).toHaveBeenCalledOnce()
    expect(document.documentElement.lang).toBe("en")
    expect(english).toHaveAttribute("aria-checked", "true")
  })

  it("moves the shared segmented thumb with the selected language", async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider initialLocale="ko">
        <AdminLanguageToggle />
      </LocaleProvider>,
    )

    const toggle = screen.getByRole("radiogroup", { name: "언어" })
    expect(within(toggle).getByRole("radio", { name: "KO" })).toHaveAttribute("aria-checked", "true")

    await user.click(screen.getByRole("radio", { name: "EN" }))

    expect(within(toggle).getByRole("radio", { name: "EN" })).toHaveAttribute("aria-checked", "true")
  })
})
