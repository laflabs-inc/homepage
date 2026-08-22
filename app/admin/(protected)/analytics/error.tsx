"use client"

import styles from "@/app/admin/admin.module.css"

type AnalyticsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AnalyticsError({ reset }: AnalyticsErrorProps) {
  return (
    <section className={styles.errorState} role="alert">
      <h2>통계를 불러오지 못했습니다 / Unable to load analytics</h2>
      <p>잠시 후 다시 시도해 주세요. / Please try again shortly.</p>
      <button type="button" onClick={reset}>Retry / 다시 시도</button>
    </section>
  )
}
