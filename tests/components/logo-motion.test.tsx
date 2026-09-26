import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AnimatedLogoLink } from "@/components/ui/animated-logo-link"

const SESSION_KEY = "laflabs:logo-motion:v1"

function setReducedMotion(matches: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })))
}

beforeEach(() => {
  window.sessionStorage.clear()
  setReducedMotion(false)
})

afterEach(() => vi.useRealTimers())

describe("AnimatedLogoLink", () => {
  it("plays the intro once per browser session", () => {
    vi.useFakeTimers()
    const first = render(<AnimatedLogoLink href="/" />)
    const firstLink = screen.getByRole("link", { name: "LafLabs" })

    expect(firstLink).toHaveAttribute("data-logo-motion", "intro")
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("played")

    act(() => vi.advanceTimersByTime(800))
    expect(firstLink).toHaveAttribute("data-logo-motion", "idle")

    first.unmount()
    render(<AnimatedLogoLink href="/" />)

    expect(screen.getByRole("link", { name: "LafLabs" })).toHaveAttribute("data-logo-motion", "idle")
  })

  it("replays one short cycle on deliberate hover or keyboard focus", () => {
    vi.useFakeTimers()
    window.sessionStorage.setItem(SESSION_KEY, "played")
    render(<AnimatedLogoLink href="/" />)
    const link = screen.getByRole("link", { name: "LafLabs" })

    fireEvent.mouseEnter(link)
    expect(link).toHaveAttribute("data-logo-motion", "replay")

    act(() => vi.advanceTimersByTime(500))
    fireEvent.focus(link)
    expect(link).toHaveAttribute("data-logo-motion", "replay")
  })

  it("keeps the logo static when reduced motion is requested", async () => {
    setReducedMotion(true)
    render(<AnimatedLogoLink href="/" />)
    const link = screen.getByRole("link", { name: "LafLabs" })

    await Promise.resolve()
    expect(link).toHaveAttribute("data-logo-motion", "idle")
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull()

    fireEvent.mouseEnter(link)
    link.focus()
    expect(link).toHaveAttribute("data-logo-motion", "idle")
  })
})
