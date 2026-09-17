import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/app/(documents)/locale", () => ({
  resolveDocumentPageLocale: async (searchParams: Promise<{ locale?: string }>) =>
    (await searchParams).locale === "en" ? "en" : "ko",
}))

import AssetsPage from "@/app/(documents)/design/assets/page"
import FoundationsPage from "@/app/(documents)/design/foundations/page"

const koreanFoundationHeadings = [
  "브랜드 아이덴티티",
  "컬러",
  "타이포그래피",
  "간격과 레이아웃",
  "형태",
  "아이콘",
  "모션",
  "접근성",
  "문장과 말투",
  "사실과 주장",
]

const englishFoundationHeadings = [
  "Brand identity",
  "Color",
  "Typography",
  "Spacing and layout",
  "Shape",
  "Iconography",
  "Motion",
  "Accessibility",
  "Voice",
  "Factual claims",
]

const trustedAssetPaths = [
  "/laflabs-logo.png",
  "/laf-system-loop-poster.png",
  "/laf-system-loop.webm",
  "/laf-system-loop.mp4",
]

describe("Design system foundations page", () => {
  it("renders every Korean foundation and current semantic token values", async () => {
    render(await FoundationsPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("heading", { level: 1, name: "기초 원칙" })).toBeInTheDocument()
    koreanFoundationHeadings.forEach((heading) => {
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument()
    })
    expect(screen.getByText("#2563EB")).toBeInTheDocument()
    expect(screen.getByText("0px")).toBeInTheDocument()

    const navigation = screen.getByRole("navigation", { name: "디자인 시스템" })
    expect(within(navigation).getByRole("link", { name: /기초 원칙/ })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(within(navigation).getByRole("link", { name: /에셋/ })).toHaveAttribute(
      "href",
      "/design/assets",
    )
  })

  it("renders the same foundation inventory in English and preserves the locale", async () => {
    render(await FoundationsPage({ searchParams: Promise.resolve({ locale: "en" }) }))

    expect(screen.getByRole("heading", { level: 1, name: "Foundations" })).toBeInTheDocument()
    englishFoundationHeadings.forEach((heading) => {
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument()
    })

    const navigation = screen.getByRole("navigation", { name: "Design system" })
    expect(within(navigation).getByRole("link", { name: /Foundations/ })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(within(navigation).getByRole("link", { name: /Assets/ })).toHaveAttribute(
      "href",
      "/design/assets?locale=en",
    )
  })

  it("keeps the motion sample static until the user changes its selection", async () => {
    const user = userEvent.setup()

    render(await FoundationsPage({ searchParams: Promise.resolve({ locale: "en" }) }))

    const sample = screen.getByRole("group", { name: "Motion" })
    expect(sample).toHaveAttribute("data-active-index", "0")
    expect(within(sample).getByRole("button", { name: "A" })).toHaveAttribute("aria-pressed", "true")
    expect(within(sample).getByRole("button", { name: "B" })).toHaveAttribute("aria-pressed", "false")

    await user.click(within(sample).getByRole("button", { name: "B" }))

    expect(sample).toHaveAttribute("data-active-index", "1")
    expect(within(sample).getByRole("button", { name: "B" })).toHaveAttribute("aria-pressed", "true")
  })

  it("applies catalog typography specimen metrics", async () => {
    render(await FoundationsPage({ searchParams: Promise.resolve({ locale: "en" }) }))

    const methodMark = screen.getByText("typography.method-mark").closest("figure")
    expect(methodMark).not.toBeNull()
    const methodMarkSample = methodMark?.querySelector("figcaption + p")
    expect(methodMarkSample).not.toBeNull()
    expect(methodMarkSample?.getAttribute("style")).toContain("font-weight: 850")
    expect(methodMarkSample?.getAttribute("style")).toContain("line-height: 0.75")
    expect(methodMarkSample?.getAttribute("style")).toContain("letter-spacing: -0.08em")
    expect(methodMarkSample).toHaveAttribute(
      "style",
      expect.stringContaining("font-size: clamp(88px, 10.5vw, 154px)"),
    )

    const monoLabel = screen.getByText("typography.mono-label").closest("figure")
    expect(monoLabel).not.toBeNull()
    const monoLabelSample = monoLabel?.querySelector("figcaption + p")
    expect(monoLabelSample).not.toBeNull()
    expect(monoLabelSample?.getAttribute("style")).toContain("font-family: var(--font-geist-mono), monospace")
    expect(monoLabelSample).toHaveAttribute(
      "style",
      expect.stringContaining("font-size: clamp(10px, 0.8vw, 11px)"),
    )
  })

  it("uses the approved Paper surface for new layout, shape, and asset specimens", () => {
    const stylesheet = readFileSync(
      join(process.cwd(), "components/design-system/design-system.module.css"),
      "utf8",
    )

    for (const selector of ["layoutStage", "shapeSpecimen", "assetPreview"]) {
      expect(stylesheet).toMatch(
        new RegExp(`\\.${selector}\\s*\\{[^}]*background:\\s*var\\(--paper\\);`, "s"),
      )
    }
  })
})

describe("Design system assets page", () => {
  it("renders Korean asset guidance with trusted direct downloads", async () => {
    render(await AssetsPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("heading", { level: 1, name: "에셋" })).toBeInTheDocument()
    const navigation = screen.getByRole("navigation", { name: "디자인 시스템" })
    expect(within(navigation).getByRole("link", { name: /에셋/ })).toHaveAttribute(
      "aria-current",
      "page",
    )

    const downloads = document.querySelectorAll<HTMLAnchorElement>("a[download]")
    expect(Array.from(downloads, (link) => link.getAttribute("href"))).toEqual(trustedAssetPaths)
    downloads.forEach((link) => {
      expect(link).toHaveAttribute("download")
      expect(link.getAttribute("href")).toMatch(/^\/(?!\/)/)
    })
    expect(screen.getByText("460 × 460 px")).toBeInTheDocument()
    expect(screen.getByText("LafLabs 로고가 필요한 공개 화면에서 원본 비율로 사용합니다.")).toBeInTheDocument()
  })

  it("renders English asset guidance and keeps English navigation links", async () => {
    render(await AssetsPage({ searchParams: Promise.resolve({ locale: "en" }) }))

    expect(screen.getByRole("heading", { level: 1, name: "Assets" })).toBeInTheDocument()
    expect(
      screen.getByText(
        "Use at its original proportions wherever the LafLabs logo is required on a public surface.",
      ),
    ).toBeInTheDocument()

    const navigation = screen.getByRole("navigation", { name: "Design system" })
    expect(within(navigation).getByRole("link", { name: /Assets/ })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(within(navigation).getByRole("link", { name: /Overview/ })).toHaveAttribute(
      "href",
      "/design?locale=en",
    )
  })
})
