# Public Document Index Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Notices, Disclosures, and Legal index pages with the global 1280px shell and replace the oversized heading block with a compact, navigable document masthead without changing document-detail typography or discovery behavior.

**Architecture:** Keep each route and `DocumentIndex` as Server Components. Add one presentational Server Component for the localized masthead and document-type navigation, then integrate it into the existing index while retaining the current client-side discovery toolbar. Keep all styles in the existing content CSS Module so the index and detail width rules can be reviewed together.

**Tech Stack:** Next.js 16.3.2 App Router, React 19.2.6 Server Components, TypeScript 5.9.3, CSS Modules, Vitest 4.1.11, Testing Library

**Spec:** `docs/superpowers/specs/2026-09-10-website-admin-platform-design.md`, section “1. Public document index design”

## Global Constraints

- Only `/notices`, `/disclosures`, and `/legal` index composition changes in this milestone.
- `components/content/document-detail.tsx` and the 920px document-detail reading width remain unchanged.
- Existing locale, category, sort, search, cursor pagination, empty-state, and legal grouping behavior remains unchanged.
- The index root uses the global `--shell` token, which is 1280px on desktop and `calc(100% - 40px)` below the existing 900px global breakpoint.
- Navigation between document types preserves `locale` and deliberately starts the destination type without a stale category, search, sort, or cursor.
- The active document type is exposed with `aria-current="page"`; the navigation has localized accessible labels.
- Mobile must have no viewport overflow; document-type navigation may scroll horizontally within its own region.
- Do not add a new dependency or change the current Next.js rendering and cache behavior.

## File structure

- Create `components/content/document-masthead.tsx`: render localized index copy and the three document-type links.
- Modify `components/content/document-index.tsx`: replace its inline heading block with `DocumentMasthead` only.
- Modify `components/content/content.module.css`: separate index and detail width rules and style the compact masthead and responsive type navigation.
- Modify `lib/content.ts`: add localized accessible copy for the document-type navigation.
- Modify `tests/components/document-pages.test.tsx`: verify masthead semantics, localized links, active state, and preserved discovery behavior.
- Create `tests/components/document-index-layout.test.ts`: guard the shell width, detail width, and mobile overflow rules that caused the reported regression.

---

### Task 1: Localized document masthead and type navigation

**Files:**
- Create: `components/content/document-masthead.tsx`
- Modify: `components/content/document-index.tsx:1-8,92-100`
- Modify: `lib/content.ts:493-528`
- Test: `tests/components/document-pages.test.tsx`

**Interfaces:**
- Consumes: `DocumentKind`, `Locale`, `documentSections`, and the existing `content.module.css` class map.
- Produces: the exported `DocumentMasthead({ kind, locale }: { kind: DocumentKind; locale: Locale })` component and `documentNavigationCopy: Record<Locale, { label: string }>`.
- The component renders links in the fixed order Notice, Disclosure, Legal. Each destination is `${documentSections[targetKind].path}?locale=${locale}`.

- [ ] **Step 1: Write failing semantic and navigation tests**

Add the following two cases inside `describe("public document pages", ...)` in `tests/components/document-pages.test.tsx`:

```tsx
it("renders a localized document-section navigation with the current type marked", async () => {
  render(await DocumentIndex({
    kind: "notice",
    locale: "ko",
    section: documentSections.notice,
    repository: repository({ listPublished: vi.fn().mockResolvedValue([]) }),
  }))

  const navigation = screen.getByRole("navigation", { name: "문서 종류" })
  expect(within(navigation).getByRole("link", { name: "공지사항" })).toHaveAttribute("aria-current", "page")
  expect(within(navigation).getByRole("link", { name: "공지사항" })).toHaveAttribute("href", "/notices?locale=ko")
  expect(within(navigation).getByRole("link", { name: "공시" })).toHaveAttribute("href", "/disclosures?locale=ko")
  expect(within(navigation).getByRole("link", { name: "법적 고지" })).toHaveAttribute("href", "/legal?locale=ko")
})

it("localizes the document-section navigation without carrying stale filters", async () => {
  render(await DocumentIndex({
    kind: "disclosure",
    locale: "en",
    section: documentSections.disclosure,
    category: "service",
    sort: "oldest",
    q: "operations",
    categories: managedCategories.map((candidate) => ({ ...candidate, kind: "disclosure" as const })),
    repository: repository({ listPublished: vi.fn().mockResolvedValue([]) }),
  }))

  const navigation = screen.getByRole("navigation", { name: "Document sections" })
  expect(within(navigation).getByRole("link", { name: "Disclosures" })).toHaveAttribute("aria-current", "page")
  expect(within(navigation).getByRole("link", { name: "Notices" })).toHaveAttribute("href", "/notices?locale=en")
  expect(within(navigation).getByRole("link", { name: "Legal" })).toHaveAttribute("href", "/legal?locale=en")
})
```

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run:

