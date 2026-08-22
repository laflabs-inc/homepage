import { afterEach, describe, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"

import { handleAnalyticsRetention } from "@/app/api/cron/analytics-retention/route"
import { deleteExpiredAnalytics } from "@/lib/analytics/service"
import { analyticsStore, type AnalyticsStore } from "@/lib/analytics/store"

const {
  executeMock,
  getDbMock,
} = vi.hoisted(() => ({
  executeMock: vi.fn(),
  getDbMock: vi.fn(),
}))

vi.mock("@/lib/db", () => ({ getDb: getDbMock }))

class RetentionStore implements AnalyticsStore {
  cutoff: Date | null = null
  expiredGuardsBefore: Date | null = null
  private hasExpiredData = true

  async collectEvents() {
    return { status: "accepted" as const, accepted: 0 }
  }

  async withdrawVisitorAnalytics() {}

  async deleteBefore(cutoff: Date, expiredGuardsBefore?: Date) {
    this.cutoff = cutoff
    this.expiredGuardsBefore = expiredGuardsBefore ?? null
    if (!this.hasExpiredData) return { events: 0, windows: 0 }
    this.hasExpiredData = false
    return { events: 4, windows: 2 }
  }
}

afterEach(() => vi.unstubAllEnvs())

describe("analytics retention", () => {
  it("uses an exact ninety-day cutoff and clears expired withdrawal guards", async () => {
    const store = new RetentionStore()
    const now = new Date("2026-08-22T00:00:00.000Z")

    await expect(deleteExpiredAnalytics(now, store)).resolves.toEqual({ events: 4, windows: 2 })
    expect(store.cutoff?.toISOString()).toBe("2026-05-24T00:00:00.000Z")
    expect(store.expiredGuardsBefore).toEqual(now)
  })

  it("rejects a missing bearer secret", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-that-is-long-enough")

    const response = await handleAnalyticsRetention(
      new Request("https://laflabs.co/api/cron/analytics-retention"),
      new RetentionStore(),
      new Date("2026-08-22T00:00:00.000Z"),
    )

    expect(response.status).toBe(401)
  })

  it("rejects a mismatched bearer secret", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-that-is-long-enough")

    const response = await handleAnalyticsRetention(
      new Request("https://laflabs.co/api/cron/analytics-retention", {
        headers: { Authorization: "Bearer a-different-secret" },
      }),
      new RetentionStore(),
      new Date("2026-08-22T00:00:00.000Z"),
    )

    expect(response.status).toBe(401)
  })

  it("runs retention once and reports zero after the expired data is gone", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-that-is-long-enough")
    const store = new RetentionStore()
    const request = new Request("https://laflabs.co/api/cron/analytics-retention", {
      headers: { Authorization: "Bearer cron-secret-that-is-long-enough" },
    })
    const now = new Date("2026-08-22T00:00:00.000Z")

    const first = await handleAnalyticsRetention(request, store, now)
    const second = await handleAnalyticsRetention(request, store, now)

    await expect(first.json()).resolves.toEqual({ events: 4, windows: 2 })
    await expect(second.json()).resolves.toEqual({ events: 0, windows: 0 })
  })

  it("counts bounded CTE deletions without returning every deleted identifier", async () => {
    const cutoff = new Date("2026-05-24T00:00:00.000Z")
    const now = new Date("2026-08-22T00:00:00.000Z")
    executeMock.mockResolvedValue({ rows: [{ events: "4", windows: 2 }] })
    getDbMock.mockReturnValue({ execute: executeMock })

    await expect(analyticsStore.deleteBefore(cutoff, now)).resolves.toEqual({
      events: 4,
      windows: 2,
    })

    const compiled = new PgDialect().sqlToQuery(executeMock.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(compiled.params).toContainEqual(cutoff)
    expect(compiled.params).toContainEqual(now)
    expect(normalizedSql).toContain("with deleted_events as")
    expect(normalizedSql).toContain("deleted_windows as")
    expect(normalizedSql).toContain("deleted_guards as")
    expect(normalizedSql).toContain('"received_at" <')
    expect(normalizedSql).toContain('"minute_bucket" <')
    expect(normalizedSql).toContain('"expires_at" <=')
    expect(normalizedSql).toContain("returning 1")
    expect(normalizedSql).toContain("count(*)::integer")
    expect(normalizedSql).not.toContain('returning "id"')
    expect(normalizedSql).not.toContain('returning "visitor_hash"')
  })
})
