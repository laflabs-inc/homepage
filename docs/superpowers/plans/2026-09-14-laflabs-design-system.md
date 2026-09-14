# LafLabs Living Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-page human design reference and a provider-neutral, downloadable AI design package from one typed LafLabs catalog.

**Architecture:** Serializable modules under `lib/design-system/` own tokens, bilingual guidance, component contracts, patterns, and assets. Human pages render that catalog through a dedicated documentation shell and a typed registry of real component demos. Pure serializers expose Markdown, JSON, and a Codex Skill file map through public Route Handlers and a deterministic zip download; root `DESIGN.md` is generated and checked for drift.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript 5.9, CSS Modules, Motion, Phosphor Icons, Vitest, Testing Library, `fflate`, `tsx`

**Spec:** `docs/superpowers/specs/2026-09-14-laflabs-design-system-design.md`

## Global Constraints

- Keep `/design` canonical and split detailed content across `/design/foundations`, `/design/components`, `/design/components/[slug]`, `/design/patterns`, `/design/assets`, and `/design/ai`.
- Public machine resources require no authentication, cookies, or analytics consent.
- Paper `#f8fafc`, Ink `#0f172a`, Primary Blue `#2563eb`, square geometry, one-pixel rules, Geist, and Pretendard remain the active default language.
- Human pages are structurally equivalent in Korean and English; component names, tokens, imports, and API identifiers remain English.
- Render actual production components in demos. Do not create styled lookalikes or execute editable code in the browser.
- Do not invent customers, metrics, product availability, jobs, benefits, or company claims.
- All motion honors `prefers-reduced-motion`; all controls remain keyboard operable with visible focus.
- Keep the global Site Header, Footer, public document routes, and Admin behavior unchanged outside explicit integration points.
- `design:check` is read-only and fails when generated `DESIGN.md` differs from the catalog.
- Read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`, `08-caching.md`, the dynamic route guide, and the sitemap guide before implementing the corresponding Next.js tasks.

---

## File map

### Catalog and serialization

- Create `lib/design-system/schema.ts`: catalog types, identifier validation, and catalog assertion.
- Create `lib/design-system/meta.ts`: system name, version, canonical routes, locales, and update date.
- Create `lib/design-system/tokens.ts`: semantic color, typography, spacing, layout, shape, and motion tokens.
- Create `lib/design-system/foundations.ts`: bilingual foundation guidance.
- Create `lib/design-system/components.ts`: component contracts, demo keys, code examples, states, and source paths.
- Create `lib/design-system/patterns.ts`: page-composition guidance.
- Create `lib/design-system/assets.ts`: trusted downloadable assets.
- Create `lib/design-system/catalog.ts`: assembled and validated catalog export.
- Create `lib/design-system/serialize.ts`: guide, token, Skill, ETag, and zip file-map serialization.
- Create `scripts/generate-design-system.ts`: generate or compare root `DESIGN.md`.
- Modify `DESIGN.md`: replace manually drifting content with generated catalog output.

### Reusable UI and documentation surfaces

- Create `components/ui/action.tsx` and `components/ui/action.module.css`: supported action variants extracted from existing public styles.
- Create `components/ui/icon-control.tsx` and `components/ui/icon-control.module.css`: supported square icon control.
- Create `components/ui/text-link.tsx` and `components/ui/text-link.module.css`: supported inline action link.
- Create `components/design-system/design-shell.tsx`: local documentation navigation and page frame.
- Create `components/design-system/design-system.module.css`: shared design documentation layout.
- Create `components/design-system/component-demo-registry.tsx`: typed mapping from catalog demo keys to real components.
- Create `components/design-system/component-preview.tsx`: preview stage and optional surface selector.
- Create `components/design-system/code-copy-button.tsx`: accessible clipboard control.
- Create `components/design-system/component-code.tsx`: highlighted code with copy behavior.
- Create `components/design-system/design-overview.tsx`.
- Create `components/design-system/foundations-guide.tsx`.
- Create `components/design-system/component-index.tsx`.
- Create `components/design-system/component-detail.tsx`.
- Create `components/design-system/patterns-guide.tsx`.
- Create `components/design-system/assets-guide.tsx`.
- Create `components/design-system/ai-guide.tsx`.
- Remove `components/content/design-guide.tsx` and `components/content/design-guide.module.css` after route migration.

### Routes and integration

- Modify `app/(documents)/design/page.tsx`.
- Create `app/(documents)/design/foundations/page.tsx`.
- Create `app/(documents)/design/components/page.tsx`.
- Create `app/(documents)/design/components/[slug]/page.tsx`.
- Create `app/(documents)/design/patterns/page.tsx`.
- Create `app/(documents)/design/assets/page.tsx`.
- Create `app/(documents)/design/ai/page.tsx`.
- Create machine Route Handlers under `app/(documents)/design/guide.md`, `tokens.json`, `skill`, and `skill.zip`.
- Modify `lib/search/site-search.ts`, `app/sitemap.ts`, and localized Footer copy only if the existing Design label needs a clearer destination.

### Tests

- Create `tests/design-system/catalog.test.ts`.
- Create `tests/design-system/serialize.test.ts`.
- Create `tests/design-system/routes.test.ts`.
- Create `tests/components/design-system-pages.test.tsx`.
- Create `tests/components/design-system-interactions.test.tsx`.
- Modify `tests/components/design-guide.test.tsx`, `tests/components/document-pages.test.tsx`, `tests/search/site-search.test.ts`, and `tests/components/site-search-overlay.test.tsx`.

---

### Task 1: Restore a clean dependency baseline

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: existing CodeMirror imports in `components/admin/markdown-live-editor.tsx` and `components/admin/markdown-editor-commands.ts`
- Produces: reproducible direct dependencies and the `tsx` and `fflate` tools required by later tasks

- [ ] **Step 1: Confirm the clean baseline failure**

Run:

```bash
npm install
npm run typecheck
```

Expected: FAIL with unresolved `@codemirror/commands`, `@codemirror/lang-markdown`, `@codemirror/state`, and `@codemirror/view` imports.

- [ ] **Step 2: Install declared dependencies**

Run:

```bash
npm install @codemirror/commands@^6 @codemirror/lang-markdown@^6 @codemirror/state@^6 @codemirror/view@^6 fflate@^0.8.3
npm install --save-dev tsx@^4
```

- [ ] **Step 3: Verify the restored baseline**

Run:

```bash
npm run typecheck
npm run test:unit -- --run tests/components/document-admin.test.tsx tests/components/markdown-editor-commands.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "fix: declare editor and design tooling dependencies"
```

### Task 2: Define and validate the catalog schema

**Files:**
- Create: `lib/design-system/schema.ts`
- Create: `lib/design-system/meta.ts`
- Create: `tests/design-system/catalog.test.ts`

**Interfaces:**
- Produces: `LocaleText`, `DesignToken`, `FoundationEntry`, `ComponentEntry`, `PatternEntry`, `AssetEntry`, `DesignCatalog`, `assertDesignCatalog(catalog)` and `designSystemMeta`

- [ ] **Step 1: Write failing catalog invariant tests**

Create tests that exercise a minimal catalog and reject duplicate IDs, invalid slugs, missing locale copy, unsafe asset paths, missing stable imports, and missing component demo keys:

```ts
import { describe, expect, it } from "vitest"
import { assertDesignCatalog, type DesignCatalog } from "@/lib/design-system/schema"

