# LafLabs Core UI v2 C3C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Pagination, Dialog, AlertDialog, Spinner, Toast, Alert, and StatusLabel as one coherent, accessible LafLabs Core UI release while preserving current application behavior for one compatibility release.

**Architecture:** Keep native elements for navigation and inline feedback, and keep the unified `radix-ui` package as the behavior layer for Dialog, AlertDialog, and Toast. LafLabs continues to own every exported API, CSS Module, test, demo, catalog entry, and generated design artifact. New compound APIs become the documented path while current props and NoticeToast imports remain compatibility aliases.

**Tech Stack:** Next.js 16.3.6 App Router, React 19.2.6, TypeScript 5.9, CSS Modules, unified `radix-ui`, Phosphor Icons, Vitest, Testing Library, Playwright/browser verification.

**Spec:** `docs/superpowers/specs/2026-10-03-laflabs-core-ui-v2-overlays-feedback-design.md`

## Global Constraints

- Do not install shadcn or another component library; use it only as a composition reference.
- Preserve square 0px geometry, Paper `#F8FAFC`, Ink `#0F172A`, Primary Blue `#2563EB`, Line `#CBD5E1`, and semantic tokens already defined in `app/globals.css`.
- Use `radix-ui` only behind LafLabs-owned exports.
- Preserve current imports and common props for one compatibility release.
- Do not change routes, mutations, analytics event names, form field names, or business copy as a side effect.
- Support Korean and English, 320px layouts, 200% zoom, keyboard-only operation, visible focus, and reduced motion.
- Motion is limited to transform and opacity, with 120-240ms state transitions and an immediate reduced-motion fallback.
- Keep Toast transient and in-memory. Do not build persistence, notification history, or server delivery.
- Follow local Next.js 16 documentation in `node_modules/next/dist/docs/` before modifying `app/layout.tsx`.
- Use TDD for each component task and commit each independently testable delivery.

## Review Focus

- Long Korean or English Dialog content at 320px and 200% zoom must keep title, body, actions, and close access usable; Task 2 adds the scroll-mode contract test and Task 7 performs browser verification.
- Mixed legacy and new compound APIs must not produce duplicate close controls, headings, icons, or descriptions; Tasks 2 and 6 add compatibility tests.
- Toast bursts, duplicate IDs, and more than three items must update or queue predictably without losing dismissal; Task 5 tests the full lifecycle.
- Components used without their required Provider or accessible label must fail clearly during development or retain an accessible fallback; Tasks 4 and 5 test these conditions.
- Layering with Navbar, menus, Dialog, Tooltip, and Toast must keep the active surface visible and interactive; Tasks 2 and 5 use shared layer tokens and Task 7 verifies the stack in a browser.

---

### Task 1: Connected Pagination rail

**Files:**
- Modify: `components/ui/pagination.tsx`
- Modify: `components/ui/pagination.module.css`
- Create: `tests/components/core-ui-c3c-pagination.test.tsx`

**Interfaces:**
- Consumes: native `nav`, `ul`, `li`, and anchor props; existing `Pagination*` exports.
- Produces: existing `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, and `PaginationEllipsis` exports with a connected-rail visual contract and explicit disabled direction semantics.

- [ ] **Step 1: Write failing Pagination semantics tests**

Add tests named:

- `renders a connected current-page rail with real navigation links`
- `keeps a disabled boundary visible without exposing a destination`
- `preserves caller-provided native anchor props and refs`

Assert `aria-current="page"`, real `href` values, named navigation, named ellipsis, and a disabled Previous rendered with `aria-disabled="true"` and no navigable `href`.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `npm run test:unit -- tests/components/core-ui-c3c-pagination.test.tsx`

Expected: FAIL because direction components do not yet accept a disabled contract and the connected-rail markers are absent.

- [ ] **Step 3: Extend the direction interface**

Implement:

```ts
type PaginationDirectionProps = ComponentPropsWithRef<"a"> & {
  disabled?: boolean
  label: string
}
```

When disabled, omit `href`, add `aria-disabled="true"`, and prevent activation without replacing the visible control. Keep real anchors for active destinations and keep prop/ref forwarding.

- [ ] **Step 4: Replace separate boxes with one connected rail**

Update the CSS Module so `PaginationContent` owns the single outer boundary, items share one-pixel internal rules, the current page is a square Primary Blue cell with white text, and Ellipsis has no independent border. Preserve 42px minimum desktop targets and 44px mobile targets without hiding caller-provided pages in CSS.

- [ ] **Step 5: Run focused verification**

Run: `npm run test:unit -- tests/components/core-ui-c3c-pagination.test.tsx tests/components/core-ui-expansion-c2.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit Pagination**

