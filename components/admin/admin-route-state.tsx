"use client"

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page"
import { useLocale } from "@/components/i18n/locale-provider"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { adminCopy } from "@/lib/admin/i18n"
import styles from "./admin-route-state.module.css"

export function AdminRouteLoading() {
  const t = adminCopy[useLocale()].routeState

  return (
    <div className={styles.routeState} data-route-state="loading">
      <div className={styles.loadingHeader} data-route-state-header>
        <Skeleton className={styles.loadingEyebrow} />
        <Skeleton className={styles.loadingTitle} />
        <Skeleton className={styles.loadingDescription} />
      </div>
      <div className={styles.loadingContent} data-route-state-content>
        <Spinner label={t.loading} size="compact" />
        <div className={styles.loadingRows} aria-hidden="true">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      </div>
    </div>
  )
}

export function AdminRouteError({
  description,
  onRetry,
  retryLabel,
  title,
}: {
  title: string
  description: string
  retryLabel: string
  onRetry: () => void
}) {
  return (
    <AdminPage className={styles.routeState} data-route-state="error">
      <div className={styles.copy}>
        <AdminPageHeader
          actions={<Button onClick={onRetry}>{retryLabel}</Button>}
          description={description}
          title={title}
        />
      </div>
      <Alert title={title} variant="error">{description}</Alert>
    </AdminPage>
  )
}
