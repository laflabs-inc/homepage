import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useRouter: () => ({ replace: vi.fn() }),
}))
vi.mock("@/components/analytics/consent-panel.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/search/site-search-overlay.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import HomeExperimentPage from "@/app/home/page"
import { ConsentProvider } from "@/components/analytics/consent-provider"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import { homeExperimentCopy, homeExperimentWork } from "@/lib/home-experiment"

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

function renderPage(locale: "ko" | "en" = "ko") {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ConsentProvider initialState="essential" dnt={false}>
        <HomeExperimentPage />
      </ConsentProvider>
    </LocaleProvider>,
  )
}

describe("evidence-led home experiment", () => {
  it("keeps the experiment inside the shared public shell", () => {
    const { container } = renderPage()

    expect(container.querySelector("header.site-header")).toBeInTheDocument()
    expect(container.querySelector('main[data-home-experiment="true"]')).toBeInTheDocument()
    expect(container.querySelector("footer.site-footer")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "LafLabs" })).toHaveAttribute("href", "#top")
  })

  it("defines intentional Korean and English company copy", () => {
    expect(homeExperimentCopy.ko.hero.titleLines).toEqual([
      "제품을 만들고,",
      "필요한 기반을 직접",
      "구축합니다.",
    ])
    expect(homeExperimentCopy.en.hero.titleLines).toEqual([
      "We build products",
      "and the systems",
      "they need.",
    ])
    expect(homeExperimentCopy.ko.method.items.map((item) => item.mark)).toEqual([
      "ASK",
      "BUILD",
      "RUN",
    ])
  })

  it("keeps public destinations verified and unavailable work non-interactive", () => {
    expect(homeExperimentWork.map(({ id, href }) => ({ id, href }))).toEqual([
      { id: "laf-id", href: undefined },
      { id: "lafetch", href: "https://github.com/laflabs-inc/lafetch" },
      { id: "lafwall", href: undefined },
    ])
    expect(homeExperimentWork.every((item) => !item.artifact.source.startsWith("/work/"))).toBe(true)
  })
})
