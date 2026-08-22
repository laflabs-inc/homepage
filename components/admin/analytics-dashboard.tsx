import Link from "next/link"

import type {
  AnalyticsCountRow,
  AnalyticsRange,
  AnalyticsSummary,
} from "@/lib/analytics/store"
import styles from "@/app/admin/admin.module.css"

const ranges: AnalyticsRange[] = [7, 30, 90]
const numberFormatter = new Intl.NumberFormat("en-US")

function formatCount(value: number) {
  return numberFormatter.format(value)
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`
}

function MetricCell({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.metricCell}>
      <dt>{label}</dt>
      <dd>{formatCount(value)}</dd>
    </div>
  )
}

function Distribution({
  id,
  title,
  rows,
}: {
  id: string
  title: string
  rows: AnalyticsCountRow[]
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <section className={styles.distribution} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title}</h2>
      {rows.length === 0 ? (
        <p className={styles.inlineEmpty}>No page-view data / 페이지뷰 데이터 없음</p>
      ) : (
        <ul className={styles.barList}>
          {rows.map((row) => {
            const share = total === 0 ? 0 : row.count / total
            return (
              <li key={row.key}>
                <div className={styles.barMeta}>
                  <span>{row.key}</span>
                  <span>{formatCount(row.count)} · {formatPercent(share)}</span>
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
}: {
  id: string
  title: string
  totalLabel: string
  rows: AnalyticsCountRow[]
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
            <th scope="col">Target / 대상</th>
            <th scope="col">Events / 이벤트</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={2} className={styles.tableEmpty}>No events in this range / 이 기간의 이벤트 없음</td>
            </tr>
          ) : rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.key}</th>
              <td>{formatCount(row.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export function AnalyticsDashboard({ summary }: { summary: AnalyticsSummary }) {
  const hasEvents = summary.consentedVisitors + summary.pageViews + summary.productClicks
    + summary.githubClicks + summary.contactClicks > 0

  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardHeading}>
        <div>
          <h1>Analytics / 분석</h1>
          <p>Consented traffic only / 동의한 트래픽만 집계</p>
        </div>
        <nav className={styles.rangeNav} aria-label="Analytics date range">
          {ranges.map((range) => (
            <Link
              key={range}
              href={`/admin/analytics?range=${range}`}
              aria-current={summary.rangeDays === range ? "page" : undefined}
            >
              {range} days
            </Link>
          ))}
        </nav>
      </header>

      {!hasEvents ? (
        <section className={styles.dashboardEmpty}>
          <h2>No signal yet / 아직 수집된 신호가 없습니다</h2>
          <p>No consented events have been collected in this range. / 이 기간에 수집된 동의 기반 이벤트가 없습니다.</p>
        </section>
      ) : (
        <>
          <dl className={styles.metrics} aria-label="Consented analytics totals">
            <MetricCell label="Consented visitors" value={summary.consentedVisitors} />
            <MetricCell label="Page views" value={summary.pageViews} />
            <MetricCell label="Product clicks" value={summary.productClicks} />
            <MetricCell label="Contact clicks" value={summary.contactClicks} />
          </dl>

          <section className={styles.funnel} aria-labelledby="funnel-heading">
            <div className={styles.sectionHeading}>
              <h2 id="funnel-heading">Visitor funnel / 방문자 퍼널</h2>
              <p>Conversion uses distinct consented visitors / 전환율은 고유 동의 방문자 기준</p>
            </div>
            <div className={styles.funnelTrack}>
              <div className={styles.funnelStage}>
                <span>Page view</span>
                <strong>{formatCount(summary.pageViews)}</strong>
                <small>events</small>
              </div>
              <div className={styles.funnelRate}>
                <strong>{formatPercent(summary.funnel.pageToProduct)}</strong>
                <span>to product</span>
              </div>
              <div className={styles.funnelStage}>
                <span>Product click</span>
                <strong>{formatCount(summary.productClicks)}</strong>
                <small>events</small>
              </div>
              <div className={styles.funnelRate}>
                <strong>{formatPercent(summary.funnel.productToContact)}</strong>
                <span>to contact</span>
              </div>
              <div className={styles.funnelStage}>
                <span>Contact click</span>
                <strong>{formatCount(summary.contactClicks)}</strong>
                <small>events</small>
              </div>
            </div>
          </section>

          <div className={styles.distributionGrid}>
            <Distribution id="locale" title="Locale / 언어" rows={summary.locales} />
            <Distribution id="device" title="Device / 기기" rows={summary.devices} />
          </div>

          <div className={styles.tableGrid}>
            <AggregateTable
              id="referrers"
              title="Referrers"
              totalLabel="Top 10 page-view hosts"
              rows={summary.referrers}
            />
            <AggregateTable
              id="products"
              title="Products"
              totalLabel={`${formatCount(summary.productClicks)} product clicks`}
              rows={summary.products}
            />
            <AggregateTable
              id="github-targets"
              title="GitHub targets"
              totalLabel={`${formatCount(summary.githubClicks)} GitHub clicks`}
              rows={summary.githubTargets}
            />
          </div>
        </>
      )}
    </div>
  )
}
