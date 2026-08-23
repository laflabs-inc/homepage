"use client"

import styles from "@/components/content/content.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import { documentRouteStateCopy } from "@/lib/content"

export default function DocumentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useLocale()
  const copy = documentRouteStateCopy[locale]
  return (
    <section className={styles.page} role="alert" lang={locale}>
      <div className={styles.unavailableState}>
        <span aria-hidden="true">□</span>
        <h1>{copy.errorTitle}</h1>
        <p>{copy.errorBody}</p>
        <button type="button" onClick={reset}>{copy.retry}</button>
      </div>
    </section>
  )
}
