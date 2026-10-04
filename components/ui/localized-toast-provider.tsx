"use client"

import type { ReactNode } from "react"

import { useLocale } from "@/components/i18n/locale-provider"
import { ToastProvider } from "./toast"

export function LocalizedToastProvider({ children }: Readonly<{ children: ReactNode }>) {
  const locale = useLocale()

  return (
    <ToastProvider
      closeLabel={locale === "ko" ? "알림 닫기" : "Dismiss notification"}
      viewportLabel={locale === "ko" ? "알림" : "Notifications"}
    >
      {children}
    </ToastProvider>
  )
}