```bash
git add components/ui/pagination.tsx components/ui/pagination.module.css tests/components/core-ui-c3c-pagination.test.tsx
git commit -m "feat: redesign pagination rail"
```

### Task 2: Composable Dialog and shared overlay shell

**Files:**
- Create: `components/ui/overlay-shell.module.css`
- Modify: `components/ui/dialog.tsx`
- Delete: `components/ui/dialog.module.css`
- Modify: `app/globals.css`
- Modify: `tests/components/core-ui-dialog.test.tsx`

**Interfaces:**
- Consumes: `Dialog` primitives from unified `radix-ui`; existing Dialog exports and `closeLabel` compatibility prop.
- Produces: `DialogPortal`, `DialogOverlay`, `DialogBody`, and a composable `DialogClose`; `DialogContent` props `size?: "small" | "medium" | "large" | "full"` and `scroll?: "content" | "body"`.

- [ ] **Step 1: Read the local Next.js layout and CSS guidance**

Read the relevant files under `node_modules/next/dist/docs/` for root layout global CSS constraints before changing global layer tokens.

- [ ] **Step 2: Add failing compound and compatibility tests**

Extend `tests/components/core-ui-dialog.test.tsx` with:

- `composes portal overlay body footer and an explicit close control`
- `supports small medium large and full content sizes`
- `keeps header and footer outside a body scrolling boundary`
- `renders one legacy close control only when closeLabel is supplied`
- `keeps long localized content and actions inside the dialog viewport`

Assert `data-size`, `data-scroll`, exactly one named close control, DialogBody presence, focus trap, Escape, outside dismissal, and trigger focus restoration.

- [ ] **Step 3: Run Dialog tests and confirm failure**

Run: `npm run test:unit -- tests/components/core-ui-dialog.test.tsx`

Expected: FAIL because Portal, Overlay, Body, size, and scroll contracts do not exist.

- [ ] **Step 4: Add the shared layer scale**

Add these CSS variables to `:root` in `app/globals.css`:

```css
--layer-sticky: 50;
--layer-popup: 120;
--layer-overlay: 130;
--layer-dialog: 131;
--layer-toast: 150;
```

Do not rewrite unrelated z-index values in this task. The new overlay components must consume the shared variables.

- [ ] **Step 5: Implement the Dialog compound API**

Export `DialogPortal` and `DialogOverlay` wrappers with class/ref forwarding. Implement:

```ts
type DialogContentProps = Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "asChild"> & {
  closeLabel?: string
  scroll?: "content" | "body"
  size?: "small" | "medium" | "large" | "full"
}
```

Export `DialogBody` as a ref-forwarding `div`. Keep `DialogClose` as the Radix primitive so callers may compose their own control. When `closeLabel` exists, inject exactly one legacy X control after children.

- [ ] **Step 6: Implement the shared overlay CSS**

Move Dialog layout into `overlay-shell.module.css`. Define overlay, content, size, scroll, header, body, footer, title, description, close, mobile, open/closed animation, and reduced-motion classes. Use `--layer-overlay` and `--layer-dialog`; keep transforms and opacity as the only animated properties.

- [ ] **Step 7: Run Dialog and existing asset-dialog tests**

