import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
  usePathname: () => "/careers",
  useRouter: () => ({ replace: vi.fn() }),
}))

import { buildSitemap } from "@/app/sitemap"
import { ConsentProvider } from "@/components/analytics/consent-provider"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import { SiteFooter } from "@/components/layout/site-footer"
import type { PublishedDocumentReader } from "@/lib/documents/cache"
import { buildCareersMetadata } from "@/lib/careers-metadata"
import { searchSite } from "@/lib/search/site-search"

const emptyRepository: PublishedDocumentReader = {
  listPublished: vi.fn().mockResolvedValue([]),
  getPublished: vi.fn(),
}

function renderFooter(locale: "ko" | "en") {
  render(
    <LocaleProvider initialLocale={locale}>
      <ConsentProvider initialState="essential" dnt={false}>
        <SiteFooter homeHref="/" />
      </ConsentProvider>
    </LocaleProvider>,
  )
}

describe("careers discovery", () => {
  it.each([
    ["ko", "채용"],
    ["en", "Careers"],
  ] as const)("adds the localized careers link to the %s Footer", (locale, label) => {
    renderFooter(locale)

    expect(within(screen.getByRole("contentinfo")).getByRole("link", { name: label })).toHaveAttribute(
      "href",
      "/careers",
    )
  })

  it.each([
    ["ko", "채용", "함께 오래 쓸 시스템을 만듭니다."],
    ["en", "hiring", "Build systems that stay useful."],
  ] as const)("returns localized careers search copy in %s", async (locale, query, title) => {
    const result = await searchSite(query, locale, emptyRepository)

    expect(result.results).toContainEqual(expect.objectContaining({
      id: "careers",
      group: "page",
      title,
      href: "/careers",
    }))
  })

  it("includes the canonical careers URL in the static sitemap", async () => {
    const entries = await buildSitemap(emptyRepository)

    expect(entries).toContainEqual(expect.objectContaining({
      url: "https://laflabs.co/careers",
      changeFrequency: "monthly",
    }))
  })

  it("builds localized careers metadata", () => {
    expect(buildCareersMetadata("ko")).toMatchObject({ title: "채용" })
    expect(buildCareersMetadata("en")).toMatchObject({ title: "Careers" })
  })
})
