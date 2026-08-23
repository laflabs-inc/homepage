"use client"

import Link from "next/link"

import styles from "@/components/content/content.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import { documentRouteStateCopy } from "@/lib/content"

export default function DocumentNotFound() {
  const locale = useLocale()
  const copy = documentRouteStateCopy[locale]
  return (
    <section className={styles.page} lang={locale}>
      <div className={styles.unavailableState}>
        <span aria-hidden="true">□</span>
        <h1>{copy.notFoundTitle}</h1>
        <p>{copy.notFoundBody}</p>
        <Link href="/">{copy.home}</Link>
      </div>
    </section>
  )
}
