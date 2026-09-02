"use client"

import Link from "next/link"

import type {
  AnalyticsCountRow,
  AnalyticsRange,
  AnalyticsSummary,
} from "@/lib/analytics/store"
import styles from "@/app/admin/admin.module.css"
import { AnalyticsCharts } from "@/components/admin/analytics-charts"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy, type AdminCopy } from "@/lib/admin/i18n"

const ranges: AnalyticsRange[] = [7, 30, 90]

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
    <section className={styles.distribution} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title}</h2>
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
    </section>
  )
}

function AggregateTable({
  id,
  title,
  totalLabel,
  rows,
  targetLabel,
  eventsLabel,
  noEventsLabel,
  locale,
}: {
  id: string
  title: string
  totalLabel: string
  rows: AnalyticsCountRow[]
  targetLabel: string
  eventsLabel: string
  noEventsLabel: string
  locale: "ko" | "en"
}) {
  return (
    <section className={styles.tableSection} aria-labelledby={`${id}-heading`}>
      <div className={styles.tableHeading}>
        <h2 id={`${id}-heading`}>{title}</h2>
        <span>{totalLabel}</span>
      </div>
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
    </section>
  )
}

export function AnalyticsDashboard({ summary }: { summary: AnalyticsSummary }) {
  const locale = useLocale()
  const t = adminCopy[locale].analytics
  const hasEvents = summary.consentedVisitors + summary.pageViews + summary.productClicks
    + summary.githubClicks + summary.contactClicks > 0

  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardHeading}>
        <div>
          <h1>{t.heading}</h1>
          <p>{t.consentedTraffic}</p>
        </div>
        <nav className={styles.rangeNav} aria-label={t.dateRangeLabel}>
          {ranges.map((range) => (
            <Link
              key={range}
              href={`/admin/analytics?range=${range}`}
              aria-current={summary.rangeDays === range ? "page" : undefined}
            >
              {t.range(range)}
            </Link>
          ))}
        </nav>
      </header>

      {!hasEvents ? (
        <section className={styles.dashboardEmpty}>
          <h2>{t.emptyHeading}</h2>
          <p>{t.emptyDescription}</p>
        </section>
      ) : (
        <>
          <dl className={styles.metrics} aria-label={t.totalsLabel}>
            <MetricCell label={t.consentedVisitors} value={summary.consentedVisitors} locale={locale} />
            <MetricCell label={t.pageViews} value={summary.pageViews} locale={locale} />
            <MetricCell label={t.productClicks} value={summary.productClicks} locale={locale} />
            <MetricCell label={t.contactClicks} value={summary.contactClicks} locale={locale} />
          </dl>

          <AnalyticsCharts daily={summary.daily} locale={locale} copy={t} />

          <section className={styles.funnel} aria-labelledby="funnel-heading">
            <div className={styles.sectionHeading}>
              <h2 id="funnel-heading">{t.funnel}</h2>
              <p>{t.funnelDescription}</p>
            </div>
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
          </section>

          <div className={styles.distributionGrid}>
            <Distribution id="locale" title={t.locale} rows={summary.locales} noDataLabel={t.noPageViewData} locale={locale} copy={t} />
            <Distribution id="device" title={t.device} rows={summary.devices} noDataLabel={t.noPageViewData} locale={locale} copy={t} />
          </div>

          <div className={styles.tableGrid}>
            <AggregateTable
              id="referrers"
              title={t.referrers}
              totalLabel={t.referrersTotal}
              rows={summary.referrers}
              targetLabel={t.target}
              eventsLabel={t.events}
              noEventsLabel={t.noEvents}
              locale={locale}
            />
            <AggregateTable
              id="products"
              title={t.products}
              totalLabel={t.productsTotal(formatCount(summary.productClicks, locale))}
              rows={summary.products}
              targetLabel={t.target}
              eventsLabel={t.events}
              noEventsLabel={t.noEvents}
              locale={locale}
            />
            <AggregateTable
              id="github-targets"
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
