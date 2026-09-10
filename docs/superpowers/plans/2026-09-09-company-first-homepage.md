# Company-first Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the LafLabs homepage around company credibility, explicit work methods, verifiable work, and real engineering evidence.

**Architecture:** Keep the existing App Router shell, locale provider, header, footer, search, consent, and news API. Replace the old product rail and build-loop with a focused landing composition, a typed work registry, and one isolated interactive Selected Work client component. Component-specific CSS owns the new page so document and admin surfaces keep their current global styling.

**Tech Stack:** Next.js 16.3.2 App Router, React 19, TypeScript 5.9, Motion 12, Vitest, Testing Library, Playwright, existing analytics and locale contexts.

**Spec:** `docs/superpowers/specs/2026-09-09-company-first-homepage.md`

## Global Constraints

- Preserve the official logo, route blue, paper/ink palette, square geometry, locale switching, search, consent, documents, admin, and analytics.
- Never invent customers, testimonials, metrics, investment information, or product availability.
- Product names first appear after company scope and work method.
- Do not create a sticky stage taller than the viewport or convert vertical wheel input into horizontal movement.
- Selected Work has no autoplay and supports buttons, keyboard arrows, and touch swipe.
- Use real public code/system structure; do not ship fake product UI or generated images as proof.
- Support 320px–1440px with reduced-motion and no document-level horizontal overflow.

---

### Task 1: Define company-first content and work registry

**Files:**
- Create: `lib/homepage.ts`
- Modify: `lib/content.ts`
- Test: `tests/components/landing-refresh.test.tsx`

**Interfaces:**
- Produces `WorkItem`, `workItems`, `workMethod`, and bilingual homepage copy.
- Preserves existing `products`, `repositories`, document copy, and URLs.

- [x] **Step 1: Write the failing structure assertions**

Assert that the Korean page leads with `제품을 만들고, 필요한 기반을 직접 구축합니다.`, renders `제품과 그 아래의 기술을 함께 만듭니다.` before any `Laf ID`, and exposes `문제`, `구축`, `운영` as the three work-method headings.

- [x] **Step 2: Run the focused test and confirm failure**

Run: `npm run test:unit -- tests/components/landing-refresh.test.tsx`

Expected: FAIL because the old product-first copy and build-loop still render.

- [x] **Step 3: Add typed, factual homepage data**

Create a language-independent work registry with public URLs, statuses, tags, and visual lines. Keep localized summaries in the same module and make TypeScript enforce both locales.

- [x] **Step 4: Verify the content contract**

Run: `npm run test:unit -- tests/components/landing-refresh.test.tsx && npm run typecheck`

Expected: the content contract compiles; UI assertions remain red until Task 3.

### Task 2: Build the manual Selected Work interaction

**Files:**
- Create: `components/sections/selected-work.tsx`
- Create: `components/sections/selected-work.module.css`
- Test: `tests/components/selected-work.test.tsx`

**Interfaces:**
- Produces `SelectedWork()` using `workItems`, `useLocale()`, and `useAnalytics()`.
- Exposes a named region, current slide status, previous/next buttons, arrow-key navigation, and touch swipe.

- [x] **Step 1: Write failing interaction tests**

Assert the first item is visible, next and previous wrap correctly, ArrowRight advances while focus is in the region, localized summaries switch, and controls record a privacy-safe `work_navigate` event with slug/direction only.

- [x] **Step 2: Run the focused test and confirm failure**

Run: `npm run test:unit -- tests/components/selected-work.test.tsx`

Expected: FAIL because `SelectedWork` does not exist.

- [x] **Step 3: Implement the minimal accessible carousel**

Use React state and pointer coordinates, keep every transition explicit, place the active item in a live status, and keep all real links as semantic anchors. Do not add autoplay or a timer.

- [x] **Step 4: Add the square split composition**

Render a 56/44 desktop split and one-column mobile layout. Use a code/document/system specimen from the registry as the visual field, visible focus states, and a short 360ms horizontal transition disabled by reduced motion.

- [x] **Step 5: Verify and commit the component behavior**

Run: `npm run test:unit -- tests/components/selected-work.test.tsx && npm run typecheck`

### Task 3: Replace the landing information architecture

**Files:**
- Modify: `components/landing.tsx`
- Create: `components/landing.module.css`
- Modify: `components/layout/site-header.tsx`
- Modify: `components/layout/site-footer.tsx`
- Modify: `lib/search/site-search.ts`
- Modify: `tests/components/landing-refresh.test.tsx`
- Modify: `e2e/homepage-motion.spec.ts`

**Interfaces:**
- Consumes `SelectedWork`, `LatestSignals`, `StackStrip`, `workMethod`, and existing repositories.
- Produces stable anchors `#company`, `#work-method`, `#work`, `#engineering`, `#open-source`, `#latest-signals`, and `#contact`.

- [x] **Step 1: Replace old browser behavior expectations**

Write Playwright assertions that the work-method section is shorter than two viewports and non-sticky, Selected Work does not autoplay, explicit next changes the item, and 320/390/1440 layouts do not widen the document.

- [x] **Step 2: Run the focused Playwright test and confirm failure**

Run: `npx playwright test e2e/homepage-motion.spec.ts --project=desktop-chromium --grep "company-first"`

Expected: FAIL because the new regions and controls do not exist.

- [x] **Step 3: Implement the company-first composition**

Replace parallax video, product rail, BuildLoop, and duplicated principles with the new hero, company scope, work-method grid, Selected Work, Engineering Proof, existing open-source list, Latest Signals, and contact section. Keep one technology marquee and one restrained SIGNAL motion.

- [x] **Step 4: Update navigation and search continuity**

Point header/footer anchors to company, work, open source, and contact. Replace old `build-loop`, `products`, and `principles` search records with the new work-method, work, and engineering records while keeping product records discoverable.

- [x] **Step 5: Verify focused unit and browser tests**

Run: `npm run test:unit -- tests/components/landing-refresh.test.tsx tests/components/selected-work.test.tsx tests/search/site-search.test.ts && npx playwright test e2e/homepage-motion.spec.ts`

### Task 4: Visual verification and release

**Files:**
- Modify only files required by verified regressions.
- Capture: `.impeccable/review/desktop.png`
- Capture: `.impeccable/review/mobile.png`
- Capture: `.impeccable/review/user-320.png`

**Interfaces:**
- Produces a tested branch and pull request based on `codex/site-search-overlay-impl`.

- [x] **Step 1: Run all automated checks**

Run: `npm test`

Expected: typecheck, lint, all Vitest tests, and production build pass.

- [x] **Step 2: Run one batched browser inspection**

Capture the full page at 1440×1000, 390×844, and 320×568 after entrance motion settles. Inspect copy wrapping, type scale, touch targets, focus, work navigation, reduced motion, and horizontal overflow.

- [x] **Step 3: Run the mechanical design detector once**

Run: `node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json components/landing.tsx components/landing.module.css components/sections/selected-work.tsx components/sections/selected-work.module.css components/layout/site-header.tsx components/layout/site-footer.tsx`

Fix only actionable mechanical findings, then do one confirmation screenshot round.

- [x] **Step 4: Run the full verification suite again**

Run: `npm test && npx playwright test e2e/homepage-motion.spec.ts`

- [x] **Step 5: Commit, push, and open a pull request**

Commit the tested implementation, push `codex/company-first-homepage-rework`, and open a PR against `codex/site-search-overlay-impl` while PR #24 remains open. If PR #24 merges first, rebase the branch and target `main`.
