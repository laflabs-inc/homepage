"use client"

import type {
  AnalyticsCountRow,
  AnalyticsSummary,
} from "@/lib/analytics/store"
import styles from "@/app/admin/admin.module.css"
import { AdminSection } from "@/components/admin/admin-page"
import { AnalyticsCharts } from "@/components/admin/analytics-charts"
import { useLocale } from "@/components/i18n/locale-provider"
import { EmptyState } from "@/components/ui/empty-state"
import { adminCopy, type AdminCopy } from "@/lib/admin/i18n"

function distributionValueLabel(
  key: string,
  id: "locale" | "device",
  t: AdminCopy["analytics"],
): string {
  if (id === "locale" && (key === "ko" || key === "en")) return t.localeValues[key]
  if (id === "device" && (key === "mobile" || key === "desktop")) return t.deviceValues[key]
  return key
}

function formatCount(value: number, locale: "ko" | "en") {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US").format(value)
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`
}

function MetricCell({ label, value, locale }: { label: string; value: number; locale: "ko" | "en" }) {
  return (
    <div className={styles.metricCell}>
      <dt>{label}</dt>
      <dd>{formatCount(value, locale)}</dd>
    </div>
  )
}

function Distribution({
  id,
  title,
  rows,
  noDataLabel,
  locale,
  copy,
}: {
  id: "locale" | "device"
  title: string
  rows: AnalyticsCountRow[]
  noDataLabel: string
  locale: "ko" | "en"
  copy: AdminCopy["analytics"]
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <AdminSection className={styles.distribution} title={title}>
      {rows.length === 0 ? (
        <p className={styles.inlineEmpty}>{noDataLabel}</p>
      ) : (
        <ul className={styles.barList}>
          {rows.map((row) => {
            const share = total === 0 ? 0 : row.count / total
            return (
              <li key={row.key}>
                <div className={styles.barMeta}>
                  <span>{distributionValueLabel(row.key, id, copy)}</span>
                  <span>{formatCount(row.count, locale)} · {formatPercent(share)}</span>
                </div>
                <div className={styles.barTrack} aria-hidden="true">
                  <span style={{ width: `${share * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </AdminSection>
  )
}

function AggregateTable({
  title,
  totalLabel,
  rows,
  targetLabel,
  eventsLabel,
  noEventsLabel,
  locale,
}: {
  title: string
  totalLabel: string
  rows: AnalyticsCountRow[]
  targetLabel: string
  eventsLabel: string
  noEventsLabel: string
  locale: "ko" | "en"
}) {
  return (
    <AdminSection className={styles.tableSection} title={title} actions={<span className={styles.tableTotal}>{totalLabel}</span>}>
      <div className={styles.tableViewport}>
        <table aria-label={title}>
          <thead>
            <tr>
              <th scope="col">{targetLabel}</th>
              <th scope="col">{eventsLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className={styles.tableEmpty}>{noEventsLabel}</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.key}</th>
                <td>{formatCount(row.count, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSection>
  )
}

export function AnalyticsDashboard({ summary }: { summary: AnalyticsSummary }) {
  const locale = useLocale()
  const t = adminCopy[locale].analytics
  const hasEvents = summary.consentedVisitors + summary.pageViews + summary.productClicks
    + summary.githubClicks + summary.contactClicks > 0

  return (
    <div className={styles.dashboard}>
      {!hasEvents ? (
        <EmptyState className={styles.dashboardEmpty} title={t.emptyHeading} description={t.emptyDescription} />
      ) : (
        <>
          <dl className={styles.metrics} aria-label={t.totalsLabel}>
            <MetricCell label={t.consentedVisitors} value={summary.consentedVisitors} locale={locale} />
            <MetricCell label={t.pageViews} value={summary.pageViews} locale={locale} />
            <MetricCell label={t.productClicks} value={summary.productClicks} locale={locale} />
            <MetricCell label={t.contactClicks} value={summary.contactClicks} locale={locale} />
          </dl>

          <AnalyticsCharts daily={summary.daily} locale={locale} copy={t} />

          <AdminSection className={styles.funnel} title={t.funnel} description={t.funnelDescription}>
            <div className={styles.funnelTrack}>
              <div className={styles.funnelStage}>
                <span>{t.pageView}</span>
                <strong>{formatCount(summary.funnel.pageVisitors, locale)}</strong>
                <small>{t.visitors}</small>
              </div>
              <div className={styles.funnelRate}>
                <strong>{formatPercent(summary.funnel.pageToProduct)}</strong>
                <span>{t.toProduct}</span>
              </div>
              <div className={styles.funnelStage}>
                <span>{t.productClick}</span>
                <strong>{formatCount(summary.funnel.productVisitors, locale)}</strong>
                <small>{t.visitors}</small>
              </div>
              <div className={styles.funnelRate}>
                <strong>{formatPercent(summary.funnel.productToContact)}</strong>
                <span>{t.toContact}</span>
              </div>
              <div className={styles.funnelStage}>
                <span>{t.contactClick}</span>
                <strong>{formatCount(summary.funnel.contactVisitors, locale)}</strong>
                <small>{t.visitors}</small>
              </div>
            </div>
          </AdminSection>

          <div className={styles.distributionGrid}>
            <Distribution id="locale" title={t.locale} rows={summary.locales} noDataLabel={t.noPageViewData} locale={locale} copy={t} />
            <Distribution id="device" title={t.device} rows={summary.devices} noDataLabel={t.noPageViewData} locale={locale} copy={t} />
          </div>

          <div className={styles.tableGrid}>
            <AggregateTable
              title={t.referrers}
              totalLabel={t.referrersTotal}
              rows={summary.referrers}
              targetLabel={t.target}
              eventsLabel={t.events}
              noEventsLabel={t.noEvents}
              locale={locale}
            />
            <AggregateTable
              title={t.products}
              totalLabel={t.productsTotal(formatCount(summary.productClicks, locale))}
              rows={summary.products}
              targetLabel={t.target}
              eventsLabel={t.events}
              noEventsLabel={t.noEvents}
              locale={locale}
            />
            <AggregateTable
              title={t.githubTargets}
              totalLabel={t.githubTargetsTotal(formatCount(summary.githubClicks, locale))}
              rows={summary.githubTargets}
              targetLabel={t.target}
              eventsLabel={t.events}
              noEventsLabel={t.noEvents}
              locale={locale}
            />
          </div>
        </>
      )}
    </div>
  )
}
