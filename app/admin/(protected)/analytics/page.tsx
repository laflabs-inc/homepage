import Link from "next/link"

import styles from "@/app/admin/admin.module.css"
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { adminCopy } from "@/lib/admin/i18n"
import { getAdminLocale } from "@/lib/admin/locale"
import { getAnalyticsSummary, parseAnalyticsRange } from "@/lib/analytics/store"
import type { AnalyticsRange } from "@/lib/analytics/store"
import { requireAdmin } from "@/lib/auth/require-admin"

export const dynamic = "force-dynamic"

type AnalyticsPageProps = {
  searchParams: Promise<{ range?: string | string[] }>
}

const ranges: AnalyticsRange[] = [7, 30, 90]

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  await requireAdmin()

  const [params, locale] = await Promise.all([searchParams, getAdminLocale()])
  const range = parseAnalyticsRange(params.range)
  const now = new Date()
  const summary = await getAnalyticsSummary(range, now)
  const t = adminCopy[locale].analytics

  return (
    <AdminPage>
      <AdminPageHeader
        title={t.heading}
        description={t.consentedTraffic}
        actions={(
          <nav className={styles.rangeNav} aria-label={t.dateRangeLabel}>
            {ranges.map((days) => (
              <Link
                key={days}
                href={`/admin/analytics?range=${days}`}
                aria-current={summary.rangeDays === days ? "page" : undefined}
              >
                {t.range(days)}
              </Link>
            ))}
          </nav>
        )}
      />
      <AnalyticsDashboard summary={summary} />
    </AdminPage>
  )
}
