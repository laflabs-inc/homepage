import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/app/(documents)/locale", () => ({
  resolveDocumentPageLocale: async () => "ko",
}))
vi.mock("@/lib/documents/cache", () => ({
  listPublishedDocuments: async () => [],
}))
vi.mock("@/components/content/content.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/content/design-guide.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import DesignPage from "@/app/(documents)/design/page"

describe("Design guide", () => {
  it("presents the brand system and downloadable official asset without document data", async () => {
    render(await DesignPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("heading", { level: 1, name: "디자인 가이드" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "로고" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "컬러" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "타이포그래피" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "인터페이스 원칙" })).toBeInTheDocument()
    expect(screen.getByText("#2563EB")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "PNG 다운로드" })).toHaveAttribute(
      "href",
      "/laflabs-logo.png",
    )
    expect(screen.getByRole("link", { name: "PNG 다운로드" })).toHaveAttribute("download")
  })
})