```bash
npx vitest run tests/components/document-pages.test.tsx
```

Expected: both new cases fail because no document-section navigation exists.

- [ ] **Step 3: Add localized navigation copy**

Add this export immediately before `documentCategoryCopy` in `lib/content.ts`:

```ts
export const documentNavigationCopy: Record<Locale, { label: string }> = {
  ko: { label: "문서 종류" },
  en: { label: "Document sections" },
}
```

- [ ] **Step 4: Create the Server Component**

Create `components/content/document-masthead.tsx`:

```tsx
import Link from "next/link"

import { documentNavigationCopy, documentSections } from "@/lib/content"
import type { DocumentKind, Locale } from "@/lib/documents/types"
import styles from "./content.module.css"

const documentKinds = ["notice", "disclosure", "legal"] as const satisfies readonly DocumentKind[]

export function DocumentMasthead({ kind, locale }: { kind: DocumentKind; locale: Locale }) {
  const copy = documentSections[kind].localized[locale]

  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderCopy}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="document-index-title">{copy.title}</h1>
        <p>{copy.description}</p>
      </div>

      <nav className={styles.documentKindNav} aria-label={documentNavigationCopy[locale].label}>
        {documentKinds.map((targetKind) => {
          const target = documentSections[targetKind]
          const active = targetKind === kind

          return (
            <Link
              key={targetKind}
              href={`${target.path}?locale=${locale}`}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true" />
              {target.localized[locale].title}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
```

- [ ] **Step 5: Replace the inline header in `DocumentIndex`**

Import the component:

```tsx
import { DocumentMasthead } from "./document-masthead"
```

Replace the current `pageHeader` block with:

```tsx
<DocumentMasthead kind={kind} locale={locale} />
```

Keep `const copy = section.localized[locale]` because the empty state still consumes `copy.empty`.

- [ ] **Step 6: Run the component suite**

Run:

```bash
npx vitest run tests/components/document-pages.test.tsx
```

Expected: all tests in the file pass, including the new Korean and English navigation cases.

- [ ] **Step 7: Commit the semantic masthead**

```bash
git add components/content/document-masthead.tsx components/content/document-index.tsx lib/content.ts tests/components/document-pages.test.tsx
git commit -m "feat: add document index masthead navigation"
```

---

### Task 2: Shell alignment and responsive square styling

**Files:**
- Modify: `components/content/content.module.css:380-435,680-720`
- Create: `tests/components/document-index-layout.test.ts`

**Interfaces:**
- Consumes: `page`, `detailPage`, `pageHeader`, `pageHeaderCopy`, and `documentKindNav` CSS Module class names rendered by Task 1.
- Produces: the index shell-width contract, unchanged 920px detail-width contract, compact desktop masthead, and internally scrollable mobile type navigation.

- [ ] **Step 1: Write the failing layout-contract test**

Create `tests/components/document-index-layout.test.ts`:

```ts
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const stylesheet = readFileSync(
  fileURLToPath(new URL("../../components/content/content.module.css", import.meta.url)),
  "utf8",
)

describe("document index layout contract", () => {
  it("aligns indexes to the site shell while preserving the detail reading width", () => {
    expect(stylesheet).toMatch(/\.page\s*\{[^}]*width:\s*var\(--shell\)/s)
    expect(stylesheet).toMatch(/\.detailPage\s*\{[^}]*width:\s*min\(920px,\s*calc\(100%\s*-\s*64px\)\)/s)
  })

  it("contains document navigation overflow on mobile", () => {
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*700px\)[\s\S]*\.documentKindNav\s*\{[^}]*overflow-x:\s*auto/s)
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*700px\)[\s\S]*\.documentKindNav a\s*\{[^}]*flex:\s*0 0 auto/s)
  })
})
```

- [ ] **Step 2: Run the layout test and confirm it fails**

Run:

```bash
npx vitest run tests/components/document-index-layout.test.ts
```

Expected: the shell-width and mobile navigation assertions fail against the old combined `.page, .detailPage` rule.

- [ ] **Step 3: Separate index and detail sizing**

Replace the combined page sizing block with:

```css
.page {
  width: var(--shell);
  min-height: 70vh;
  margin: 0 auto;
  padding: 132px 0 110px;
}

.detailPage {
  width: min(920px, calc(100% - 64px));
  min-height: 70vh;
  margin: 0 auto;
  padding: 150px 0 110px;
}
```

- [ ] **Step 4: Replace the oversized banner styling with the compact masthead**

Replace the existing `.pageHeader`, `.pageHeader h1`, and `.pageHeader > p:last-child` declarations and add the new classes:

