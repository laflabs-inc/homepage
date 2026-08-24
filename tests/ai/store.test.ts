import { PgDialect } from "drizzle-orm/pg-core"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createAiQuotaStore } from "@/lib/ai/store"

const execute = vi.fn()
const transaction = vi.fn()
const store = createAiQuotaStore({ execute, transaction })
const now = new Date("2026-08-24T10:00:00.000Z")
const expiresAt = new Date("2026-08-24T10:01:30.000Z")
const monthBucket = new Date("2026-08-01T00:00:00.000Z")
const reservationId = "00000000-0000-4000-8000-000000000001"

function compiledCall(index = 0) {
  return new PgDialect().sqlToQuery(execute.mock.calls[index][0])
}

function compiledTransactionCall(statement: number, transactionCall = 0) {
  return new PgDialect().sqlToQuery(transaction.mock.calls[transactionCall][0][statement])
}

beforeEach(() => {
  execute.mockReset()
  transaction.mockReset()
})

describe("AI summary quota store", () => {
  it("locks the month before cleanup and reservation in the same transaction", async () => {
    transaction.mockResolvedValue([
      { rows: [{ locked: null }] },
      { rows: [{ reservationId }] },
    ])

    await expect(store.reserveSummary({
      monthBucket,
      reservedTokens: 1_115,
      reservedCostMicrousd: 1_715,
      now,
      expiresAt,
    })).resolves.toEqual({ status: "reserved", id: reservationId })

    expect(execute).not.toHaveBeenCalled()
    expect(transaction).toHaveBeenCalledTimes(1)
    expect(transaction.mock.calls[0][0]).toHaveLength(2)

    const lock = compiledTransactionCall(0)
    const normalizedLock = lock.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedLock).toContain("select pg_advisory_xact_lock(hashtextextended(")
    expect(lock.params).toEqual(["2026-08"])

    const compiled = compiledTransactionCall(1)
    const normalized = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalized).toContain("with expired_reservations as ( delete from \"ai_usage_reservations\"")
    expect(normalized).toContain("settings as")
    expect(normalized).not.toContain("for update")
    expect(normalized).not.toContain("pg_advisory")
    expect(normalized).toContain("coalesce(sum(r.\"reserved_cost_microusd\"), 0)")
    expect(normalized).toContain("r.\"expires_at\" >")
    expect(normalized).toContain("u.\"estimated_cost_microusd\"")
    expect(normalized).toContain("< settings.\"monthly_cost_limit_microusd\"")
    expect(normalized).toContain("<= settings.\"monthly_cost_limit_microusd\"")
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
    transaction.mockResolvedValue([
      { rows: [{ locked: null }] },
      { rows: [{ reservationId: null }] },
    ])

    await expect(store.reserveSummary({
      monthBucket,
      reservedTokens: 1,
      reservedCostMicrousd: 1,
      now,
      expiresAt,
    })).resolves.toEqual({ status: "monthly_limit" })
  })

  it("gives concurrent attempts the same month-only lock before either reservation query", async () => {
    transaction
      .mockResolvedValueOnce([
        { rows: [{ locked: null }] },
        { rows: [{ reservationId }] },
      ])
      .mockResolvedValueOnce([
        { rows: [{ locked: null }] },
        { rows: [{ reservationId: null }] },
      ])

    const input = {
      monthBucket,
      reservedTokens: 1_115,
      reservedCostMicrousd: 1_715,
      now,
      expiresAt,
    }
    const results = await Promise.all([store.reserveSummary(input), store.reserveSummary(input)])

    expect(results).toEqual([
      { status: "reserved", id: reservationId },
      { status: "monthly_limit" },
    ])
    expect(transaction).toHaveBeenCalledTimes(2)
    for (const call of [0, 1]) {
      expect(transaction.mock.calls[call][0]).toHaveLength(2)
      expect(compiledTransactionCall(0, call).params).toEqual(["2026-08"])
      expect(compiledTransactionCall(0, call).sql.toLowerCase()).toContain("pg_advisory_xact_lock")
      expect(compiledTransactionCall(1, call).sql.toLowerCase()).toContain("insert into")
    }
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
