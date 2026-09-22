# LafLabs Core UI — Delivery B Implementation Plan

> **For Codex:** Execute this plan with `superpowers:executing-plans`. Use TDD for every public interaction contract and keep the work inside `codex/laflabs-core-ui-delivery-b`.

**Goal:** Expand LafLabs Core UI from native foundations into six accessible composite controls—Select, Dropdown Menu, Dialog, Tabs, Accordion, and Tooltip—and publish each control as a real, inspectable, copyable design-guide component.

**Architecture:** Use the unified `radix-ui` package only as the behavior/accessibility engine. Each LafLabs wrapper owns its TypeScript API, CSS Module, icon choices, copy, and public documentation. Compound exports stay close to Radix conventions so they are easy to compose, while defaults enforce LafLabs square geometry, one-pixel rules, Paper/Ink/Primary Blue surfaces, keyboard focus, mobile touch targets, reduced motion, and portal layering.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript 5.9, CSS Modules, unified `radix-ui`, Phosphor Icons, Vitest, Testing Library, Playwright/browser verification.

**Spec:** `docs/superpowers/specs/2026-09-20-laflabs-core-ui-design.md`

**Global Constraints:**

- Preserve the stable Delivery A APIs and generated design resources.
- Do not install or copy the shadcn theme, Tailwind component styles, rounded cards, gradients, or shadow-heavy surfaces.
- Interactive wrappers are local Client Components; server-rendered design pages remain Server Components.
- Every popup works by keyboard, restores focus appropriately, supports 320px layouts and 200% zoom, and disables non-essential motion for `prefers-reduced-motion`.
- Public examples use real LafLabs components and can be copied without hidden application context.
- No product claims or invented brand assets.

**Review Focus:**

- Focus trap, Escape dismissal, outside interaction, focus restoration, roving focus, arrow-key navigation, and disabled-item behavior.
- Portal width/position at narrow viewports and layering above the fixed site header.
- Controlled and uncontrolled APIs, ref forwarding, className composition, and stable data-state hooks.
- Korean and English labels, long copy, touch targets, reduced motion, and no horizontal overflow.
- Catalog completeness: metadata, demos, state previews, imports, usage, dependency disclosure, slugs, sitemap, generated `DESIGN.md`, and public AI resources.

---

### Task 1: Add the behavior dependency and LafLabs Select

**Files:**
- Modify: `package.json`, `package-lock.json`, `tests/setup.ts`
- Create: `components/ui/select.tsx`, `components/ui/select.module.css`
- Create: `tests/components/core-ui-select.test.tsx`

**Interfaces:**
- Export `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, and `SelectSeparator`.
- `SelectTrigger` accepts standard Radix trigger props plus `className`; content owns portal, scroll controls, and viewport.
- Select depends on `radix-ui` and Phosphor icons but exposes no third-party styling contract.

1. Install the current unified `radix-ui` package and add only the DOM polyfills that the real interaction tests require.
2. Write tests first for trigger/value exposure, opening by pointer and keyboard, arrow-key selection, `onValueChange`, disabled items, selected indicator, and focus return.
3. Run the focused test and confirm failure because the LafLabs wrapper does not exist.
4. Implement the minimal compound API and CSS, including trigger-width content, max-height scrolling, square geometry, 44px items, visible focus, state animations, and reduced-motion fallback.
5. Run the focused test, typecheck, and lint; commit as `feat: add LafLabs select primitive`.

### Task 2: Add Dropdown Menu

**Files:**
- Create: `components/ui/dropdown-menu.tsx`, `components/ui/dropdown-menu.module.css`
- Create: `tests/components/core-ui-dropdown-menu.test.tsx`

**Interfaces:**
- Export root, trigger, content, group, label, item, checkbox item, radio group/item, separator, sub/sub-trigger/sub-content, and shortcut helpers.
- Content and sub-content own their portals and collision padding.

1. Write failing tests for open/close, keyboard item activation, disabled item skipping, checkbox/radio state, submenu access, Escape dismissal, and focus restoration.
2. Implement the public compound API with LafLabs icons and semantic state attributes.
3. Style compact Paper/Ink menus with one-pixel rules, 44px touch rows, no rounded shell, viewport collision handling, and restrained enter/exit motion.
4. Run the focused test, existing action/selection tests, typecheck, and lint; commit as `feat: add LafLabs dropdown menu`.

### Task 3: Add Dialog

**Files:**
- Create: `components/ui/dialog.tsx`, `components/ui/dialog.module.css`
- Create: `tests/components/core-ui-dialog.test.tsx`

**Interfaces:**
- Export `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, and `DialogClose`.
- `DialogContent` always renders a labeled visible close control and accepts a localized `closeLabel`.

1. Write failing tests for accessible title/description, focus trap, close button, Escape/outside dismissal, focus restoration, and controlled state changes.
2. Implement the dialog wrapper, portal, overlay, close control, and structural helpers.
3. Style a responsive editorial sheet with square geometry, one-pixel framing, bounded height, internal overflow, and reduced-motion behavior.
4. Run focused tests, typecheck, and lint; commit as `feat: add LafLabs dialog primitive`.

