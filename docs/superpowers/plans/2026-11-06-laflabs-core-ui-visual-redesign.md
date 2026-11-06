# LafLabs Core UI Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the six high-use LafLabs component families so their primitive pages show a clear visual improvement while preserving existing APIs and application behavior.

**Architecture:** Keep the current owned React components, CSS Modules, native controls, and Radix behavior. Redesign shared family CSS in dependency order, introduce only the data slots needed for stable styling and tests, then synchronize catalog demos and generated public design resources.

**Tech Stack:** React 19, TypeScript 5.9, CSS Modules, Radix UI, Motion, Vitest, Testing Library, Next.js 16.

**Spec:** `docs/superpowers/specs/2026-11-06-laflabs-core-ui-visual-redesign.md`

## Global Constraints

- Preserve Paper `#F8FAFC`, Ink `#0F172A`, Primary Blue `#2563EB`, square geometry, restrained semantic colors, and one-pixel structural rules.
- Do not add rounded corners, shadows, gradients, glass effects, a second theme, or new dependencies.
- Preserve existing exports, common props, semantic HTML, Radix behavior, routes, analytics, data contracts, and product copy.
- Keep one filled Primary action per task region and one outer frame per connected control group.
- Preserve 44px mobile touch targets, two-pixel focus outlines, keyboard behavior, reduced motion, Korean/English labels, and geometry during loading or disabled states.
- Primitive component pages must reveal the redesign without relying on recipe pages.

## Review Focus

- Long Korean and English labels must wrap without changing connected-control geometry; pin this in Tasks 1, 2, and 6 through existing DOM and mobile contract tests.
- Invalid and open form states must not stack conflicting outlines; pin this in Task 2 with shared slot/state assertions and interaction tests.
- Disabled, loading, and reduced-motion states must preserve dimensions and semantics; pin this in Tasks 1, 3, and 4.
- Nested overlays must retain correct focus, dismissal, scroll, and action ordering at 320px; pin this in Task 5 with existing overlay interaction suites.
- Semantic feedback must remain understandable without color; pin this in Task 4 through signal, title, live-region, and accessible-name assertions.

---

### Task 1: Redesign actions and connected action groups

**Files:**
- Modify: `components/ui/button.module.css`
- Modify: `components/ui/button-group.module.css`
- Modify: `components/ui/button.tsx`
- Test: `tests/components/core-ui-actions.test.tsx`
- Test: `tests/components/core-ui-composition-contracts.test.tsx`

**Interfaces:**
- Consumes: existing `ButtonVariant`, `ButtonSize`, `getButtonClassName()` from `components/ui/button-contract.ts`.
- Produces: unchanged Button and ButtonGroup public APIs, stable `data-size`, `data-variant`, and new `data-slot="button"` styling hook.

- [ ] **Step 1: Write failing action-family contract tests**

Add assertions that Button exposes `data-slot="button"`, loading keeps its accessible name and geometry contract, icon buttons retain an accessible name, and horizontal/vertical ButtonGroup retains one named group with connected children.

- [ ] **Step 2: Run action tests and verify the new slot assertion fails**

Run: `npm run test:unit -- tests/components/core-ui-actions.test.tsx tests/components/core-ui-composition-contracts.test.tsx`

Expected: FAIL because Button does not yet expose the new stable slot.

- [ ] **Step 3: Implement the action visual system**

Add `data-slot="button"` in `Button`. Update the CSS to the approved 46px default, 38px compact desktop rhythm, 44px mobile floor, consistent icon/text gap, decisive filled variants, restrained secondary/outline/ghost hierarchy, non-layout-shifting pressed states, and a ButtonGroup-owned outer frame with Line internal dividers.

- [ ] **Step 4: Run action tests**

Run: `npm run test:unit -- tests/components/core-ui-actions.test.tsx tests/components/core-ui-composition-contracts.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add components/ui/button.tsx components/ui/button.module.css components/ui/button-group.module.css tests/components/core-ui-actions.test.tsx tests/components/core-ui-composition-contracts.test.tsx
git commit -m "style: redesign core action components"
```

### Task 2: Unify the form-control chassis

**Files:**
- Modify: `components/ui/form-control.module.css`
- Modify: `components/ui/input.tsx`
- Modify: `components/ui/textarea.tsx`
- Modify: `components/ui/native-select.tsx`
- Modify: `components/ui/select.module.css`
- Modify: `components/ui/combobox.module.css`
- Modify: `components/ui/combobox.tsx`
- Modify: `components/ui/input-group.module.css`
- Modify: `components/ui/input-group.tsx`
- Test: `tests/components/core-ui-forms.test.tsx`
- Test: `tests/components/core-ui-select.test.tsx`
- Test: `tests/components/core-ui-expansion-c1.test.tsx`

