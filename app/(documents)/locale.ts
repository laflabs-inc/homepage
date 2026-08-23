import { cookies, headers } from "next/headers"

import { LOCALE_COOKIE, pickLocale, resolveRequestLocale, type Locale } from "@/lib/i18n"

export async function resolveDocumentPageLocale(
  searchParams: Promise<{ locale?: string }>,
): Promise<Locale> {
  const [query, cookieStore, requestHeaders] = await Promise.all([searchParams, cookies(), headers()])
  return pickLocale(query.locale) ?? resolveRequestLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    requestHeaders.get("accept-language"),
  )
}
