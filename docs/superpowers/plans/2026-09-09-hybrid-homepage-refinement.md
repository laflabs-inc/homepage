# Hybrid Homepage Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Combine the original LafLabs Hero, Company, and framed-panel language with the remake's image-led work registry, restrained open-source list, and calmer search typography.

**Architecture:** Keep the existing App Router shell, locale provider, analytics, search API, consent, and Latest Signals. Recompose only the homepage presentation, extend the typed work data with honest editorial image metadata, and adjust the existing search overlay CSS without changing its behavior or response contract.

**Tech Stack:** Next.js 16.3.2 App Router, React 19, TypeScript 5.9, Motion 12, CSS Modules plus existing global legacy styles, Vitest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-09-company-first-homepage.md`

## Global Constraints

- Preserve the official logo, route blue, ink/paper palette, square geometry, locale switching, search behavior, consent, documents, admin, and analytics.
- Restore the original Hero and Company compositions without restoring oversized mobile typography.
- Use `ASK`, `BUILD`, and `RUN` as the work-method display marks.
- Do not restore sticky scroll stages or intercept vertical wheel input.
- Selected Work has no autoplay and supports buttons, keyboard arrows, and touch swipe.
- Decorative images must not be presented as real product screenshots.
- Show only `lafetch` by name in the open-source list; the other two entries are undisclosed.
- Remove recruitment language from the homepage and do not add a careers route.
- Support 320px through 1440px, reduced motion, and no document-level horizontal overflow.

---

### Task 1: Lock the hybrid content contract

**Files:**
- Modify: `lib/homepage.ts`
- Modify: `tests/components/landing-refresh.test.tsx`
- Modify: `tests/components/selected-work.test.tsx`

**Interfaces:**
- Produces `homepageCopy[locale].method.items` with `mark: "ASK" | "BUILD" | "RUN"`.
- Extends each `WorkItem.visual` with `image: { src: string; alt: Record<Locale, string> }`.
- Produces `openSourceRows`, one public row and two undisclosed rows, for the landing composition.

- [x] **Step 1: Write failing content assertions**

Assert that the rendered Korean homepage contains the company-first Hero and Company copy, displays `ASK`, `BUILD`, and `RUN`, omits the engineering heading, and contains no recruitment text. Assert that `openSourceRows` contains one linked `lafetch` entry and two entries whose title is `미공개 프로젝트` in Korean and `Undisclosed project` in English.

- [x] **Step 2: Run the focused tests and confirm failure**

Run: `npm run test:unit -- tests/components/landing-refresh.test.tsx tests/components/selected-work.test.tsx`

Expected: FAIL because the current method marks are Korean, the engineering section still renders, and the open-source rows still expose three repository names.

- [x] **Step 3: Implement the content contract**

Use explicit data structures:

```ts
type WorkImage = {
  src: string
  alt: Record<Locale, string>
}

type OpenSourceRow = {
  id: string
  title: Record<Locale, string>
  description: Record<Locale, string>
  language?: string
  href?: string
  public: boolean
}
```

Set the method marks to `ASK`, `BUILD`, and `RUN`. Keep factual project summaries. Remove careers from `homepageCopy.ko.contact.lede` and `homepageCopy.en.contact.lede` while preserving product, partnership, and investment inquiries.

- [x] **Step 4: Run the focused data tests**

Run: `npm run test:unit -- tests/components/landing-refresh.test.tsx tests/components/selected-work.test.tsx && npm run typecheck`

Expected: content/data assertions pass; layout assertions may remain red until Tasks 2–4.

### Task 2: Restore Hero, Company, and framed work method

**Files:**
- Modify: `components/landing.tsx`
- Modify: `components/landing.module.css`
- Modify: `tests/components/landing-refresh.test.tsx`
- Modify: `e2e/homepage-motion.spec.ts`

**Interfaces:**
- Consumes `homepageCopy` and `StackStrip`.
- Produces stable anchors `#company`, `#work-method`, and `#work` in that order.

- [x] **Step 1: Write failing structural and motion tests**

Assert that the Hero renders `LAF / 001`, the Company section uses the dark manifesto composition, the work method has exactly three panels with `ASK / BUILD / RUN`, and no `.engineeringFrame` exists. In Playwright, assert that `#work-method` is not sticky and its mobile rail has native horizontal overflow.

- [x] **Step 2: Run the focused test and confirm failure**

Run: `npm run test:unit -- tests/components/landing-refresh.test.tsx`

Expected: FAIL because the current Hero, Company, and work-method markup use the remake composition.

- [x] **Step 3: Implement the hybrid composition**

Restore the original Hero structure and Company offset structure inside the CSS Module. Use Motion only for short entrance transforms and the existing restrained Hero field movement. Render the method as:

```tsx
<ol className={styles.methodPanels}>
  {t.method.items.map((item, index) => (
    <motion.li key={item.mark} className={styles.methodPanel}>
      <div className={styles.panelTop}><span>0{index + 1}</span><span>{item.title}</span></div>
      <strong className={styles.panelMark}>{item.mark}</strong>
      <div className={styles.panelCopy}><h3>{item.title}</h3><p>{item.body}</p></div>
    </motion.li>
  ))}
</ol>
```

Desktop uses three columns. Mobile uses `overflow-x: auto`, `scroll-snap-type: x mandatory`, and panels no wider than 84vw. Do not translate wheel events.

- [x] **Step 4: Apply the typography scale**

