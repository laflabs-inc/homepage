import type { AgentSettings } from "@/lib/agent/types"
import { usageBuckets } from "@/lib/ai/buckets"
import { estimateCostMicrousd, type TokenPrices } from "@/lib/ai/cost"

const SUMMARY_PROMPT_BYTE_LIMIT = 16_384
const SUMMARY_SOURCE_BYTE_LIMIT = 800_000
const SUMMARY_MAX_OUTPUT_TOKENS = 256
const RESERVATION_TTL_MS = 90_000

export type SummaryReservationInput = {
  reservationId: string
  monthBucket: Date
  reservedTokens: number
  reservedCostMicrousd: number
  now: Date
  expiresAt: Date
}

export type SummaryUsageInput = {
  reservationId: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostMicrousd: number
  now: Date
}

export type MonthlyBudgetStatus = {
  limitMicrousd: number
  actualCostMicrousd: number
  reservedCostMicrousd: number
}

export type SummaryReservation = {
  id: string
  estimatedInputTokens: number
  maxOutputTokens: number
  reservedTokens: number
  reservedCostMicrousd: number
  prices: TokenPrices
}

export interface AiQuotaStore {
  reserveSummary(input: SummaryReservationInput): Promise<
    { status: "reserved"; id: string } | { status: "in_progress" } | { status: "monthly_limit" }
  >
  reconcileSummaryUsage(input: SummaryUsageInput): Promise<boolean>
  releaseReservation(reservationId: string): Promise<boolean>
  getMonthlyBudgetStatus(input: { monthBucket: Date; now: Date }): Promise<MonthlyBudgetStatus>
}

type SettingsReader = Pick<{ getSettings(): Promise<AgentSettings> }, "getSettings">

export class AiQuotaError extends Error {
  constructor(
    public readonly code: "disabled" | "misconfigured" | "content_too_large" | "in_progress" | "monthly_limit",
    message: string,
  ) {
    super(message)
    this.name = "AiQuotaError"
  }
}

function monthDate(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`)
}

function summaryInputTokens(prompt: string, source: string): number {
  const encoder = new TextEncoder()
  const promptBytes = encoder.encode(prompt).byteLength
  const sourceBytes = encoder.encode(source).byteLength
  if (promptBytes > SUMMARY_PROMPT_BYTE_LIMIT || sourceBytes > SUMMARY_SOURCE_BYTE_LIMIT) {
    throw new AiQuotaError("content_too_large", "Summary input exceeds the supported size")
  }
  return Math.ceil((promptBytes + sourceBytes) / 2) + 512
}

function requireSummarySettings(settings: AgentSettings) {
  if (!settings.enabled) throw new AiQuotaError("disabled", "AI is disabled")
  if (
    !settings.model
    || settings.inputPriceMicrousdPerMillion === null
    || settings.outputPriceMicrousdPerMillion === null
  ) throw new AiQuotaError("misconfigured", "AI model and prices are required")
  return {
    maxOutputTokens: Math.min(settings.maxOutputTokens, SUMMARY_MAX_OUTPUT_TOKENS),
    prices: {
      inputMicrousdPerMillion: settings.inputPriceMicrousdPerMillion,
      outputMicrousdPerMillion: settings.outputPriceMicrousdPerMillion,
    },
  }
}

export function createAiQuotaService(
  store: AiQuotaStore,
  settingsReader: SettingsReader,
  dependencies: { now: () => Date } = { now: () => new Date() },
) {
  return {
    async reserveSummary(input: { reservationId: string; prompt: string; source: string }): Promise<SummaryReservation> {
      const settings = await settingsReader.getSettings()
      const { maxOutputTokens, prices } = requireSummarySettings(settings)
      const estimatedInputTokens = summaryInputTokens(input.prompt, input.source)
      const reservedTokens = estimatedInputTokens + maxOutputTokens
      const reservedCostMicrousd = estimateCostMicrousd(
        { inputTokens: estimatedInputTokens, outputTokens: maxOutputTokens },
        prices,
      )
      const now = dependencies.now()
      const month = usageBuckets(now, settings.resetTimezone, settings.dailyResetMinute).month
      const result = await store.reserveSummary({
        reservationId: input.reservationId,
        monthBucket: monthDate(month),
        reservedTokens,
        reservedCostMicrousd,
        now,
        expiresAt: new Date(now.getTime() + RESERVATION_TTL_MS),
      })
      if (result.status === "monthly_limit") {
        throw new AiQuotaError("monthly_limit", "The monthly AI cost limit has been reached")
      }
      if (result.status === "in_progress") {
        throw new AiQuotaError("in_progress", "Summary generation is already in progress")
      }
      return {
        id: result.id,
        estimatedInputTokens,
        maxOutputTokens,
        reservedTokens,
        reservedCostMicrousd,
        prices,
      }
    },

    async reconcileSummaryUsage(
      reservation: SummaryReservation,
      usage: { inputTokens: number; outputTokens: number; totalTokens: number },
    ): Promise<boolean> {
      if (usage.outputTokens > reservation.maxOutputTokens) {
        throw new RangeError("outputTokens exceeds the reserved maximum")
      }
      const estimatedCostMicrousd = estimateCostMicrousd(usage, reservation.prices)
      if (!Number.isSafeInteger(usage.totalTokens) || usage.totalTokens < 0) {
        throw new RangeError("totalTokens must be a non-negative safe integer")
      }
      return store.reconcileSummaryUsage({
        reservationId: reservation.id,
        ...usage,
        estimatedCostMicrousd,
        now: dependencies.now(),
      })
    },

    releaseReservation(reservationId: string): Promise<boolean> {
      return store.releaseReservation(reservationId)
    },

    async getRemainingMonthlyBudget() {
      const settings = await settingsReader.getSettings()
      const now = dependencies.now()
      const month = usageBuckets(now, settings.resetTimezone, settings.dailyResetMinute).month
      const status = await store.getMonthlyBudgetStatus({ monthBucket: monthDate(month), now })
      const remaining = BigInt(status.limitMicrousd)
        - BigInt(status.actualCostMicrousd)
        - BigInt(status.reservedCostMicrousd)
      const remainingMicrousd = remaining > 0n ? Number(remaining) : 0
      return {
        month,
        ...status,
        remainingMicrousd,
        exhausted: remainingMicrousd === 0,
      }
    },
  }
}