Run: `npm run test:unit -- tests/components/core-ui-dialog.test.tsx tests/components/asset-picker-dialog.test.tsx tests/components/asset-library.test.tsx`

Expected: PASS without changing current call sites.

- [ ] **Step 8: Commit Dialog**

```bash
git add app/globals.css components/ui/dialog.tsx components/ui/overlay-shell.module.css components/ui/dialog.module.css tests/components/core-ui-dialog.test.tsx
git commit -m "feat: expand dialog composition"
```

### Task 3: AlertDialog on the shared shell and Button contract

**Files:**
- Modify: `components/ui/alert-dialog.tsx`
- Delete: `components/ui/alert-dialog.module.css`
- Modify: `components/ui/overlay-shell.module.css`
- Create: `tests/components/core-ui-c3c-alert-dialog.test.tsx`

**Interfaces:**
- Consumes: shared overlay classes from Task 2 and `getButtonClassName({ variant, size, className })` from `components/ui/button-contract.ts`.
- Produces: `AlertDialogPortal`, `AlertDialogOverlay`, `AlertDialogBody`; current exports remain valid; `AlertDialogAction variant?: "primary" | "destructive"` maps to Button `primary | danger`.

- [ ] **Step 1: Write failing decision-flow tests**

Add tests named:

- `requires an explicit cancel or action decision instead of outside dismissal`
- `uses the shared Button contract for cancel primary and destructive actions`
- `composes portal overlay header body and footer`
- `returns focus to the trigger after cancel`

Assert that outside pointer interaction leaves the AlertDialog open, Cancel closes it, Action fires once, destructive text uses the shared danger class, and focus returns to the trigger.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `npm run test:unit -- tests/components/core-ui-c3c-alert-dialog.test.tsx`

Expected: FAIL because the new compound exports and shared Button classes are absent.

- [ ] **Step 3: Implement the shared AlertDialog anatomy**

Add ref-forwarding `AlertDialogPortal`, `AlertDialogOverlay`, and `AlertDialogBody`. Use the same `overlay-shell.module.css` structure as Dialog but keep Radix AlertDialog behavior and do not add an outside-dismiss handler.

- [ ] **Step 4: Delegate actions to Button styling**

Use `getButtonClassName` for Cancel and Action instead of duplicating button CSS. Map Cancel to secondary, primary Action to primary, and destructive Action to danger. Preserve current prop names and Radix refs.

- [ ] **Step 5: Run focused and compatibility tests**

