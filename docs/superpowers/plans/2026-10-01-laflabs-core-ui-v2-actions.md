# LafLabs Core UI v2 Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Deliver the first Core UI v2 slice by simplifying the action model, making ButtonGroup composable, replacing the fixed two-option SegmentedToggle with SegmentedControl, and publishing complete human and AI documentation.

**Architecture:** Native button and anchor elements share one LafLabs-owned visual contract. Deprecated Action, IconControl, and SegmentedToggle exports remain compatibility wrappers for one release, but all internal consumers and public documentation use Button, ButtonLink, and SegmentedControl. Motion is isolated to the active segmented surface and honors reduced motion.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript 5.9, CSS Modules, Motion, Phosphor Icons, Vitest, Testing Library.

**Spec:** docs/superpowers/specs/2026-10-01-laflabs-core-ui-v2-design.md

## Global Constraints

- Preserve Paper #F8FAFC, Ink #0F172A, Primary Blue #2563EB, zero-radius geometry, one-pixel rules, Geist Sans, Pretendard, and restrained motion.
- Keep native button and anchor semantics; do not add asChild, CVA, a class-merging dependency, or a new interaction library.
- Use Button for in-place actions, ButtonLink for navigation, and TextLink for inline navigation.
- Button variants are primary, secondary, inverse, danger, and ghost.
- Button sizes are compact, default, and icon.
- Danger uses Error Deep with a white foreground.
- An icon-sized Button needs an accessible name.
- SegmentedControl selects one value from two or more short options and uses arrow-key navigation.
- Deprecated aliases remain importable and tested for one release but do not appear in recommended examples.
- All generated resources remain deterministic and use the existing public origin.
- Read relevant files under node_modules/next/dist/docs before changing App Router pages.

## Review Focus

- Existing Action links and buttons must retain semantics and native attributes after becoming wrappers; Task 1 pins both branches.
- Icon-sized buttons without visible text must remain nameable, focusable, and at least 44px on small screens; Tasks 1 and 4 test the contract and rendered CSS.
- ButtonGroup must not create doubled rules or collapse long Korean labels at 320px; Tasks 2 and 5 cover structure and browser review.
- SegmentedControl must support unequal label widths, disabled options, keyboard navigation, and more than two values without a fixed translation; Task 3 tests all cases.
- Catalog, demo keys, related-component links, generated guide, Skill references, and source paths must not retain recommended Action or IconControl entries; Task 4 pins the generated contract.

---

## File structure

### Shared action source

- components/ui/button-contract.ts: shared Button and ButtonLink variant, size, and class-name contract.
- components/ui/button.tsx and button.module.css: native Button behavior and shared visual implementation.
- components/ui/button-link.tsx: native anchor using the Button visual contract.
- components/ui/action.tsx: deprecated compatibility wrapper.
- components/ui/icon-control.tsx: deprecated icon-sized Button wrapper.
- components/ui/button-group.tsx and button-group.module.css: ButtonGroup, ButtonGroupSeparator, and ButtonGroupText.

### Segmented selection source

- components/ui/segmented-control.tsx and segmented-control.module.css: variable-width, multi-option single selection.
- components/ui/segmented-toggle.tsx: deprecated two-option compatibility wrapper.

### Catalog and demos

- lib/design-system/component-options.ts: new demo keys and removal of retired recommended keys.
- lib/design-system/component-catalog/actions.ts: Button, ButtonLink, ButtonGroup, and SegmentedControl entries.
- lib/design-system/component-catalog/existing.ts: remove recommended Action, IconControl, and SegmentedToggle entries while retaining unrelated primitives.
- components/design-system/component-demo-actions.tsx: realistic action, group, and segmented examples.
- components/design-system/component-demo-registry.tsx: exhaustive recommended demo registry.
- components/design-system/design-system.module.css: composed demo layouts and responsive behavior.

### Consumers and tests

- components/layout/site-header.tsx, components/admin/admin-language-toggle.tsx, components/admin/asset-library.tsx, components/admin/markdown-live-editor.tsx, and components/design-system/foundation-motion-sample.tsx: SegmentedControl migration.
- components/design-system/component-demo-composites.tsx and component-demo-registry.tsx: Button icon-size migration.
- tests/components/core-ui-actions.test.tsx: Button, ButtonLink, aliases, and ButtonGroup contracts.
- tests/components/segmented-control.test.tsx: selection and keyboard contract.
- tests/components/design-system-primitives.test.tsx: deprecated alias compatibility only.
- tests/design-system/catalog.test.ts and tests/design-system/serialize.test.ts: public catalog and generated output.
- tests/components/design-system-pages.test.tsx: production demos and state pages.

---

### Task 1: Unify Button, ButtonLink, and compatibility aliases

