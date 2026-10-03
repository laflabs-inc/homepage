# LafLabs Core UI v2 Form Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Core UI v2 C3B with composable Field and InputGroup families, square RadioGroup selection, configurable Switch tones, production form recipes, and a representative Admin migration.

**Architecture:** Keep native inputs, labels, fieldsets, radios, checkboxes, and buttons as the semantic foundation. Expand the existing LafLabs-owned compound APIs instead of introducing a form framework or copying shadcn source, while preserving current props as compatibility paths. CSS Modules own square geometry, connected one-pixel boundaries, responsive orientation, and state styling.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript 5.9, CSS Modules, Phosphor Icons, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-01-laflabs-core-ui-v2-design.md`

## Global Constraints

- Preserve native form semantics and browser behavior; do not introduce React Hook Form, CVA, Tailwind, or a new interaction dependency.
- Preserve Paper `#F8FAFC`, Ink `#0F172A`, Primary Blue `#2563EB`, zero-radius geometry, one-pixel rules, Geist Sans, Pretendard, and restrained motion.
- Keep existing Field, InputGroup, RadioGroup, and Switch call sites source-compatible unless the plan explicitly names a new preferred prop.
- Labels remain visible above their controls by default; placeholders never replace labels.
- Error copy renders below the control and must be connected through `aria-describedby`; invalid controls expose `aria-invalid`.
- Radio indicators are square and communicate selection with both fill and an inner square, not color alone.
- Switch checked tones are semantic options, not arbitrary colors, and disabled state preserves the current checked value.
- New public examples use realistic LafLabs Admin compositions without inventing product claims or operational data.
- Every interactive target remains keyboard reachable, at least 44px on small screens, and usable at 320px and 200% zoom.
- Read the relevant files under `node_modules/next/dist/docs/` before changing App Router pages.

## Review Focus

- A Field with nested `FieldContent` must still connect its label, description, and error to an Input or InputGroup control; Task 1 adds the nested relationship test.
- A responsive or horizontal Field must return to a single vertical column at 320px without shrinking its control below usable width; Tasks 1 and 6 cover CSS and browser review.
- InputGroup must support inline and block add-ons without doubled rules, clipped Korean copy, or multiple tabbable wrappers; Tasks 2 and 6 cover structure and responsive review.
- RadioGroup must preserve controlled and uncontrolled values after the visual indicator becomes square; Task 3 pins both modes, and Task 6 verifies native arrow-key behavior in a browser.
- Switch tone changes must affect only the checked surface, while off, focus, disabled, form submission, and accessible naming remain unchanged; Task 3 tests the full state matrix.

---

## File structure

### Field composition

- `components/ui/field.tsx`: Field context, relationship wiring, orientation, and compound FieldGroup, FieldSet, FieldLegend, and FieldContent parts.
- `components/ui/field.module.css`: vertical, horizontal, and responsive composition plus group and fieldset spacing.
- `tests/components/core-ui-forms.test.tsx`: semantic relationships, compound structure, orientation, and compatibility.

### Input composition

- `components/ui/input-group.tsx`: InputGroup, InputGroupInput, InputGroupTextarea, Addon, Text, and Button APIs.
- `components/ui/input-group.module.css`: grid-owned inline and block placement, shared focus and invalid boundaries, responsive behavior.
- `tests/components/core-ui-expansion-c1.test.tsx`: compound InputGroup behavior and compatibility placement values.

### Selection controls

- `components/ui/radio-group.tsx`: existing native radio contract with explicit data slots for square visuals.
- `components/ui/switch.tsx`: checked-tone contract and data attributes.
- `components/ui/selection-control.module.css`: square radio indicator and semantic Switch checked tones.
- `tests/components/core-ui-selection.test.tsx`: native selection, keyboard, tone, form, focus, and disabled contracts.

### Catalog, recipes, and adoption