### Task 4: Add Tabs

**Files:**
- Create: `components/ui/tabs.tsx`, `components/ui/tabs.module.css`
- Create: `tests/components/core-ui-tabs.test.tsx`

**Interfaces:**
- Export `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent` with Radix-compatible props and forwarded refs.

1. Write failing tests for initial value, controlled changes, arrow-key roving focus, disabled triggers, active state, and panel association.
2. Implement the compound API and an overflow-safe tab list.
3. Style the active tab as a measured blue rule/square state, preserve visible focus, and support horizontal scrolling without clipping focus rings.
4. Run focused tests, typecheck, and lint; commit as `feat: add LafLabs tabs primitive`.

### Task 5: Add Accordion

**Files:**
- Create: `components/ui/accordion.tsx`, `components/ui/accordion.module.css`
- Create: `tests/components/core-ui-accordion.test.tsx`

**Interfaces:**
- Export `Accordion`, `AccordionItem`, `AccordionTrigger`, and `AccordionContent`; retain Radix single/multiple and collapsible modes.

1. Write failing tests for single and multiple disclosure, collapsible behavior, keyboard focus movement, disabled items, and expanded state.
2. Implement the compound API with a decorative caret and CSS height variables supplied by Radix.
3. Style rule-separated disclosure rows with clear state, content rhythm, and reduced-motion fallback.
4. Run focused tests, typecheck, and lint; commit as `feat: add LafLabs accordion primitive`.

### Task 6: Add Tooltip

**Files:**
- Create: `components/ui/tooltip.tsx`, `components/ui/tooltip.module.css`
- Create: `tests/components/core-ui-tooltip.test.tsx`

**Interfaces:**
- Export `TooltipProvider`, `Tooltip`, `TooltipTrigger`, and `TooltipContent`.
- Provider delay remains configurable and is local to the consuming surface; no global layout provider is introduced.

1. Write failing tests for accessible trigger description, hover/focus open, Escape dismissal, disabled-delay configuration, and portal content.
2. Implement the wrapper and a square arrowless LafLabs tooltip surface.
3. Style compact inverse copy with safe viewport collision and reduced motion.
4. Run focused tests, typecheck, and lint; commit as `feat: add LafLabs tooltip primitive`.

### Task 7: Publish Delivery B in the design guide

**Files:**
- Modify: `lib/design-system/component-options.ts`, `lib/design-system/component-slugs.ts`, `lib/design-system/components.ts`, `lib/design-system/component-catalog/forms.ts`, `lib/design-system/meta.ts`
- Create: `lib/design-system/component-catalog/navigation.ts`, `lib/design-system/component-catalog/disclosure.ts`, `lib/design-system/component-catalog/overlays.ts`
- Modify: `components/design-system/component-demo-registry.tsx`, `components/design-system/design-system.module.css`
- Create: `components/design-system/component-demo-composites.tsx`
- Modify/Create focused design-system tests as needed.

**Interfaces:**
- Add six new component IDs and demo keys without weakening the exhaustive registry type.
- Every entry has bilingual guidance, accessibility notes, states, props, source path, `radix-ui` dependency disclosure, imports, usage, and related components.

1. Write failing catalog tests for 26 unique slugs, six new real demos, dependency metadata, and `/design/components/<slug>` static params.
2. Add catalog metadata and interactive Korean/English demos that expose common, disabled, open, and selected states without requiring hidden application state.
3. Extend the registry and demo styling; keep overlays usable inside the preview stage and avoid document overflow.
4. Update meta version/date to `2026.9.2` / `2026-09-22` and run `npm run design:generate`.
5. Run design tests, `npm run design:check`, typecheck, and lint; commit as `docs: publish composite Core UI components`.

### Task 8: Verify the complete Delivery B surface

**Files:**
- Modify: `.impeccable/design.json`, `DESIGN.md` only where generated/required
- Modify production/tests only for verified defects.

1. Refresh the Impeccable sidecar with representative Select, Dialog, Tabs, and Accordion snippets while preserving schema version 2 and public-variable-only CSS.
2. Run focused unit suites for all six composites and the design catalog.
3. Run `npm test` and `git diff --check`.
4. Run the Impeccable detector once over `components/ui`, `components/design-system`, and `app/(documents)/design`; fix verified Critical/Important findings in one batch with regression tests.
5. Inspect `/design/components` and each new detail route at desktop and 320px widths in Korean and English. Verify keyboard-only use, long copy, overlays, 200% zoom, reduced motion, and no horizontal overflow.
6. Re-run `npm test`, generate the final whole-branch review package, receive one fresh reviewer pass, resolve Critical/Important findings, and rerun the full suite.
7. Commit final verification artifacts as `chore: verify Core UI delivery B`, push `codex/laflabs-core-ui-delivery-b`, and open a PR to `main`.
