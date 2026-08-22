import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/analytics/consent-panel.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { ConsentPanel } from "@/components/analytics/consent-panel"
import { ConsentProvider, useConsent } from "@/components/analytics/consent-provider"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import { SiteFooter } from "@/components/layout/site-footer"

const baseProps = {
  open: true,
  pending: false,
  error: null,
  dnt: false,
} as const

function ConsentProbe() {
  const { state, openSettings, pending, error } = useConsent()

  return (
    <div>
      <output aria-label="consent state">{state}</output>
      <output aria-label="pending state">{String(pending)}</output>
      <output aria-label="consent error">{error ?? ""}</output>
      <button type="button" onClick={openSettings}>Open settings</button>
    </div>
  )
}

afterEach(() => vi.unstubAllGlobals())

describe("ConsentPanel", () => {
  it("offers both Korean choices as equal keyboard-accessible buttons", async () => {
    const user = userEvent.setup()
    const choose = vi.fn()

    render(
      <ConsentPanel
        {...baseProps}
        locale="ko"
        onChoose={choose}
        onClose={null}
      />,
    )

    const essential = screen.getByRole("button", { name: "필수만 사용" })
    const analytics = screen.getByRole("button", { name: "분석 허용" })
    expect(essential).toBeEnabled()
    expect(analytics).toBeEnabled()
    expect(essential.className).toBe(analytics.className)
    expect(essential).not.toHaveAttribute("aria-pressed")
    expect(analytics).not.toHaveAttribute("aria-pressed")

    await user.tab()
    expect(essential).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(choose).toHaveBeenCalledWith("essential")
  })

  it("shows exact English copy, all collection details, and 90-day retention", async () => {
    const user = userEvent.setup()

    render(
      <ConsentPanel
        {...baseProps}
        locale="en"
        onChoose={vi.fn()}
        onClose={null}
      />,
    )

    expect(screen.getByRole("heading", { name: "Choose your analytics preference" })).toBeVisible()
    expect(screen.getByText("We use anonymous usage statistics to improve the site. No analytics data is sent before you allow it.")).toBeVisible()

    await user.click(screen.getByText("See what is collected"))
    for (const eventName of [
      "Page views",
      "Product clicks",
      "GitHub clicks",
      "Contact clicks",
      "Language changes",
      "Analytics consent",
    ]) {
      expect(screen.getByText(eventName)).toBeVisible()
    }
    expect(screen.getByText(/90 days/)).toBeVisible()
  })

  it("cannot close the initial choice but can close footer-opened settings", async () => {
    const user = userEvent.setup()
    const close = vi.fn()
    const { rerender } = render(
      <ConsentPanel
        {...baseProps}
        locale="en"
        onChoose={vi.fn()}
        onClose={null}
      />,
    )

    expect(screen.queryByRole("button", { name: "Close cookie settings" })).not.toBeInTheDocument()

    rerender(
      <ConsentPanel
        {...baseProps}
        locale="en"
        onChoose={vi.fn()}
        onClose={close}
      />,
    )
    await user.click(screen.getByRole("button", { name: "Close cookie settings" }))
    expect(close).toHaveBeenCalledOnce()
  })

  it("disables both choices and announces progress while a request is pending", () => {
    render(
      <ConsentPanel
        {...baseProps}
        locale="en"
        pending
        onChoose={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole("region", { name: "Cookie settings" })).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("button", { name: "Essential only" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Allow analytics" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Close cookie settings" })).toBeDisabled()
  })

  it("announces retryable errors and an honored DNT preference", () => {
    render(
      <ConsentPanel
        {...baseProps}
        locale="ko"
        error="설정을 저장하지 못했습니다. 다시 시도해 주세요."
        dnt
        onChoose={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole("alert")).toHaveTextContent("설정을 저장하지 못했습니다. 다시 시도해 주세요.")
    expect(screen.getByText(/추적 거부/)).toBeVisible()
  })

  it("renders nothing while closed", () => {
    render(
      <ConsentPanel
        {...baseProps}
        locale="en"
        open={false}
        onChoose={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByRole("region", { name: "Cookie settings" })).not.toBeInTheDocument()
  })
})

describe("ConsentProvider", () => {
  it("updates client state from a successful choice without a reload", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choice: "analytics",
      dntHonored: false,
    }), { status: 200, headers: { "content-type": "application/json" } }))
    vi.stubGlobal("fetch", fetchMock)

    render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="unknown" dnt={false}>
          <ConsentProbe />
        </ConsentProvider>
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Allow analytics" }))

    expect(fetchMock).toHaveBeenCalledWith("/api/consent", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ choice: "analytics" }),
    }))
    expect(screen.getByLabelText("consent state")).toHaveTextContent("analytics")
    expect(screen.queryByRole("heading", { name: "Choose your analytics preference" })).not.toBeInTheDocument()
  })

  it("keeps settings open and exposes a retryable error after an API failure", async () => {
    const user = userEvent.setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: "withdrawal_failed",
    }), { status: 503, headers: { "content-type": "application/json" } })))

    render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="analytics" dnt={false}>
          <ConsentProbe />
        </ConsentProvider>
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Open settings" }))
    await user.click(screen.getByRole("button", { name: "Essential only" }))

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't save your preference. Please try again.")
    expect(screen.getByLabelText("consent state")).toHaveTextContent("analytics")
    expect(screen.getByRole("button", { name: "Close cookie settings" })).toBeEnabled()
  })

  it("opens dismissible settings from the semantic footer button", async () => {
    const user = userEvent.setup()

    render(
      <LocaleProvider initialLocale="ko">
        <ConsentProvider initialState="essential" dnt={false}>
          <SiteFooter />
        </ConsentProvider>
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "쿠키 설정" }))

    expect(screen.getByRole("heading", { name: "분석 쿠키를 선택해 주세요" })).toBeVisible()
    expect(screen.getByRole("button", { name: "쿠키 설정 닫기" })).toBeEnabled()
  })
})