- `components/design-system/component-demo-forms.tsx`: complete Field compositions and document-settings recipe.
- `components/design-system/component-demo-core-expansion.tsx`: inline and multiline InputGroup recipes.
- `components/design-system/component-demo-selection.tsx`: square radio and Switch tone state demos.
- `components/design-system/design-system.module.css`: responsive recipe layout only.
- `lib/design-system/component-catalog/forms.ts`: Field family documentation and realistic examples.
- `lib/design-system/component-catalog/core-expansion.ts`: InputGroup family documentation and examples.
- `lib/design-system/component-catalog/selection.ts`: RadioGroup and Switch tone documentation.
- `components/admin/document-editor.tsx`: representative Admin document-settings migration.
- `app/admin/admin.module.css`: remove superseded raw form-control rules and retain page layout only.
- `tests/components/document-admin.test.tsx`: behavior-preserving proof migration tests.
- `tests/design-system/catalog.test.ts`, `tests/design-system/serialize.test.ts`, and `tests/components/design-system-pages.test.tsx`: public and AI-readable contract.

---

### Task 1: Expand the Field compound family

**Files:**
- Modify: `components/ui/field.tsx`
- Modify: `components/ui/field.module.css`
- Modify: `tests/components/core-ui-forms.test.tsx`

**Interfaces:**
- Preserves: `FieldProps`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `Label`, and `useFieldControlProps`.
- Adds: `FieldOrientation = "vertical" | "horizontal" | "responsive"`.
- Adds: `FieldProps.orientation?: FieldOrientation` with `vertical` as the default.
- Adds: `FieldGroupProps`, `FieldGroup`.
- Adds: `FieldSetProps`, `FieldSet`.
- Adds: `FieldLegendProps`, `FieldLegend`.
- Adds: `FieldContentProps`, `FieldContent`.
- Types: FieldGroup and FieldContent extend `HTMLAttributes<HTMLDivElement>`, FieldSet extends `ComponentPropsWithRef<"fieldset">`, and FieldLegend extends `ComponentPropsWithRef<"legend">`.

- [x] **Step 1: Write failing Field composition tests**

Add tests that assert:

- `FieldGroup` and `FieldContent` expose `data-slot` names without adding form semantics.
- `FieldSet` renders a native fieldset and `FieldLegend` renders a native legend.
- `orientation="horizontal"` and `orientation="responsive"` produce deterministic `data-orientation` values.
- a nested `FieldContent` containing `FieldLabel`, `FieldDescription`, and `FieldError` still connects the generated IDs to an `Input` sibling.
- caller-provided IDs and existing direct-child Field usage remain unchanged.

- [x] **Step 2: Run focused tests and confirm the API is missing**

Run:

    npx vitest run tests/components/core-ui-forms.test.tsx

Expected: failure because FieldGroup, FieldSet, FieldLegend, FieldContent, and orientation are not implemented.

- [x] **Step 3: Implement the Field compound structure**

Add the interfaces above. Recursively inspect presentational compound children when deriving description and error relationships, but do not clone controls or depend on their concrete component type. Emit `data-slot="field"`, `field-group`, `field-set`, `field-legend`, and `field-content`.

- [x] **Step 4: Implement Field layout states**

Keep vertical as the compatibility default. Horizontal aligns label content and control without fixed widths; responsive uses horizontal layout only above 720px and collapses to a single column below it. FieldGroup provides one shared vertical rhythm, and FieldSet resets native browser margins and borders without removing the legend.

- [x] **Step 5: Run tests and commit**

Run:

    npx vitest run tests/components/core-ui-forms.test.tsx tests/components/core-ui-composition-contracts.test.tsx

Expected: all tests pass.

Commit:

    git add components/ui/field.tsx components/ui/field.module.css tests/components/core-ui-forms.test.tsx
    git commit -m "feat(ui): expand field composition"

---

### Task 2: Expand InputGroup without constraining control shape

**Files:**
- Modify: `components/ui/input-group.tsx`
- Modify: `components/ui/input-group.module.css`
- Modify: `tests/components/core-ui-expansion-c1.test.tsx`