Run: `npm run test:unit -- tests/components/core-ui-c3c-alert-dialog.test.tsx tests/components/core-ui-expansion-c1.test.tsx tests/components/asset-library.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit AlertDialog**

```bash
git add components/ui/alert-dialog.tsx components/ui/alert-dialog.module.css components/ui/overlay-shell.module.css tests/components/core-ui-c3c-alert-dialog.test.tsx
git commit -m "feat: unify alert dialog decisions"
```

### Task 4: Stationary square-gap Spinner

**Files:**
- Modify: `components/ui/spinner.tsx`
- Modify: `components/ui/spinner.module.css`
- Create: `tests/components/core-ui-c3c-spinner.test.tsx`

**Interfaces:**
- Consumes: current `SpinnerProps` with required `label` and `size?: "compact" | "default" | "large"`.
- Produces: the same public props and status semantics, with four presentational square segments and no Phosphor dependency.

- [ ] **Step 1: Write failing geometry and accessibility tests**

Add tests named:

- `announces the pending task with a required status name`
- `renders a square perimeter without a rotating svg`
- `forwards native span props and all three sizes`

Assert role, accessible name, `data-size`, four `aria-hidden` perimeter segments, ref forwarding, and absence of an SVG.

- [ ] **Step 2: Run Spinner tests and confirm failure**

Run: `npm run test:unit -- tests/components/core-ui-c3c-spinner.test.tsx`

Expected: FAIL because the current implementation renders `CircleNotch`.

- [ ] **Step 3: Implement the stationary square markup**

Keep `SpinnerProps` stable. Render four presentational spans inside the named status. Use `currentColor` and data attributes so the CSS controls compact, default, and large sizes.

- [ ] **Step 4: Implement perimeter-step motion**

Animate segment opacity in sequence so the highlighted or absent segment appears to move around a stationary square. Do not rotate the root or change layout. Under `prefers-reduced-motion: reduce`, stop the sequence with one segment emphasized.

- [ ] **Step 5: Run focused and compatibility tests**

Run: `npm run test:unit -- tests/components/core-ui-c3c-spinner.test.tsx tests/components/core-ui-expansion-c2.test.tsx`

Expected: PASS after updating the old assertion from hidden SVG to hidden perimeter geometry.

- [ ] **Step 6: Commit Spinner**

```bash
git add components/ui/spinner.tsx components/ui/spinner.module.css tests/components/core-ui-c3c-spinner.test.tsx tests/components/core-ui-expansion-c2.test.tsx
git commit -m "feat: add square gap spinner"
```

### Task 5: Application-wide Toast provider and compatibility aliases

**Files:**
- Create: `components/ui/toast.tsx`
- Create: `components/ui/toast.module.css`
- Modify: `components/ui/notice-toast.tsx`
- Delete: `components/ui/notice-toast.module.css`
- Modify: `app/layout.tsx`
- Create: `tests/components/core-ui-c3c-toast.test.tsx`
- Modify: `tests/components/core-ui-expansion-c2.test.tsx`

**Interfaces:**
- Consumes: `Toast` primitives from unified `radix-ui`, the layer tokens from Task 2, and server-resolved `initialLocale` in `app/layout.tsx`.
- Produces: `ToastProvider`, `ToastViewport`, `ToastRoot`, `ToastTitle`, `ToastDescription`, `ToastAction`, `ToastClose`, `useToast`, and deprecated-compatible `NoticeToastProvider`, `useNoticeToast`, `NoticeToastInput`, and `NoticeToastVariant` exports.

Define:

```ts
export type ToastTone = "neutral" | "info" | "success" | "warning" | "error"

export type ToastOptions = Readonly<{
  action?: Readonly<{ label: string; onClick: () => void }>
  description?: string
  duration?: number
  id?: string
  onDismiss?: () => void
  title: string
  tone?: ToastTone
}>

export type ToastProviderProps = Readonly<{
  children: ReactNode
  closeLabel: string
  viewportLabel: string
}>