describe("design catalog schema", () => {
  it("accepts a complete bilingual catalog", () => {
    expect(() => assertDesignCatalog(validCatalog)).not.toThrow()
  })

  it("rejects duplicate component slugs", () => {
    const duplicate = {
      ...validCatalog,
      components: [validCatalog.components[0], validCatalog.components[0]],
    } satisfies DesignCatalog
    expect(() => assertDesignCatalog(duplicate)).toThrow("duplicate component id")
  })

  it("rejects a stable component without an import example", () => {
    const component = { ...validCatalog.components[0], importExample: undefined }
    expect(() => assertDesignCatalog({ ...validCatalog, components: [component] })).toThrow(
      "stable component requires importExample",
    )
  })
})
```

- [ ] **Step 2: Run the tests to verify RED**

Run: `npm run test:unit -- --run tests/design-system/catalog.test.ts`

Expected: FAIL because `schema.ts` does not exist.

- [ ] **Step 3: Implement the schema and metadata**

Use serializable, closed unions:

```ts
export type LocaleText = Readonly<{ ko: string; en: string }>
export type TokenGroup = "color" | "typography" | "spacing" | "layout" | "shape" | "motion"
export type ComponentMaturity = "stable" | "candidate"
export type DemoKey = "logo" | "action" | "segmented-toggle" | "icon-control" | "text-link" | "code-block"

export type ComponentEntry = Readonly<{
  id: string
  name: string
  category: "brand" | "action" | "navigation" | "content"
  maturity: ComponentMaturity
  summary: LocaleText
  whenToUse: LocaleText
  whenNotToUse: LocaleText
  accessibility: LocaleText
  sourcePath: string
  demoKey: DemoKey
  importExample?: string
  usageExample: string
  states: readonly string[]
  props: readonly { name: string; type: string; required: boolean; description: LocaleText }[]
}>
```

`assertDesignCatalog` throws messages that name the collection and offending ID. It accepts only same-origin public asset paths beginning with `/` and component slugs matching `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.