Use Hero 64–80px desktop / 40–48px mobile, Company 52–72px / 36–44px, section headings 44–60px / 32–40px, body 14–17px, and mono labels 9–11px. Keep all type fluid with bounded `clamp()` values.

- [x] **Step 5: Verify the homepage structure**

Run: `npm run test:unit -- tests/components/landing-refresh.test.tsx && npm run typecheck`

Expected: PASS.

### Task 3: Convert Selected Work to an image-led showcase

**Files:**
- Create: `public/work/laf-id.webp`
- Create: `public/work/lafetch.webp`
- Create: `public/work/lafwall.webp`
- Modify: `components/sections/selected-work.tsx`
- Modify: `components/sections/selected-work.module.css`
- Modify: `tests/components/selected-work.test.tsx`

**Interfaces:**
- Consumes `WorkItem.visual.image` and the existing `useAnalytics()` hook.
- Preserves `work_navigate` targets in the form `next:<slug>` and `previous:<slug>`.

- [x] **Step 1: Write failing image and control tests**

Assert the active item renders an image with localized alt text, previous/next buttons, a segmented position rail, and the same no-autoplay behavior. Assert that changing locale changes the alt text without resetting the active item.

- [x] **Step 2: Run the focused test and confirm failure**

Run: `npm run test:unit -- tests/components/selected-work.test.tsx`

Expected: FAIL because the left side still renders code/system specimens.

- [x] **Step 3: Produce honest editorial images**

Create three 3:2 images in the LafLabs palette. They may communicate identity, networking, and a protected boundary through physical editorial scenes, but must contain no fake UI, fabricated customer marks, metrics, or product claims. Store the final optimized assets under `public/work/` and record their provenance.

- [x] **Step 4: Implement the image-led split**

Replace `WorkVisual` with `next/image` using `fill`, responsive `sizes`, and `object-fit: cover`. Keep the 56/44 desktop split, stack the image above copy on mobile, and style the navigation as 44px square buttons separated by a segmented rail. Preserve keyboard, swipe, focus, reduced motion, and analytics.

- [x] **Step 5: Verify interactions**

Run: `npm run test:unit -- tests/components/selected-work.test.tsx && npm run typecheck`

Expected: PASS.

### Task 4: Restrict open source and calm the search overlay

**Files:**
- Modify: `components/landing.tsx`
- Modify: `components/landing.module.css`
- Modify: `components/search/site-search-overlay.module.css`
- Modify: `lib/search/site-search.ts`
- Modify: `tests/components/landing-refresh.test.tsx`
- Modify: `tests/components/site-search-overlay.test.tsx`
- Modify: `tests/search/site-search.test.ts`

**Interfaces:**
- Consumes `openSourceRows`.
- Preserves the existing `SiteSearchResponse`, grouped results, focus behavior, and analytics events.

- [x] **Step 1: Write failing disclosure and search-scale tests**

Assert that only the `lafetch` row is a repository link, two undisclosed rows render as non-links, and hidden repository names are absent from homepage search results. Add browser assertions that the search input is at most 64px on desktop and 38px on mobile, and that at least three result rows fit in the initial results viewport.

- [x] **Step 2: Run the focused tests and confirm failure**

Run: `npm run test:unit -- tests/components/landing-refresh.test.tsx tests/components/site-search-overlay.test.tsx tests/search/site-search.test.ts`

Expected: FAIL because all repositories are currently exposed and the search input can reach 96px desktop / 54px mobile.

- [x] **Step 3: Render the restricted open-source rows**

Render anchors only when `row.public && row.href`. Use a semantic non-link row for undisclosed entries. Do not display language, descriptions, or status claims that reveal the hidden project identities.

- [x] **Step 4: Adjust the search type and spacing**

Set the search heading to `clamp(32px, 3.4vw, 48px)`, input to `clamp(42px, 4.5vw, 64px)`, mobile input to `clamp(30px, 9vw, 38px)`, and result titles to `clamp(20px, 1.8vw, 26px)` / `18–22px` mobile. Reduce form height, row minimum height, and inter-group spacing without reducing touch targets below 44px.

- [x] **Step 5: Verify focused behavior**

Run: `npm run test:unit -- tests/components/landing-refresh.test.tsx tests/components/site-search-overlay.test.tsx tests/search/site-search.test.ts && npm run typecheck`

Expected: PASS.

### Task 5: Visual and release verification

**Files:**
- Modify only files required by verified regressions.
- Replace: `.impeccable/review/desktop.png`
- Replace: `.impeccable/review/mobile.png`
- Replace: `.impeccable/review/user-320.png`

**Interfaces:**
- Produces a verified update to PR #25.

- [x] **Step 1: Run all automated checks**

Run: `npm test`

Expected: typecheck, lint, all Vitest tests, and Next.js production build pass.

- [x] **Step 2: Run one batched browser inspection**

Capture the homepage and search overlay at 1440×1000, 390×844, and 320×568. Verify typography, native method scrolling, selected-work controls, search result density, reduced motion, and horizontal overflow.

- [x] **Step 3: Run the mechanical design detector once**

Run: `node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json components/landing.tsx components/landing.module.css components/sections/selected-work.tsx components/sections/selected-work.module.css components/search/site-search-overlay.module.css`

Fix actionable mechanical findings in one batch.

- [x] **Step 4: Run final verification**

Run: `npm test` and the focused homepage/search Playwright specs.

- [x] **Step 5: Commit and update the open pull request**

Commit the tested implementation, push `codex/company-first-homepage-rework`, and verify that PR #25 targets `codex/site-search-overlay-impl` while PR #24 remains open.
