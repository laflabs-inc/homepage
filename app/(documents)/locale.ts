import { cookies } from "next/headers"

import { defaultLocale, LOCALE_COOKIE, pickLocale, type Locale } from "@/lib/i18n"

export async function resolveDocumentPageLocale(
  searchParams: Promise<{ locale?: string }>,
): Promise<Locale> {
  const [query, cookieStore] = await Promise.all([searchParams, cookies()])
  return pickLocale(query.locale) ?? pickLocale(cookieStore.get(LOCALE_COOKIE)?.value) ?? defaultLocale
}
