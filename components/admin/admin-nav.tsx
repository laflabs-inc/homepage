"use client"

import Link from "next/link"

import styles from "@/app/admin/admin.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"

export function AdminNav() {
  const t = adminCopy[useLocale()].nav

  return (
    <nav className={styles.adminNav} aria-label={t.label}>
      <Link href="/admin/analytics">{t.analytics}</Link>
      <Link href="/admin/documents">{t.documents}</Link>
      <Link href="/admin/documents/categories">{t.categories}</Link>
      <Link href="/admin/agent">{t.agent}</Link>
    </nav>
  )
}
