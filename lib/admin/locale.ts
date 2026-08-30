import { cookies, headers } from "next/headers"

import { LOCALE_COOKIE, resolveRequestLocale, type Locale } from "@/lib/i18n"

/** Resolves the Admin shell locale through the same request preference as the public site. */
export async function getAdminLocale(): Promise<Locale> {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()])

  return resolveRequestLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    requestHeaders.get("accept-language"),
  )
}
