"use client"

import { useRouter } from "next/navigation"

import { useLocale, useSetLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"
import { locales } from "@/lib/i18n"

import styles from "@/app/admin/admin.module.css"

const languageNames = {
  ko: "한국어",
  en: "English",
} as const

export function AdminLanguageToggle() {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const router = useRouter()
  const t = adminCopy[locale].shell

  return (
    <div className={styles.adminLanguageToggle} role="group" aria-label={t.languageLabel}>
      <span
        className={styles.adminLanguageThumb}
        data-locale={locale}
        data-testid="admin-language-thumb"
        aria-hidden="true"
      />
      {locales.map((value) => {
        const active = value === locale

        return (
          <button
            key={value}
            type="button"
            data-active={active}
            aria-pressed={active}
            onClick={() => {
              if (value !== locale) {
                setLocale(value)
                router.refresh()
              }
            }}
          >
            {languageNames[value]}
          </button>
        )
      })}
    </div>
  )
}
