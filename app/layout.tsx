import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { cookies, headers } from "next/headers"

import { ConsentProvider } from "@/components/analytics/consent-provider"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import {
  CONSENT_COOKIE,
  VISITOR_COOKIE,
  parseConsentCookie,
  resolveInitialConsentState,
} from "@/lib/analytics/consent"
import type { ConsentState } from "@/lib/analytics/types"
import { siteUrl } from "@/lib/content"
import { LOCALE_COOKIE, resolveRequestLocale, type Locale } from "@/lib/i18n"
import { getAnalyticsEnv } from "@/lib/env"
import "./globals.css"

const geistSans = localFont({
  src: "../public/fonts/geist-sans-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
})

const geistMono = localFont({
  src: "../public/fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LafLabs — Build quietly. Work reliably.",
    template: "%s · LafLabs",
  },
  description:
    "LafLabs는 제품을 기획하고 개발하며, 운영에 필요한 기반 기술까지 직접 구축하는 소프트웨어 개발사입니다.",
  keywords: ["LafLabs", "software company", "product development", "open source", "TypeScript"],
  authors: [{ name: "LafLabs Inc.", url: siteUrl }],
  openGraph: {
    type: "website",
    siteName: "LafLabs",
    locale: "ko_KR",
    alternateLocale: ["en_US"],
    title: "LafLabs — Build quietly. Work reliably.",
    description:
      "제품을 만들고, 운영에 필요한 기반 기술까지 직접 구축하는 소프트웨어 개발사입니다.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "LafLabs — Build quietly. Work reliably.",
    description: "A software company that builds products and the technology required to operate them.",
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/laflabs-logo.png", type: "image/png", sizes: "460x460" }],
    shortcut: ["/laflabs-logo.png"],
    apple: [{ url: "/laflabs-logo.png", type: "image/png", sizes: "460x460" }],
  },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f8fafc",
}

function resolveLocale(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  requestHeaders: Awaited<ReturnType<typeof headers>>,
): Locale {
  return resolveRequestLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    requestHeaders.get("accept-language"),
  )
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()])
  const initialLocale = resolveLocale(cookieStore, requestHeaders)
  const dnt = requestHeaders.get("dnt") === "1"
  const consentCookie = cookieStore.get(CONSENT_COOKIE)?.value
  const savedConsent = parseConsentCookie(consentCookie)?.choice
  let initialState: ConsentState = savedConsent ?? "unknown"
  if (savedConsent === "analytics") {
    try {
      const environment = getAnalyticsEnv()
      initialState = resolveInitialConsentState({
        consentCookie,
        visitorToken: cookieStore.get(VISITOR_COOKIE)?.value,
        dnt,
        currentSecret: environment.ANALYTICS_HASH_SECRET,
        previousSecret: environment.ANALYTICS_HASH_SECRET_PREVIOUS,
      })
    } catch {
      initialState = "unknown"
    }
  }

  return (
    <html lang={initialLocale}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <LocaleProvider initialLocale={initialLocale}>
          <ConsentProvider initialState={initialState} dnt={dnt}>
            {children}
          </ConsentProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