**Interfaces:**
- Preserves: `InputGroup`, `InputGroupInput`, `InputGroupAddon`, `InputGroupText`, and `InputGroupButton`.
- Adds: `InputGroupPlacement = "inline-start" | "inline-end" | "block-start" | "block-end"`.
- Preserves compatibility: `placement="start" | "end"` maps to inline-start and inline-end.
- Adds: `InputGroupTextarea(props: ComponentPropsWithRef<"textarea">)`.
- Changes: `InputGroupButton` shares the public Button variant, size, focus, disabled, and icon-only accessibility contract while retaining native button props and default `type="button"`; its connected rendering removes Button's standalone outer frame so the group keeps one boundary.

- [x] **Step 1: Write failing InputGroup composition tests**

Add tests for:

- inline prefix, one native input, and an end action;
- block-start guidance plus a multiline `InputGroupTextarea` and block-end counter;
- all four canonical placement data values and the two compatibility aliases;
- Field invalid, required, and described-by propagation into InputGroupInput and InputGroupTextarea;
- icon action accessible naming and default button type.

- [x] **Step 2: Run the focused test and confirm failure**

Run:

    npx vitest run tests/components/core-ui-expansion-c1.test.tsx tests/components/core-ui-forms.test.tsx

Expected: failure because block placements and InputGroupTextarea are missing.

- [x] **Step 3: Implement the expanded compound API**

Use CSS Grid for placement rather than flex order or child cloning. The input or textarea owns the flexible center cell; block add-ons span the full group width. Map start and end aliases at the component boundary and emit only canonical placement data values.

- [x] **Step 4: Implement connected visual behavior**

The group owns its single outer border, focus ring, and invalid border. Add-ons create one-pixel internal rules only at their boundary. Multiline controls keep block add-ons readable, horizontal controls may shrink without clipping, and buttons reuse the shared Button contract without adding a second outer frame.

- [x] **Step 5: Run tests and commit**

Run:

    npx vitest run tests/components/core-ui-expansion-c1.test.tsx tests/components/core-ui-forms.test.tsx tests/components/core-ui-actions.test.tsx

Expected: all tests pass.

Commit:

    git add components/ui/input-group.tsx components/ui/input-group.module.css tests/components/core-ui-expansion-c1.test.tsx tests/components/core-ui-forms.test.tsx
    git commit -m "feat(ui): expand input group composition"

---

### Task 3: Refine RadioGroup and Switch state contracts

**Files:**
- Modify: `components/ui/radio-group.tsx`
- Modify: `components/ui/switch.tsx`
- Modify: `components/ui/selection-control.module.css`
- Modify: `tests/components/core-ui-selection.test.tsx`

**Interfaces:**
- Preserves: `RadioOption`, `RadioGroupProps`, and `RadioGroup` native controlled and uncontrolled APIs.
- Adds: stable `data-slot` values for radio group, option, input, indicator, label, and description.
- Adds: `SwitchTone = "primary" | "success" | "warning" | "danger" | "neutral"`.
- Adds: `SwitchProps.tone?: SwitchTone` with `primary` as the default.
- Preserves: Switch native input props, label, description, checked, defaultChecked, disabled, name, value, and ref behavior.

- [x] **Step 1: Write failing RadioGroup and Switch tests**

Add tests that assert:

- RadioGroup exposes a distinct square indicator beside its visually hidden native radio.
- controlled and uncontrolled behavior remains native, including disabled-option state.
- Switch emits `data-tone` for every supported tone and defaults to primary.
- each checked tone preserves `role="switch"`, checked state, form name and value, disabled state, label, and described-by relationships.
- tone does not add a second interactive element or change the unchecked surface.

- [x] **Step 2: Run the focused test and confirm failure**

Run:

    npx vitest run tests/components/core-ui-selection.test.tsx

Expected: failure because the radio indicator and Switch tone API are missing.

- [x] **Step 3: Implement the square RadioGroup indicator**

Keep the native input in the accessibility tree and add a hidden-input plus visible-indicator structure parallel to Checkbox. Selected state uses a blue outer square and a smaller inner square; focus is drawn outside the visible indicator. No circular geometry remains.

- [x] **Step 4: Implement Switch checked tones**

Set `data-tone` on the Switch root. Map checked surfaces to existing semantic tokens: primary uses `--blue`, success `--success`, warning `--warning`, danger `--error-deep`, and neutral `--ink`. Off-state, focus, disabled, thumb travel, and reduced-motion behavior remain shared.

