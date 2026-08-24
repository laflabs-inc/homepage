import { describe, expect, it } from "vitest"

import type { AgentSettings } from "@/lib/agent/types"
import {
  AiQuotaError,
  createAiQuotaService,
  type AiQuotaStore,
  type MonthlyBudgetStatus,
  type SummaryReservationInput,
  type SummaryUsageInput,
} from "@/lib/ai/quota"

const now = new Date("2026-08-24T10:00:00.000Z")
const summarySubjectId = "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131"
const firstAttemptId = "00000000-0000-4000-8000-000000000001"
const secondAttemptId = "00000000-0000-4000-8000-000000000002"
const thirdAttemptId = "00000000-0000-4000-8000-000000000003"

function settings(overrides: Partial<AgentSettings> = {}): AgentSettings {
  return {
    id: "default",
    enabled: true,
    model: "gpt-test",
    dailyTokenLimit: 20_000,
    dailyQuestionLimit: 10,
    maxOutputTokens: 600,
    monthlyCostLimitMicrousd: 50_000_000,
    inputPriceMicrousdPerMillion: 1_000_000,
    outputPriceMicrousdPerMillion: 2_000_000,
    pricingCheckedAt: now,
    resetTimezone: "Asia/Seoul",
    dailyResetMinute: 0,
    cookieRetentionDays: 180,
    summaryPolicy: "review",
    version: 1,
    updatedBy: "github:42",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

class MemorySummaryStore implements AiQuotaStore {
  reserveInputs: SummaryReservationInput[] = []
  usage = { actualCostMicrousd: 0, reservedCostMicrousd: 0 }
  limit = 50_000_000
  reservations = new Map<string, { subjectId: string; reservedCostMicrousd: number; reconciled: boolean }>()
  subjects = new Map<string, string>()
  summaryCount = 0
  inputTokens = 0
  outputTokens = 0
  totalTokens = 0
  async reserveSummary(input: SummaryReservationInput) {
    this.reserveInputs.push(input)
    const used = this.usage.actualCostMicrousd + this.usage.reservedCostMicrousd
    if (used >= this.limit || used + input.reservedCostMicrousd > this.limit) {
      return { status: "monthly_limit" as const }
    }
    if (this.subjects.has(input.subjectId)) return { status: "in_progress" as const }
    const id = input.reservationId
    this.reservations.set(id, {
      subjectId: input.subjectId,
      reservedCostMicrousd: input.reservedCostMicrousd,
      reconciled: false,
    })
    this.subjects.set(input.subjectId, id)
    this.usage.reservedCostMicrousd += input.reservedCostMicrousd
    return { status: "reserved" as const, id }
  }

  async reconcileSummaryUsage(input: SummaryUsageInput) {
    const reservation = this.reservations.get(input.reservationId)
    if (!reservation || reservation.reconciled) return false
    reservation.reconciled = true
    this.usage.reservedCostMicrousd -= reservation.reservedCostMicrousd
    reservation.reservedCostMicrousd = 0
    this.usage.actualCostMicrousd += input.estimatedCostMicrousd
    this.summaryCount += 1
    this.inputTokens += input.inputTokens
    this.outputTokens += input.outputTokens
    this.totalTokens += input.totalTokens
    return true
  }

  async releaseReservation(reservationId: string) {
    const reservation = this.reservations.get(reservationId)
    if (!reservation) return false
    this.reservations.delete(reservationId)
    if (this.subjects.get(reservation.subjectId) === reservationId) this.subjects.delete(reservation.subjectId)
    this.usage.reservedCostMicrousd -= reservation.reservedCostMicrousd
    return true
  }

  async getMonthlyBudgetStatus(): Promise<MonthlyBudgetStatus> {
    return { limitMicrousd: this.limit, ...this.usage }
  }
}

function service(
  store = new MemorySummaryStore(),
  current = settings(),
  attemptIds = [firstAttemptId, secondAttemptId, thirdAttemptId],
) {
  let nextAttempt = 0
  return {
    quota: createAiQuotaService(store, { getSettings: async () => current }, {
      now: () => now,
      randomUUID: () => attemptIds[nextAttempt++] ?? crypto.randomUUID(),
    }),
    store,
  }
}

describe("summary budget service", () => {
  it("reserves a conservative UTF-8 input estimate plus configured maximum output", async () => {
    const { quota, store } = service()

    await expect(quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" })).resolves.toMatchObject({
      id: firstAttemptId,
      estimatedInputTokens: 515,
      maxOutputTokens: 256,
      reservedTokens: 771,
      reservedCostMicrousd: 1_027,
    })

    expect(store.reserveInputs).toEqual([{
      monthBucket: new Date("2026-08-01T00:00:00.000Z"),
      reservationId: firstAttemptId,
      subjectId: summarySubjectId,
      reservedTokens: 771,
      reservedCostMicrousd: 1_027,
      now,
      expiresAt: new Date("2026-08-24T10:01:30.000Z"),
    }])
    expect(JSON.stringify(store.reserveInputs)).not.toContain("ab")
    expect(JSON.stringify(store.reserveInputs)).not.toContain("가")
  })

  it.each([
    settings({ enabled: false }),
    settings({ model: null }),
    settings({ inputPriceMicrousdPerMillion: null }),
    settings({ outputPriceMicrousdPerMillion: null }),
  ])("fails closed before storage when AI settings are unavailable", async (current) => {
    const { quota, store } = service(new MemorySummaryStore(), current)

    await expect(quota.reserveSummary({ subjectId: summarySubjectId, prompt: "prompt", source: "source" }))
      .rejects.toBeInstanceOf(AiQuotaError)
    expect(store.reserveInputs).toEqual([])
  })

  it("rejects prompt or source bytes outside the summary bounds", async () => {
    const { quota, store } = service()

    await expect(quota.reserveSummary({ subjectId: summarySubjectId, prompt: "p".repeat(16_385), source: "source" }))
      .rejects.toMatchObject({ code: "content_too_large" })
    await expect(quota.reserveSummary({ subjectId: summarySubjectId, prompt: "prompt", source: "가".repeat(266_667) }))
      .rejects.toMatchObject({ code: "content_too_large" })
    expect(store.reserveInputs).toEqual([])
  })

  it("reports the monthly guard when actual plus live reservation cost cannot fit", async () => {
    const store = new MemorySummaryStore()
    store.limit = 1_026
    const { quota } = service(store)

    await expect(quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" }))
      .rejects.toMatchObject({ code: "monthly_limit" })
  })

  it("reconciles provider usage once using the reservation price snapshot", async () => {
    const { quota, store } = service()
    const reservation = await quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" })
    const usage = { inputTokens: 1_200, outputTokens: 200, totalTokens: 1_400 }

    await expect(quota.reconcileSummaryUsage(reservation, usage)).resolves.toBe(true)
    await expect(quota.reconcileSummaryUsage(reservation, usage)).resolves.toBe(false)

    expect(store).toMatchObject({
      summaryCount: 1,
      inputTokens: 1_200,
      outputTokens: 200,
      totalTokens: 1_400,
      usage: { actualCostMicrousd: 1_600, reservedCostMicrousd: 0 },
    })
  })

  it("rejects provider output beyond the reservation's configured maximum", async () => {
    const { quota } = service()
    const reservation = await quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" })

    await expect(quota.reconcileSummaryUsage(reservation, {
      inputTokens: 500,
      outputTokens: 257,
      totalTokens: 757,
    })).rejects.toThrow(RangeError)
  })

  it("releases a reservation after a provider failure", async () => {
    const { quota, store } = service()
    const reservation = await quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" })

    try {
      throw new Error("provider unavailable")
    } catch {
      await quota.releaseReservation(reservation.id)
    }

    expect(store.reservations.size).toBe(0)
    expect(store.usage.reservedCostMicrousd).toBe(0)
  })

  it("allows one bounded actual overrun, clamps remaining to zero, then blocks", async () => {
    const store = new MemorySummaryStore()
    store.limit = 2_000
    const { quota } = service(store)
    const reservation = await quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" })

    await quota.reconcileSummaryUsage(reservation, {
      inputTokens: 2_500,
      outputTokens: 0,
      totalTokens: 2_500,
    })

    await expect(quota.getRemainingMonthlyBudget()).resolves.toEqual({
      month: "2026-08",
      limitMicrousd: 2_000,
      actualCostMicrousd: 2_500,
      reservedCostMicrousd: 0,
      remainingMicrousd: 0,
      exhausted: true,
    })
    await expect(quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" }))
      .rejects.toMatchObject({ code: "monthly_limit" })
  })

  it("keeps a reconciled subject claimed until its exact reservation is released", async () => {
    const { quota, store } = service()
    const reservation = await quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" })
    await quota.reconcileSummaryUsage(reservation, { inputTokens: 10, outputTokens: 2, totalTokens: 12 })

    await expect(quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" }))
      .rejects.toMatchObject({ code: "in_progress" })
    expect(store.summaryCount).toBe(1)

    await quota.releaseReservation(reservation.id)
    await expect(quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" }))
      .resolves.toMatchObject({ id: thirdAttemptId })
  })

  it("does not let a delayed old release delete a newer claim for the same subject", async () => {
    const { quota, store } = service()
    const oldReservation = await quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" })
    await quota.releaseReservation(oldReservation.id)
    const currentReservation = await quota.reserveSummary({ subjectId: summarySubjectId, prompt: "ab", source: "가" })

    await expect(quota.releaseReservation(oldReservation.id)).resolves.toBe(false)
    expect(store.subjects.get(summarySubjectId)).toBe(currentReservation.id)
    expect(store.reservations.has(currentReservation.id)).toBe(true)
  })
})