**Interfaces:**
- Consumes: Task 1 button dimensions for InputGroupButton and popup actions.
- Produces: stable `data-slot` hooks for control, select trigger, combobox control, and input group; unchanged value/change/ref APIs.

- [ ] **Step 1: Write failing form-family structure tests**

Assert native Input, Textarea, and NativeSelect expose family slots; Select and Combobox expose trigger/control slots; InputGroup keeps one control boundary and its addon placement slots; invalid and disabled semantics remain on the native control.

- [ ] **Step 2: Run form tests and verify slot assertions fail**

Run: `npm run test:unit -- tests/components/core-ui-forms.test.tsx tests/components/core-ui-select.test.tsx tests/components/core-ui-expansion-c1.test.tsx`

Expected: FAIL on the new family slot assertions.

- [ ] **Step 3: Add the stable form slots without changing public APIs**

Add only the `data-slot` attributes required by the tests and CSS. Do not add wrapper elements around native Input or Textarea.

- [ ] **Step 4: Implement the shared field chassis**

Unify height, typography, inset, placeholder, disabled surface, invalid state, blue focus rail, and focus outline. Give Select and Combobox a consistent square icon cell; use a blue side marker plus wash for active popup rows; reduce addon border authority inside InputGroup.

- [ ] **Step 5: Run form tests**

Run: `npm run test:unit -- tests/components/core-ui-forms.test.tsx tests/components/core-ui-select.test.tsx tests/components/core-ui-expansion-c1.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add components/ui/form-control.module.css components/ui/input.tsx components/ui/textarea.tsx components/ui/native-select.tsx components/ui/select.module.css components/ui/combobox.module.css components/ui/combobox.tsx components/ui/input-group.module.css components/ui/input-group.tsx tests/components/core-ui-forms.test.tsx tests/components/core-ui-select.test.tsx tests/components/core-ui-expansion-c1.test.tsx
git commit -m "style: unify core form controls"
```

### Task 3: Redesign selection controls

**Files:**
- Modify: `components/ui/selection-control.module.css`
- Modify: `components/ui/segmented-control.module.css`
- Modify: `components/ui/checkbox.tsx`
- Modify: `components/ui/radio-group.tsx`
- Modify: `components/ui/switch.tsx`
- Test: `tests/components/core-ui-selection.test.tsx`
- Test: `tests/components/core-ui-actions.test.tsx`

**Interfaces:**
- Consumes: shared 44px mobile interaction floor and Primary/semantic tokens.
- Produces: distinct square Checkbox and Radio indicators, unchanged Switch tone API, unchanged SegmentedControl option/value API.

- [ ] **Step 1: Write failing selection-family slot and state tests**

Assert Checkbox, Radio option, Switch, and SegmentedControl expose stable root/control slots; Checkbox and Radio retain distinct indicator anatomy; Switch tone and checked state remain accessible; disabled segmented options remain inert.

- [ ] **Step 2: Run selection tests and verify new slot assertions fail**

Run: `npm run test:unit -- tests/components/core-ui-selection.test.tsx tests/components/core-ui-actions.test.tsx`

Expected: FAIL on missing stable slots.

- [ ] **Step 3: Add stable slots and implement selection visuals**

Create larger clickable rows with quiet hover wash, preserve a check/mixed mark for Checkbox and centered square for Radio, strengthen Switch off/on contrast with mechanical thumb motion, and make SegmentedControl one Ink frame with a full-height selected plane and inactive-only separators.

- [ ] **Step 4: Run selection tests**

Run: `npm run test:unit -- tests/components/core-ui-selection.test.tsx tests/components/core-ui-actions.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add components/ui/selection-control.module.css components/ui/segmented-control.module.css components/ui/checkbox.tsx components/ui/radio-group.tsx components/ui/switch.tsx tests/components/core-ui-selection.test.tsx tests/components/core-ui-actions.test.tsx
git commit -m "style: redesign selection controls"
```

### Task 4: Establish one feedback signal language

**Files:**
- Modify: `components/ui/feedback.module.css`
- Modify: `components/ui/alert.tsx`
- Modify: `components/ui/toast.module.css`
- Modify: `components/ui/toast.tsx`
- Modify: `components/ui/status-label.module.css`
- Modify: `components/ui/spinner.module.css`
- Test: `tests/components/core-ui-c3c-feedback.test.tsx`
- Test: `tests/components/core-ui-c3c-toast.test.tsx`
- Test: `tests/components/core-ui-c3c-spinner.test.tsx`
- Test: `tests/components/panel-status-label.test.tsx`

**Interfaces:**
- Consumes: Task 1 Button hierarchy for feedback actions.
- Produces: shared signal marker/rail grammar while preserving Alert shorthand and compound APIs, Toast hook lifecycle, StatusLabel tones, and Spinner size/label contract.