```css
.pageHeader {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 64px;
  align-items: end;
  padding-bottom: 36px;
  border-bottom: 1px solid var(--ink);
}

.pageHeaderCopy {
  min-width: 0;
}

.pageHeader h1 {
  margin: 0;
  font-size: clamp(40px, 5vw, 64px);
  line-height: 1;
  letter-spacing: -0.055em;
}

.pageHeaderCopy > p:last-child {
  max-width: 52ch;
  margin: 18px 0 0;
  color: var(--muted);
  line-height: 1.65;
}

.documentKindNav {
  display: flex;
  max-width: 100%;
  border: 1px solid var(--line);
}

.documentKindNav a {
  min-height: 44px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border-right: 1px solid var(--line);
  color: var(--muted);
  font: 650 11px var(--font-geist-mono), "Pretendard", monospace;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.documentKindNav a:last-child {
  border-right: 0;
}

.documentKindNav a > span {
  width: 8px;
  height: 8px;
  border: 1px solid var(--line);
  background: transparent;
}

.documentKindNav a[aria-current="page"] {
  color: var(--ink);
  background: #eff6ff;
}

.documentKindNav a[aria-current="page"] > span {
  border-color: var(--blue);
  background: var(--blue);
}

.documentKindNav a:hover {
  color: var(--blue);
  background: #eff6ff;
}

.documentKindNav a:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid var(--blue);
  outline-offset: 3px;
}
```

- [ ] **Step 5: Stack the masthead at the existing tablet breakpoint**

Add this block before the existing `@media (max-width: 700px)` block:

```css
@media (max-width: 900px) {
  .pageHeader {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
  }
}
```

- [ ] **Step 6: Add mobile navigation containment and preserve detail mobile sizing**

Inside the existing `@media (max-width: 700px)` block, replace the combined `.page, .detailPage` rule and add navigation containment:

```css
.page {
  width: var(--shell);
  padding: 108px 0 72px;
}

.detailPage {
  width: min(100% - 40px, 920px);
  padding: 112px 0 72px;
}

.pageHeader {
  padding-bottom: 28px;
}

.pageHeader h1 {
  font-size: clamp(38px, 12vw, 52px);
}

.documentKindNav {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
}

.documentKindNav a {
  flex: 0 0 auto;
}
```

- [ ] **Step 7: Run the layout and component tests**

Run:

```bash
npx vitest run tests/components/document-index-layout.test.ts tests/components/document-pages.test.tsx
```

Expected: both files pass. Existing document-detail, filtering, pagination, and locale assertions remain green.

- [ ] **Step 8: Commit the responsive shell styling**

```bash
git add components/content/content.module.css tests/components/document-index-layout.test.ts
git commit -m "style: align public document indexes to site shell"
```

---

### Task 3: Full verification and reviewer handoff

**Files:**
- Modify only if a verification failure identifies a defect in the files changed by Tasks 1 or 2.

**Interfaces:**
- Consumes: the completed public document masthead and layout contract.
- Produces: a release-ready pull request with automated evidence and a concise human UI checklist.

- [ ] **Step 1: Run the full automated gate**

Run:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

Expected: every command exits with status 0. If a command fails, fix only regressions caused by this milestone, rerun the failing command, then rerun all four commands.

- [ ] **Step 2: Inspect the final diff for scope and whitespace**

Run:

```bash
git diff --check origin/main...HEAD
git diff --stat origin/main...HEAD
git status --short
```

Expected: no whitespace errors, only the six files listed in this plan are changed by the implementation commits, and the worktree is clean.

- [ ] **Step 3: Publish the preview and give the user the focused UI checklist**

Push the implementation branch and open its Vercel preview. Ask the user to check exactly these cases:

```text
Desktop 1440px
1. /notices?locale=ko: header, masthead, toolbar, and list share the same left and right guides.
2. /disclosures?locale=en: Disclosures is the only active blue-square item.
3. /legal?locale=ko: category groups and toolbar behavior remain unchanged.

Mobile 390px
4. All three index pages have a 20px outer gutter and no horizontal page overflow.
5. The document-type navigation scrolls inside itself if it cannot fit.
6. A document detail page keeps its current readable width and Markdown typography.
```

- [ ] **Step 4: Record verification in the pull request**

Add a PR comment containing the four command results, preview URL, and the six-item checklist. Do not claim visual approval until the user has reviewed the preview.

- [ ] **Step 5: Commit only if verification required an implementation fix**

If Step 1 or Step 2 required a code correction, commit that correction with the affected test:

```bash
git add components/content/document-masthead.tsx components/content/document-index.tsx components/content/content.module.css lib/content.ts tests/components/document-pages.test.tsx tests/components/document-index-layout.test.ts
git commit -m "fix: resolve document index verification findings"
```

If no correction was required, do not create an empty commit.