export type ToastApi = Readonly<{
  dismiss: (id?: string) => void
  error: (title: string, options?: Omit<ToastOptions, "title" | "tone">) => string
  info: (title: string, options?: Omit<ToastOptions, "title" | "tone">) => string
  neutral: (title: string, options?: Omit<ToastOptions, "title" | "tone">) => string
  show: (options: ToastOptions) => string
  success: (title: string, options?: Omit<ToastOptions, "title" | "tone">) => string
  update: (id: string, options: Partial<Omit<ToastOptions, "id">>) => void
  warning: (title: string, options?: Omit<ToastOptions, "title" | "tone">) => string
}>
```

- [ ] **Step 1: Write failing Toast lifecycle tests**

Add tests named:

- `throws a clear error when useToast is called outside ToastProvider`
- `shows semantic helper toasts and dismisses one or all`
- `updates a duplicate stable ID instead of rendering another toast`
- `shows at most three toasts and advances queued items after dismissal`
- `runs an optional action once and preserves its accessible label`
- `uses a longer error duration and supports deliberate persistence`
- `forwards localized viewport and close labels`

Use fake timers only for duration tests. Assert status versus alert live semantics, queue order, callback count, and the exact missing-provider error.

- [ ] **Step 2: Run Toast tests and confirm failure**

Run: `npm run test:unit -- tests/components/core-ui-c3c-toast.test.tsx`

Expected: FAIL because `components/ui/toast.tsx` does not exist.

- [ ] **Step 3: Implement the provider store and hook**

Use React context and stable IDs. Keep one FIFO in-memory queue with at most three active items; additional items remain pending until an active item leaves. Order active items so the newest visible Toast is closest to the viewport edge. `show` with an existing active or pending ID updates in place. `dismiss()` clears active and pending items; `dismiss(id)` removes one and calls its `onDismiss` exactly once. Use neutral, info, success, warning, and error helpers as thin calls into `show`.

Default durations are 5,000ms for neutral, info, and success; 7,000ms for warning; and 9,000ms for error. `duration: 0` persists until deliberate dismissal. A pending Toast does not begin its duration until it becomes active.

- [ ] **Step 4: Implement Radix Toast rendering**

Render one Radix Provider and Viewport. Each visible item uses Root, Title, optional Description, optional Action, and Close. Use Primary Blue and semantic edge treatments, square geometry, logical swipe variables, `--layer-toast`, safe-area offsets, top-inline-end desktop placement, and bottom placement on mobile. Gate entry and exit transforms under reduced motion.

- [ ] **Step 5: Preserve NoticeToast imports**

Change `components/ui/notice-toast.tsx` into a documented compatibility module that re-exports or adapts the new provider and hook:

- `NoticeToastVariant` maps to ToastTone excluding neutral.
- `NoticeToastInput.variant` maps to `ToastOptions.tone`.
- `useNoticeToast()` continues to return `{ notify, dismiss }`.
- `NoticeToastProvider` keeps required `closeLabel` and `viewportLabel` props.

Do not retain a second queue or second CSS implementation.

- [ ] **Step 6: Install the root provider once**

Read the root-layout guidance from Step 2, then wrap the existing children inside `ToastProvider` in `app/layout.tsx`. Supply Korean or English `closeLabel` and `viewportLabel` from the already resolved `initialLocale`; do not create another locale store or client-side detection path.

- [ ] **Step 7: Run Toast, layout, and compatibility tests**

Run: `npm run test:unit -- tests/components/core-ui-c3c-toast.test.tsx tests/components/core-ui-expansion-c2.test.tsx tests/components/design-system-pages.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit Toast**

```bash
git add app/layout.tsx components/ui/toast.tsx components/ui/toast.module.css components/ui/notice-toast.tsx components/ui/notice-toast.module.css tests/components/core-ui-c3c-toast.test.tsx tests/components/core-ui-expansion-c2.test.tsx
git commit -m "feat: add application toast system"
```

### Task 6: Compound Alert and quieter StatusLabel

**Files:**
- Modify: `components/ui/alert.tsx`
- Modify: `components/ui/feedback.module.css`
- Modify: `components/ui/status-label.tsx`
- Modify: `components/ui/status-label.module.css`
- Create: `tests/components/core-ui-c3c-feedback.test.tsx`
- Modify: `tests/components/panel-status-label.test.tsx`

**Interfaces:**
- Consumes: current Alert `title`, `variant`, and `live` props; current StatusLabel `variant` prop.
- Produces: `AlertIcon`, `AlertContent`, `AlertTitle`, `AlertDescription`, `AlertAction`; `StatusLabel tone?: "neutral" | "info" | "success" | "warning" | "error"` with `variant` as compatibility alias.

- [ ] **Step 1: Write failing Alert compound tests**

Add tests named:

- `composes icon title description and action with one labelled region`
- `keeps static information out of live regions`
- `announces only a live urgent alert`
- `keeps the title prop as a non-duplicating compatibility shorthand`

Assert heading association, optional action, one title only, role absence for static alerts, and `role="alert"` only when `live` is true.

- [ ] **Step 2: Write failing StatusLabel tests**

Add or update tests named:

- `uses text and a semantic edge without a decorative marker`
- `accepts a composed Phosphor icon without relying on it for the name`
- `lets tone override the legacy variant without creating a live region`
- `forwards native span props and refs`

