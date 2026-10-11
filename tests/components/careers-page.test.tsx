import { render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
  usePathname: () => "/careers",
  useRouter: () => ({ replace: vi.fn() }),
}))
vi.mock("@/components/careers/careers.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/search/site-search-overlay.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { ConsentProvider } from "@/components/analytics/consent-provider"
import { CareersPage, CareersRoleList } from "@/components/careers/careers-page"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import { readCareersContent, type CareerRole } from "@/lib/careers"

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

afterEach(() => vi.unstubAllGlobals())

function renderCareers(locale: "ko" | "en" = "ko") {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ConsentProvider initialState="essential" dnt={false}>
        <CareersPage content={readCareersContent()} />
      </ConsentProvider>
    </LocaleProvider>,
  )
}

describe("CareersPage", () => {
  it("presents the Korean company narrative before the hiring state", () => {
    const { container } = renderCareers()

    expect(screen.getByRole("heading", { level: 1, name: "함께 오래 쓸 시스템을 만듭니다." })).toBeVisible()
    expect(screen.getByRole("heading", { name: "우리가 다루는 문제" })).toBeVisible()
    expect(screen.getByRole("heading", { name: "함께 일하는 기준" })).toBeVisible()
    expect(screen.getByRole("heading", { name: "대화를 시작하는 과정" })).toBeVisible()
    expect(screen.getByText("현재 공개된 역할은 없습니다.")).toBeVisible()
    expect(screen.getByRole("link", { name: "먼저 이야기하기" })).toHaveAttribute("href", "#open-application")
    expect(screen.getByRole("link", { name: "이메일 보내기" })).toHaveAttribute(
      "href",
      "mailto:contact@laflabs.co?subject=LafLabs%20open%20application",
    )
    expect(container.querySelector("header.site-header")).toBeInTheDocument()
    expect(container.querySelector("footer.site-footer")).toBeInTheDocument()
  })

  it("switches all authored careers copy to English", () => {
    renderCareers("en")

    expect(screen.getByRole("heading", { level: 1, name: "Build systems that stay useful." })).toBeVisible()
    expect(screen.getByRole("heading", { name: "Problems we take on" })).toBeVisible()
    expect(screen.getByText("There are no public openings right now.")).toBeVisible()
    expect(screen.getByRole("link", { name: "Start a conversation" })).toHaveAttribute("href", "#open-application")
  })

  it("keeps the complete work field readable without motion", () => {
    renderCareers()

    const field = screen.getByLabelText("LafLabs가 일을 확장하는 방식")
    expect(field).toHaveTextContent("BUILD")
    expect(field).toHaveTextContent("OPERATE")
    expect(field).toHaveTextContent("SHARE")
  })
})

describe("CareersRoleList", () => {
  it("renders future roles through the same typed boundary", () => {
    const roles: readonly CareerRole[] = [{
      id: "platform-engineer",
      slug: "platform-engineer",
      title: { ko: "플랫폼 엔지니어", en: "Platform Engineer" },
      summary: { ko: "제품 기반을 함께 만듭니다.", en: "Build shared product foundations." },
      team: { ko: "엔지니어링", en: "Engineering" },
      href: "/careers/platform-engineer",
    }]

    render(
      <LocaleProvider initialLocale="ko">
        <CareersRoleList roles={roles} />
      </LocaleProvider>,
    )

    const role = screen.getByRole("link", { name: /플랫폼 엔지니어/ })
    expect(role).toHaveAttribute("href", "/careers/platform-engineer")
    expect(within(role).getByText("엔지니어링")).toBeVisible()
    expect(within(role).getByText("제품 기반을 함께 만듭니다.")).toBeVisible()
  })
})