- [x] **Step 5: Run tests and commit**

Run:

    npx vitest run tests/components/core-ui-selection.test.tsx tests/components/design-system-interactions.test.tsx

Expected: all tests pass.

Commit:

    git add components/ui/radio-group.tsx components/ui/switch.tsx components/ui/selection-control.module.css tests/components/core-ui-selection.test.tsx
    git commit -m "feat(ui): refine selection controls"

---

### Task 4: Publish form recipes and complete catalog guidance

**Files:**
- Modify: `components/design-system/component-demo-forms.tsx`
- Modify: `components/design-system/component-demo-core-expansion.tsx`
- Modify: `components/design-system/component-demo-selection.tsx`
- Modify: `components/design-system/design-system.module.css`
- Modify: `lib/design-system/component-catalog/forms.ts`
- Modify: `lib/design-system/component-catalog/core-expansion.ts`
- Modify: `lib/design-system/component-catalog/selection.ts`
- Modify: `tests/design-system/catalog.test.ts`
- Modify: `tests/design-system/serialize.test.ts`
- Modify: `tests/components/design-system-pages.test.tsx`
- Regenerate: `DESIGN.md`

**Interfaces:**
- Consumes: compound APIs from Tasks 1-3.
- Produces: copyable recipes for document settings, URL verification, multiline annotated input, visible radio comparison, and semantic immediate settings.
- Produces: deterministic public Markdown, JSON, Skill references, and component pages using the same recommended interfaces.

- [x] **Step 1: Write failing catalog and page tests**

Assert that:

- Field documentation lists FieldGroup, FieldSet, FieldLegend, FieldContent, and orientation.
- InputGroup documentation lists InputGroupTextarea, canonical placements, and compatibility aliases.
- RadioGroup documentation explicitly requires square indicators.
- Switch documentation lists every checked tone and explains that tone applies only when checked.
- rendered demos include a full document-settings composition, a multiline InputGroup, square radios, and at least three Switch tones.

- [x] **Step 2: Run tests and verify failure**

Run:

    npx vitest run tests/design-system/catalog.test.ts tests/design-system/serialize.test.ts tests/components/design-system-pages.test.tsx

Expected: failure because C3B APIs and recipes are absent.

- [x] **Step 3: Build realistic demos**

Use real Core UI components only. Keep examples compact enough for 320px, use Korean and English labels already supported by the catalog, and avoid raw controls in the recommended compositions.

- [x] **Step 4: Update catalog metadata**

Document anatomy, when-to-use boundaries, state guidance, accessibility, source paths, exact props, compatibility behavior, and related components. Do not add a separate Form wrapper or validation library.

- [x] **Step 5: Regenerate and verify public resources**

Run:

    npm run design:generate
    npm run design:check

Expected: generated resources are deterministic and recommend only the C3B interfaces.

- [x] **Step 6: Run tests and commit**

Run:

    npx vitest run tests/design-system/catalog.test.ts tests/design-system/serialize.test.ts tests/components/design-system-pages.test.tsx tests/components/core-ui-forms.test.tsx tests/components/core-ui-expansion-c1.test.tsx tests/components/core-ui-selection.test.tsx

Expected: all tests pass.

Commit:

    git add components/design-system lib/design-system tests/design-system tests/components/design-system-pages.test.tsx DESIGN.md
    git commit -m "docs(design): publish core ui form recipes"

---

### Task 5: Migrate one complete Admin form proof

**Files:**
- Modify: `components/admin/document-editor.tsx`
- Modify: `app/admin/admin.module.css`
- Modify: `tests/components/document-admin.test.tsx`

**Interfaces:**
- Consumes: FieldSet, FieldLegend, FieldGroup, Field, FieldLabel, Input, NativeSelect, Checkbox, Button, and ButtonLink.
- Preserves: every existing document value, callback, disabled condition, validation attribute, route, visible label, analytics behavior, and save or publication lifecycle.
- Produces: one representative production Admin settings composition without raw input, select, checkbox, or button styling inside the migrated boundary.

- [x] **Step 1: Write failing Admin proof tests**

Extend DocumentEditor tests to assert:

