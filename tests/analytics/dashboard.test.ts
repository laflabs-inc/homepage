import { beforeEach, describe, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"

import {
  getAnalyticsSummary,
  parseAnalyticsRange,
} from "@/lib/analytics/store"

const { executeMock, getDbMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  getDbMock: vi.fn(),
}))

vi.mock("@/lib/db", () => ({ getDb: getDbMock }))

const now = new Date("2026-08-22T12:00:00.000Z")

beforeEach(() => {
  executeMock.mockReset()
  getDbMock.mockReset()
  getDbMock.mockReturnValue({ execute: executeMock })
})

describe("analytics dashboard aggregation", () => {
  it("returns aggregate-only values from the selected retained window", async () => {
    executeMock.mockResolvedValue({
      rows: [{
        consentedVisitors: "12",
        pageViews: "30",
        productClicks: "7",
        githubClicks: "4",
        contactClicks: "2",
        pageVisitors: "12",
        productVisitors: "7",
        contactVisitors: "2",
        locales: [{ key: "ko", count: 20 }, { key: "en", count: 10 }],
        devices: [{ key: "mobile", count: 18 }, { key: "desktop", count: 12 }],
        referrers: [{ key: "github.com", count: 5 }],
        products: [{ key: "laf-id", count: 7 }],
        githubTargets: [{ key: "lafetch", count: 4 }],
      }],
    })

    await expect(getAnalyticsSummary(30, now)).resolves.toEqual({
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
    })

    const compiled = new PgDialect().sqlToQuery(executeMock.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()

    expect(compiled.params).toContainEqual(new Date("2026-07-23T12:00:00.000Z"))
    expect(compiled.params).toContainEqual(now)
    expect(compiled.params).toEqual(expect.arrayContaining([
      "laf-id",
      "laf-pay",
      "lafdock",
      "laflabs-inc",
      "lafetch",
      "lafwall",
      "lafinvest",
    ]))
    expect(normalizedSql).toContain("count(distinct visitor_hash)")
    expect(normalizedSql).toContain("page_stage as")
    expect(normalizedSql).toContain("product_stage as")
    expect(normalizedSql).toContain("contact_stage as")
    expect(normalizedSql).toContain("selected.occurred_at >= page_stage.page_at")
    expect(normalizedSql).toContain("selected.occurred_at >= product_stage.product_at")
    expect(normalizedSql).toContain("event_type = 'page_view'")
    expect(normalizedSql).toContain("event_type = 'product_click'")
    expect(normalizedSql).toContain("event_type = 'contact_click'")
    expect(normalizedSql).toContain("limit 10")
    expect(JSON.stringify(await getAnalyticsSummary(30, now))).not.toContain("visitorHash")
  })

  it("never exposes a downstream funnel stage above its upstream cohort", async () => {
    executeMock.mockResolvedValue({
      rows: [{
        consentedVisitors: 1,
        pageViews: 1,
        productClicks: 5,
        githubClicks: 0,
        contactClicks: 8,
        pageVisitors: 1,
        productVisitors: 5,
        contactVisitors: 8,
        locales: [],
        devices: [],
        referrers: [],
        products: [],
        githubTargets: [],
      }],
    })

    const summary = await getAnalyticsSummary(30, now)

    expect(summary.funnel).toEqual({
      pageVisitors: 1,
      productVisitors: 1,
      contactVisitors: 1,
      pageToProduct: 1,
      productToContact: 1,
    })
  })

  it("returns zero conversion rates when a funnel stage has no visitors", async () => {
    executeMock.mockResolvedValue({
      rows: [{
        consentedVisitors: 0,
        pageViews: 0,
        productClicks: 0,
        githubClicks: 0,
        contactClicks: 0,
        pageVisitors: 0,
        productVisitors: 0,
        contactVisitors: 0,
        locales: [],
        devices: [],
        referrers: [],
        products: [],
        githubTargets: [],
      }],
    })

    const summary = await getAnalyticsSummary(7, now)

    expect(summary.funnel).toEqual({
      pageVisitors: 0,
      productVisitors: 0,
      contactVisitors: 0,
      pageToProduct: 0,
      productToContact: 0,
    })
    expect(summary.locales).toEqual([])
    expect(summary.devices).toEqual([])
  })

  it.each([
    ["7", 7],
    ["30", 30],
    ["90", 90],
    ["365", 30],
    [undefined, 30],
    [["7", "90"], 30],
  ] as const)("parses range %j as %i days", (value, expected) => {
    expect(parseAnalyticsRange(value)).toBe(expected)
  })
})
