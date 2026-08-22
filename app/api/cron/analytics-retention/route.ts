import { timingSafeEqual } from "node:crypto"

import { deleteExpiredAnalytics } from "@/lib/analytics/service"
import { analyticsStore, type AnalyticsStore } from "@/lib/analytics/store"
import { getCronEnv } from "@/lib/env"

const unauthorized = () => Response.json({ error: "unauthorized" }, { status: 401 })

function hasValidBearerSecret(authorization: string | null, secret: string): boolean {
  if (!authorization) return false

  const expected = Buffer.from(`Bearer ${secret}`, "utf8")
  const received = Buffer.from(authorization, "utf8")
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export async function handleAnalyticsRetention(
  request: Request,
  store: AnalyticsStore = analyticsStore,
  now: Date = new Date(),
): Promise<Response> {
  let secret: string
  try {
    secret = getCronEnv().CRON_SECRET
  } catch {
    return unauthorized()
  }

  if (!hasValidBearerSecret(request.headers.get("authorization"), secret)) {
    return unauthorized()
  }

  try {
    return Response.json(await deleteExpiredAnalytics(now, store))
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 })
  }
}

export async function GET(request: Request): Promise<Response> {
  return handleAnalyticsRetention(request)
}
