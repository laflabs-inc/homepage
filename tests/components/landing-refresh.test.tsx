import { render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/" }))
vi.mock("@/components/analytics/consent-panel.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/sections/build-loop.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/sections/latest-signals.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/landing.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/sections/selected-work.module.css", () => ({
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
  vi.stubGlobal("fetch", vi.fn(async () => (
    new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 })
  )))
})

afterEach(() => vi.unstubAllGlobals())

describe("homepage refresh", () => {
  it("introduces the company and its work method before any product", () => {
    const { container } = render(
      <LocaleProvider initialLocale="ko">
        <ConsentProvider initialState="essential" dnt={false}>
          <Landing />
        </ConsentProvider>
      </LocaleProvider>,
    )

    expect(screen.getByRole("heading", {
      name: "제품을 만들고, 필요한 기반을 직접 구축합니다.",
    })).toBeVisible()
    expect(screen.getByText("LAF / 001")).toBeVisible()
    expect(screen.getByRole("heading", {
      name: "제품과 그 아래의 기술을 함께 만듭니다.",
    })).toBeVisible()
    expect(screen.getByText("ASK")).toBeVisible()
    expect(screen.getByText("BUILD")).toBeVisible()
    expect(screen.getByText("RUN")).toBeVisible()
    expect(screen.getByRole("heading", { name: "실제 문제부터" })).toBeVisible()
    expect(screen.getByRole("heading", { name: "필요한 만큼 단순하게" })).toBeVisible()
    expect(screen.getByRole("heading", { name: "직접 운영하며 확인" })).toBeVisible()

    const company = container.querySelector<HTMLElement>("section#company")
    const method = container.querySelector<HTMLElement>("section#work-method")
    const work = container.querySelector<HTMLElement>("section#work")
    expect(company).toBeInTheDocument()
    expect(method).toBeInTheDocument()
    expect(work).toBeInTheDocument()
    expect(company!.compareDocumentPosition(method!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(method!.compareDocumentPosition(work!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(work).toHaveTextContent("Laf ID")
    expect(company).not.toHaveTextContent("Laf ID")
    expect(method).not.toHaveTextContent("Laf ID")
  })

  it("keeps work factual, hides undisclosed repositories, and removes recruiting copy", () => {
    const { container } = render(
      <LocaleProvider initialLocale="ko">
        <ConsentProvider initialState="essential" dnt={false}>
          <Landing />
        </ConsentProvider>
      </LocaleProvider>,
    )

    expect(screen.getByRole("heading", {
      name: "제품을 만들고, 필요한 기반을 직접 구축합니다.",
    })).toBeVisible()
    expect(screen.queryByRole("heading", { name: "코드가 결과를 설명합니다." })).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent("채용")

    const openSource = container.querySelector<HTMLElement>("section#open-source")!
    expect(within(openSource).getByRole("link", { name: /lafetch/ })).toHaveAttribute(
      "href",
      "https://github.com/laflabs-inc/lafetch",
    )
    expect(within(openSource).getAllByText("미공개 프로젝트")).toHaveLength(2)
    expect(openSource).not.toHaveTextContent("lafwall")
    expect(openSource).not.toHaveTextContent("lafinvest")
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
