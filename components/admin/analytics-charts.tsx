"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import styles from "@/app/admin/admin.module.css"
import type { AdminCopy } from "@/lib/admin/i18n"
import type { AnalyticsDailyPoint } from "@/lib/analytics/store"

function formatDate(date: string, locale: "ko" | "en", options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
}

function formatCount(value: number, locale: "ko" | "en") {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US").format(value)
}

export function AnalyticsCharts({
  daily,
  locale,
  copy,
}: {
  daily: AnalyticsDailyPoint[]
  locale: "ko" | "en"
  copy: AdminCopy["analytics"]
}) {
  return (
    <section className={styles.traffic} aria-labelledby="traffic-heading">
      <div className={styles.sectionHeading}>
        <h2 id="traffic-heading">{copy.traffic}</h2>
      </div>
      <div className={styles.trafficLegend} aria-hidden="true">
        <span><i className={styles.visitorsKey} />{copy.visitors}</span>
        <span><i className={styles.pageViewsKey} />{copy.pageViews}</span>
      </div>
      <div className={styles.trafficPlot} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={daily} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={{ stroke: "var(--ink)" }}
              tickLine={false}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickFormatter={(date: string) => formatDate(date, locale, { month: "short", day: "numeric" })}
              minTickGap={28}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickFormatter={(value: number) => formatCount(value, locale)}
              width={32}
            />
            <Line
              type="linear"
              dataKey="visitors"
              stroke="var(--blue)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="pageViews"
              stroke="var(--ink)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className={styles.visuallyHidden} aria-label={copy.dailyTrafficData}>
        <thead>
          <tr>
            <th scope="col">{copy.date}</th>
            <th scope="col">{copy.visitorsColumn}</th>
            <th scope="col">{copy.pageViews}</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((point) => (
            <tr key={point.date}>
              <th scope="row">
                {formatDate(point.date, locale, { year: "numeric", month: "short", day: "numeric" })}
              </th>
              <td>{formatCount(point.visitors, locale)}</td>
              <td>{formatCount(point.pageViews, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
