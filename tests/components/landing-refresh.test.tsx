import { render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/" }))
vi.mock("@/components/analytics/consent-panel.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { ConsentPanel } from "@/components/analytics/consent-panel"
import { ConsentProvider } from "@/components/analytics/consent-provider"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import { Landing } from "@/components/landing"
import { SiteFooter } from "@/components/layout/site-footer"

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

describe("homepage refresh", () => {
  it("presents the humanized Korean company and engineering story", () => {
    render(
      <LocaleProvider initialLocale="ko">
        <Landing />
      </LocaleProvider>,
    )

    expect(screen.getByRole("heading", { name: "제품에 필요한 다음을 만듭니다." })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "제품에서 시작해 시스템으로 남깁니다." })).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "직접 쓰고 검증한 코드를 공개합니다." }),
    ).toBeVisible()
    expect(screen.getByRole("heading", { name: "기반 기술" })).toBeVisible()
    expect(screen.getByRole("heading", { name: "운영" })).toBeVisible()
  })

  it("keeps document and contact access in the footer without a duplicate email feature", () => {
    render(
      <LocaleProvider initialLocale="ko">
        <ConsentProvider initialState="essential" dnt={false}>
          <SiteFooter />
        </ConsentProvider>
      </LocaleProvider>,
    )

    const footer = screen.getByRole("contentinfo")
    expect(within(footer).getByRole("link", { name: "문의하기" })).toHaveAttribute(
      "href",
      "mailto:contact@laflabs.co",
    )
    expect(within(footer).getByRole("link", { name: "공지사항" })).toHaveAttribute("href", "/notices")
    expect(within(footer).getByRole("link", { name: "공시" })).toHaveAttribute("href", "/disclosures")
    expect(within(footer).getByRole("link", { name: "디자인 가이드" })).toHaveAttribute("href", "/design")
    expect(within(footer).queryByText("새로운 이야기를 시작하세요")).not.toBeInTheDocument()
  })

  it("uses concise Korean consent copy while preserving both choices", () => {
    render(
      <ConsentPanel
        locale="ko"
        open
        pending={false}
        error={null}
        onChoose={vi.fn()}
        onClose={null}
      />,
    )

    expect(screen.getByText("사이트를 더 낫게 만들기 위해 익명 사용 통계를 수집합니다. 동의하기 전에는 분석 정보를 보내지 않습니다.")).toBeVisible()
    expect(screen.getByRole("button", { name: "필수만 사용" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "분석 허용" })).toBeEnabled()
  })
})