Set metadata to:

```ts
export const designSystemMeta = {
  name: "LafLabs Web Design",
  skillName: "laflabs-web-design",
  version: "2026.9.0",
  updatedAt: "2026-09-14",
  canonicalPath: "/design",
  locales: ["ko", "en"],
} as const
```

- [ ] **Step 4: Run the schema tests**

Run: `npm run test:unit -- --run tests/design-system/catalog.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/design-system/schema.ts lib/design-system/meta.ts tests/design-system/catalog.test.ts
git commit -m "feat: define design system catalog schema"
```

### Task 3: Populate foundations, components, patterns, and assets

**Files:**
- Create: `lib/design-system/tokens.ts`
- Create: `lib/design-system/foundations.ts`
- Create: `lib/design-system/components.ts`
- Create: `lib/design-system/patterns.ts`
- Create: `lib/design-system/assets.ts`
- Create: `lib/design-system/catalog.ts`
- Modify: `tests/design-system/catalog.test.ts`

**Interfaces:**
- Consumes: schema and `designSystemMeta` from Task 2
- Produces: `designCatalog`, `getComponentEntry(slug)`, `designPageEntries`, and complete token and content arrays

- [ ] **Step 1: Add failing production-catalog tests**

Assert exact required IDs and that all assets exist:

```ts
expect(designCatalog.foundations.map(({ id }) => id)).toEqual([
  "identity", "color", "typography", "spacing-layout", "shape", "iconography",
  "motion", "accessibility", "voice", "claims",
])
expect(designCatalog.components.map(({ id }) => id)).toEqual([
  "logo", "action", "segmented-toggle", "icon-control", "text-link", "code-block",
])
expect(designCatalog.patterns.map(({ id }) => id)).toEqual([
  "site-chrome", "editorial-heading", "collection-row", "selected-work",
  "document-surface", "system-states", "responsive-collapse", "contrast-band",
])
for (const asset of designCatalog.assets) {
  expect(existsSync(join(process.cwd(), "public", asset.path))).toBe(true)
}
```

- [ ] **Step 2: Run the test to verify RED**

Run: `npm run test:unit -- --run tests/design-system/catalog.test.ts`

Expected: FAIL because the catalog modules do not exist.

- [ ] **Step 3: Define current semantic tokens**

Store actual values with a purpose and optional contrast guidance. The color defaults are:

```ts
export const designTokens = [
  { id: "color.primary", group: "color", value: "#2563eb", cssVariable: "--blue" },
  { id: "color.primary-deep", group: "color", value: "#1e40af", cssVariable: "--deep" },
  { id: "color.paper", group: "color", value: "#f8fafc", cssVariable: "--paper" },
  { id: "color.ink", group: "color", value: "#0f172a", cssVariable: "--ink" },
  { id: "color.muted", group: "color", value: "#64748b", cssVariable: "--muted" },
  { id: "color.line", group: "color", value: "#cbd5e1", cssVariable: "--line" },
] as const satisfies readonly DesignToken[]
```

Add the exact active type scales from current `DESIGN.md`, the `--shell`, `--gutter`, 720px and 1080px breakpoints, zero radius, one-pixel rule, 34px compact controls, and the shared segmented-toggle spring. Mark route-era dark colors as `legacy: true` rather than default tokens.

- [ ] **Step 4: Define bilingual guidance and component contracts**

Populate the exact IDs from Step 1. Keep Korean sentences short and natural. Stable components use these import examples:

```ts
const imports = {
  logo: 'import { Logo } from "@/components/ui/logo"',
  segmentedToggle: 'import { SegmentedToggle } from "@/components/ui/segmented-toggle"',
  codeBlock: 'import { CodeBlock } from "@/components/content/code-block"',
} as const
```

Mark Action, Icon Control, and Text Link as `candidate` until Task 5 extracts them. Their source paths identify the intended new files, and their snippets use only the declared APIs from Task 5.

- [ ] **Step 5: Assemble and validate the catalog**

```ts
export const designCatalog = {
  meta: designSystemMeta,
  tokens: designTokens,
  foundations,
  components,
  patterns,
  assets,
} satisfies DesignCatalog

assertDesignCatalog(designCatalog)

export function getComponentEntry(slug: string) {
  return designCatalog.components.find((entry) => entry.id === slug)
}
```

- [ ] **Step 6: Run tests**

