import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

vi.mock("@/app/(documents)/locale", () => ({
  resolveDocumentPageLocale: async (searchParams: Promise<{ locale?: string }>) =>
    (await searchParams).locale === "en" ? "en" : "ko",
}))

vi.mock("@/components/analytics/consent-provider", () => ({
  useAnalytics: () => ({ track: vi.fn() }),
}))

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}))

import AssetsPage from "@/app/(documents)/design/assets/page"
import AiPage from "@/app/(documents)/design/ai/page"
import ComponentsPage, {
  generateMetadata as generateComponentsMetadata,
} from "@/app/(documents)/design/components/page"
import ComponentDetailPage, {
  generateMetadata as generateComponentMetadata,
  generateStaticParams,
} from "@/app/(documents)/design/components/[slug]/page"
import FoundationsPage from "@/app/(documents)/design/foundations/page"
import { designCatalog } from "@/lib/design-system/catalog"

afterEach(() => vi.restoreAllMocks())

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

describe("Design system component pages", () => {
  it("renders every catalog component once as a Korean editorial row with a detail link", async () => {
    render(await ComponentsPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("heading", { level: 1, name: "컴포넌트" })).toBeInTheDocument()

    for (const component of designCatalog.components) {
      expect(screen.getAllByRole("heading", { level: 2, name: component.name })).toHaveLength(1)
      expect(
        screen.getByRole("link", { name: `${component.name} 자세히 보기` }),
      ).toHaveAttribute("href", `/design/components/${component.id}`)
    }
    expect(screen.getByRole("button", { name: "검색 미리보기" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /컴포넌트 보기/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "TypeScript 코드 복사" })).toBeInTheDocument()
  })

  it("renders the equivalent English component index and preserves locale links", async () => {
    render(await ComponentsPage({ searchParams: Promise.resolve({ locale: "en" }) }))

    expect(screen.getByRole("heading", { level: 1, name: "Components" })).toBeInTheDocument()
    expect(screen.getByText(designCatalog.components[0].summary.en)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Logo details" })).toHaveAttribute(
      "href",
      "/design/components/logo?locale=en",
    )
  })

  it("renders the real segmented toggle with complete English guidance", async () => {
    render(await ComponentDetailPage({
      params: Promise.resolve({ slug: "segmented-toggle" }),
      searchParams: Promise.resolve({ locale: "en" }),
    }))

    expect(screen.getByRole("heading", { level: 1, name: "Segmented Toggle" })).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Language preview" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute(
      "href",
      "https://github.com/laflabs-inc/homepage/blob/main/components/ui/segmented-toggle.tsx",
    )
    expect(screen.getByRole("heading", { level: 2, name: "When to use" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Accessibility" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "API" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Usage" })).toBeInTheDocument()
  })

  it("renders localized Korean detail guidance", async () => {
    render(await ComponentDetailPage({
      params: Promise.resolve({ slug: "segmented-toggle" }),
      searchParams: Promise.resolve({}),
    }))

    expect(screen.getByRole("group", { name: "언어 미리보기" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "사용할 때" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "접근성" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "사용 예시" })).toBeInTheDocument()
    expect(screen.getByText(designCatalog.components[2].whenNotToUse.ko)).toBeInTheDocument()
  })

  it("generates catalog params and localized route metadata", async () => {
    expect(generateStaticParams()).toEqual(
      designCatalog.components.map(({ id }) => ({ slug: id })),
    )
    await expect(generateComponentsMetadata({
      searchParams: Promise.resolve({ locale: "en" }),
    })).resolves.toMatchObject({
      title: `Components | ${designCatalog.meta.name}`,
      description: "Supported UI states, APIs, and usage guidance.",
    })
    await expect(generateComponentMetadata({
      params: Promise.resolve({ slug: "action" }),
      searchParams: Promise.resolve({}),
    })).resolves.toMatchObject({
      title: `Action | ${designCatalog.meta.name}`,
      description: designCatalog.components[1].summary.ko,
    })
  })

  it("uses the not-found surface for an unknown component slug", async () => {
    await expect(ComponentDetailPage({
      params: Promise.resolve({ slug: "missing-component" }),
      searchParams: Promise.resolve({}),
    })).rejects.toThrow("NEXT_NOT_FOUND")

    expect(notFoundMock).toHaveBeenCalledOnce()
  })
})

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
    expect(methodMarkSample?.getAttribute("style")).toContain("letter-spacing: -0.04em")
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

    const heroFieldMark = screen.getByText("typography.hero-field-mark").closest("figure")
    expect(heroFieldMark).not.toBeNull()
    expect(heroFieldMark?.querySelector("figcaption + p")?.getAttribute("style")).toContain(
      "letter-spacing: -0.04em",
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

describe("Design system AI page", () => {
  const installCommand = `mkdir -p "$CODEX_HOME/skills"
curl -fsSL https://laflabs.co/design/skill.zip -o /tmp/laflabs-web-design.zip
unzip -q /tmp/laflabs-web-design.zip -d "$CODEX_HOME/skills"`
  const resourceUrls = [
    "https://laflabs.co/design/guide.md",
    "https://laflabs.co/design/tokens.json",
    "https://laflabs.co/design/skill/SKILL.md",
    "https://laflabs.co/design/skill/references/foundations.md",
    "https://laflabs.co/design/skill/references/components.md",
    "https://laflabs.co/design/skill/references/patterns.md",
    "https://laflabs.co/design/skill/references/tokens.json",
    "https://laflabs.co/design/skill.zip",
  ]
  const koreanProviderInstruction = "LafLabs 공개 웹 작업에는 https://laflabs.co/design/guide.md와 https://laflabs.co/design/tokens.json을 기준으로 사용하세요. 관련된 경우에만 연결된 Skill 참고 문서를 읽고, 제품 주장·에셋·컴포넌트를 임의로 만들지 마세요."
  const englishProviderInstruction = "Use https://laflabs.co/design/guide.md and https://laflabs.co/design/tokens.json as the source of truth for LafLabs public web work. Read linked Skill references only when relevant, and do not invent product claims, assets, or components."

  function expectPoliteClipboardStatus(message: string): void {
    const status = screen.getByText(message).closest('[role="status"]')
    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status).toHaveAttribute("aria-atomic", "true")
  }

  it("renders Korean provider-neutral resources and a copyable Skill installation command", async () => {
    render(await AiPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("heading", { level: 1, name: "AI에서 사용하기" })).toBeInTheDocument()
    expect(
      screen.getByText((_, element) =>
        element?.tagName === "CODE" && element.textContent === installCommand,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bash 설치 명령 복사" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "AI 작업 안내문 복사" })).toBeInTheDocument()
    resourceUrls.forEach((url) => {
      expect(screen.getByRole("link", { name: url })).toHaveAttribute("href", url)
    })
    expect(screen.getByRole("link", { name: "Skill 다운로드" })).toHaveAttribute(
      "href",
      "/design/skill.zip",
    )
    expect(
      screen.getByText((_, element) =>
        element?.tagName === "CODE" && element.textContent === koreanProviderInstruction,
      ),
    ).toBeInTheDocument()

    const navigation = screen.getByRole("navigation", { name: "디자인 시스템" })
    expect(within(navigation).getByRole("link", { name: /AI에서 사용하기/ })).toHaveAttribute(
      "aria-current",
      "page",
    )
  })

  it("renders equivalent English resources and preserves the locale in design navigation", async () => {
    render(await AiPage({ searchParams: Promise.resolve({ locale: "en" }) }))

    expect(screen.getByRole("heading", { level: 1, name: "Use with AI" })).toBeInTheDocument()
    expect(
      screen.getByText((_, element) =>
        element?.tagName === "CODE" && element.textContent === installCommand,
      ),
    ).toBeInTheDocument()
    resourceUrls.forEach((url) => {
      expect(screen.getByRole("link", { name: url })).toHaveAttribute("href", url)
    })
    expect(screen.getByRole("button", { name: "Copy Bash installation command" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Copy AI work instruction" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Download Skill" })).toHaveAttribute(
      "href",
      "/design/skill.zip",
    )

    const navigation = screen.getByRole("navigation", { name: "Design system" })
    expect(within(navigation).getByRole("link", { name: /Use with AI/ })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(within(navigation).getByRole("link", { name: /Overview/ })).toHaveAttribute(
      "href",
      "/design?locale=en",
    )
    expect(
      screen.getByText((_, element) =>
        element?.tagName === "CODE" && element.textContent === englishProviderInstruction,
      ),
    ).toBeInTheDocument()
  })

  it.each([
    [
      "Korean",
      {},
      "Bash 설치 명령 복사",
      "복사됨",
      "다시 시도",
      "Bash 설치 명령을 클립보드에 복사했습니다.",
      "Bash 설치 명령을 복사하지 못했습니다. 다시 시도해 주세요.",
    ],
    [
      "English",
      { locale: "en" },
      "Copy Bash installation command",
      "COPIED",
      "RETRY",
      "Bash installation command copied to clipboard.",
      "Could not copy the Bash installation command. Try again.",
    ],
  ])("announces localized %s clipboard success and failure", async (
    _localeName,
    searchParams,
    buttonName,
    copiedLabel,
    retryLabel,
    copiedStatus,
    retryStatus,
  ) => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined)
    render(await AiPage({ searchParams: Promise.resolve(searchParams) }))
    const copy = screen.getByRole("button", { name: buttonName })

    await user.click(copy)
    expect(copy).toHaveTextContent(copiedLabel)
    expectPoliteClipboardStatus(copiedStatus)

    writeText.mockRejectedValueOnce(new Error("clipboard access denied"))
    await user.click(copy)
    expect(copy).toHaveTextContent(retryLabel)
    expectPoliteClipboardStatus(retryStatus)
  })
})
