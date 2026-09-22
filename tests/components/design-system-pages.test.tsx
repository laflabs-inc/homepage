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
import PatternsPage from "@/app/(documents)/design/patterns/page"
import { ComponentDetail } from "@/components/design-system/component-detail"
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
    expect(screen.getByRole("heading", { level: 2, name: "폼" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "선택" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "탐색" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "공개와 접기" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "오버레이" })).toBeInTheDocument()

    for (const component of designCatalog.components) {
      expect(screen.getAllByRole("heading", { level: 3, name: component.name })).toHaveLength(1)
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

  it("uses a shrink-safe intermediate component-row layout beside the shell navigation", () => {
    const stylesheet = readFileSync(
      join(process.cwd(), "components/design-system/design-system.module.css"),
      "utf8",
    )

    expect(stylesheet).toMatch(
      /@media \(max-width: 1020px\)\s*{\s*\.componentRow\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*0\.58fr\) minmax\(0,\s*0\.92fr\);/s,
    )
    expect(stylesheet).toMatch(
      /@media \(max-width: 1020px\)[\s\S]*?\.componentPreview\s*{[^}]*grid-column:\s*1 \/ -1;/,
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
    const segmentedToggle = designCatalog.components.find(({ id }) => id === "segmented-toggle")
    if (!segmentedToggle) throw new Error("Segmented Toggle catalog fixture is missing")
    expect(screen.getByText(segmentedToggle.whenNotToUse.ko)).toBeInTheDocument()
  })

  it("renders every Action variant and state as an inspectable real production control", () => {
    const action = designCatalog.components.find(({ id }) => id === "action")
    if (!action) throw new Error("Action catalog fixture is missing")

    render(<ComponentDetail component={action} locale="en" />)

    const inspections = screen.getByRole("list", { name: "Action state inspections" })
    expect(within(inspections).getAllByRole("listitem")).toHaveLength(6)
    const expectedStates = [
      ["primary", "Inspect the real blue primary button as the highest-priority action."],
      ["secondary", "Inspect the real outlined secondary button as a lower-priority action."],
      ["inverse", "Inspect the real inverse button for a clear boundary and label on Ink."],
      ["hover", "Hover the real button and confirm its color change does not move the layout."],
      ["focus-visible", "Tab to the real button and inspect its two-pixel blue focus outline."],
      ["disabled", "Inspect the real disabled button: it stays named, cannot activate, and uses reduced opacity."],
    ] as const
    for (const [state, guidance] of expectedStates) {
      const preview = within(inspections).getByRole("region", {
        name: `Action ${state} state preview`,
      })
      expect(preview).toBeInTheDocument()
      expect(within(inspections).getByText(guidance)).toBeInTheDocument()
    }
    expect(within(inspections).getByRole("button", { name: "Disabled action" })).toBeDisabled()
  })

  it("derives locale-preserving related component and pattern links from the catalog", () => {
    const action = designCatalog.components.find(({ id }) => id === "action")
    if (!action) throw new Error("Action catalog fixture is missing")

    render(<ComponentDetail component={action} locale="en" />)

    const related = screen.getByRole("region", { name: "Related documentation" })
    expect(within(related).getByRole("link", { name: "Logo" })).toHaveAttribute(
      "href",
      "/design/components/logo?locale=en",
    )
    expect(within(related).getByRole("link", { name: "Text Link" })).toHaveAttribute(
      "href",
      "/design/components/text-link?locale=en",
    )
    expect(within(related).getByRole("link", { name: "Icon Control" })).toHaveAttribute(
      "href",
      "/design/components/icon-control?locale=en",
    )
    expect(within(related).getByRole("link", { name: "Contrast band" })).toHaveAttribute(
      "href",
      "/design/patterns?locale=en#pattern-contrast-band",
    )
    expect(within(related).queryByRole("link", { name: "Action" })).not.toBeInTheDocument()
  })

  it("shows Korean state inspection guidance and related links without changing locale", () => {
    const iconControl = designCatalog.components.find(({ id }) => id === "icon-control")
    if (!iconControl) throw new Error("Icon Control catalog fixture is missing")

    render(<ComponentDetail component={iconControl} locale="ko" />)

    const inspections = screen.getByRole("list", { name: "Icon Control 상태 살펴보기" })
    const expectedGuidance = [
      "실제 34px 컨트롤 안의 아이콘과 접근성 이름을 확인합니다.",
      "실제 컨트롤에 포인터를 올려 Blue 배경과 Paper 아이콘 전환을 확인합니다.",
      "Tab으로 실제 컨트롤에 초점을 옮겨 외부 focus outline을 확인합니다.",
      "실제 비활성 컨트롤이 이름을 유지하고 실행되지 않는지 확인합니다.",
    ]
    for (const guidance of expectedGuidance) {
      expect(within(inspections).getByText(guidance)).toBeInTheDocument()
    }
    expect(within(inspections).getByRole("button", { name: "비활성 아이콘 컨트롤" })).toBeDisabled()

    const related = screen.getByRole("region", { name: "관련 문서" })
    expect(within(related).getByRole("link", { name: "Segmented Toggle" })).toHaveAttribute(
      "href",
      "/design/components/segmented-toggle",
    )
    expect(within(related).getByRole("link", { name: "반응형 쌓기" })).toHaveAttribute(
      "href",
      "/design/patterns#pattern-responsive-collapse",
    )
  })

  it.each([
    ["en", "Candidate"],
    ["ko", "후보"],
  ] as const)("derives the %s maturity label from candidate catalog data", (locale, label) => {
    render(
      <ComponentDetail
        component={{ ...designCatalog.components[1], maturity: "candidate" }}
        locale={locale}
      />,
    )

    expect(screen.getByText(label)).toBeInTheDocument()
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

  it("keeps foundation guidance rules full width while constraining only their text", () => {
    const stylesheet = readFileSync(
      join(process.cwd(), "components/design-system/design-system.module.css"),
      "utf8",
    )

    expect(stylesheet).toMatch(
      /\.guidanceList li\s*\{(?=[^}]*border-bottom:\s*1px solid var\(--line\))(?=[^}]*padding:\s*15px 0)(?![^}]*max-width)[^}]*\}/s,
    )
    expect(stylesheet).toMatch(
      /\.guidanceList li > span\s*\{(?=[^}]*display:\s*block)(?=[^}]*max-width:\s*72ch)[^}]*\}/s,
    )
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

