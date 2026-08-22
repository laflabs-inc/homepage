import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "font-variable" }),
}))

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => ({ get: () => null }),
}))

vi.mock("@/app/globals.css", () => ({}))

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => <i data-vercel-analytics="enabled" />,
}))

vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <i data-vercel-speed-insights="enabled" />,
}))

vi.mock("@/components/analytics/consent-provider", () => ({
  ConsentProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/components/i18n/locale-provider", () => ({
  LocaleProvider: ({ children }: { children: React.ReactNode }) => children,
}))

import RootLayout, { metadata } from "@/app/layout"

describe("RootLayout", () => {
  it("loads Vercel Web Analytics and Speed Insights for every route", async () => {
    const layout = await RootLayout({ children: <main>Homepage</main> })
    const html = renderToStaticMarkup(layout)

    expect(html).toContain('data-vercel-analytics="enabled"')
    expect(html).toContain('data-vercel-speed-insights="enabled"')
  })

  it("uses the official LafLabs mark as the browser icon", () => {
    expect(metadata.icons).toEqual({
      icon: [{ url: "/laflabs-logo.png", type: "image/png", sizes: "460x460" }],
      shortcut: ["/laflabs-logo.png"],
      apple: [{ url: "/laflabs-logo.png", type: "image/png", sizes: "460x460" }],
    })
  })
})
