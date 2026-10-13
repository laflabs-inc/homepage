"use client"

import { useEffect } from "react"

import { AdminRouteError } from "@/components/admin/admin-route-state"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = adminCopy[useLocale()].routeState

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <AdminRouteError
      description={t.errorDescription}
      onRetry={reset}
      retryLabel={t.retry}
      title={t.errorHeading}
    />
  )
}
