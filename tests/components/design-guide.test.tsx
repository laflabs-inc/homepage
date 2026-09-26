import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/app/(documents)/locale", () => ({
  resolveDocumentPageLocale: async (searchParams: Promise<{ locale?: string }>) =>
    (await searchParams).locale === "en" ? "en" : "ko",
}))

import DesignPage from "@/app/(documents)/design/page"

describe("Design system overview", () => {
  it("introduces the Korean reference manual and its primary destinations", async () => {
    render(await DesignPage({ searchParams: Promise.resolve({}) }))

    expect(
      screen.getByRole("heading", { level: 1, name: "LafLabs 디자인 시스템" }),
    ).toBeInTheDocument()
    expect(screen.getByText("2026.9.6")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "기초 원칙" })).toHaveAttribute(
      "href",
      "/design/foundations",
    )
    expect(screen.getByRole("link", { name: "컴포넌트" })).toHaveAttribute(
      "href",
      "/design/components",
    )
    expect(screen.getByRole("link", { name: "AI에서 사용하기" })).toHaveAttribute(
      "href",
      "/design/ai",
    )
    expect(screen.getByRole("navigation", { name: "디자인 시스템" })).toBeInTheDocument()
  })

  it("keeps the English overview on the same destination structure", async () => {
    render(await DesignPage({ searchParams: Promise.resolve({ locale: "en" }) }))

    expect(
      screen.getByRole("heading", { level: 1, name: "LafLabs Design System" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Documentation" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Foundations" })).toHaveAttribute(
      "href",
      "/design/foundations?locale=en",
    )
    expect(screen.getByRole("link", { name: "Components" })).toHaveAttribute(
      "href",
      "/design/components?locale=en",
    )
    expect(screen.getByRole("link", { name: "Use with AI" })).toHaveAttribute(
      "href",
      "/design/ai?locale=en",
    )
    expect(screen.getByRole("navigation", { name: "Design system" })).toBeInTheDocument()
  })
})