Assert `data-tone`, no generated marker element, visible status text, ref forwarding, and no role or aria-live.

- [ ] **Step 3: Run feedback tests and confirm failure**

Run: `npm run test:unit -- tests/components/core-ui-c3c-feedback.test.tsx tests/components/panel-status-label.test.tsx`

Expected: FAIL because compound Alert parts and StatusLabel tone do not exist.

- [ ] **Step 4: Implement the Alert compound context**

Use one generated title ID per Alert and context for AlertTitle. Export the compound parts as native ref-forwarding elements. In compound mode, callers compose icon, title, description, and action. When the legacy `title` prop is supplied, render exactly one default semantic icon, AlertTitle, and AlertDescription wrapper around current children.

- [ ] **Step 5: Redesign Alert CSS**

Use a semantic edge or icon cell, Paper surface, Ink and Muted copy, and optional action alignment. Do not tint the whole component with saturated semantic color. Stack the action below content on narrow screens. Preserve reduced-motion neutrality because Alert has no automatic motion.

- [ ] **Step 6: Implement StatusLabel tone compatibility**

Accept both `tone` and `variant`, resolve `tone ?? variant ?? "neutral"`, and emit `data-tone`. Remove the pseudo-element marker. Use a compact semantic edge block or restrained surface, square geometry, and text-required children. Allow caller-composed icons through normal children without adding an icon prop.

- [ ] **Step 7: Run focused and current call-site tests**

Run: `npm run test:unit -- tests/components/core-ui-c3c-feedback.test.tsx tests/components/panel-status-label.test.tsx tests/components/asset-library.test.tsx tests/components/document-admin.test.tsx`

Expected: PASS without application call-site changes.

- [ ] **Step 8: Commit feedback components**

```bash
git add components/ui/alert.tsx components/ui/feedback.module.css components/ui/status-label.tsx components/ui/status-label.module.css tests/components/core-ui-c3c-feedback.test.tsx tests/components/panel-status-label.test.tsx
git commit -m "feat: refine alert and status feedback"
```

### Task 7: Publish C3C catalog, demos, generated resources, and verification

**Files:**
- Create: `lib/design-system/component-catalog/c3c.ts`
- Modify: `lib/design-system/component-catalog/core-expansion-c2.ts`
- Modify: `lib/design-system/component-catalog/feedback.ts`
- Modify: `lib/design-system/component-catalog/overlays.ts`
- Modify: `lib/design-system/component-catalog/structure.ts`
- Modify: `lib/design-system/components.ts`
- Modify: `lib/design-system/component-options.ts`
- Modify: `lib/design-system/component-slugs.ts`
- Modify: `lib/design-system/meta.ts`
- Create: `components/design-system/component-demo-c3c.tsx`
- Create: `components/design-system/component-demo-c3c-client.tsx`
- Modify: `components/design-system/component-demo-registry.tsx`
- Modify: `components/design-system/design-system.module.css`
- Modify: `tests/design-system/catalog.test.ts`
- Modify: `tests/design-system/serialize.test.ts`
- Modify: `tests/components/design-system-pages.test.tsx`
- Modify: `tests/components/document-pages.test.tsx`
- Modify: `docs/platform-roadmap.md`
- Regenerate: `DESIGN.md`

**Interfaces:**
- Consumes: all component APIs from Tasks 1-6 and the existing design catalog serializer.
- Produces: recommended catalog IDs `pagination`, `dialog`, `alert-dialog`, `spinner`, `toast`, `alert`, and `status-label`; realistic bilingual demos; refreshed AI-readable design artifacts; roadmap status showing C3C shipped and C3D next.

- [ ] **Step 1: Add failing catalog and route expectations**

Update tests to expect:

- `toast` as the recommended public component ID and demo key;
- no recommended `notice-toast` catalog entry;
- Radix dependencies only for Dialog, AlertDialog, and Toast;
- no Phosphor dependency for Spinner;
- compound anatomy, compatibility props, new states, and copyable examples;
- `/design/components/toast` in public route and sitemap expectations;
- generated guide and Skill resources containing `useToast`, `DialogBody`, `AlertAction`, and StatusLabel `tone` guidance.