Run: `npm run test:unit -- --run tests/design-system/catalog.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/design-system tests/design-system/catalog.test.ts
git commit -m "feat: add LafLabs design catalog"
```

### Task 4: Build deterministic Markdown, JSON, and Skill serializers

**Files:**
- Create: `lib/design-system/serialize.ts`
- Create: `scripts/generate-design-system.ts`
- Create: `tests/design-system/serialize.test.ts`
- Modify: `DESIGN.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: `designCatalog`
- Produces: `serializeDesignGuide()`, `serializeTokens()`, `serializeRootDesign()`, `serializeSkillFiles()`, `serializeSkillZip()`, `strongEtag(bytes)`, `writeDesignArtifacts({ check })`

- [ ] **Step 1: Write failing serializer tests**

```ts
expect(serializeDesignGuide()).toContain("# LafLabs Web Design")
expect(JSON.parse(serializeTokens()).version).toBe("2026.9.0")

const files = serializeSkillFiles()
expect([...files.keys()]).toEqual([
  "laflabs-web-design/SKILL.md",
  "laflabs-web-design/references/foundations.md",
  "laflabs-web-design/references/components.md",
  "laflabs-web-design/references/patterns.md",
  "laflabs-web-design/references/tokens.json",
])
expect(files.get("laflabs-web-design/SKILL.md")).toContain("name: laflabs-web-design")
expect(files.get("laflabs-web-design/SKILL.md")).toContain("references/components.md")
expect(serializeDesignGuide().endsWith("\n")).toBe(true)
expect(serializeDesignGuide()).toBe(serializeDesignGuide())
```

Also unzip `serializeSkillZip()` with `unzipSync` and assert the same five normalized paths and no executable files.

- [ ] **Step 2: Run the tests to verify RED**

Run: `npm run test:unit -- --run tests/design-system/serialize.test.ts`

Expected: FAIL because serialization functions do not exist.

- [ ] **Step 3: Implement pure serializers**

Use sorted arrays and one final newline. Generate the Skill entry point with concise progressive disclosure:

```ts
export function serializeSkillFiles(): ReadonlyMap<string, string> {
  return new Map([
    [`${skillName}/SKILL.md`, serializeSkillEntry()],
    [`${skillName}/references/foundations.md`, serializeFoundationsReference()],
    [`${skillName}/references/components.md`, serializeComponentsReference()],
    [`${skillName}/references/patterns.md`, serializePatternsReference()],
    [`${skillName}/references/tokens.json`, serializeTokens()],
  ])
}

export function serializeSkillZip(): Uint8Array {
  const files = Object.fromEntries(
    [...serializeSkillFiles()].map(([path, source]) => [path, strToU8(source)]),
  )
  return zipSync(files, { level: 9 })
}
```

Use Web Crypto SHA-256 for ETags so Route Handlers can await `strongEtag` without Node-only hashing.

- [ ] **Step 4: Implement generation and drift checking**

`scripts/generate-design-system.ts` accepts only `--check`. Without it, write `DESIGN.md`; with it, compare bytes and exit nonzero with `Run npm run design:generate` when stale.

Add scripts:

```json
{
  "design:generate": "tsx scripts/generate-design-system.ts",
  "design:check": "tsx scripts/generate-design-system.ts --check",
  "test": "npm run design:check && npm run typecheck && npm run lint && npm run test:unit && npm run build"
}
```

- [ ] **Step 5: Generate root DESIGN.md and verify**

Run:

```bash
npm run design:generate
npm run design:check
npm run test:unit -- --run tests/design-system/serialize.test.ts
```

Expected: all commands PASS and `DESIGN.md` starts with a generated-file notice, system version, core principles, tokens, components, and public machine-resource URLs.

- [ ] **Step 6: Commit**

```bash
git add lib/design-system/serialize.ts scripts/generate-design-system.ts tests/design-system/serialize.test.ts DESIGN.md package.json
git commit -m "feat: serialize design system resources"
```

### Task 5: Extract supported Action, Icon Control, and Text Link primitives

**Files:**
- Create: `components/ui/action.tsx`
- Create: `components/ui/action.module.css`
- Create: `components/ui/icon-control.tsx`
- Create: `components/ui/icon-control.module.css`
- Create: `components/ui/text-link.tsx`
- Create: `components/ui/text-link.module.css`
- Create: `tests/components/design-system-primitives.test.tsx`
- Modify: `lib/design-system/components.ts`

**Interfaces:**
- Produces: `Action`, `IconControl`, and `TextLink`

- [ ] **Step 1: Write failing primitive behavior tests**

```tsx
render(<Action href="/design" variant="primary">Open guide</Action>)
expect(screen.getByRole("link", { name: "Open guide" })).toHaveAttribute("href", "/design")
expect(screen.getByRole("link", { name: "Open guide" })).toHaveAttribute("data-variant", "primary")

