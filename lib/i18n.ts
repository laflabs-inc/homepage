export const locales = ["ko", "en"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "ko"

export const LOCALE_COOKIE = "laf_locale"

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale)
}

/** Accepts a raw cookie value or an Accept-Language tag ("ko-KR", "en-US"). */
export function pickLocale(value: string | null | undefined): Locale | undefined {
  if (!value) return undefined
  const tag = value.toLowerCase().split("-")[0]
  return isLocale(tag) ? tag : undefined
}
