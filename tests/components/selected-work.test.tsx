import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

const track = vi.fn()

vi.mock("@/components/analytics/consent-provider", () => ({
  useAnalytics: () => ({ track }),
}))
vi.mock("@/components/sections/selected-work.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { LocaleProvider } from "@/components/i18n/locale-provider"
import { SelectedWork } from "@/components/sections/selected-work"

afterEach(() => {
  track.mockReset()
  vi.useRealTimers()
})

describe("SelectedWork", () => {
  it("changes only through an explicit control and records a safe target", async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider initialLocale="ko">
        <SelectedWork />
      </LocaleProvider>,
    )

    expect(screen.getByRole("heading", { name: "Laf ID" })).toBeVisible()
    expect(screen.getByText("1 / 3")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "다음 작업" }))

    expect(screen.getByRole("heading", { name: "lafetch" })).toBeVisible()
    expect(screen.getByText("2 / 3")).toBeVisible()
    expect(track).toHaveBeenCalledWith("work_navigate", "next:lafetch")

    await user.click(screen.getByRole("button", { name: "이전 작업" }))
    expect(screen.getByRole("heading", { name: "Laf ID" })).toBeVisible()
    expect(track).toHaveBeenLastCalledWith("work_navigate", "previous:laf-id")
  })

  it("supports arrow keys and touch-style swipes without autoplay", () => {
    vi.useFakeTimers()
    render(
      <LocaleProvider initialLocale="ko">
        <SelectedWork />
      </LocaleProvider>,
    )

    const region = screen.getByRole("region", { name: "우리가 만든 것" })
    fireEvent.keyDown(region, { key: "ArrowRight" })
    expect(screen.getByRole("heading", { name: "lafetch" })).toBeVisible()

    fireEvent.pointerDown(region, { clientX: 220, pointerId: 1 })
    fireEvent.pointerUp(region, { clientX: 100, pointerId: 1 })
    expect(screen.getByRole("heading", { name: "lafwall" })).toBeVisible()

    vi.advanceTimersByTime(60_000)
    expect(screen.getByRole("heading", { name: "lafwall" })).toBeVisible()
  })

  it("renders localized labels and public destinations", () => {
    render(
      <LocaleProvider initialLocale="en">
        <SelectedWork />
      </LocaleProvider>,
    )

    expect(screen.getByRole("region", { name: "Selected work" })).toBeVisible()
    expect(screen.getByText("Developer preview")).toBeVisible()
    expect(screen.queryByRole("link", { name: /Open project/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Next work" }))
    expect(screen.getByRole("link", { name: "Open repository" })).toHaveAttribute(
      "href",
      "https://github.com/laflabs-inc/lafetch",
    )
  })
})
