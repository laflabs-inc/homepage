"use client"

import { createContext, useCallback, useContext, useState } from "react"

import { defaultLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n"

const LocaleContext = createContext<Locale>(defaultLocale)
const SetLocaleContext = createContext<(locale: Locale) => void>(() => undefined)

export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  const setLocalePreference = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = next
    setLocale(next)
  }, [])

  return (
    <LocaleContext.Provider value={locale}>
      <SetLocaleContext.Provider value={setLocalePreference}>{children}</SetLocaleContext.Provider>
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function useSetLocale() {
  return useContext(SetLocaleContext)
}
