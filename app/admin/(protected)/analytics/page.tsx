import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { getAnalyticsSummary, parseAnalyticsRange } from "@/lib/analytics/store"
import { requireAdmin } from "@/lib/auth/require-admin"

export const dynamic = "force-dynamic"

type AnalyticsPageProps = {
  searchParams: Promise<{ range?: string | string[] }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  await requireAdmin()

  const params = await searchParams
  const range = parseAnalyticsRange(params.range)
  const now = new Date()
  const summary = await getAnalyticsSummary(range, now)

  return <AnalyticsDashboard summary={summary} />
}