**Files:**
- Create: components/ui/button-contract.ts
- Create: components/ui/button-link.tsx
- Modify: components/ui/button.tsx
- Modify: components/ui/button.module.css
- Modify: components/ui/action.tsx
- Modify: components/ui/icon-control.tsx
- Delete after migration: components/ui/action.module.css
- Delete after migration: components/ui/icon-control.module.css
- Modify: tests/components/core-ui-actions.test.tsx
- Modify: tests/components/core-ui-composition-contracts.test.tsx
- Modify: tests/components/design-system-primitives.test.tsx

**Interfaces:**
- Produces: ButtonVariant = primary | secondary | inverse | danger | ghost.
- Produces: ButtonSize = compact | default | icon.
- Produces: getButtonClassName(options: { variant?: ButtonVariant; size?: ButtonSize; className?: string }): string.
- Produces: ButtonProps and Button.
- Produces: ButtonLinkProps and ButtonLink.
- Preserves: ActionProps and Action with a deprecation annotation.
- Preserves: IconControlProps and IconControl with a deprecation annotation.

- [x] **Step 1: Write failing Button family tests**

Add cases that assert:

    render(<Button variant="ghost">More</Button>)
    expect(screen.getByRole("button", { name: "More" })).toHaveAttribute("data-variant", "ghost")

    render(<Button size="icon" aria-label="Search"><MagnifyingGlass /></Button>)
    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute("data-size", "icon")

    render(<ButtonLink href="/design">Design guide</ButtonLink>)
    expect(screen.getByRole("link", { name: "Design guide" })).toHaveAttribute("href", "/design")

Keep tests for safe default type, native prop forwarding, loading suppression, ref forwarding, Action link and button branches, and IconControl accessible naming.

Add a compile-time contract proving that size icon requires aria-label and that ButtonLink does not accept disabled or loading:

    // @ts-expect-error icon buttons require an accessible name
    <Button size="icon"><MagnifyingGlass /></Button>
    // @ts-expect-error anchors do not expose disabled button semantics
    <ButtonLink href="/design" disabled>Design</ButtonLink>

- [x] **Step 2: Run focused tests and confirm the new API is missing**

Run:

    npx vitest run tests/components/core-ui-actions.test.tsx tests/components/core-ui-composition-contracts.test.tsx tests/components/design-system-primitives.test.tsx

Expected: failure for missing ButtonLink, ghost and icon sizes, and wrapper migration.

- [x] **Step 3: Implement the shared visual contract**

Create button-contract.ts with the exact types above and a deterministic class-name helper that maps CSS Module classes. Update Button to consume it while preserving loading, disabled, ref, native props, and type button default.

Add ghost and icon CSS. The icon visual size is 34px on desktop and its interactive target reaches 44px on small screens without pseudo-elements covering neighboring controls.

- [x] **Step 4: Implement ButtonLink and compatibility wrappers**

ButtonLink renders a native anchor, forwards anchor attributes and refs, and consumes the shared variant and size contract. It does not accept disabled or loading props.

Action delegates href props to ButtonLink and non-href props to Button while preserving its primary, secondary, and inverse variants.

IconControl delegates to Button with size icon and secondary as its compatibility default.

- [x] **Step 5: Run action tests**

Run:

    npx vitest run tests/components/core-ui-actions.test.tsx tests/components/core-ui-composition-contracts.test.tsx tests/components/design-system-primitives.test.tsx

Expected: all tests pass.

- [x] **Step 6: Commit the Button family**

    git add components/ui/button-contract.ts components/ui/button.tsx components/ui/button.module.css components/ui/button-link.tsx components/ui/action.tsx components/ui/icon-control.tsx tests/components/core-ui-actions.test.tsx tests/components/core-ui-composition-contracts.test.tsx tests/components/design-system-primitives.test.tsx
    git add -u components/ui
    git commit -m "refactor(ui): unify action components"

---

### Task 2: Expand ButtonGroup composition

**Files:**
- Modify: components/ui/button-group.tsx
- Modify: components/ui/button-group.module.css
- Modify: components/design-system/component-demo-actions.tsx
- Modify: tests/components/core-ui-actions.test.tsx

**Interfaces:**
- Consumes: Button and ButtonLink from Task 1.
- Produces: ButtonGroupProps accepting label for compatibility plus aria-label or aria-labelledby.
- Produces: ButtonGroup.
- Produces: ButtonGroupSeparator with orientation horizontal or vertical.
- Produces: ButtonGroupText.

- [x] **Step 1: Write failing compound-component tests**

Test a labelled group containing ButtonGroupText, two Buttons, and ButtonGroupSeparator. Assert group semantics, forwarded native attributes, orientation data, separator aria-hidden state, and visible text.

