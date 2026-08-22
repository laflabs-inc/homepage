import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { cookies, headers } from "next/headers"

import { LocaleProvider } from "@/components/i18n/locale-provider"
import { siteUrl } from "@/lib/content"
import { defaultLocale, LOCALE_COOKIE, pickLocale, type Locale } from "@/lib/i18n"
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
    "LafLabs는 신원, 결제, 클라우드 인프라를 하나의 경험으로 잇는 소프트웨어 개발사입니다. Laf ID, Laf Pay, LafDock을 만듭니다.",
  keywords: ["LafLabs", "Laf ID", "Laf Pay", "LafDock", "identity", "payments", "cloud infrastructure"],
  authors: [{ name: "LafLabs Inc.", url: siteUrl }],
  openGraph: {
    type: "website",
    siteName: "LafLabs",
    locale: "ko_KR",
    alternateLocale: ["en_US"],
    title: "LafLabs — Build quietly. Work reliably.",
    description:
      "재미있는 것을 만드는 소프트웨어 개발사. 신원, 결제, 클라우드 인프라를 하나의 경험으로 잇습니다.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "LafLabs — Build quietly. Work reliably.",
    description: "A software company that builds fun things. Identity, payments, and cloud infrastructure as one experience.",
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f8fafc",
}

async function resolveLocale(): Promise<Locale> {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()])

  const saved = pickLocale(cookieStore.get(LOCALE_COOKIE)?.value)
  if (saved) return saved

  for (const tag of (requestHeaders.get("accept-language") ?? "").split(",")) {
    const candidate = pickLocale(tag.split(";")[0].trim())
    if (candidate) return candidate
  }
  return defaultLocale
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = await resolveLocale()

  return (
    <html lang={initialLocale}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
      </body>
    </html>
  )
}