describe("Design system patterns page", () => {
  it("renders every Korean catalog pattern with links to its real related components", async () => {
    render(await PatternsPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole("heading", { level: 1, name: "패턴" })).toBeInTheDocument()

    for (const pattern of designCatalog.patterns) {
      const heading = screen.getByRole("heading", { level: 2, name: pattern.title.ko })
      const section = heading.closest("section")
      expect(section).not.toBeNull()

      for (const componentId of pattern.relatedComponents) {
        const component = designCatalog.components.find(({ id }) => id === componentId)
        expect(component).toBeDefined()
        expect(within(section as HTMLElement).getByRole("link", { name: component?.name })).toHaveAttribute(
          "href",
          `/design/components/${componentId}`,
        )
      }
    }
  })

  it("preserves English navigation and renders the required restrained pattern structures", async () => {
    render(await PatternsPage({ searchParams: Promise.resolve({ locale: "en" }) }))

    for (const pattern of designCatalog.patterns) {
      expect(screen.getByRole("heading", { level: 2, name: pattern.title.en })).toBeInTheDocument()
    }

    expect(screen.getByRole("figure", { name: "Annotated page shell" })).toBeInTheDocument()
    expect(screen.getByRole("list", { name: "Structural patterns" })).toBeInTheDocument()
    expect(screen.getByRole("article", { name: "Document surface excerpt" })).toBeInTheDocument()

    const navigation = screen.getByRole("navigation", { name: "Design system" })
    expect(within(navigation).getByRole("link", { name: /Patterns/ })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(within(navigation).getByRole("link", { name: /Components/ })).toHaveAttribute(
      "href",
      "/design/components?locale=en",
    )
    expect(screen.getByRole("link", { name: "Code Block" })).toHaveAttribute(
      "href",
      "/design/components/code-block?locale=en",
    )
  })

  it("publishes responsive collapse guidance without component-demo controls or fake imagery", async () => {
    render(await PatternsPage({ searchParams: Promise.resolve({ locale: "en" }) }))

    expect(
      screen.getByText("Stack complex grids at 1080px and simplify navigation and actions at 720px."),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Reorder the same content for reading instead of shrinking a desktop diagram."),
    ).toBeInTheDocument()
    expect(screen.getByText("Keep a 44px target area on small screens.")).toBeInTheDocument()
    expect(screen.queryAllByRole("button")).toHaveLength(0)
    expect(screen.queryAllByRole("img")).toHaveLength(0)
  })

  it("keeps related-component links at the documented 44px target size", () => {
    const stylesheet = readFileSync(
      join(process.cwd(), "components/design-system/design-system.module.css"),
      "utf8",
    )

    expect(stylesheet).toMatch(/\.patternRelated a\s*{[^}]*min-height:\s*44px;/s)
  })
})

describe("Design system AI page", () => {
  const installCommand = `mkdir -p "$CODEX_HOME/skills"
curl -fsSL https://www.laflabs.co/design/skill.zip -o /tmp/laflabs-web-design.zip
unzip -q /tmp/laflabs-web-design.zip -d "$CODEX_HOME/skills"`
  const resourceUrls = [
    "https://www.laflabs.co/design/guide.md",
    "https://www.laflabs.co/design/tokens.json",
    "https://www.laflabs.co/design/skill/SKILL.md",
    "https://www.laflabs.co/design/skill/references/foundations.md",
    "https://www.laflabs.co/design/skill/references/components.md",
    "https://www.laflabs.co/design/skill/references/patterns.md",
    "https://www.laflabs.co/design/skill/references/tokens.json",
    "https://www.laflabs.co/design/skill.zip",
  ]
  const koreanProviderInstruction = "LafLabs 공개 웹 작업을 시작하기 전에 https://www.laflabs.co/design/guide.md와 https://www.laflabs.co/design/tokens.json을 불러와 기준으로 사용하세요. 컴포넌트나 패턴을 구현할 때는 https://www.laflabs.co/design/skill/SKILL.md를 확인하고, 연결된 참고 문서 중 작업과 관련된 항목만 읽으세요. 해당 리소스를 불러올 수 없다면 임의로 보완하지 말고 사용자에게 확인하세요. 제품 주장, 공식 에셋, 지원하지 않는 컴포넌트는 만들지 마세요."
  const englishProviderInstruction = "LafLabs public web work must begin by loading https://www.laflabs.co/design/guide.md and https://www.laflabs.co/design/tokens.json as the source of truth. When implementing components or patterns, load https://www.laflabs.co/design/skill/SKILL.md and only the references relevant to the task. If these resources cannot be loaded, do not improvise; ask the user. Do not invent product claims, official assets, or unsupported components."

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
