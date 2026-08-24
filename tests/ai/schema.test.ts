import { getTableConfig } from "drizzle-orm/pg-core"
import { describe, expect, it } from "vitest"

import { aiUsageDaily, aiUsageMonthly, aiUsageReservations } from "@/lib/db/schema"

const usageTables = [aiUsageDaily, aiUsageMonthly, aiUsageReservations]

describe("AI usage schema", () => {
  it("stores quota aggregates without retained prompt, answer, content, IP, or identity columns", () => {
    expect(getTableConfig(aiUsageDaily).columns.map((column) => column.name)).toEqual([
      "visitor_hash", "date_bucket", "question_count", "input_tokens",
      "output_tokens", "total_tokens", "updated_at",
    ])
    expect(getTableConfig(aiUsageMonthly).columns.map((column) => column.name)).toEqual([
      "month_bucket", "question_count", "summary_count", "input_tokens",
      "output_tokens", "total_tokens", "estimated_cost_microusd", "updated_at",
    ])
    expect(getTableConfig(aiUsageReservations).columns.map((column) => column.name)).toEqual([
      "id", "visitor_hash", "date_bucket", "month_bucket", "kind",
      "reserved_tokens", "reserved_cost_microusd", "expires_at", "created_at",
    ])

    for (const table of usageTables) {
      expect(getTableConfig(table).columns.map((column) => column.name)).not.toContain("prompt")
      expect(getTableConfig(table).columns.map((column) => column.name)).not.toContain("question")
      expect(getTableConfig(table).columns.map((column) => column.name)).not.toContain("answer")
      expect(getTableConfig(table).columns.map((column) => column.name)).not.toContain("content")
      expect(getTableConfig(table).columns.map((column) => column.name)).not.toContain("ip")
      expect(getTableConfig(table).columns.map((column) => column.name)).not.toContain("visitor_id")
    }
  })

  it("uses bounded counters, reservation kind, and retention keys", () => {
    const daily = getTableConfig(aiUsageDaily)
    const monthly = getTableConfig(aiUsageMonthly)
    const reservations = getTableConfig(aiUsageReservations)

    expect(daily.primaryKeys[0]?.columns.map((column) => column.name)).toEqual([
      "visitor_hash", "date_bucket",
    ])
    expect(monthly.columns.find((column) => column.name === "month_bucket")?.primary).toBe(true)
    expect(reservations.indexes.map((index) => index.config.name)).toContain("ai_usage_reservations_expiry_idx")
    expect(daily.indexes.map((index) => index.config.name)).toContain("ai_usage_daily_date_bucket_idx")
    expect(reservations.columns.find((column) => column.name === "kind")?.enumValues).toEqual([
      "question", "summary",
    ])
    expect(reservations.columns.find((column) => column.name === "visitor_hash")?.notNull).toBe(false)
    expect(reservations.columns.find((column) => column.name === "date_bucket")?.notNull).toBe(false)

    for (const table of [aiUsageDaily, aiUsageMonthly]) {
      for (const column of getTableConfig(table).columns.filter(({ name }) => (
        name.endsWith("tokens") || name.endsWith("microusd")
      ))) {
        expect(column.dataType).toBe("number")
        expect(column.default).toBe(0)
      }
    }

    for (const column of reservations.columns.filter(({ name }) => (
      name.endsWith("tokens") || name.endsWith("microusd")
    ))) expect(column.dataType).toBe("number")
  })
})
