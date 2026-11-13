# Evidence-led `/home` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a reviewable `/home` experiment that retains LafLabs' current frame while replacing generated-looking visual metaphors with credible software artifacts and restrained flat technical illustrations.

**Architecture:** Add a route-local page composition and route-local CSS/components under `components/home-experiment/`, while reusing the existing site header, footer, locale provider, analytics conventions, content APIs, and latest-signals section. Static bilingual content and verified artifact data live in one focused module so the experiment can later replace `/` without coupling to the current `Landing` component.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Motion 12, Phosphor Icons, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-13-home-evidence-refresh-design.md`

## Global Constraints

- Keep `/` unchanged; all experimental presentation lives at `/home`.
- Preserve the current square geometry, `#2563eb` blue identity, shared header/footer, Korean/English locale behavior, accessibility, and reduced-motion support.
- Do not invent customers, metrics, availability, product capabilities, testimonials, or links.
- Do not use the existing abstract 3D work images on `/home`.
- Use only existing dependencies and public, verified LafLabs content.
- Keep the experiment promotable by replacing the root page composition rather than rewriting its sections.

## Review Focus

- Korean and English strings of different lengths must not overflow or collapse the intended hierarchy at 390px and 1280px.
- Motion-disabled visitors must see the complete final artifact state with no hidden copy or blank media areas.
- Unavailable products and undisclosed projects must remain visibly unavailable and must not gain interactive destinations.
- `/home` must preserve shared search, locale, GitHub, consent, and analytics behavior supplied by the global shell.
- Product/artifact visuals must remain readable on mobile without shrinking UI text below a credible interface scale.

---

### Task 1: Route and verified experiment content

**Files:**
- Create: `app/home/page.tsx`
- Create: `lib/home-experiment.ts`
- Create: `tests/components/home-experiment-page.test.tsx`

**Interfaces:**
- Consumes: `SiteHeader`, `SiteFooter`, `Locale`, existing public links and work metadata.
- Produces: `homeExperimentCopy: Record<Locale, HomeExperimentCopy>` and `homeExperimentWork: readonly HomeExperimentWorkItem[]` for the page composition.

- [ ] **Step 1: Write the failing route/content tests**

Assert that the `/home` page composes the shared header and footer around a route-local landing component; assert Korean and English content exists; assert every public work link matches an existing verified destination and unavailable items have no `href`.

- [ ] **Step 2: Run the targeted test and verify failure**

Run: `npx vitest run tests/components/home-experiment-page.test.tsx`

Expected: FAIL because `app/home/page.tsx` and `lib/home-experiment.ts` do not exist.

- [ ] **Step 3: Implement route and content contracts**

Create `HomeExperimentCopy`, `HomeExperimentArtifact`, and `HomeExperimentWorkItem` types. Populate them from currently published LafLabs claims only, with source comments for lafetch code, Laf ID standards, and lafwall description. Compose `SiteHeader`, `EvidenceHome`, and `SiteFooter` in `app/home/page.tsx`.

- [ ] **Step 4: Run the targeted test**

Run: `npx vitest run tests/components/home-experiment-page.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/home/page.tsx lib/home-experiment.ts tests/components/home-experiment-page.test.tsx
git commit -m "feat: scaffold evidence-led home experiment"
```

### Task 2: Evidence scenes and compact variants

**Files:**
- Create: `components/home-experiment/evidence-scenes.tsx`
- Create: `components/home-experiment/evidence-scenes.module.css`
- Create: `tests/components/home-evidence-scenes.test.tsx`

**Interfaces:**
- Consumes: `HomeExperimentArtifact` and locale-aware strings from Task 1.
- Produces: `BuildScene`, `MethodScene`, `IdentityArtifact`, `LafetchArtifact`, and `LafwallArtifact` React components with a `compact?: boolean` presentation contract.

- [ ] **Step 1: Write failing scene tests**

Assert each scene exposes a stable `data-evidence-scene` identifier, uses real focal strings from its artifact data, marks purely explanatory SVGs `aria-hidden`, and renders a complete non-animated state when reduced motion is requested.

- [ ] **Step 2: Run the targeted test and verify failure**

Run: `npx vitest run tests/components/home-evidence-scenes.test.tsx`

Expected: FAIL because the evidence scene module does not exist.

- [ ] **Step 3: Implement the evidence scenes**

