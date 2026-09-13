"use client"

import { useRouter } from "next/navigation"

import { useLocale, useSetLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"
import { SegmentedToggle } from "@/components/ui/segmented-toggle"

export function AdminLanguageToggle() {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const router = useRouter()
  const t = adminCopy[locale].shell

  return (
    <SegmentedToggle
      label={t.languageLabel}
      value={locale}
      options={[
        { value: "ko", label: "KO", content: "KO" },
        { value: "en", label: "EN", content: "EN" },
      ]}
      onValueChange={(value) => {
        setLocale(value)
        router.refresh()
      }}
    />
  )
}
