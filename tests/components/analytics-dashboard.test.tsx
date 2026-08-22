import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import AnalyticsError from "@/app/admin/(protected)/analytics/error"
import AnalyticsPage from "@/app/admin/(protected)/analytics/page"
import type { AnalyticsSummary } from "@/lib/analytics/store"

const { getAnalyticsSummaryMock, requireAdminMock } = vi.hoisted(() => ({
  getAnalyticsSummaryMock: vi.fn(),
  requireAdminMock: vi.fn(),
}))

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: requireAdminMock }))
vi.mock("@/lib/analytics/store", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/analytics/store")>(),
  getAnalyticsSummary: getAnalyticsSummaryMock,
}))
vi.mock("@/app/admin/admin.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

const summary: AnalyticsSummary = {
  rangeDays: 30,
  consentedVisitors: 12,
  pageViews: 30,
  productClicks: 7,
  githubClicks: 4,
  contactClicks: 2,
  funnel: {
    pageVisitors: 12,
    productVisitors: 7,
    contactVisitors: 2,
    pageToProduct: 0.5833,
    productToContact: 0.2857,
  },
  locales: [{ key: "ko", count: 20 }, { key: "en", count: 10 }],
  devices: [{ key: "mobile", count: 18 }, { key: "desktop", count: 12 }],
  referrers: [{ key: "github.com", count: 5 }],
  products: [{ key: "laf-id", count: 7 }],
  githubTargets: [{ key: "lafetch", count: 4 }],
}

beforeEach(() => {
  requireAdminMock.mockReset().mockResolvedValue({ user: { orgMember: true } })
  getAnalyticsSummaryMock.mockReset().mockResolvedValue(summary)
})

describe("AnalyticsDashboard", () => {
  it("renders real aggregates, funnel context, tables, and non-JavaScript range links", () => {
    render(<AnalyticsDashboard summary={summary} />)

    expect(screen.getByRole("heading", { name: "Analytics / 분석" })).toBeInTheDocument()
    expect(screen.getByText("Consented visitors").nextElementSibling).toHaveTextContent("12")
    expect(screen.getByText("Page views").nextElementSibling).toHaveTextContent("30")
    expect(screen.getByText("4 GitHub clicks")).toBeInTheDocument()
    expect(screen.getByText("58.33%")).toBeInTheDocument()
    expect(screen.getByText("28.57%")).toBeInTheDocument()
    expect(screen.getByText("Consented traffic only / 동의한 트래픽만 집계")).toBeInTheDocument()

    expect(screen.getByRole("link", { name: "7 days" })).toHaveAttribute("href", "/admin/analytics?range=7")
    expect(screen.getByRole("link", { name: "30 days" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "90 days" })).toHaveAttribute("href", "/admin/analytics?range=90")

    expect(screen.getByRole("table", { name: "Referrers" })).toHaveTextContent("github.com5")
    expect(screen.getByRole("table", { name: "Products" })).toHaveTextContent("laf-id7")
    expect(screen.getByRole("table", { name: "GitHub targets" })).toHaveTextContent("lafetch4")
    expect(screen.getByRole("region", { name: "Locale / 언어" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Device / 기기" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "GitHub targets" })).toBeInTheDocument()
  })

  it("shows a consented visitor even when no conversion event has arrived", () => {
    render(<AnalyticsDashboard summary={{
      ...summary,
      consentedVisitors: 1,
      pageViews: 0,
      productClicks: 0,
      githubClicks: 0,
      contactClicks: 0,
      funnel: {
        pageVisitors: 0,
        productVisitors: 0,
        contactVisitors: 0,
        pageToProduct: 0,
        productToContact: 0,
      },
      locales: [],
      devices: [],
      referrers: [],
      products: [],
      githubTargets: [],
    }} />)

    expect(screen.getByText("Consented visitors").nextElementSibling).toHaveTextContent("1")
    expect(screen.queryByText("No signal yet / 아직 수집된 신호가 없습니다")).not.toBeInTheDocument()
  })

  it("keeps repeated event totals separate from distinct-visitor funnel stages", () => {
    render(<AnalyticsDashboard summary={{
      ...summary,
      pageViews: 30,
      productClicks: 14,
      contactClicks: 4,
      funnel: {
        pageVisitors: 12,
        productVisitors: 7,
        contactVisitors: 2,
        pageToProduct: 0.5833,
        productToContact: 0.2857,
      },
    }} />)

    const totals = screen.getByLabelText("Consented analytics totals")
    expect(within(totals).getByText("Page views").nextElementSibling).toHaveTextContent("30")
    expect(within(totals).getByText("Product clicks").nextElementSibling).toHaveTextContent("14")
    expect(within(totals).getByText("Contact clicks").nextElementSibling).toHaveTextContent("4")

    const funnel = screen.getByRole("region", { name: "Visitor funnel / 방문자 퍼널" })
    expect(within(funnel).getByText("Page view").parentElement).toHaveTextContent("12")
    expect(within(funnel).getByText("Product click").parentElement).toHaveTextContent("7")
    expect(within(funnel).getByText("Contact click").parentElement).toHaveTextContent("2")
    expect(within(funnel).getByText("58.33%")).toBeInTheDocument()
    expect(within(funnel).getByText("28.57%")).toBeInTheDocument()
  })

  it("explains empty consented datasets instead of inventing values", () => {
    render(<AnalyticsDashboard summary={{
      ...summary,
      consentedVisitors: 0,
      pageViews: 0,
      productClicks: 0,
      githubClicks: 0,
      contactClicks: 0,
      funnel: {
        pageVisitors: 0,
        productVisitors: 0,
        contactVisitors: 0,
        pageToProduct: 0,
        productToContact: 0,
      },
      locales: [],
      devices: [],
      referrers: [],
      products: [],
      githubTargets: [],
    }} />)

    expect(screen.getByText(
      "No consented events have been collected in this range. / 이 기간에 수집된 동의 기반 이벤트가 없습니다.",
    )).toBeInTheDocument()
    expect(screen.queryByText("Sample data")).not.toBeInTheDocument()
  })
})

describe("analytics route boundaries", () => {
  it("authorizes at the page boundary and defaults an unknown range to thirty days", async () => {
    render(await AnalyticsPage({ searchParams: Promise.resolve({ range: "365" }) }))

    expect(requireAdminMock).toHaveBeenCalledTimes(1)
    expect(getAnalyticsSummaryMock).toHaveBeenCalledWith(30, expect.any(Date))
    expect(requireAdminMock.mock.invocationCallOrder[0]).toBeLessThan(
      getAnalyticsSummaryMock.mock.invocationCallOrder[0],
    )
    expect(screen.getByRole("link", { name: "30 days" })).toHaveAttribute("aria-current", "page")
  })

  it("redacts query errors and retries through the route reset callback", async () => {
    const user = userEvent.setup()
    const reset = vi.fn()

    render(<AnalyticsError error={new Error("DATABASE_URL=postgres://secret")} reset={reset} />)

    expect(screen.getByRole("heading", {
      name: "통계를 불러오지 못했습니다 / Unable to load analytics",
    })).toBeInTheDocument()
    expect(screen.queryByText(/postgres|database_url|secret/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Retry / 다시 시도" }))
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
