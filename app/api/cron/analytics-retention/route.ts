import { deleteExpiredAnalytics } from "@/lib/analytics/service"
import { analyticsStore, type AnalyticsStore } from "@/lib/analytics/store"
import { authorizeCronRequest } from "@/lib/http/cron-auth"

const unauthorized = () => Response.json({ error: "unauthorized" }, { status: 401 })

export async function handleAnalyticsRetention(
  request: Request,
  store: AnalyticsStore = analyticsStore,
  now: Date = new Date(),
): Promise<Response> {
  if (!authorizeCronRequest(request)) return unauthorized()

  try {
    return Response.json(await deleteExpiredAnalytics(now, store))
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 })
  }
}

export async function GET(request: Request): Promise<Response> {
  return handleAnalyticsRetention(request)
}