Add a nested-group rendering case and a split-action case. Do not require child introspection or cloning.

- [x] **Step 2: Run the focused tests and verify failure**

Run:

    npx vitest run tests/components/core-ui-actions.test.tsx

Expected: failure because Separator and Text are not exported.

- [x] **Step 3: Implement the compound API and connected frame**

Use data-slot attributes on each part. CSS owns adjacency through slot selectors and orientation. Connected children share one outer frame, internal borders remain one pixel, and focus outlines render above adjacent siblings.

Do not impose width on nested inputs or Buttons. Allow horizontal overflow where the caller requests no wrapping; otherwise wrap only at an explicit responsive boundary.

- [x] **Step 4: Replace the minimal demo with real compositions**

Add:

- Save and publish connected actions.
- Split publish action with DropdownMenu.
- Search InputGroup plus submit Button.
- Vertical mobile-safe action group.

Use existing production components only.

- [x] **Step 5: Run tests and commit**

Run:

    npx vitest run tests/components/core-ui-actions.test.tsx

Expected: pass.

Commit:

    git add components/ui/button-group.tsx components/ui/button-group.module.css components/design-system/component-demo-actions.tsx tests/components/core-ui-actions.test.tsx
    git commit -m "feat(ui): expand button group composition"

---

### Task 3: Replace SegmentedToggle with variable-width SegmentedControl

**Files:**
- Create: components/ui/segmented-control.tsx
- Create: components/ui/segmented-control.module.css
- Modify: components/ui/segmented-toggle.tsx
- Delete after migration: components/ui/segmented-toggle.module.css
- Create: tests/components/segmented-control.test.tsx
- Modify: tests/components/design-system-interactions.test.tsx

**Interfaces:**
- Produces: SegmentedControlOption<Value extends string> with value, label, content, disabled, and buttonProps.
- Produces: SegmentedControlProps<Value extends string> with label, value, options, onValueChange, and className.
- Produces: SegmentedControl.
- Preserves: SegmentedToggle with its existing two-option prop contract as a deprecated wrapper.

- [x] **Step 1: Write failing selection and keyboard tests**

Cover:

- two options and three unequal-width options;
- five options without clipping;
- click selection calls onValueChange once;
- clicking the current or disabled option does not call it;
- ArrowRight and ArrowLeft move to the next enabled option and wrap;
- Home and End choose the first and last enabled option;
- one option has tabIndex zero and the rest negative one;
- group and option accessible names;
- reduced motion does not remove the active state.

- [x] **Step 2: Run the focused tests and verify failure**

Run:

    npx vitest run tests/components/segmented-control.test.tsx tests/components/design-system-interactions.test.tsx

Expected: failure because SegmentedControl does not exist and the current control only accepts two fixed options.

- [x] **Step 3: Implement SegmentedControl**

Render a named radiogroup with button options using role radio and aria-checked. Maintain refs for roving focus. Skip disabled options and wrap keyboard navigation.

Render the active surface inside the selected button with Motion layout rather than x multiplied by a fixed width. Generate a unique layout identifier with useId so multiple controls on one page do not share animation state. Set the transition duration to zero for reduced motion.

Require at least two options at runtime in development. For an unknown current value, render no selected option, give the first enabled option the only tab stop, and do not mutate selection until the user acts.

- [x] **Step 4: Implement the compatibility wrapper**

SegmentedToggle keeps its current two-item tuple type and maps directly to SegmentedControl. It contains no independent layout or motion logic.

- [x] **Step 5: Run focused tests and commit**

Run:

    npx vitest run tests/components/segmented-control.test.tsx tests/components/design-system-interactions.test.tsx

Expected: pass.

Commit:

    git add components/ui/segmented-control.tsx components/ui/segmented-control.module.css components/ui/segmented-toggle.tsx tests/components/segmented-control.test.tsx tests/components/design-system-interactions.test.tsx
    git add -u components/ui
    git commit -m "feat(ui): add flexible segmented control"

---

### Task 4: Migrate consumers and publish the recommended catalog

**Files:**
- Modify: components/layout/site-header.tsx
- Modify: components/admin/admin-language-toggle.tsx
- Modify: components/admin/asset-library.tsx
- Modify: components/admin/markdown-live-editor.tsx
- Modify: components/design-system/foundation-motion-sample.tsx
- Modify: components/design-system/component-demo-composites.tsx
- Modify: components/design-system/component-demo-registry.tsx
- Modify: components/design-system/component-demo-actions.tsx
- Modify: components/design-system/design-system.module.css
- Modify: lib/design-system/component-options.ts
- Modify: lib/design-system/component-catalog/actions.ts
- Modify: lib/design-system/component-catalog/existing.ts
- Modify: tests/design-system/catalog.test.ts
- Modify: tests/design-system/serialize.test.ts
- Modify: tests/components/design-system-pages.test.tsx

