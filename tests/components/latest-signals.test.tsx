import { render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/sections/latest-signals.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { LocaleProvider } from "@/components/i18n/locale-provider"
import { LatestSignals } from "@/components/sections/latest-signals"

function publicItem() {
  return {
    id: "notice-1",
    kind: "notice",
    locale: "ko",
    slug: "hello",
    category: "company",
    pinned: false,
    revision: 1,
    title: "새 공지",
    summary: "새 소식을 전합니다.",
    effectiveAt: null,
    publishedAt: "2026-08-28T00:00:00.000Z",
  }
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("LatestSignals", () => {
  it("keeps one short title in the blue signal panel and leaves the story rail compact", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)))

    const { container } = render(
      <LocaleProvider initialLocale="ko">
        <LatestSignals />
      </LocaleProvider>,
    )

    const signalPanel = container.querySelector<HTMLElement>(".signalPanel")!
    const stories = container.querySelector<HTMLElement>(".stories")!
    expect(within(signalPanel).getByRole("heading", { name: "새 소식을 전합니다." })).toBeVisible()
    expect(screen.queryByText("제품 업데이트와 기술 기록, 회사 정보를 공개합니다.")).not.toBeInTheDocument()
    expect(within(stories).getByRole("heading", { name: "최근 소식" })).toBeVisible()
  })

  it("announces loading while published documents are pending", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)))

    render(
      <LocaleProvider initialLocale="ko">
        <LatestSignals />
      </LocaleProvider>,
    )

    expect(screen.getByRole("status")).toHaveTextContent("최근 소식을 불러오는 중입니다.")
    expect(screen.getByTestId("signal-lock")).toHaveAttribute("data-signal-state", "loading")
  })

  it("renders the newest published items as localized document links", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const kind = new URL(String(input), "https://laflabs.co").searchParams.get("kind")
      const items = kind === "notice" ? [publicItem()] : []
      return new Response(JSON.stringify({ items, nextCursor: null }), { status: 200 })
    })
    vi.stubGlobal("fetch", fetchMock)

    render(
      <LocaleProvider initialLocale="ko">
        <LatestSignals />
      </LocaleProvider>,
    )

    const noticeLink = await screen.findByRole("link", { name: /새 공지/ })
    expect(noticeLink).toHaveAttribute(
      "href",
      "/notices/hello?locale=ko",
    )
    expect(within(noticeLink).getByText("새 소식을 전합니다.")).toBeVisible()
    expect(screen.getByTestId("signal-lock")).toHaveAttribute("data-signal-state", "ready")
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      "/api/content?kind=notice&locale=ko&limit=3",
      "/api/content?kind=disclosure&locale=ko&limit=3",
    ])
  })

  it("keeps useful document destinations when no items are published", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => (
      new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 })
    )))

    render(
      <LocaleProvider initialLocale="ko">
        <LatestSignals />
      </LocaleProvider>,
    )

    expect(await screen.findByText("아직 공개된 새 소식이 없습니다.")).toBeVisible()
    expect(screen.getByTestId("signal-lock")).toHaveAttribute("data-signal-state", "empty")
    expect(screen.getByRole("link", { name: "공지사항" })).toHaveAttribute("href", "/notices?locale=ko")
    expect(screen.getByRole("link", { name: "공시" })).toHaveAttribute("href", "/disclosures?locale=ko")
    expect(screen.queryByRole("link", { name: "디자인 가이드" })).not.toBeInTheDocument()
  })

  it("shows a non-blocking fallback when the content API fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })))

    render(
      <LocaleProvider initialLocale="ko">
        <LatestSignals />
      </LocaleProvider>,
    )

    expect(await screen.findByText("지금은 새 소식을 불러올 수 없습니다.")).toBeVisible()
    expect(screen.getByTestId("signal-lock")).toHaveAttribute("data-signal-state", "error")
    expect(screen.getByRole("link", { name: "공지사항" })).toBeVisible()
  })
})