render(<IconControl label="Search"><MagnifyingGlass aria-hidden /></IconControl>)
expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute("type", "button")

render(<TextLink href="/design/components">Components</TextLink>)
expect(screen.getByRole("link", { name: /Components/ })).toHaveAttribute("href", "/design/components")
```

Test Action as both link and button without allowing invalid mixed props.

- [ ] **Step 2: Run the test to verify RED**

Run: `npm run test:unit -- --run tests/components/design-system-primitives.test.tsx`

Expected: FAIL because the primitives do not exist.

- [ ] **Step 3: Implement minimal discriminated APIs**

```ts
type ActionProps =
  | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: never } & ButtonHTMLAttributes<HTMLButtonElement>)

export function Action({ variant = "primary", ...props }: ActionProps & {
  variant?: "primary" | "secondary" | "inverse"
})
```

All variants use a 50px minimum visual height, square corners, one reserved border, WCAG AA contrast, and a 2px Primary Blue focus outline. Icon Control uses a 34px visual square inside a 44px mobile hit target. Text Link uses text plus a Phosphor arrow and never hand-drawn SVG.

- [ ] **Step 4: Mark extracted entries stable**

Update the three catalog entries with their real source paths and import examples. Do not migrate unrelated homepage call sites in this task.

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test:unit -- --run tests/components/design-system-primitives.test.tsx tests/design-system/catalog.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/ui lib/design-system/components.ts tests/components/design-system-primitives.test.tsx
git commit -m "feat: extract public design primitives"
```

### Task 6: Build the documentation shell and overview

**Files:**
- Create: `components/design-system/design-shell.tsx`
- Create: `components/design-system/design-system.module.css`
- Create: `components/design-system/design-overview.tsx`
- Modify: `app/(documents)/design/page.tsx`
- Modify: `tests/components/design-guide.test.tsx`

**Interfaces:**
- Consumes: `designCatalog.meta`, `designPageEntries`, existing `SiteHeader` and `SiteFooter` through the documents layout
- Produces: `DesignShell({ locale, currentPath, children })` and the new `/design` overview

- [ ] **Step 1: Read current Next.js page and metadata guidance**

Read:

```text
node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md
```

- [ ] **Step 2: Replace the old monolithic-page test with failing overview tests**

Assert:

```tsx
expect(screen.getByRole("heading", { level: 1, name: "LafLabs 디자인 시스템" })).toBeInTheDocument()
expect(screen.getByText("2026.9.0")).toBeInTheDocument()
expect(screen.getByRole("link", { name: "기초 원칙" })).toHaveAttribute("href", "/design/foundations")
expect(screen.getByRole("link", { name: "컴포넌트" })).toHaveAttribute("href", "/design/components")
expect(screen.getByRole("link", { name: "AI에서 사용하기" })).toHaveAttribute("href", "/design/ai")
expect(screen.getByRole("navigation", { name: "디자인 시스템" })).toBeInTheDocument()
```

Add an English render asserting equivalent destinations and English headings.

- [ ] **Step 3: Run the test to verify RED**

Run: `npm run test:unit -- --run tests/components/design-guide.test.tsx`

Expected: FAIL because the current page still renders the old five-section guide.

- [ ] **Step 4: Implement the documentation shell**

Use a compact page masthead, a desktop left rail inside `var(--shell)`, and a native `<details>` navigation on mobile. Each active link has `aria-current="page"`. The shell must not create another fixed global navbar.

- [ ] **Step 5: Implement the overview**

Render catalog metadata, one official brand specimen, the five human destinations, and three direct start paths for Designer, Developer, and AI. Use editorial rows with one-pixel rules rather than equal cards.

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
npm run test:unit -- --run tests/components/design-guide.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add 'app/(documents)/design/page.tsx' components/design-system tests/components/design-guide.test.tsx
git commit -m "feat: add design system overview"
```

### Task 7: Add Foundations and Assets pages

**Files:**
- Create: `components/design-system/foundations-guide.tsx`
- Create: `components/design-system/assets-guide.tsx`
- Create: `app/(documents)/design/foundations/page.tsx`
- Create: `app/(documents)/design/assets/page.tsx`
- Create: `tests/components/design-system-pages.test.tsx`

**Interfaces:**
- Consumes: design tokens, foundations, assets, `DesignShell`
- Produces: bilingual `/design/foundations` and `/design/assets`

- [ ] **Step 1: Write failing route component tests**

Render each page in Korean and English. Assert the foundation IDs appear as headings, active local navigation uses `aria-current`, semantic values such as `#2563EB` and `0px` are visible, and each downloadable asset points to a trusted same-origin path with `download`.

