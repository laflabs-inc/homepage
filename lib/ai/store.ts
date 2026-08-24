import "server-only"

import { sql, type SQL } from "drizzle-orm"

import type {
  AiQuotaStore,
  MonthlyBudgetStatus,
  SummaryReservationInput,
  SummaryUsageInput,
} from "@/lib/ai/quota"
import { getDb } from "@/lib/db"
import { agentSettings, aiUsageMonthly, aiUsageReservations } from "@/lib/db/schema"

type SqlExecutor = {
  execute(query: SQL): Promise<{ rows: unknown[] }>
}

type SqlTransactionExecutor = SqlExecutor & {
  transaction(queries: readonly [SQL, SQL]): Promise<readonly [
    { rows: unknown[] },
    { rows: unknown[] },
  ]>
}

function safeInteger(value: unknown, name: string): number {
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 0) throw new RangeError(`${name} is outside the safe integer range`)
  return number
}

export function createAiQuotaStore(database: SqlTransactionExecutor): AiQuotaStore {
  return {
    async reserveSummary(input: SummaryReservationInput) {
      const month = input.monthBucket.toISOString().slice(0, 7)
      const [, result] = await database.transaction([sql`
        SELECT pg_advisory_xact_lock(hashtextextended(${month}, 0)) AS "locked"
      `, sql`
        WITH expired_reservations AS (
          DELETE FROM ${aiUsageReservations}
          WHERE "expires_at" <= ${input.now}
          RETURNING "id"
        ), settings AS (
          SELECT "monthly_cost_limit_microusd"
          FROM ${agentSettings}
          WHERE "id" = 'default'
        ), monthly_usage AS (
          SELECT
            COALESCE(max(u."estimated_cost_microusd"), 0) AS "actualCostMicrousd",
            COALESCE(sum(r."reserved_cost_microusd"), 0) AS "reservedCostMicrousd"
          FROM settings
          LEFT JOIN ${aiUsageMonthly} u ON u."month_bucket" = ${input.monthBucket}
          LEFT JOIN ${aiUsageReservations} r
            ON r."month_bucket" = ${input.monthBucket}
            AND r."expires_at" > ${input.now}
        ), inserted_reservation AS (
          INSERT INTO ${aiUsageReservations} (
            "id", "visitor_hash", "date_bucket", "month_bucket", "kind",
            "reserved_tokens", "reserved_cost_microusd", "expires_at", "created_at"
          )
          SELECT ${input.reservationId}::uuid, NULL, NULL, ${input.monthBucket}, 'summary',
            ${input.reservedTokens}, ${input.reservedCostMicrousd}, ${input.expiresAt}, ${input.now}
          FROM monthly_usage, settings
          WHERE monthly_usage."actualCostMicrousd" + monthly_usage."reservedCostMicrousd"
              < settings."monthly_cost_limit_microusd"
            AND monthly_usage."actualCostMicrousd" + monthly_usage."reservedCostMicrousd"
              + ${input.reservedCostMicrousd} <= settings."monthly_cost_limit_microusd"
            AND (SELECT count(*) FROM expired_reservations) >= 0
          ON CONFLICT ("id") DO NOTHING
          RETURNING "id"
        )
        SELECT inserted_reservation."id" AS "reservationId", EXISTS(
          SELECT 1 FROM ${aiUsageReservations} existing
          WHERE existing."id" = ${input.reservationId}::uuid
            AND existing."expires_at" > ${input.now}
        ) AS "duplicate"
        FROM monthly_usage
        LEFT JOIN inserted_reservation ON true
      `])
      const row = result.rows[0] as { reservationId?: unknown; duplicate?: unknown } | undefined
      if (!row) throw new Error("Agent settings are unavailable")
      if (typeof row.reservationId === "string") return { status: "reserved" as const, id: row.reservationId }
      return row.duplicate === true ? { status: "in_progress" as const } : { status: "monthly_limit" as const }
    },

    async reconcileSummaryUsage(input: SummaryUsageInput) {
      const result = await database.execute(sql`
        WITH deleted_reservation AS (
          DELETE FROM ${aiUsageReservations}
          WHERE "id" = ${input.reservationId}
            AND "kind" = 'summary'
          RETURNING "month_bucket"
        ), recorded_usage AS (
          INSERT INTO ${aiUsageMonthly} (
            "month_bucket", "question_count", "summary_count", "input_tokens",
            "output_tokens", "total_tokens", "estimated_cost_microusd", "updated_at"
          )
          SELECT "month_bucket", 0, 1, ${input.inputTokens}, ${input.outputTokens},
            ${input.totalTokens}, ${input.estimatedCostMicrousd}, ${input.now}
          FROM deleted_reservation
          ON CONFLICT ("month_bucket") DO UPDATE SET
            "summary_count" = ${aiUsageMonthly}."summary_count" + 1,
            "input_tokens" = ${aiUsageMonthly}."input_tokens" + EXCLUDED."input_tokens",
            "output_tokens" = ${aiUsageMonthly}."output_tokens" + EXCLUDED."output_tokens",
            "total_tokens" = ${aiUsageMonthly}."total_tokens" + EXCLUDED."total_tokens",
            "estimated_cost_microusd" = ${aiUsageMonthly}."estimated_cost_microusd"
              + EXCLUDED."estimated_cost_microusd",
            "updated_at" = EXCLUDED."updated_at"
          RETURNING "month_bucket"
        )
        SELECT EXISTS(SELECT 1 FROM recorded_usage) AS "reconciled"
      `)
      return (result.rows[0] as { reconciled?: unknown } | undefined)?.reconciled === true
    },

    async releaseReservation(reservationId: string) {
      const result = await database.execute(sql`
        WITH deleted_reservation AS (
          DELETE FROM ${aiUsageReservations}
          WHERE "id" = ${reservationId}
          RETURNING "id"
        )
        SELECT EXISTS(SELECT 1 FROM deleted_reservation) AS "released"
      `)
      return (result.rows[0] as { released?: unknown } | undefined)?.released === true
    },

    async getMonthlyBudgetStatus({ monthBucket, now }): Promise<MonthlyBudgetStatus> {
      const result = await database.execute(sql`
        SELECT
          s."monthly_cost_limit_microusd" AS "limitMicrousd",
          COALESCE(u."estimated_cost_microusd", 0) AS "actualCostMicrousd",
          COALESCE(sum(r."reserved_cost_microusd"), 0) AS "reservedCostMicrousd"
        FROM ${agentSettings} s
        LEFT JOIN ${aiUsageMonthly} u ON u."month_bucket" = ${monthBucket}
        LEFT JOIN ${aiUsageReservations} r
          ON r."month_bucket" = ${monthBucket}
          AND r."expires_at" > ${now}
        WHERE s."id" = 'default'
        GROUP BY s."monthly_cost_limit_microusd", u."estimated_cost_microusd"
      `)
      const row = result.rows[0] as Record<string, unknown> | undefined
      if (!row) throw new Error("Agent settings are unavailable")
      return {
        limitMicrousd: safeInteger(row.limitMicrousd, "monthly cost limit"),
        actualCostMicrousd: safeInteger(row.actualCostMicrousd, "actual monthly cost"),
        reservedCostMicrousd: safeInteger(row.reservedCostMicrousd, "reserved monthly cost"),
      }
    },
  }
}

export const aiQuotaStore = createAiQuotaStore({
  execute(query) {
    return getDb().execute(query)
  },
  transaction(queries) {
    const database = getDb()
    return database.batch([
      database.execute(queries[0]),
      database.execute(queries[1]),
    ])
  },
})