Build route-local HTML/CSS/SVG scenes using existing color tokens and square geometry. Keep focal UI strings at 11–15px design scale, use one consistent route stroke, and provide explicit mobile compositions through CSS/container variants rather than uniform scaling.

- [ ] **Step 4: Verify scene tests**

Run: `npx vitest run tests/components/home-evidence-scenes.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/home-experiment/evidence-scenes.tsx components/home-experiment/evidence-scenes.module.css tests/components/home-evidence-scenes.test.tsx
git commit -m "feat: add credible product evidence scenes"
```

### Task 3: Experimental homepage composition

**Files:**
- Create: `components/home-experiment/evidence-home.tsx`
- Create: `components/home-experiment/evidence-home.module.css`
- Modify: `app/home/page.tsx`
- Modify: `tests/components/home-experiment-page.test.tsx`

**Interfaces:**
- Consumes: content from Task 1, evidence scenes from Task 2, `LatestSignals`, locale and analytics providers already mounted by the root layout.
- Produces: `EvidenceHome` route composition with hero, company, method, selected work, open-source, and latest-signals sections.

- [ ] **Step 1: Extend the page test with composition and safety assertions**

Assert all six named areas render; `/work/*.webp` abstract 3D images are absent; unavailable work has no anchor; public lafetch evidence has the verified GitHub destination; and the current root `Landing` import remains unchanged.

- [ ] **Step 2: Run the targeted test and verify failure**

Run: `npx vitest run tests/components/home-experiment-page.test.tsx`

Expected: FAIL because `EvidenceHome` is not implemented.

- [ ] **Step 3: Implement the route composition**

Compose the approved sequence. Reuse shared shell components and `LatestSignals`, but keep section markup, motion, and styles route-local. Use one primary artifact per section, preserve visible product status, and keep motion entry-only with complete static reduced-motion fallbacks.

- [ ] **Step 4: Add responsive behavior**

At 900px and below, switch paired compositions to stacked compact scenes. Ensure selected-work navigation reveals continuation through a visible next edge/control without scroll-jacking. Validate that Korean line breaks remain deliberate and English copy uses a bounded measure.

- [ ] **Step 5: Verify targeted component tests**

Run: `npx vitest run tests/components/home-experiment-page.test.tsx tests/components/home-evidence-scenes.test.tsx tests/components/latest-signals.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/home/page.tsx components/home-experiment/evidence-home.tsx components/home-experiment/evidence-home.module.css tests/components/home-experiment-page.test.tsx
git commit -m "feat: compose evidence-led home experiment"
```

### Task 4: Render verification and production checks

**Files:**
- Modify: route-local files from Tasks 1–3 only when the bounded visual review identifies defects.
- Create: `docs/superpowers/reviews/2026-11-13-home-evidence-refresh.md`

**Interfaces:**
- Consumes: completed `/home` experiment.
- Produces: verified desktop/mobile/reduced-motion page and a concise review record.

- [ ] **Step 1: Run the full automated checks**

Run: `npm test`

Expected: design check, typecheck, lint, 1,400+ unit tests, and production build all pass; the build route table includes `/home`.

- [ ] **Step 2: Run the Impeccable detector once**

Run: `/home/singlethread/.agents/skills/impeccable/scripts/impeccable detect --json app/home/page.tsx components/home-experiment/evidence-home.tsx components/home-experiment/evidence-home.module.css components/home-experiment/evidence-scenes.tsx components/home-experiment/evidence-scenes.module.css`

Expected: no unresolved high-confidence findings.

- [ ] **Step 3: Perform one batched visual review**

Capture `/home` at desktop 1440×1000 and mobile 390×844, plus one reduced-motion mobile capture. Review hierarchy, Korean/English overflow, evidence readability, continuation affordances, accidental crops, and layout shift in a single batch.

- [ ] **Step 4: Fix all findings in one batch and confirm once**

Make only route-local corrections, then repeat the same captures once. Stop after the confirmation pass.

- [ ] **Step 5: Write the review record**

Record capture sizes, checks performed, remaining asset limitations, and the exact promotion step from `/home` to `/` in `docs/superpowers/reviews/2026-11-13-home-evidence-refresh.md`.

- [ ] **Step 6: Commit**

```bash
git add app/home components/home-experiment lib/home-experiment.ts tests/components/home-experiment-page.test.tsx tests/components/home-evidence-scenes.test.tsx docs/superpowers/reviews/2026-11-13-home-evidence-refresh.md
git commit -m "test: verify evidence-led home experiment"
```