**Interfaces:**
- Consumes: Button, ButtonLink, ButtonGroup family, and SegmentedControl.
- Produces: recommended catalog entries button, button-link, button-group, and segmented-control.
- Removes from recommended catalog: action, icon-control, segmented-toggle.
- Preserves source imports for deprecated aliases outside the catalog.

- [x] **Step 1: Write failing catalog and page tests**

Assert:

    expect(componentIds).toContain("button-link")
    expect(componentIds).toContain("segmented-control")
    expect(componentIds).not.toContain("action")
    expect(componentIds).not.toContain("icon-control")
    expect(componentIds).not.toContain("segmented-toggle")

Assert that generated Markdown explains Button versus ButtonLink, documents icon size under Button, and contains a three-option SegmentedControl example.

Assert the live page renders every Button variant, ButtonGroup split composition, and a SegmentedControl with at least three options.

- [x] **Step 2: Run the catalog tests and verify failure**

Run:

    npx vitest run tests/design-system/catalog.test.ts tests/design-system/serialize.test.ts tests/components/design-system-pages.test.tsx

Expected: failure because retired catalog entries remain and the new entries are absent.

- [x] **Step 3: Migrate internal consumers**

Replace every non-compatibility SegmentedToggle import under app and components with SegmentedControl. Replace demo IconControl usage with Button size icon. Replace demo Action usage with Button or ButtonLink according to semantics.

Do not change labels, analytics attributes, routes, callbacks, or form behavior.

- [x] **Step 4: Update catalog metadata and demos**

Move SegmentedControl into the action or selection-navigation section agreed by the existing category taxonomy. Button documentation includes variant priority, icon naming, and loading behavior. ButtonLink explicitly states navigation semantics. ButtonGroup documents split, nested, and mixed-control composition.

Every entry includes production source path, dependencies, state guidance, related components, and a copyable realistic example.

- [x] **Step 5: Regenerate public and AI resources**

Run:

    npm run design:generate
    npm run design:check

Expected: DESIGN.md and generated resource snapshots contain only the recommended v2 names while compatibility exports remain in source.

- [x] **Step 6: Run focused tests and commit**

Run:

    npx vitest run tests/design-system/catalog.test.ts tests/design-system/serialize.test.ts tests/components/design-system-pages.test.tsx tests/components/core-ui-actions.test.tsx tests/components/segmented-control.test.tsx

Expected: pass.

Commit:

    git add app components lib tests DESIGN.md
    git commit -m "docs(design): publish core ui v2 actions"

---

### Task 5: Verify responsive behavior and complete the delivery

**Files:**
- Modify only if defects are found: components/ui/*.module.css
- Modify only if defects are found: components/design-system/design-system.module.css
- Modify: docs/platform-roadmap.md
- Modify: docs/superpowers/plans/2026-10-01-laflabs-core-ui-v2-actions.md

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a verified Delivery C3A and records C3B as the next delivery.

- [x] **Step 1: Run the complete static and unit suite**

Run:

    npm run design:check
    npm run typecheck
    npm run lint
    npm run test:unit

Expected: design check passes, TypeScript reports no errors, lint reports no errors, and all unit tests pass.

- [x] **Step 2: Run the production build**

Run:

    npm run build

Expected: Next.js production build completes without route, serialization, or hydration errors.

- [x] **Step 3: Review representative pages in a browser**

Review:

- /design/components/button
- /design/components/button-link
- /design/components/button-group
- /design/components/segmented-control
- the public site header
- one Admin page containing SegmentedControl

Check desktop and 320px mobile widths, 200% zoom, long Korean and English labels, keyboard focus, Arrow/Home/End navigation, disabled options, reduced motion, and connected group borders.

- [x] **Step 4: Run the Impeccable manual detector**

Run:

    node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs components/ui components/design-system

Review each reported pattern and fix only actual violations. Record intentional exceptions in the delivery notes.

- [x] **Step 5: Update roadmap and plan status**

Mark Delivery C3A complete in docs/platform-roadmap.md, identify C3B form composition as next, and check every completed plan item.

- [x] **Step 6: Commit verification fixes**

    git add components docs DESIGN.md
    git commit -m "chore(design): verify core ui v2 actions"

- [x] **Step 7: Push and open the pull request**

    git push -u origin codex/design-system-v2
    gh pr create --base main --head codex/design-system-v2 --title "Refine LafLabs Core UI action system" --fill

The PR body summarizes semantic cleanup, compatibility aliases, new composition APIs, generated resource changes, and the exact verification commands.
