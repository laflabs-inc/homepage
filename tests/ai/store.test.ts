import { PgDialect } from "drizzle-orm/pg-core"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createAiQuotaStore } from "@/lib/ai/store"

const execute = vi.fn()
const store = createAiQuotaStore({ execute })
const now = new Date("2026-08-24T10:00:00.000Z")
const expiresAt = new Date("2026-08-24T10:01:30.000Z")
const monthBucket = new Date("2026-08-01T00:00:00.000Z")
const reservationId = "00000000-0000-4000-8000-000000000001"

function compiledCall(index = 0) {
  return new PgDialect().sqlToQuery(execute.mock.calls[index][0])
}

beforeEach(() => execute.mockReset())

describe("AI summary quota store", () => {
  it("deletes expiry, locks settings, totals actual and live reservations, and conditionally inserts in one statement", async () => {
    execute.mockResolvedValue({ rows: [{ reservationId }] })

    await expect(store.reserveSummary({
      monthBucket,
      reservedTokens: 1_115,
      reservedCostMicrousd: 1_715,
      now,
      expiresAt,
    })).resolves.toEqual({ status: "reserved", id: reservationId })

    expect(execute).toHaveBeenCalledTimes(1)
    const compiled = compiledCall()
    const normalized = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalized).toContain("with expired_reservations as ( delete from \"ai_usage_reservations\"")
    expect(normalized).toContain("locked_settings as")
    expect(normalized).toContain("for update")
    expect(normalized).toContain("coalesce(sum(r.\"reserved_cost_microusd\"), 0)")
    expect(normalized).toContain("r.\"expires_at\" >")
    expect(normalized).toContain("u.\"estimated_cost_microusd\"")
    expect(normalized).toContain("< locked_settings.\"monthly_cost_limit_microusd\"")
    expect(normalized).toContain("<= locked_settings.\"monthly_cost_limit_microusd\"")
    expect(normalized).toContain("insert into \"ai_usage_reservations\"")
    expect(normalized).toContain("select null, null,")
    expect(normalized).toContain("'summary'")
    expect(compiled.params).toEqual(expect.arrayContaining([
      monthBucket,
      1_115,
      1_715,
      now,
      expiresAt,
    ]))
  })

  it("maps a rejected conditional insert to the monthly limit", async () => {
    execute.mockResolvedValue({ rows: [{ reservationId: null }] })

    await expect(store.reserveSummary({
      monthBucket,
      reservedTokens: 1,
      reservedCostMicrousd: 1,
      now,
      expiresAt,
    })).resolves.toEqual({ status: "monthly_limit" })
  })

  it("deletes exactly one summary reservation and upserts actual monthly usage once", async () => {
    execute.mockResolvedValue({ rows: [{ reconciled: true }] })

    await expect(store.reconcileSummaryUsage({
      reservationId,
      inputTokens: 1_200,
      outputTokens: 400,
      totalTokens: 1_600,
      estimatedCostMicrousd: 2_000,
      now,
    })).resolves.toBe(true)

    expect(execute).toHaveBeenCalledTimes(1)
    const compiled = compiledCall()
    const normalized = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalized).toContain("delete from \"ai_usage_reservations\"")
    expect(normalized).toContain("where \"id\" =")
    expect(normalized).toContain("and \"kind\" = 'summary'")
    expect(normalized).toContain("insert into \"ai_usage_monthly\"")
    expect(normalized).toContain("on conflict (\"month_bucket\") do update")
    expect(normalized).toContain("\"summary_count\" = \"ai_usage_monthly\".\"summary_count\" + 1")
    expect(normalized).toContain("\"estimated_cost_microusd\" = \"ai_usage_monthly\".\"estimated_cost_microusd\" + excluded.\"estimated_cost_microusd\"")
    expect(compiled.params).toEqual(expect.arrayContaining([
      reservationId,
      1_200,
      400,
      1_600,
      2_000,
      now,
    ]))
  })

  it("does not report reconciliation when the reservation is missing", async () => {
    execute.mockResolvedValue({ rows: [{ reconciled: false }] })
    await expect(store.reconcileSummaryUsage({
      reservationId,
      inputTokens: 1,
      outputTokens: 1,
      totalTokens: 2,
      estimatedCostMicrousd: 1,
      now,
    })).resolves.toBe(false)
  })

  it("releases only the addressed reservation", async () => {
    execute.mockResolvedValue({ rows: [{ released: true }] })
    await expect(store.releaseReservation(reservationId)).resolves.toBe(true)

    const compiled = compiledCall()
    expect(compiled.sql.replace(/\s+/g, " ").toLowerCase()).toContain(
      "delete from \"ai_usage_reservations\" where \"id\" =",
    )
    expect(compiled.params).toEqual([reservationId])
  })

  it("returns configured limit, actual cost, and only live reservation cost", async () => {
    execute.mockResolvedValue({ rows: [{
      limitMicrousd: "50000000",
      actualCostMicrousd: "2300000",
      reservedCostMicrousd: "1700",
    }] })

    await expect(store.getMonthlyBudgetStatus({ monthBucket, now })).resolves.toEqual({
      limitMicrousd: 50_000_000,
      actualCostMicrousd: 2_300_000,
      reservedCostMicrousd: 1_700,
    })

    const normalized = compiledCall().sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalized).toContain("r.\"expires_at\" >")
    expect(normalized).toContain("r.\"month_bucket\" =")
  })
})
