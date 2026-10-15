"use client"

import styles from "@/app/admin/admin.module.css"
import { AdminPage, AdminPageHeader, AdminSection } from "@/components/admin/admin-page"
import { useLocale } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { adminCopy } from "@/lib/admin/i18n"

type AnalyticsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AnalyticsError({ reset }: AnalyticsErrorProps) {
  const t = adminCopy[useLocale()].analytics

  return (
    <AdminPage>
      <AdminPageHeader title={t.errorHeading} description={t.errorDescription} />
      <AdminSection className={styles.errorState} role="alert" aria-label={t.errorHeading}>
        <Button type="button" onClick={reset}>{t.retry}</Button>
      </AdminSection>
    </AdminPage>
  )
}