- document settings are a native named fieldset;
- kind, locale, category, slug, effective date, and pinned state keep their current values and disabled rules;
- changing editable settings calls the existing state path once;
- save, schedule, publish, delete, and English-revision actions keep their current labels, types, disabled states, and callbacks;
- no nested form or duplicate interactive wrapper is introduced.

- [x] **Step 2: Run the focused test and verify the proof is absent**

Run:

    npx vitest run tests/components/document-admin.test.tsx

Expected: new fieldset and shared-component assertions fail against the raw controls.

- [x] **Step 3: Migrate the document settings boundary**

Replace raw label, input, select, and checkbox markup in the document properties section with the shared compounds. Replace action buttons with Button or ButtonLink according to semantics. Keep the Markdown editor, title and summary workflow, confirmation logic, server calls, and copy unchanged.

- [x] **Step 4: Remove superseded page-specific control styling**

Retain grid placement and page layout classes only. Delete raw input, select, checkbox, button, focus, and disabled styles now owned by Core UI. Add no descendant selector that restyles shared component internals.

- [x] **Step 5: Run Admin and regression tests, then commit**

Run:

    npx vitest run tests/components/document-admin.test.tsx tests/components/core-ui-forms.test.tsx tests/components/core-ui-selection.test.tsx tests/components/core-ui-actions.test.tsx

Expected: all tests pass.

Commit:

    git add components/admin/document-editor.tsx app/admin/admin.module.css tests/components/document-admin.test.tsx
    git commit -m "refactor(admin): adopt form composition system"

---

### Task 6: Verify C3B and complete the delivery

**Files:**
- Modify only if defects are found: `components/ui/*.module.css`
- Modify only if defects are found: `components/design-system/design-system.module.css`
- Modify: `docs/platform-roadmap.md`
- Modify: `docs/superpowers/plans/2026-10-03-laflabs-core-ui-v2-forms.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified Delivery C3B and records C3C overlays, navigation, and feedback as next.

- [x] **Step 1: Run the complete static and unit suite**

Run:

    npm run design:check
    npm run typecheck
    npm run lint
    npm run test:unit

Expected: all commands pass and every unit test succeeds.

- [x] **Step 2: Run the production build**

Run:

    npm run build

Expected: Next.js production build completes without route, serialization, server-component, or hydration errors.

- [x] **Step 3: Review representative pages in a browser**

Review:

- `/design/components/field`
- `/design/components/input-group`
- `/design/components/radio-group`
- `/design/components/switch`
- the migrated Admin document editor with configured local authentication

Check desktop and 320px widths, 200% zoom, Korean and English labels, keyboard focus, native radio arrow keys, disabled controls, every Switch tone, reduced motion, connected borders, and error relationships. If Admin authentication is unavailable locally, record the environment limitation and rely on the focused behavior test instead of weakening the route.

- [x] **Step 4: Run the Impeccable detector once**

Run:

    node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json components/ui/field.tsx components/ui/field.module.css components/ui/input-group.tsx components/ui/input-group.module.css components/ui/radio-group.tsx components/ui/switch.tsx components/ui/selection-control.module.css components/design-system/component-demo-forms.tsx components/design-system/component-demo-core-expansion.tsx components/design-system/component-demo-selection.tsx components/design-system/design-system.module.css components/admin/document-editor.tsx app/admin/admin.module.css

Review each finding and fix only actual violations. Record intentional exceptions in the PR verification notes.

- [x] **Step 5: Update roadmap and plan status**

Mark C3B shipped in `docs/platform-roadmap.md`, identify C3C overlays, navigation, and feedback as next, and check every completed plan item.

- [x] **Step 6: Commit verification fixes**

    git add components app docs DESIGN.md
    git commit -m "chore(design): verify core ui form composition"

- [x] **Step 7: Push and open the pull request**

    git push -u origin codex/design-system-v2-forms
    gh pr create --base main --head codex/design-system-v2-forms --title "Expand LafLabs Core UI form composition" --fill

The PR body summarizes compound APIs, compatibility behavior, Admin adoption, generated resource changes, exact verification commands, browser coverage, and any intentional detector exceptions.
