# Homepage Signal Stories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the homepage build-loop animation and add a bilingual, API-backed Latest Signals rail with a restrained one-time glitch transition.

**Architecture:** Keep the homepage client composition and existing public document API. Add one client-only section that fetches three small published-document lists whenever the active locale changes, merge those lists through a pure helper, and render loading, empty, error, and populated rail states. Repair the existing build loop by starting its Motion timeline when the section enters the viewport and removing the mobile CSS override that cancels transforms.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Motion 12, CSS Modules, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-28-homepage-signal-stories-design.md`

## Global Constraints

- Preserve the current square white, ink, and blue homepage visual language.
- Blue remains the only accent; add no new font, radius, shadow system, image dependency, or animation dependency.
- The new rail uses native horizontal scrolling and scroll snap, not scroll hijacking or autoplay.
- The glitch runs once on entry, animates only transform and opacity, and resolves immediately to stable type.
- Use only verified fields from the existing published-document API.
- Keep all existing routes, anchors, footer structure, admin flows, and public document schemas intact.
- Korean and English states must both be complete.
- `prefers-reduced-motion` receives the finished static state.

---

### Task 1: Define and test the Latest Signals data contract

**Files:**
- Create: `lib/latest-signals.ts`
- Create: `tests/components/latest-signals-data.test.ts`

**Interfaces:**
- Consumes: public `/api/content` list item fields `id`, `kind`, `locale`, `slug`, `category`, `title`, `summary`, and `publishedAt`.
- Produces: `LatestSignal`, `PublicSignalPage`, `signalKinds`, `mergeLatestSignals(pages, limit)`, and `getLatestSignalHref(signal, locale)`.

- [ ] **Step 1: Write the failing pure-data tests**

```ts
import { describe, expect, it } from "vitest"
import { getLatestSignalHref, mergeLatestSignals } from "@/lib/latest-signals"

describe("Latest Signals data", () => {
  it("merges kinds by publication time and limits the result", () => {
    const items = mergeLatestSignals([
      { items: [{ id: "notice-1", kind: "notice", locale: "ko", slug: "launch", category: "company", title: "공지", summary: "공지 요약", publishedAt: "2026-08-26T00:00:00.000Z" }] },
      { items: [{ id: "disclosure-1", kind: "disclosure", locale: "ko", slug: "report", category: "ir", title: "공시", summary: "공시 요약", publishedAt: "2026-08-28T00:00:00.000Z" }] },
      { items: [{ id: "design-1", kind: "design", locale: "ko", slug: "assets", category: "assets", title: "에셋", summary: "에셋 요약", publishedAt: "2026-08-27T00:00:00.000Z" }] },
    ], 2)

    expect(items.map(({ id }) => id)).toEqual(["disclosure-1", "design-1"])
  })

  it("builds the existing localized detail route", () => {
    expect(getLatestSignalHref({ kind: "notice", slug: "launch" }, "en"))
      .toBe("/notices/launch?locale=en")
  })
})
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `npx vitest run tests/components/latest-signals-data.test.ts`

Expected: FAIL because `@/lib/latest-signals` does not exist.

- [ ] **Step 3: Implement the public item types, merge, and path helpers**

```ts
import type { Locale } from "@/lib/i18n"

export const signalKinds = ["notice", "disclosure", "design"] as const
export type LatestSignalKind = (typeof signalKinds)[number]

export type LatestSignal = {
  id: string
  kind: LatestSignalKind
  locale: Locale
  slug: string
  category: string | null
  title: string
  summary: string
  publishedAt: string
}

export type PublicSignalPage = { items: LatestSignal[] }

const sectionByKind: Record<LatestSignalKind, string> = {
  notice: "/notices",
  disclosure: "/disclosures",
  design: "/design",
}

export function mergeLatestSignals(pages: readonly PublicSignalPage[], limit = 3) {
  return pages
    .flatMap(({ items }) => items)
    .filter((item): item is LatestSignal => signalKinds.includes(item.kind as LatestSignalKind))
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    .slice(0, limit)
}

export function getLatestSignalHref(
  signal: Pick<LatestSignal, "kind" | "slug">,
  locale: Locale,
) {
  return `${sectionByKind[signal.kind]}/${signal.slug}?locale=${locale}`
}
```

- [ ] **Step 4: Run the focused test**

