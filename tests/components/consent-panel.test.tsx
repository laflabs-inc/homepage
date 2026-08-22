import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const analyticsClientMocks = vi.hoisted(() => ({
  create: vi.fn(),
  track: vi.fn(),
  setLocale: vi.fn(),
  flush: vi.fn(),
  stop: vi.fn(),
  size: vi.fn(() => 0),
}))
const consentNavigationMocks = vi.hoisted(() => ({ reload: vi.fn() }))

vi.mock("@/lib/analytics/client", () => ({
  createAnalyticsClient: analyticsClientMocks.create,
}))

vi.mock("@/lib/analytics/reload", () => ({
  reloadForConsentPolicyUpdate: consentNavigationMocks.reload,
}))

vi.mock("next/navigation", () => ({
  usePathname: () => window.location.pathname,
}))

vi.mock("@/components/analytics/consent-panel.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { ConsentPanel } from "@/components/analytics/consent-panel"
import { ConsentProvider, useConsent } from "@/components/analytics/consent-provider"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import { Landing } from "@/components/landing"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { CONSENT_POLICY_VERSION } from "@/lib/analytics/consent"

analyticsClientMocks.create.mockReturnValue({
  track: analyticsClientMocks.track,
  setLocale: analyticsClientMocks.setLocale,
  flush: analyticsClientMocks.flush,
  stop: analyticsClientMocks.stop,
  size: analyticsClientMocks.size,
})

beforeEach(() => {
  vi.clearAllMocks()
  window.history.replaceState({}, "", "/")
  document.cookie = "laf_locale=; path=/; max-age=0"
})

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

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

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
      body: JSON.stringify({
        choice: "analytics",
        policyVersion: CONSENT_POLICY_VERSION,
      }),
    }))
    expect(screen.getByLabelText("consent state")).toHaveTextContent("analytics")
    expect(screen.queryByRole("heading", { name: "Choose your analytics preference" })).not.toBeInTheDocument()
  })

  it("reloads and keeps the current panel mandatory after a policy-version conflict", async () => {
    const user = userEvent.setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: "policy_version_mismatch",
    }), { status: 409, headers: { "content-type": "application/json" } })))

    render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="analytics" dnt={false}>
          <ConsentProbe />
        </ConsentProvider>
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Open settings" }))
    await user.click(screen.getByRole("button", { name: "Essential only" }))

    expect(screen.getByLabelText("consent state")).toHaveTextContent("unknown")
    expect(screen.getByRole("heading", { name: "Choose your analytics preference" })).toBeVisible()
    expect(screen.queryByRole("button", { name: "Close cookie settings" })).not.toBeInTheDocument()
    expect(consentNavigationMocks.reload).toHaveBeenCalledOnce()
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

  it("starts analytics only after opt-in and records the transition plus one page view", async () => {
    const user = userEvent.setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choice: "analytics",
      dntHonored: false,
    }), { status: 200, headers: { "content-type": "application/json" } })))

    render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="unknown" dnt={false}>
          <ConsentProbe />
        </ConsentProvider>
      </LocaleProvider>,
    )

    expect(analyticsClientMocks.create).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Allow analytics" }))

    await waitFor(() => expect(analyticsClientMocks.create).toHaveBeenCalledWith({
      locale: "en",
      pathname: "/",
    }))
    expect(analyticsClientMocks.track.mock.calls).toEqual([
      ["consent_update", "analytics"],
      ["page_view", null],
    ])
  })

  it("keeps one client across locale changes and delegates marked clicks", async () => {
    const user = userEvent.setup()

    render(
      <LocaleProvider initialLocale="ko">
        <ConsentProvider initialState="analytics" dnt={false}>
          <SiteHeader />
        </ConsentProvider>
      </LocaleProvider>,
    )

    await waitFor(() => expect(analyticsClientMocks.create).toHaveBeenCalledOnce())
    expect(analyticsClientMocks.track).toHaveBeenCalledWith("page_view", null)
    expect(analyticsClientMocks.track).not.toHaveBeenCalledWith("consent_update", "analytics")

    await user.click(screen.getByRole("button", { name: "EN" }))

    await waitFor(() => expect(analyticsClientMocks.setLocale).toHaveBeenCalledWith("en"))
    expect(analyticsClientMocks.create).toHaveBeenCalledOnce()
    expect(analyticsClientMocks.track).toHaveBeenCalledWith("locale_change", "en")
    expect(analyticsClientMocks.track.mock.calls.filter(([type]) => type === "page_view")).toHaveLength(1)
  })

  it("does not write a preference or analytics event when the active locale is clicked", async () => {
    const user = userEvent.setup()

    render(
      <LocaleProvider initialLocale="ko">
        <ConsentProvider initialState="analytics" dnt={false}>
          <SiteHeader />
        </ConsentProvider>
      </LocaleProvider>,
    )

    await waitFor(() => expect(analyticsClientMocks.create).toHaveBeenCalledOnce())
    analyticsClientMocks.track.mockClear()
    await user.click(screen.getByRole("button", { name: "KO" }))

    expect(analyticsClientMocks.track).not.toHaveBeenCalled()
    expect(document.cookie).not.toContain("laf_locale=")
    expect(screen.getByRole("button", { name: "KO" })).not.toHaveAttribute("data-analytics-event")
  })

  it("stops the active client before exposing a successful withdrawal", async () => {
    const user = userEvent.setup()
    analyticsClientMocks.stop.mockImplementationOnce(() => {
      expect(screen.getByLabelText("consent state")).toHaveTextContent("analytics")
    })
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choice: "essential",
      dntHonored: false,
    }), { status: 200, headers: { "content-type": "application/json" } })))

    render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="analytics" dnt={false}>
          <ConsentProbe />
        </ConsentProvider>
      </LocaleProvider>,
    )

    await waitFor(() => expect(analyticsClientMocks.create).toHaveBeenCalledOnce())
    await user.click(screen.getByRole("button", { name: "Open settings" }))
    await user.click(screen.getByRole("button", { name: "Essential only" }))

    expect(analyticsClientMocks.stop).toHaveBeenCalledOnce()
    expect(screen.getByLabelText("consent state")).toHaveTextContent("essential")
  })

  it("never creates an analytics client while DNT is active", () => {
    render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="analytics" dnt>
          <ConsentProbe />
        </ConsentProvider>
      </LocaleProvider>,
    )

    expect(analyticsClientMocks.create).not.toHaveBeenCalled()
  })

  it("instruments the public homepage but never starts analytics on admin routes", async () => {
    window.history.replaceState({}, "", "/admin/analytics?private=1")
    const admin = render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="analytics" dnt={false}>
          <p>Admin</p>
        </ConsentProvider>
      </LocaleProvider>,
    )

    expect(analyticsClientMocks.create).not.toHaveBeenCalled()
    admin.unmount()

    window.history.replaceState({}, "", "/")
    render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="analytics" dnt={false}>
          <p>Homepage</p>
        </ConsentProvider>
      </LocaleProvider>,
    )

    await waitFor(() => expect(analyticsClientMocks.create).toHaveBeenCalledOnce())
    expect(analyticsClientMocks.create).toHaveBeenCalledWith({ locale: "en", pathname: "/" })
  })

  it("keeps rendering the homepage if analytics initialization fails", () => {
    analyticsClientMocks.create.mockImplementationOnce(() => {
      throw new Error("browser analytics unavailable")
    })

    expect(() => render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="analytics" dnt={false}>
          <p>Homepage remains available</p>
        </ConsentProvider>
      </LocaleProvider>,
    )).not.toThrow()
    expect(screen.getByText("Homepage remains available")).toBeVisible()
  })

  it("marks only the existing analytics interactions without adding layout wrappers", () => {
    vi.stubGlobal("IntersectionObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
    const { container } = render(
      <LocaleProvider initialLocale="en">
        <ConsentProvider initialState="essential" dnt={false}>
          <SiteHeader />
          <Landing />
          <SiteFooter />
        </ConsentProvider>
      </LocaleProvider>,
    )

    expect(screen.getByRole("button", { name: "KO" })).toHaveAttribute("data-analytics-event", "locale_change")
    expect(screen.getByRole("button", { name: "KO" })).toHaveAttribute("data-analytics-target", "ko")
    expect(screen.getByRole("button", { name: "EN" })).not.toHaveAttribute("data-analytics-event")

    const contacts = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]'))
    expect(contacts).not.toHaveLength(0)
    for (const contact of contacts) {
      expect(contact).toHaveAttribute("data-analytics-event", "contact_click")
      expect(contact).toHaveAttribute("data-analytics-target", "email")
    }

    const githubLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="https://github.com/laflabs-inc"]'))
    expect(githubLinks).not.toHaveLength(0)
    for (const link of githubLinks) {
      expect(link).toHaveAttribute("data-analytics-event", "github_click")
      expect(link).toHaveAttribute(
        "data-analytics-target",
        link.href === "https://github.com/laflabs-inc" || link.href === "https://github.com/laflabs-inc/"
          ? "laflabs-inc"
          : link.href.split("/").at(-1),
      )
    }
  })
})
