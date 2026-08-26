import { sql, type SQL } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { aiUsageDaily, aiUsageMonthly, aiUsageReservations } from "@/lib/db/schema"
import { authorizeCronRequest } from "@/lib/http/cron-auth"

type SqlExecutor = {
  execute(query: SQL): Promise<{ rows: unknown[] }>
}

export type AiRetentionStore = {
  deleteExpired(input: { now: Date; dailyCutoff: Date; monthlyCutoff: Date }): Promise<AiRetentionCounts>
}

export type AiRetentionCounts = {
  reservations: number
  daily: number
  monthly: number
}

function count(value: unknown): number {
  const result = Number(value)
  return Number.isSafeInteger(result) && result >= 0 ? result : 0
}

export function createAiRetentionStore(database: SqlExecutor): AiRetentionStore {
  return {
    async deleteExpired({ now, dailyCutoff, monthlyCutoff }) {
      const result = await database.execute(sql`
        WITH deleted_reservations AS (
          DELETE FROM ${aiUsageReservations}
          WHERE "expires_at" <= ${now}
          RETURNING 1
        ), deleted_daily AS (
          DELETE FROM ${aiUsageDaily}
          WHERE "date_bucket" < ${dailyCutoff}
          RETURNING 1
        ), deleted_monthly AS (
          DELETE FROM ${aiUsageMonthly}
          WHERE "month_bucket" < ${monthlyCutoff}
          RETURNING 1
        )
        SELECT
          (SELECT count(*)::integer FROM deleted_reservations) AS reservations,
          (SELECT count(*)::integer FROM deleted_daily) AS daily,
          (SELECT count(*)::integer FROM deleted_monthly) AS monthly
      `)
      const row = result.rows[0] as Record<string, unknown> | undefined
      return {
        reservations: count(row?.reservations),
        daily: count(row?.daily),
        monthly: count(row?.monthly),
      }
    },
  }
}

export const aiRetentionStore = createAiRetentionStore({
  execute(query) {
    return getDb().execute(query)
  },
})

function retentionCutoffs(now: Date) {
  return {
    dailyCutoff: new Date(now.getTime() - 32 * 24 * 60 * 60_000),
    monthlyCutoff: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 13, 1)),
  }
}

const response = (body: AiRetentionCounts | { error: "unauthorized" | "unavailable" }, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store" },
})

export async function handleAiRetention(
  request: Request,
  store: AiRetentionStore = aiRetentionStore,
  now: Date = new Date(),
): Promise<Response> {
  if (!authorizeCronRequest(request)) return response({ error: "unauthorized" }, 401)

  try {
    return response(await store.deleteExpired({ now, ...retentionCutoffs(now) }))
  } catch {
    return response({ error: "unavailable" }, 503)
  }
}

export async function GET(request: Request): Promise<Response> {
  return handleAiRetention(request)
}