- [ ] **Step 2: Run the tests to verify RED**

Run: `npm run test:unit -- --run tests/components/design-system-pages.test.tsx`

Expected: FAIL because the page modules do not exist.

- [ ] **Step 3: Implement Foundations**

Render:

- logo clear-space and contrast specimens using the official asset
- color roles as full-width rows with value and purpose
- typography specimens at their real type tokens
- spacing and shell diagrams using real CSS dimensions
- shape, icon, motion, accessibility, voice, and factual-claims guidance

Do not add fake UI screenshots or animated decoration. Motion samples run only after explicit interaction and remain static under reduced motion.

- [ ] **Step 4: Implement Assets**

Use real `next/image` previews where applicable. Show name, format, dimensions when known, usage note, and a direct download. A missing optional asset is absent rather than represented by a placeholder.

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test:unit -- --run tests/components/design-system-pages.test.tsx tests/design-system/catalog.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add 'app/(documents)/design/foundations' 'app/(documents)/design/assets' components/design-system tests/components/design-system-pages.test.tsx
git commit -m "feat: document foundations and assets"
```

### Task 8: Publish machine-readable resources and the AI guide

**Files:**
- Create: `lib/design-system/response.ts`
- Create: `app/(documents)/design/guide.md/route.ts`
- Create: `app/(documents)/design/tokens.json/route.ts`
- Create: `app/(documents)/design/skill/SKILL.md/route.ts`
- Create: `app/(documents)/design/skill/references/foundations.md/route.ts`
- Create: `app/(documents)/design/skill/references/components.md/route.ts`
- Create: `app/(documents)/design/skill/references/patterns.md/route.ts`
- Create: `app/(documents)/design/skill/references/tokens.json/route.ts`
- Create: `app/(documents)/design/skill.zip/route.ts`
- Create: `app/(documents)/design/ai/page.tsx`
- Create: `components/design-system/ai-guide.tsx`
- Create: `tests/design-system/routes.test.ts`

**Interfaces:**
- Consumes: serializer functions from Task 4
- Produces: `designTextResponse(body, contentType, filename?)`, all public machine routes, and `/design/ai`

- [ ] **Step 1: Read Route Handler and caching documentation**

Read:

```text
node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md
```

- [ ] **Step 2: Write failing Route Handler tests**

Call each exported `GET` directly and assert:

```ts
const response = await getGuide()
expect(response.status).toBe(200)
expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8")
expect(response.headers.get("etag")).toMatch(/^"[a-f0-9]{64}"$/)
expect(response.headers.get("cache-control")).toContain("public")

const zip = await getSkillZip()
expect(zip.headers.get("content-disposition")).toBe(
  'attachment; filename="laflabs-web-design-2026.9.0.zip"',
)
```

Assert the zip bytes unzip to the exact five-file Skill package.

- [ ] **Step 3: Run tests to verify RED**

Run: `npm run test:unit -- --run tests/design-system/routes.test.ts`

Expected: FAIL because the handlers do not exist.

- [ ] **Step 4: Implement safe response helpers and handlers**

Return `Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400`, `X-Content-Type-Options: nosniff`, and a SHA-256 ETag. The zip handler returns `application/zip`; Markdown and JSON handlers return UTF-8 content types. No route accepts parameters or reads request paths.

- [ ] **Step 5: Implement the AI guide page**

Show stable direct URLs, a `Download Skill` action, and copyable commands:

```bash
mkdir -p "$CODEX_HOME/skills"
curl -fsSL https://laflabs.co/design/skill.zip -o /tmp/laflabs-web-design.zip
unzip -q /tmp/laflabs-web-design.zip -d "$CODEX_HOME/skills"
```

Display the command as text only. Do not execute it. Also provide a provider-neutral instruction linking `/design/guide.md` and `/design/tokens.json`.

- [ ] **Step 6: Run tests**

Run:

```bash
npm run test:unit -- --run tests/design-system/routes.test.ts tests/components/design-system-pages.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Materialize and validate the Skill once**

Use a temporary directory, write the five values returned by `serializeSkillFiles()`, and run:

```bash
python /home/singlethread/.codex/skills/.system/skill-creator/scripts/quick_validate.py "$validation_dir/laflabs-web-design"
```

Expected: validation success with no unfinished scaffold placeholders. Remove only the temporary directory created for this validation.

- [ ] **Step 8: Commit**

