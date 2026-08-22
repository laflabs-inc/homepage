# LafLabs Homepage Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the LafLabs homepage around the approved Signal Routing Field composition and official brand asset.

**Architecture:** Keep the current single-page Next.js structure, bilingual content source, and Motion leaf components. Replace only the logo asset, hero/product composition, shared visual tokens, and inaccurate company contact values; reuse the existing section boundaries and dependencies.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Motion, TypeScript

**Spec:** `docs/superpowers/specs/2026-08-22-homepage-rework-design.md`

## Global Constraints

- Use only verified copy from `lib/content.ts` or user-confirmed values.
- Official domain: `https://laflabs.co`.
- Official email: `contact@laflabs.co`.
- Preserve Korean and English, square geometry, blue branding, keyboard access, and reduced motion.
- Add no dependencies and invent no product claims, metrics, customers, or availability.

---

### Task 1: Correct Brand Truth and Logo

**Files:**
- Create: `public/laflabs-logo.png`
- Modify: `components/ui/logo.tsx`
- Modify: `lib/content.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: official GitHub organization avatar and existing `Logo` component API.
- Produces: `Logo({ size?: number })`, `siteUrl`, `contactEmail`, and accurate organization metadata.

- [ ] **Step 1: Add the official asset**

Copy the verified GitHub organization avatar to `public/laflabs-logo.png` without altering its mark.

- [ ] **Step 2: Replace the generated SVG implementation**

```tsx
export function Logo({ size = 24 }: { size?: number }) {
  return <Image src="/laflabs-logo.png" width={size} height={size} alt="" />
}
```

Keep the existing LafLabs wordmark text and public `Logo` API; remove `LogoMark` if no caller remains.

- [ ] **Step 3: Correct canonical values**

```ts
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://laflabs.co"
export const contactEmail = "contact@laflabs.co"
```

Update JSON-LD to use only these exported values.

- [ ] **Step 4: Run the static checks**

Run: `npm run typecheck && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add public/laflabs-logo.png components/ui/logo.tsx lib/content.ts app/page.tsx
git commit -m "fix: use official LafLabs identity"
```

### Task 2: Build the Signal Routing Hero

**Files:**
- Modify: `components/sections/hero.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `copy[locale].hero`, `products`, existing locale context, Motion, and `prefers-reduced-motion` handling.
- Produces: semantic product links in `.hero-routing-plane` and stable desktop/mobile layouts.

- [ ] **Step 1: Replace the hero structure**

Build one left message column and one right routing plane. Map the existing `products` array into three real links or unavailable product rows. Use existing translated CTA strings.

```tsx
<section className="hero" id="top">
  <div className="hero-inner">
    <div className="hero-copy">...</div>
    <div className="hero-routing-plane" aria-label={t.primary}>...</div>
  </div>
</section>
```

- [ ] **Step 2: Add the minimum SVG routing layer**

Use one decorative SVG with three paths and square endpoints. Keep all product text and actions in semantic HTML rather than the SVG.

```tsx
<svg className="routing-lines" viewBox="0 0 720 520" aria-hidden="true">
  <path pathLength="1" d="M40 260H340L500 100H680" />
  <path pathLength="1" d="M40 260H680" />
  <path pathLength="1" d="M40 260H340L500 420H680" />
</svg>
```

- [ ] **Step 3: Rework shared tokens and responsive CSS**

Set the page-level navy, blue, off-white, and blue-grey tokens from the approved comp. Implement the 45/55 desktop split and a single-column mobile fallback with no horizontal overflow. Keep all radii at zero.

- [ ] **Step 4: Preserve accessible motion behavior**

Animate only route drawing and entry opacity with the installed Motion package. Under reduced motion, render every route and item fully visible without transition.

- [ ] **Step 5: Run the static checks**

Run: `npm run typecheck && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add components/sections/hero.tsx app/globals.css
git commit -m "feat: add signal routing homepage hero"
```

### Task 3: Align the Remaining Page and Verify

**Files:**
- Modify: `components/sections/products.tsx`
- Modify: `components/layout/site-header.tsx`
- Modify: `components/layout/site-footer.tsx`
- Modify: `app/globals.css`
- Create: `DESIGN.md`

**Interfaces:**
- Consumes: existing section content and anchor IDs.
- Produces: consistent product navigation, contact actions, responsive sections, and documented visual rules.

- [ ] **Step 1: Make products the primary continuation**

Remove repeated section numbering and oversized ghost labels from the product list. Keep product status, description, points, and working links intact.

- [ ] **Step 2: Align navigation and footer**

Keep desktop navigation to one line, use the official logo component, and ensure every contact action resolves to `mailto:contact@laflabs.co`.

- [ ] **Step 3: Remove template-like repetition**

Limit eyebrow labels, remove the hero scroll cue, keep at most one marquee, and reuse spacing or dividers instead of adding cards.

- [ ] **Step 4: Run full verification**

Run: `npm test`

Expected: typecheck, lint, and production build all exit 0.

- [ ] **Step 5: Run the design detector**

Run:

```bash
node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json app/page.tsx app/globals.css components
```

Expected: no unresolved mechanical failures in changed UI targets.

- [ ] **Step 6: Inspect desktop and mobile output**

Capture one desktop and one mobile screenshot, verify both images are non-empty, and check Korean and English, navigation, product links, contact link, focus styles, and reduced motion.

- [ ] **Step 7: Record the built system**

Write `DESIGN.md` from the shipped implementation: exact colors, typography, square geometry, routing grammar, responsive rules, and motion limits.

- [ ] **Step 8: Commit**

```bash
git add components/sections/products.tsx components/layout/site-header.tsx components/layout/site-footer.tsx app/globals.css DESIGN.md
git commit -m "feat: complete LafLabs homepage rework"
```