- [ ] **Step 1: Write failing feedback anatomy tests**

Assert Alert and Toast expose stable signal/content/action slots, StatusLabel exposes its semantic marker and text slot, Spinner remains a labelled square status, and every semantic component includes readable text in addition to color.

- [ ] **Step 2: Run feedback tests and verify slot assertions fail**

Run: `npm run test:unit -- tests/components/core-ui-c3c-feedback.test.tsx tests/components/core-ui-c3c-toast.test.tsx tests/components/core-ui-c3c-spinner.test.tsx tests/components/panel-status-label.test.tsx`

Expected: FAIL on the new anatomy slots.

- [ ] **Step 3: Add feedback slots and implement the shared signal grammar**

Use a semantic leading cell or block, strong title, restrained description, and separated action zone. Keep Toast compact, StatusLabel borderless, and Spinner single-color/currentColor with the approved non-rotating square-gap motion and reduced-motion fallback.

- [ ] **Step 4: Run feedback tests**

Run: `npm run test:unit -- tests/components/core-ui-c3c-feedback.test.tsx tests/components/core-ui-c3c-toast.test.tsx tests/components/core-ui-c3c-spinner.test.tsx tests/components/panel-status-label.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add components/ui/feedback.module.css components/ui/alert.tsx components/ui/toast.module.css components/ui/toast.tsx components/ui/status-label.module.css components/ui/spinner.module.css tests/components/core-ui-c3c-feedback.test.tsx tests/components/core-ui-c3c-toast.test.tsx tests/components/core-ui-c3c-spinner.test.tsx tests/components/panel-status-label.test.tsx
git commit -m "style: unify feedback component language"
```

### Task 5: Give surfaces a consistent workspace grammar

**Files:**
- Modify: `components/ui/panel.module.css`
- Modify: `components/ui/panel.tsx`
- Modify: `components/ui/overlay-shell.module.css`
- Modify: `components/ui/dialog.tsx`
- Modify: `components/ui/alert-dialog.tsx`
- Modify: `components/ui/popover.module.css`
- Modify: `components/ui/popover.tsx`
- Modify: `components/ui/side-panel.module.css`
- Modify: `components/ui/side-panel.tsx`
- Test: `tests/components/panel-status-label.test.tsx`
- Test: `tests/components/core-ui-dialog.test.tsx`
- Test: `tests/components/core-ui-c3c-alert-dialog.test.tsx`
- Test: `tests/components/core-ui-expansion-c1.test.tsx`

**Interfaces:**
- Consumes: Task 1 action hierarchy, Task 2 field chassis, and Task 4 feedback hierarchy.
- Produces: stable header/body/footer/action slots across Panel and overlays with unchanged compound APIs.

- [ ] **Step 1: Write failing surface anatomy tests**

Assert Panel, Dialog, AlertDialog, Popover, and SidePanel expose named header/body/footer/action slots while retaining accessible title/description, focus management, dismissal, close labels, and scroll props.

- [ ] **Step 2: Run surface tests and verify new slot assertions fail**

Run: `npm run test:unit -- tests/components/panel-status-label.test.tsx tests/components/core-ui-dialog.test.tsx tests/components/core-ui-c3c-alert-dialog.test.tsx tests/components/core-ui-expansion-c1.test.tsx`

Expected: FAIL on missing surface slots.

- [ ] **Step 3: Add stable slots without changing compound component signatures**

Add `data-slot` only to existing elements. Preserve Radix primitives and portal/focus behavior.

- [ ] **Step 4: Implement the workspace visual grammar**

Give Panel a recognizable header zone and open body; give Dialog and AlertDialog a top identity rail, decisive title, stable close cell, and unboxed action footer; make Popover a denser tool surface; align SidePanel to the same header/body/footer rhythm.

- [ ] **Step 5: Run surface tests**

Run: `npm run test:unit -- tests/components/panel-status-label.test.tsx tests/components/core-ui-dialog.test.tsx tests/components/core-ui-c3c-alert-dialog.test.tsx tests/components/core-ui-expansion-c1.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add components/ui/panel.module.css components/ui/panel.tsx components/ui/overlay-shell.module.css components/ui/dialog.tsx components/ui/alert-dialog.tsx components/ui/popover.module.css components/ui/popover.tsx components/ui/side-panel.module.css components/ui/side-panel.tsx tests/components/panel-status-label.test.tsx tests/components/core-ui-dialog.test.tsx tests/components/core-ui-c3c-alert-dialog.test.tsx tests/components/core-ui-expansion-c1.test.tsx
git commit -m "style: redesign core surface components"
```

### Task 6: Redesign pagination and tabs