```bash
git add 'app/(documents)/design' components/design-system lib/design-system tests/design-system/routes.test.ts
git commit -m "feat: publish AI design resources"
```

### Task 9: Add the component index, real previews, and detail routes

**Files:**
- Create: `components/design-system/component-demo-registry.tsx`
- Create: `components/design-system/component-preview.tsx`
- Create: `components/design-system/code-copy-button.tsx`
- Create: `components/design-system/component-code.tsx`
- Create: `components/design-system/component-index.tsx`
- Create: `components/design-system/component-detail.tsx`
- Create: `app/(documents)/design/components/page.tsx`
- Create: `app/(documents)/design/components/[slug]/page.tsx`
- Create: `tests/components/design-system-interactions.test.tsx`
- Modify: `tests/components/design-system-pages.test.tsx`

**Interfaces:**
- Consumes: `DemoKey`, `designCatalog.components`, `getComponentEntry`, actual production UI components, `useAnalytics`
- Produces: `componentDemos: Record<DemoKey, React.ComponentType>`, component index, static detail params, and accessible code copying

- [ ] **Step 1: Write failing index and detail tests**

Assert each catalog component appears once in the index and links to `/design/components/<id>`. Render `segmented-toggle` detail and assert an actual `role="group"` control, Source link, When to use, Accessibility, API, and Usage sections. The Source link is `https://github.com/laflabs-inc/homepage/blob/main/<sourcePath>`. Assert an unknown slug calls `notFound()`.

- [ ] **Step 2: Write failing copy interaction tests**

```tsx
Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
render(<ComponentCode component={actionEntry} locale="en" />)
await user.click(screen.getByRole("button", { name: "Copy usage code" }))
expect(navigator.clipboard.writeText).toHaveBeenCalledWith(actionEntry.usageExample)
expect(screen.getByRole("status")).toHaveTextContent("Copied")
expect(track).toHaveBeenCalledWith("design_code_copy", "action")
```

Add a rejected clipboard promise and assert `Copy failed. Select the code manually.` while the source remains selectable.

- [ ] **Step 3: Run tests to verify RED**

Run:

```bash
npm run test:unit -- --run tests/components/design-system-pages.test.tsx tests/components/design-system-interactions.test.tsx
```

Expected: FAIL because the component documentation files do not exist.

- [ ] **Step 4: Implement the typed real-demo registry**

```tsx
export const componentDemos = {
  logo: LogoDemo,
  action: ActionDemo,
  "segmented-toggle": SegmentedToggleDemo,
  "icon-control": IconControlDemo,
  "text-link": TextLinkDemo,
  "code-block": CodeBlockDemo,
} satisfies Record<DemoKey, ComponentType>
```

Each demo imports the actual production component. Client state exists only inside demos that need it.

- [ ] **Step 5: Implement index and detail routes**

Use `generateStaticParams()` from catalog component IDs. Await Next.js 16 `params`. Call `notFound()` when `getComponentEntry(slug)` returns `undefined`. Set localized metadata from the catalog.

- [ ] **Step 6: Implement code copy behavior**

Reuse Code Block typography but keep the design documentation copy status localized. Reset copied state after 1800ms, clean up the timer, expose a polite live region, and track only after a successful copy.

- [ ] **Step 7: Run tests**

Run:

```bash
npm run test:unit -- --run tests/components/design-system-pages.test.tsx tests/components/design-system-interactions.test.tsx tests/design-system/catalog.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add 'app/(documents)/design/components' components/design-system tests/components lib/design-system
git commit -m "feat: add live component documentation"
```

### Task 10: Add composition patterns and remove the retired guide

**Files:**
- Create: `components/design-system/patterns-guide.tsx`
- Create: `app/(documents)/design/patterns/page.tsx`
- Modify: `tests/components/design-system-pages.test.tsx`
- Delete: `components/content/design-guide.tsx`
- Delete: `components/content/design-guide.module.css`

**Interfaces:**
- Consumes: pattern catalog and `DesignShell`
- Produces: bilingual `/design/patterns`; removes the superseded single-page implementation

- [ ] **Step 1: Add failing pattern-page tests**

Assert all eight pattern names render, each pattern identifies its related real components, responsive collapse guidance is present, and the page has no component-demo controls pretending to be reusable APIs.

- [ ] **Step 2: Run the tests to verify RED**

Run: `npm run test:unit -- --run tests/components/design-system-pages.test.tsx`

Expected: FAIL because `/design/patterns` does not exist.

- [ ] **Step 3: Implement the patterns page**

Use varied but restrained layouts: one annotated shell specimen, editorial rows for structural patterns, and one real document surface excerpt. Do not repeat a three-card layout, create fake screenshots, or add decorative scroll animation.

