"use client"

import styles from "@/app/admin/admin.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"

type AnalyticsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AnalyticsError({ reset }: AnalyticsErrorProps) {
  const t = adminCopy[useLocale()].analytics

  return (
    <section className={styles.errorState} role="alert">
      <h2>{t.errorHeading}</h2>
      <p>{t.errorDescription}</p>
      <button type="button" onClick={reset}>{t.retry}</button>
    </section>
  )
}