**Files:**
- Modify: `components/ui/pagination.module.css`
- Modify: `components/ui/pagination.tsx`
- Modify: `components/ui/tabs.module.css`
- Modify: `components/ui/tabs.tsx`
- Test: `tests/components/core-ui-c3c-pagination.test.tsx`
- Test: `tests/components/core-ui-tabs.test.tsx`

**Interfaces:**
- Consumes: Task 1 interaction density and focus grammar.
- Produces: unchanged Pagination anchor semantics and Tabs Radix/value APIs with stable navigation slots.

- [ ] **Step 1: Write failing navigation slot tests**

Assert pagination direction/page/current slots and tab list/trigger/content slots exist; preserve current-page semantics, disabled boundary behavior, keyboard selection, and long-label accessibility.

- [ ] **Step 2: Run navigation tests and verify slot assertions fail**

Run: `npm run test:unit -- tests/components/core-ui-c3c-pagination.test.tsx tests/components/core-ui-tabs.test.tsx`

Expected: FAIL on missing navigation slots.

- [ ] **Step 3: Add navigation slots and implement the visual redesign**

Separate direction actions from the lighter page-number rail, make the current page a blue lower plane rather than an oversized tile, strengthen active Tab typography and label-tied square indicator, and preserve horizontal overflow plus mobile touch sizing.

- [ ] **Step 4: Run navigation tests**

Run: `npm run test:unit -- tests/components/core-ui-c3c-pagination.test.tsx tests/components/core-ui-tabs.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit Task 6**

```bash
git add components/ui/pagination.module.css components/ui/pagination.tsx components/ui/tabs.module.css components/ui/tabs.tsx tests/components/core-ui-c3c-pagination.test.tsx tests/components/core-ui-tabs.test.tsx
git commit -m "style: redesign navigation primitives"
```

### Task 7: Synchronize the public catalog and verify the release

**Files:**
- Modify: `components/design-system/component-demo-*.tsx` only where a redesigned primitive state is not visible in the current demo
- Modify: `lib/design-system/component-catalog/*.ts` only when anatomy or state guidance changed
- Modify: `lib/design-system/meta.ts`
- Regenerate: `DESIGN.md`
- Test: `tests/design-system/catalog.test.ts`
- Test: `tests/design-system/serialize.test.ts`
- Test: `tests/design-system/routes.test.ts`
- Test: `tests/components/design-guide.test.tsx`
- Test: `tests/components/design-system-primitives.test.tsx`

**Interfaces:**
- Consumes: redesigned components from Tasks 1–6.
- Produces: public design-system version `2026.11.0`, synchronized generated guidance, and primitive demos that expose default, hover/focus guidance, selected, disabled, invalid, open, loading, and semantic states.

- [ ] **Step 1: Write failing version and catalog-state assertions**

Update expected public version to `2026.11.0` and assert each redesigned family has a primitive demo/state entry that reveals its new anatomy without depending on recipes.

- [ ] **Step 2: Run catalog/resource tests and verify they fail**

Run: `npm run test:unit -- tests/design-system/catalog.test.ts tests/design-system/serialize.test.ts tests/design-system/routes.test.ts tests/components/design-guide.test.tsx tests/components/design-system-primitives.test.tsx`

Expected: FAIL on the old version or missing state coverage.

- [ ] **Step 3: Update demos, catalog metadata, and version**

Change only the entries required to show the redesigned primitives. Do not replace real examples with decorative showcases.

- [ ] **Step 4: Regenerate and validate public design resources**

Run: `npm run design:generate && npm run design:check`

Expected: both commands PASS and generated files remain deterministic.

- [ ] **Step 5: Run targeted catalog/resource tests**

Run: `npm run test:unit -- tests/design-system/catalog.test.ts tests/design-system/serialize.test.ts tests/design-system/routes.test.ts tests/components/design-guide.test.tsx tests/components/design-system-primitives.test.tsx`

Expected: PASS.

- [ ] **Step 6: Run full verification**

Run: `npm run lint && npm run typecheck && npm run test:unit && npm run build && git diff --check`

Expected: lint and typecheck PASS; all unit tests PASS; Next.js production build PASS; no whitespace errors.

- [ ] **Step 7: Run the Impeccable detector and bounded visual review**

Run: `node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json components/ui components/design-system`

Expected: no unaddressed findings. Review desktop and mobile primitive pages once, fix all observed defects in one batch, then confirm once.

- [ ] **Step 8: Commit Task 7 and update PR #69**

```bash
git add DESIGN.md components/design-system lib/design-system tests/design-system tests/components/design-guide.test.tsx tests/components/design-system-primitives.test.tsx
git commit -m "docs: publish core ui visual redesign"
git push origin codex/design-system-component-polish
```

Update PR #69 with the visual-redesign scope, verification totals, and a short manual review checklist.