- [ ] **Step 2: Run catalog tests and confirm failure**

Run: `npm run test:unit -- tests/design-system/catalog.test.ts tests/design-system/serialize.test.ts tests/components/design-system-pages.test.tsx tests/components/document-pages.test.tsx`

Expected: FAIL because C3C records, Toast slug, and demos are absent.

- [ ] **Step 3: Consolidate C3C catalog records**

Move the seven recommended component entries into `component-catalog/c3c.ts` and remove their old records from the prior catalog files. Keep each component ID unique. Update `components.ts`, options, and slugs so Toast replaces Notice Toast in recommended navigation while the source compatibility module remains importable.

- [ ] **Step 4: Build realistic bilingual demos**

Add demos for:

- document-list Pagination;
- settings Dialog with Body and Footer;
- destructive archive AlertDialog;
- Button with square Spinner;
- save, upload-error, and undo Toast states;
- inline validation Alert with an action;
- document and media lifecycle StatusLabels.

Use real LafLabs interface language without inventing product, customer, or availability claims. Keep Toast hook interaction in the dedicated client demo file.

- [ ] **Step 5: Update design metadata and roadmap**

Bump the design-system patch version and `updatedAt` date in `lib/design-system/meta.ts`. Mark C3C shipped and C3D next in `docs/platform-roadmap.md` without changing unrelated delivery ordering.

- [ ] **Step 6: Generate and verify design artifacts**

Run: `npm run design:generate`

Expected: `DESIGN.md` changes deterministically from the catalog.

Run: `npm run design:check`

Expected: PASS.

- [ ] **Step 7: Run the complete automated gate**

Run:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

Expected: all commands PASS; the unit summary remains at or above 131 files and 1,283 tests.

- [ ] **Step 8: Run bounded visual verification**

Start the production or development server and inspect `/design/components` plus each changed detail route at desktop and mobile widths in Korean and English. Verify 320px layout, 200% zoom, keyboard focus, long Dialog scrolling, AlertDialog decisions, Pagination rail, Toast stacking/swipe/dismissal, popup layering, and reduced motion. Perform one batched defect pass and at most one confirmation pass.

- [ ] **Step 9: Run the Impeccable detector once**

Run:

```bash
node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json components/ui/pagination.tsx components/ui/pagination.module.css components/ui/dialog.tsx components/ui/overlay-shell.module.css components/ui/alert-dialog.tsx components/ui/spinner.tsx components/ui/spinner.module.css components/ui/toast.tsx components/ui/toast.module.css components/ui/alert.tsx components/ui/feedback.module.css components/ui/status-label.tsx components/ui/status-label.module.css components/design-system/component-demo-c3c.tsx components/design-system/component-demo-c3c-client.tsx components/design-system/design-system.module.css
```

Expected: no unresolved blocking findings.

- [ ] **Step 10: Commit publication and verification changes**

```bash
git add DESIGN.md docs/platform-roadmap.md lib/design-system components/design-system tests/design-system tests/components/design-system-pages.test.tsx tests/components/document-pages.test.tsx
git commit -m "docs: publish core ui c3c guidance"
```

## Final self-review

- [ ] Confirm every C3C spec section maps to one task and no C3D migration work was pulled forward.
- [ ] Confirm legacy Dialog, Alert, StatusLabel, and NoticeToast imports remain covered by tests.
- [ ] Confirm Toast queue, update, duration, action, dismissal, and Provider failure all have direct tests.
- [ ] Confirm no component adds rounded geometry, ornamental shadow, a second accent, or whole-shape Spinner rotation.
- [ ] Confirm no visible Korean or English copy was invented beyond clearly labelled component examples.
- [ ] Confirm `git diff --check`, `git status`, and the complete automated gate are clean before branch review.
