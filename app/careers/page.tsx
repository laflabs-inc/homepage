import type { Metadata } from "next"
import { cookies, headers } from "next/headers"

import { CareersPage } from "@/components/careers/careers-page"
import { readCareersContent } from "@/lib/careers"
import { buildCareersMetadata } from "@/lib/careers-metadata"
import { LOCALE_COOKIE, resolveRequestLocale } from "@/lib/i18n"

export async function generateMetadata(): Promise<Metadata> {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()])
  const locale = resolveRequestLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    requestHeaders.get("accept-language"),
  )
  return buildCareersMetadata(locale)
}

export default function CareersRoute() {
  return <CareersPage content={readCareersContent()} />
}