- [ ] **Step 4: Remove the old guide files**

Verify no imports remain:

```bash
rg -n "components/content/design-guide|design-guide.module.css" app components tests
```

Expected: no matches.

- [ ] **Step 5: Run tests and commit**

```bash
npm run test:unit -- --run tests/components/design-guide.test.tsx tests/components/design-system-pages.test.tsx
npm run typecheck
git add 'app/(documents)/design/patterns' components tests
git add -u components/content
git commit -m "feat: document LafLabs composition patterns"
```

### Task 11: Integrate search, Sitemap, and discovery

**Files:**
- Modify: `lib/search/site-search.ts`
- Modify: `app/sitemap.ts`
- Modify: `tests/search/site-search.test.ts`
- Modify: `tests/components/document-pages.test.tsx`
- Modify: `tests/components/site-search-overlay.test.tsx`
- Modify: `components/layout/site-footer.tsx` only if the current `/design` link needs a query-preserving helper

**Interfaces:**
- Consumes: `designPageEntries`
- Produces: one catalog-derived list of human design pages in search and Sitemap

- [ ] **Step 1: Write failing discovery tests**

Assert Korean searches for `타이포그래피`, `컴포넌트`, and `AI 디자인` return their specific design subpages. Assert `buildSitemap()` includes the seven human routes exactly once and does not include `.md`, `.json`, or `.zip` routes. Preserve the Footer Design link at `/design`.

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test:unit -- --run tests/search/site-search.test.ts tests/components/document-pages.test.tsx tests/components/site-search-overlay.test.tsx
```

Expected: FAIL because search and Sitemap contain only `/design`.

- [ ] **Step 3: Derive static search entries from the design catalog**

Replace the hardcoded Design result with:

```ts
...designPageEntries.map((entry) => ({
  id: `design-${entry.id}`,
  group: "page" as const,
  title: entry.title[locale],
  description: entry.description[locale],
  href: entry.href,
  keywords: entry.keywords[locale],
}))
```

- [ ] **Step 4: Derive Sitemap entries from the same list**

Map human entries only, use monthly change frequency, `/design` priority `0.6`, and subpage priority `0.5`. Keep the existing document-storage failure fallback but include all static design entries in both success and failure paths.

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test:unit -- --run tests/search/site-search.test.ts tests/components/document-pages.test.tsx tests/components/site-search-overlay.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/search/site-search.ts app/sitemap.ts components/layout/site-footer.tsx tests
git commit -m "feat: make design references discoverable"
```

### Task 12: Complete visual, content, and release verification

**Files:**
- Modify only files directly implicated by this bounded verification pass.

**Interfaces:**
- Consumes: all prior tasks
- Produces: verified Vercel-ready design system branch

- [ ] **Step 1: Run generated-artifact and static checks**

Run:

```bash
npm run design:check
npm run typecheck
npm run lint
git diff --check
```

Expected: PASS with no modified generated files.

- [ ] **Step 2: Run the complete unit suite**

Run: `npm run test:unit`

Expected: all tests PASS.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: the human and machine design routes appear in the Next.js route table and the build exits 0.

- [ ] **Step 4: Run one bounded browser review**

At desktop and mobile sizes verify:

- Korean and English overview, foundations, components, one component detail, patterns, assets, and AI pages
- local navigation current state and mobile disclosure
- long code scrolling without shell overflow
- component previews, keyboard focus, copy success, and copy failure
- reduced-motion static behavior
- direct Markdown, JSON, Skill Markdown, and zip downloads

Fix all findings in one batch and run one confirmation pass only.

- [ ] **Step 5: Run the Impeccable detector once after final UI edits**

Run:

```bash
node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json components/design-system components/ui 'app/(documents)/design'
```

Address findings caused by this feature. Report unrelated pre-existing advisories without expanding scope.

- [ ] **Step 6: Re-run the full release gate**

Run: `npm test`

Expected: `design:check`, typecheck, lint, all unit tests, and production build PASS.

- [ ] **Step 7: Commit verification fixes**

If the bounded review changed files:

```bash
git add app components lib tests DESIGN.md package.json package-lock.json
git commit -m "fix: polish design system documentation"
```

If no files changed, do not create an empty commit.

- [ ] **Step 8: Push and create the PR**

```bash
git push -u origin codex/laflabs-design-system
gh pr create --base main --head codex/laflabs-design-system --title "Build the LafLabs living design system" --body "Human component reference, machine-readable design resources, and a downloadable LafLabs Codex Skill generated from one catalog."
```

Wait for the Vercel check and provide both the PR URL and public preview URL for the user's final visual review.