Run: `npx vitest run tests/components/latest-signals-data.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the tested data contract**

```bash
git add lib/latest-signals.ts tests/components/latest-signals-data.test.ts
git commit -m "feat: define homepage signal stories"
```

---

### Task 2: Build the bilingual Latest Signals component states

**Files:**
- Create: `components/sections/latest-signals.tsx`
- Create: `components/sections/latest-signals.module.css`
- Create: `tests/components/latest-signals.test.tsx`
- Modify: `lib/content.ts`

**Interfaces:**
- Consumes: `signalKinds`, `mergeLatestSignals`, `getLatestSignalHref`, `useLocale()`, and `/api/content?kind=<kind>&locale=<locale>&limit=3`.
- Produces: `<LatestSignals />`, which owns fetching, localized states, glitch presentation, and native rail controls.

- [ ] **Step 1: Add failing component tests for populated, empty, and error states**

```tsx
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/sections/latest-signals.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { LocaleProvider } from "@/components/i18n/locale-provider"
import { LatestSignals } from "@/components/sections/latest-signals"

describe("LatestSignals", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("renders the newest published items as localized document links", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const kind = new URL(String(input), "https://laflabs.co").searchParams.get("kind")
      const item = kind === "notice" ? [{ id: "n", kind, locale: "ko", slug: "hello", category: "company", title: "새 공지", summary: "새 소식을 전합니다.", publishedAt: "2026-08-28T00:00:00.000Z" }] : []
      return new Response(JSON.stringify({ items: item }), { status: 200 })
    }))

    render(<LocaleProvider initialLocale="ko"><LatestSignals /></LocaleProvider>)

    expect(await screen.findByRole("link", { name: /새 공지/ })).toHaveAttribute(
      "href",
      "/notices/hello?locale=ko",
    )
  })

  it("keeps useful document destinations when no items are published", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items: [] }), { status: 200 })))
    render(<LocaleProvider initialLocale="ko"><LatestSignals /></LocaleProvider>)

    expect(await screen.findByText("아직 공개된 새 소식이 없습니다.")).toBeVisible()
    expect(screen.getByRole("link", { name: "공지사항" })).toHaveAttribute("href", "/notices?locale=ko")
    expect(screen.getByRole("link", { name: "공시" })).toHaveAttribute("href", "/disclosures?locale=ko")
    expect(screen.getByRole("link", { name: "디자인 가이드" })).toHaveAttribute("href", "/design?locale=ko")
  })

  it("shows a non-blocking fallback when the content API fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })))
    render(<LocaleProvider initialLocale="ko"><LatestSignals /></LocaleProvider>)

    expect(await screen.findByText("지금은 새 소식을 불러올 수 없습니다.")).toBeVisible()
    expect(screen.getByRole("link", { name: "공지사항" })).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the component test and verify it fails**

Run: `npx vitest run tests/components/latest-signals.test.tsx`

Expected: FAIL because the component and localized copy do not exist.

- [ ] **Step 3: Extend the copy contract with complete Korean and English strings**

Add a `signals` field to `Copy` with:

```ts
signals: {
  label: string
  title: string
  lede: string
  listTitle: string
  previous: string
  next: string
  loading: string
  empty: string
  error: string
  kinds: Record<"notice" | "disclosure" | "design", string>
}
```

Use these Korean values:

```ts
signals: {
  label: "LATEST SIGNALS",
  title: "만든 것과 배운 것을 기록합니다.",
  lede: "제품 소식부터 기술 기준과 회사 정보까지, 확인할 수 있는 형태로 남깁니다.",
  listTitle: "최근 소식",
  previous: "이전 소식",
  next: "다음 소식",
  loading: "최근 소식을 불러오는 중입니다.",
  empty: "아직 공개된 새 소식이 없습니다.",
  error: "지금은 새 소식을 불러올 수 없습니다.",
  kinds: { notice: "공지사항", disclosure: "공시", design: "디자인 가이드" },
}
```

Use these English values:

```ts
signals: {
  label: "LATEST SIGNALS",
  title: "We document what we build and learn.",
  lede: "From product updates to technical standards and company information, we keep the record public.",
  listTitle: "Latest",
  previous: "Previous story",
  next: "Next story",
  loading: "Loading recent updates.",
  empty: "No updates have been published yet.",
  error: "Recent updates are unavailable right now.",
  kinds: { notice: "Notices", disclosure: "Disclosures", design: "Design guide" },
}
```

- [ ] **Step 4: Implement the component and state-safe fetching**

Create `LatestSignals` as a client component. Use an `AbortController` in `useEffect`, request all three `signalKinds`, reject non-OK responses, merge the returned pages, and ignore abort errors. Render one polite loading status, the three persistent fallback destinations for empty or error states, and linked signal articles for populated state.

Use a rail ref and `scrollBy({ left: rail.clientWidth * 0.72, behavior: reduced ? "auto" : "smooth" })`. Update `canScrollPrevious` and `canScrollNext` from the rail element's `scrollLeft`, `clientWidth`, and `scrollWidth` in `onScroll` and after content settles. Give controls localized `aria-label` values and real disabled states.

Render the glitch as two or three `aria-hidden` cropped copies of `SIGNAL`. Trigger their `x` and `opacity` keyframes with `whileInView`, `viewport={{ once: true, amount: 0.55 }}`, and a duration below 0.6 seconds. Render the stable word separately so content never disappears.

- [ ] **Step 5: Add the square asymmetric layout and responsive rail CSS**

The CSS module must include:

```css
.section { padding: 140px 0; border-block: 1px solid var(--ink); overflow: hidden; }
.inner { width: var(--shell); margin: 0 auto; display: grid; grid-template-columns: minmax(320px, .78fr) minmax(0, 1.22fr); gap: clamp(44px, 6vw, 88px); }
.signalPanel { min-height: 560px; padding: 34px; background: var(--blue); color: white; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
.track { display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
.card { flex: 0 0 min(420px, 78%); min-height: 390px; scroll-snap-align: start; border: 1px solid var(--ink); }
@media (max-width: 900px) { .section { padding: 90px 0; } .inner { grid-template-columns: 1fr; gap: 42px; } .signalPanel { min-height: 430px; } .card { flex-basis: 84vw; } }
```

Complete typography, metadata, hover, focus, skeleton, error, and disabled-control rules using only the existing palette and square geometry. Do not add a second marquee or card shadows.

- [ ] **Step 6: Run the focused component and data tests**

Run: `npx vitest run tests/components/latest-signals-data.test.ts tests/components/latest-signals.test.tsx`

Expected: PASS with no unhandled state update or abort warnings.

- [ ] **Step 7: Commit the complete section**

```bash
git add lib/content.ts components/sections/latest-signals.tsx components/sections/latest-signals.module.css tests/components/latest-signals.test.tsx
git commit -m "feat: add homepage latest signals"
```

---

### Task 3: Repair the build-loop timeline on desktop and mobile

**Files:**
- Modify: `components/sections/build-loop.tsx`
- Modify: `components/sections/build-loop.module.css`
- Modify: `tests/components/build-loop-styles.test.tsx`
- Create: `e2e/homepage-motion.spec.ts`
- Create: `playwright.homepage.config.ts`

**Interfaces:**
- Consumes: `copy[locale].buildLoop`, Motion `useScroll`, `useTransform`, and `useReducedMotion`.
- Produces: a section-entry timeline with visible right-to-left headline and step motion at every responsive width.

- [ ] **Step 1: Add failing regression coverage for the cancelled mobile motion**

Extend the current component test with the motion contract:

```ts
expect(section).toHaveAttribute("data-motion-sequence", "scroll")
expect(within(section).getAllByRole("listitem")).toHaveLength(4)
```

Add a mobile Playwright test that scrolls the real page across the build-loop region, reads the first step's computed transform before and after the scroll, and asserts that the transform is neither cancelled to `none` nor static. Use a homepage-only Playwright config so this visual regression does not require the analytics test database.

- [ ] **Step 2: Run the regression test and verify it fails**

Run: `npx vitest run tests/components/build-loop-styles.test.tsx`

Expected: the unit test FAILS because the section has no timeline marker. The browser test FAILS because mobile CSS currently forces the computed transform to `none`.

- [ ] **Step 3: Start the timeline at section entry and animate the intro**

Change the scroll offsets to:

```ts
const { scrollYProgress } = useScroll({
  target: section,
  offset: ["start 0.85", "end 0.2"],
})
```

Add transform values for the intro:

```ts
const introOpacity = useTransform(scrollYProgress, [0, 0.12], [0.24, 1])
const introX = useTransform(scrollYProgress, [0, 0.12], [84, 0])
```

Wrap the heading and lead in a `motion.div` with those styles when reduced motion is not requested. Add `data-motion-sequence="scroll"` to the section.

- [ ] **Step 4: Rebalance step ranges and remove the mobile cancellation**

Use `const start = 0.08 + index * 0.18` and transform each step over `[start, start + 0.22]` from opacity `0.22` and x `72` to the final state. Map the marker between progress `0.08` and `0.9` so it begins and ends with the step sequence.

Delete only the mobile `opacity: 1 !important` and `transform: none !important` declarations. Keep the non-sticky mobile layout and the reduced-motion static fallback.

- [ ] **Step 5: Run the build-loop and homepage tests**

Run: `npx vitest run tests/components/build-loop-styles.test.tsx tests/components/landing-refresh.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the motion repair**

```bash
git add components/sections/build-loop.tsx components/sections/build-loop.module.css tests/components/build-loop-styles.test.tsx
git commit -m "fix: restore homepage build loop motion"
```

---

### Task 4: Integrate the new section and verify the full homepage

**Files:**
- Modify: `components/landing.tsx`
- Modify: `tests/components/landing-refresh.test.tsx`
- Modify if a bounded visual defect requires it: `components/sections/latest-signals.module.css`
- Modify if a bounded visual defect requires it: `components/sections/build-loop.module.css`

**Interfaces:**
- Consumes: `<LatestSignals />` from Task 2 and the repaired `<BuildLoop />` from Task 3.
- Produces: the final homepage order `products -> build loop -> latest signals -> open source`.

- [ ] **Step 1: Add a failing homepage integration assertion**

Mock the Latest Signals CSS module alongside the existing Build Loop mock, stub successful empty API responses, and assert:

```ts
expect(screen.getByRole("heading", { name: "만든 것과 배운 것을 기록합니다." })).toBeVisible()
expect(screen.getByRole("region", { name: "최근 소식" })).toBeVisible()
```

- [ ] **Step 2: Run the homepage test and verify it fails**

Run: `npx vitest run tests/components/landing-refresh.test.tsx`

Expected: FAIL because `LatestSignals` is not mounted.

- [ ] **Step 3: Mount Latest Signals in the approved page position**

Import `LatestSignals` into `components/landing.tsx` and render it immediately after `<BuildLoop />` and before the `open-stage` section. Do not change the hero, products, open source, principles, contact, or footer markup.

- [ ] **Step 4: Run all component tests, typecheck, and lint**

Run:

```bash
npx vitest run tests/components/latest-signals-data.test.ts tests/components/latest-signals.test.tsx tests/components/build-loop-styles.test.tsx tests/components/landing-refresh.test.tsx
npm run typecheck
npm run lint
```

Expected: all commands pass.

- [ ] **Step 5: Run the full suite and production build**

Run:

```bash
npm run test:unit
npm run build
```

Expected: all unit tests pass and Next.js completes the production build.

- [ ] **Step 6: Run one bounded visual inspection and one confirmation pass**

Start the local application and inspect together:

- Desktop at 1440 x 1000 in Korean and English.
- Mobile at 390 x 844 in Korean and English.
- Build-loop headline, rail, and all four step transitions.
- Signal glitch resolves cleanly with no persistent jitter.
- Populated or empty Latest Signals rail supports touch-width horizontal scrolling and keyboard controls.
- Reduced motion shows every element in its final state.
- No horizontal page overflow, clipped Korean text, or duplicate CTA intent.

Apply all defects from the first inspection in one batch, then confirm them in one final pass.

- [ ] **Step 7: Run the Impeccable mechanical detector once**

Run:

```bash
node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json components/landing.tsx components/sections/latest-signals.tsx components/sections/latest-signals.module.css components/sections/build-loop.tsx components/sections/build-loop.module.css lib/content.ts
```

Expected: no unresolved blocking findings. Fix any mechanically verified violation before the final commit.

- [ ] **Step 8: Commit the integrated and verified homepage**

```bash
git add components/landing.tsx tests/components/landing-refresh.test.tsx components/sections/latest-signals.module.css components/sections/build-loop.module.css
git commit -m "feat: enrich homepage company signals"
```

- [ ] **Step 9: Push the branch and open a pull request**

```bash
git push -u origin codex/homepage-signal-stories
gh pr create --base main --head codex/homepage-signal-stories --title "feat: enrich homepage company signals" --body "## Summary
- repair the homepage build-loop timeline on desktop and mobile
- add a bilingual Latest Signals rail backed by published documents
- add a one-time reduced-motion-safe signal glitch

## Verification
- npm run test:unit
- npm run typecheck
- npm run lint
- npm run build"
```

Expected: GitHub returns the new pull-request URL.
