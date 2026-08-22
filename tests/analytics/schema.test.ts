import { describe, expect, it } from "vitest"
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core"

import * as schema from "@/lib/db/schema"

describe("analytics withdrawal guard schema", () => {
  it("stores only a visitor HMAC and short-lived expiry", () => {
    const guard = (schema as unknown as Record<string, PgTable>)["analyticsWithdrawalGuards"]
    expect(guard).toBeDefined()
    if (!guard) return

    const config = getTableConfig(guard)
    expect(config.name).toBe("analytics_withdrawal_guards")
    expect(config.columns.map(({ name }) => name)).toEqual(["visitor_hash", "expires_at"])
    expect(config.columns.every(({ notNull }) => notNull)).toBe(true)
  })

  it("indexes both event and rate-window retention timestamps", () => {
    const eventConfig = getTableConfig(schema.analyticsEvents)
    const rateConfig = getTableConfig(schema.analyticsRateWindows)

    expect(eventConfig.indexes.map(({ config }) => config.name)).toContain("analytics_received_at_idx")
    expect(rateConfig.indexes.map(({ config }) => config.name)).toContain("analytics_rate_minute_idx")
  })
})
