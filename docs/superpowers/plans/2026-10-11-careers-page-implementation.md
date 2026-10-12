# Careers Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a bilingual, API-ready `/careers` page that explains LafLabs work honestly, renders an empty roles state, and is discoverable through the existing site shell.

**Architecture:** A typed local careers reader owns verified bilingual content and returns an empty role collection. A client careers surface consumes only that read result so a future Admin-backed repository can replace the source without changing page composition. The route keeps metadata server-side while Footer, search, and Sitemap register the new public page.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Motion, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-10-11-careers-page-design.md`

## Global Constraints

- Preserve the current off-white, deep navy, cobalt blue, square LafLabs visual language.
- Do not invent jobs, benefits, headcount, locations, hiring timelines, customers, or employment conditions.
- Use `roles: []` in the first local source and keep page components independent from that source.
- Support Korean and English through the existing locale provider.
- Open applications use `mailto:contact@laflabs.co` until the Inquiry platform ships.
- Do not add Careers to the primary Navbar.
- Motion must stop under `prefers-reduced-motion` and must not hide content.

## Review Focus

- Empty roles: the page remains complete and the open-application action is available.
- Future non-empty roles: a role row renders from data without changing the page shell.
- Locale changes: every Careers string changes together without stale mixed-language content.
- Narrow mobile widths: the work field reshapes without clipping or horizontal page overflow.
- Discovery failure boundaries: Footer, static search, metadata, and Sitemap all point to exactly `/careers`.

---

### Task 1: Typed careers content boundary

**Files:**
- Create: `lib/careers.ts`
- Test: `tests/lib/careers.test.ts`

**Interfaces:**
- Produces: `CareerRole`, `CareersPageContent`, `careersContent`, and `readCareersContent(): CareersPageContent`.
- Consumes: existing `Locale` and `contactEmail` constants.

- [ ] **Step 1: Write the failing content tests**

Assert that `readCareersContent()` returns Korean and English hero, problem, principle, process, and open-application copy, returns `roles: []`, and does not expose mutable arrays.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test:unit -- tests/lib/careers.test.ts`  
Expected: FAIL because `@/lib/careers` does not exist.

- [ ] **Step 3: Implement the minimal typed local reader**

Create localized section/item types and verified copy. Keep roles language-independent except for localized presentation fields. Freeze or expose readonly collections.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm run test:unit -- tests/lib/careers.test.ts`  
Expected: PASS.

### Task 2: Careers route, page composition, and responsive motion

**Files:**
- Create: `app/careers/page.tsx`
- Create: `components/careers/careers-page.tsx`
- Create: `components/careers/careers-work-field.tsx`
- Create: `components/careers/careers.module.css`
- Test: `tests/components/careers-page.test.tsx`

**Interfaces:**
- Consumes: `CareersPageContent`, `readCareersContent()`, `SiteHeader`, `SiteFooter`, locale context, and existing reveal/motion conventions.
- Produces: `/careers`, localized metadata, `CareersPage`, and a role-list boundary that accepts `readonly CareerRole[]`.

- [ ] **Step 1: Write failing public-page tests**

Assert localized hero and empty state, the `mailto:` open-application link, a fixture role row, semantic section headings, existing site shell, and reduced-motion-safe work-field content.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test:unit -- tests/components/careers-page.test.tsx`  
Expected: FAIL because the Careers components and route do not exist.

- [ ] **Step 3: Implement the semantic page and local role renderer**

Build the Open Door composition from semantic HTML and a CSS Module. Keep the first viewport 45/55 on desktop and stacked on mobile. Render the empty status from `roles.length === 0`; render future roles through the same component.

- [ ] **Step 4: Add restrained work-field motion**

Reveal `BUILD`, `OPERATE`, and `SHARE` plus their connecting paths once. Use `useReducedMotion()` to render the complete final state immediately.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm run test:unit -- tests/components/careers-page.test.tsx`  
Expected: PASS.

### Task 3: Public discovery integration

**Files:**
- Modify: `lib/content.ts`
- Modify: `components/layout/site-footer.tsx`
- Modify: `lib/search/site-search.ts`
- Modify: `app/sitemap.ts`
- Test: `tests/components/careers-discovery.test.tsx`
- Modify: relevant existing Footer, search, and Sitemap tests only where their explicit expectations change.

**Interfaces:**
- Consumes: careers localized content and existing Footer/search/Sitemap registries.
- Produces: one Company-column Footer link, one localized static search result, and one static Sitemap entry for `/careers`.

- [ ] **Step 1: Write failing discovery tests**

Assert the Footer link in both locales, careers keyword search in both locales, localized result text, and a canonical Sitemap entry with monthly frequency.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm run test:unit -- tests/components/careers-discovery.test.tsx`  
Expected: FAIL because discovery entries do not exist.

- [ ] **Step 3: Implement Footer, search, and Sitemap registration**

Add the localized Footer label and import careers content into the static search registry. Add `/careers` to static Sitemap entries without changing document error fallback behavior.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm run test:unit -- tests/components/careers-discovery.test.tsx`  
Expected: PASS.

### Task 4: Documentation, visual verification, and release gate

**Files:**
- Create: `.impeccable/surfaces/app-careers-page-tsx.md`
- Modify: `docs/platform-roadmap.md`
- Create or replace: `.impeccable/review/careers-desktop.png`
- Create or replace: `.impeccable/review/careers-mobile.png`

**Interfaces:**
- Consumes: all prior tasks and the approved comp `.impeccable/mocks/decision/careers-open-door.png`.
- Produces: durable surface guidance, verified screenshots, and milestone status.

- [ ] **Step 1: Run the complete automated release gate**

Run: `npm test`  
Expected: design check, typecheck, lint, unit tests, and production build all PASS.

- [ ] **Step 2: Capture one bounded desktop/mobile visual pass**

Capture Korean desktop at 1440px and English mobile at 390px. Verify header, hero, role status, work field, section rhythm, Footer, focus behavior, and no horizontal overflow.

- [ ] **Step 3: Apply one batched visual correction and confirm once**

Run the visual detector once on changed UI targets, fix mechanical findings, then recapture the same two viewports once.

- [ ] **Step 4: Record the shipped surface and roadmap status**

Write the Careers surface brief and mark Milestone 6 shipped only after the final release gate passes.

- [ ] **Step 5: Commit and open the pull request**

Commit the cohesive milestone, push `codex/careers-page`, and open a PR against `main` with verification evidence.
