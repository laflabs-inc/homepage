# Admin Visual Quality Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine every existing authenticated Admin surface into one compact, coherent “Quiet Operations” workspace without changing any workflow or data behavior.

**Architecture:** Keep the existing `AdminWorkspace`, `AdminPage`, `AdminPageHeader`, `AdminToolbar`, and `AdminSection` composition API. Establish the visual grammar in their CSS modules first, then revise route-owned CSS for documents, media, analytics, and Agent settings; change JSX only when an existing element needs a presentational class or semantic grouping that cannot be expressed safely in CSS.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Vitest, Testing Library, existing LafLabs Core UI

**Spec:** `docs/superpowers/specs/2026-10-16-admin-visual-quality-design.md`

## Global Constraints

- Do not change APIs, payloads, database structures, storage, authentication, authorization, routes, lifecycle rules, calculations, or existing data.
- Preserve field names, field order, validation meaning, save behavior, labels, and user-facing copy.
- Do not add dependencies, placeholder data, dark mode, features, rounded cards, drop shadows, or decorative animation.
- Retain the 232px desktop navigation rail and 1500px maximum workspace.
- Use fixed Admin title sizes: 40px/44px desktop and 32px/36px mobile; do not use fluid `clamp()` headings.
- Use the spacing scale `4, 8, 12, 16, 24, 32, 48, 64px` and gutters of 48px desktop, 32px tablet, and 16px mobile.
- Keep interactive targets at least 44px and state motion within 150–220ms, respecting `prefers-reduced-motion`.
- Preserve Korean/English parity and prevent page-level horizontal overflow at 390px.

## Review Focus

- Long Korean and English headings/descriptions at 390px must wrap without page-level overflow; Task 1 adds the CSS contract and Task 6 verifies both locales.
- Busy and disabled controls must retain dimensions and labels while operations run; Tasks 2, 3, and 5 retain the existing interaction tests and Task 6 checks presentation contracts.
- Analytics tables and charts must overflow only inside their own viewport; Task 4 adds an explicit local-overflow contract.
- Media cards must not jump between queued, failed, completed, and deletion states; Task 3 pins stable card/queue geometry.
- Agent configured, unconfigured, validating, success, conflict, and error states must keep actions in a stable location; Task 5 runs the complete Agent component suite and adds a layout contract.

---

### Task 1: Shared Admin Shell and Visual Grammar

**Files:**
- Create: `tests/components/admin-visual-quality.test.ts`
- Modify: `components/admin/admin-page.module.css`
- Modify: `components/admin/admin-workspace.module.css`
- Modify: `components/admin/admin-route-state.module.css`
- Test: `tests/components/admin-page.test.tsx`
- Test: `tests/components/admin-workspace.test.tsx`
- Test: `tests/components/admin-route-state.test.tsx`

**Interfaces:**
- Consumes: Existing `AdminPage`, `AdminPageHeader`, `AdminToolbar`, `AdminSection`, and `AdminWorkspace` markup and class names.
- Produces: Fixed Admin typography, shared gutters, compact headers, connected sections, and consistent route states used by all later tasks.

- [ ] **Step 1: Write the failing shared visual contract tests**

Add tests named `uses fixed product-ui heading sizes`, `uses authored workspace gutters at all three breakpoints`, `keeps compact route states`, and `removes marketing-scale heading clamps`. Read the three CSS modules and assert the exact spec values: 40/44 desktop page title, 32/36 mobile title, 48/32/16 gutters, 44px minimum controls where locally defined, and no `clamp()` in Admin page headings.

- [ ] **Step 2: Run the shared contract and composition tests to verify failure**

Run: `npx vitest run tests/components/admin-visual-quality.test.ts tests/components/admin-page.test.tsx tests/components/admin-workspace.test.tsx tests/components/admin-route-state.test.tsx`

Expected: the new visual contract fails on current fluid headings/gutters while composition and interaction tests remain green.

- [ ] **Step 3: Implement the shared visual grammar**

Update the three CSS modules to use fixed product typography, 32–48px page rhythm, authored shell gutters, a single active-navigation treatment, compact toolbar/section headings, and compact loading/error layouts. Preserve the 232px rail, 1500px maximum width, current mobile drawer behavior, accessible names, and component APIs.

- [ ] **Step 4: Run the shared tests and typecheck**

Run: `npx vitest run tests/components/admin-visual-quality.test.ts tests/components/admin-page.test.tsx tests/components/admin-workspace.test.tsx tests/components/admin-route-state.test.tsx && npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit the shared grammar**

```bash
git add components/admin/admin-page.module.css components/admin/admin-workspace.module.css components/admin/admin-route-state.module.css tests/components/admin-visual-quality.test.ts
git commit -m "style: refine admin workspace grammar"
```

### Task 2: Documents, Categories, and Editor

**Files:**
- Modify: `app/admin/admin.module.css`
- Modify only if presentation hooks are necessary: `components/admin/document-list.tsx`
- Modify only if presentation hooks are necessary: `components/admin/document-editor.tsx`
- Modify only if presentation hooks are necessary: `components/admin/document-category-manager.tsx`
- Modify only if presentation hooks are necessary: `components/admin/markdown-authoring-guide.tsx`
- Test: `tests/components/admin-visual-quality.test.ts`
- Test: `tests/components/document-admin-layout.test.ts`
- Test: `tests/components/document-admin.test.tsx`
- Test: `tests/components/document-category-manager.test.tsx`
- Test: `tests/components/markdown-authoring-guide.test.tsx`

**Interfaces:**
- Consumes: Task 1 page/header/toolbar/section geometry.
- Produces: Connected document filters/results, compact rows, editor-first hierarchy, grouped settings, and stable publishing actions.

- [ ] **Step 1: Extend the failing visual contract for document surfaces**

Add assertions for one connected filter/result rhythm, row separators only between list items, a bounded editor canvas, compact properties grid, and mobile publishing controls that remain inside the viewport. Preserve the existing explicit publishing-column assertions in `document-admin-layout.test.ts`.

- [ ] **Step 2: Run document visual and behavior tests to verify the new assertions fail**

Run: `npx vitest run tests/components/admin-visual-quality.test.ts tests/components/document-admin-layout.test.ts tests/components/document-admin.test.tsx tests/components/document-category-manager.test.tsx tests/components/markdown-authoring-guide.test.tsx`

Expected: only the newly added presentation assertions fail.

- [ ] **Step 3: Refine document list and category management styles**

Use spacing and row dividers instead of nested card borders; keep document identity, status, locale/date metadata, and actions in their existing semantic order. Align category creation and category rows to the same control, status, and action grammar without changing callbacks or optimistic-version behavior.

- [ ] **Step 4: Refine editor and authoring-guide styles**

Make the source editor the dominant canvas, settings a compact supporting region, and publishing actions a stable single hierarchy. Retain field order, source/preview behavior, dirty navigation, summary generation, scheduling, publishing, archive, and delete semantics.

- [ ] **Step 5: Run document tests**

Run: `npx vitest run tests/components/admin-visual-quality.test.ts tests/components/document-admin-layout.test.ts tests/components/document-admin-pages.test.tsx tests/components/document-admin.test.tsx tests/components/document-category-manager.test.tsx tests/components/markdown-authoring-guide.test.tsx`

Expected: PASS, including busy/disabled publication and long-copy cases.

- [ ] **Step 6: Commit document refinements**

```bash
git add app/admin/admin.module.css components/admin/document-list.tsx components/admin/document-editor.tsx components/admin/document-category-manager.tsx components/admin/markdown-authoring-guide.tsx tests/components/admin-visual-quality.test.ts tests/components/document-admin-layout.test.ts
git commit -m "style: polish admin document workflows"
```

### Task 3: Media Library

**Files:**
- Modify: `components/admin/asset-library.module.css`
- Modify only if presentation hooks are necessary: `components/admin/asset-library.tsx`
- Modify only if presentation hooks are necessary: `components/admin/asset-upload-queue.tsx`
- Test: `tests/components/admin-visual-quality.test.ts`
- Test: `tests/components/asset-library.test.tsx`
- Test: `tests/components/asset-upload-queue.test.tsx`
- Test: `tests/components/admin-assets-page.test.tsx`

**Interfaces:**
- Consumes: Task 1 sections, toolbar, controls, and state grammar.
- Produces: Compact upload entry, dense filters, stable asset cards/queue items, and an authored mobile list.

- [ ] **Step 1: Add failing media presentation contracts**

Assert that the media stylesheet uses a bounded thumbnail aspect ratio, stable queue/card minimum geometry, compact upload spacing, and an explicit one-column mobile layout without page-level overflow.

- [ ] **Step 2: Run media tests to verify the new contract fails**

Run: `npx vitest run tests/components/admin-visual-quality.test.ts tests/components/asset-library.test.tsx tests/components/asset-upload-queue.test.tsx tests/components/admin-assets-page.test.tsx`

Expected: existing upload/filter/delete behavior passes and new geometry assertions fail.

- [ ] **Step 3: Refine upload, filters, cards, and states**

Reduce upload-panel prominence, align filter controls, prioritize thumbnail and identity, demote metadata/actions, and keep queued/failed/completed/deleting states dimensionally stable. Preserve file input, replacement, delivery-path copy, metadata edit, archive, usage, and permanent cleanup behavior.

- [ ] **Step 4: Implement the media mobile composition**

At 720px and below, use the existing single-column contract with readable thumbnail/metadata order and no clipped actions. Do not shrink the desktop grid card into an unreadable miniature.

- [ ] **Step 5: Run media tests and commit**

Run: `npx vitest run tests/components/admin-visual-quality.test.ts tests/components/asset-library.test.tsx tests/components/asset-upload-queue.test.tsx tests/components/admin-assets-page.test.tsx`

```bash
git add components/admin/asset-library.module.css components/admin/asset-library.tsx components/admin/asset-upload-queue.tsx tests/components/admin-visual-quality.test.ts
git commit -m "style: polish admin media library"
```

### Task 4: Analytics Dashboard

**Files:**
- Modify: `app/admin/admin.module.css`
- Modify only if presentation hooks are necessary: `components/admin/analytics-dashboard.tsx`
- Modify only if presentation hooks are necessary: `components/admin/analytics-charts.tsx`
- Test: `tests/components/admin-visual-quality.test.ts`
- Test: `tests/components/analytics-dashboard.test.tsx`

**Interfaces:**
- Consumes: Task 1 section and state grammar plus the existing Recharts data interface.
- Produces: A coherent metric strip, shared chart legend/grid treatment, distinct funnel/distribution/table layouts, and local table overflow.

- [ ] **Step 1: Add failing analytics layout contracts**

Assert fixed metric-value scale, shared chart-region spacing, local `.tableViewport` overflow, stable chart/no-data height, and absence of page-level overflow rules.

- [ ] **Step 2: Run analytics tests to verify presentation failures only**

Run: `npx vitest run tests/components/admin-visual-quality.test.ts tests/components/analytics-dashboard.test.tsx`

Expected: data, funnel, localization, authorization, retry, and accessible-table tests pass; new CSS assertions fail.

- [ ] **Step 3: Refine analytics presentation**

Align metric labels/values, use primary blue only for the main series, normalize legends/tooltips/grids, keep funnel stages in one readable progression, keep distribution groups in the existing responsive grid, and constrain tables to `.tableViewport`. Preserve chart dimensions for loading/no-data states. Do not change calculations, date ranges, data keys, or accessible tables.

- [ ] **Step 4: Run analytics tests and commit**

Run: `npx vitest run tests/components/admin-visual-quality.test.ts tests/components/analytics-dashboard.test.tsx`

```bash
git add app/admin/admin.module.css components/admin/analytics-dashboard.tsx components/admin/analytics-charts.tsx tests/components/admin-visual-quality.test.ts
git commit -m "style: refine admin analytics hierarchy"
```

### Task 5: Agent Settings

**Files:**
- Modify: `app/admin/admin.module.css`
- Modify only if presentation hooks are necessary: `components/admin/agent-settings.tsx`
- Test: `tests/components/admin-visual-quality.test.ts`
- Test: `tests/components/agent-settings.test.tsx`

**Interfaces:**
- Consumes: Task 1 section, control, focus, and feedback grammar.
- Produces: Clear connection/model/policy/limits grouping with stable action and feedback placement.

- [ ] **Step 1: Add failing Agent layout contracts**

Assert explicit connection, policy/usage, advanced-limit, and action regions; compact field grids; stable action placement; and no per-field card borders.

- [ ] **Step 2: Run Agent tests to verify presentation failures only**

Run: `npx vitest run tests/components/admin-visual-quality.test.ts tests/components/agent-settings.test.tsx`

Expected: credential, model, policy, limits, verification, conflict, kill-switch, localization, busy, success, and error behavior stays green; new CSS contract fails.

- [ ] **Step 3: Refine Agent settings presentation**

Separate connection, model/policy, usage limits, and optional advanced limits through headings, spacing, and grid alignment. Keep verification feedback adjacent to the relevant connection controls and keep save/kill-switch actions stable across all states. Do not change request bodies, price data, confirmation, retry, or credential handling.

- [ ] **Step 4: Run Agent tests and commit**

Run: `npx vitest run tests/components/admin-visual-quality.test.ts tests/components/agent-settings.test.tsx`

```bash
git add app/admin/admin.module.css components/admin/agent-settings.tsx tests/components/admin-visual-quality.test.ts
git commit -m "style: polish admin agent settings"
```

### Task 6: Cross-route Responsive, Language, and State Verification

**Files:**
- Modify as findings require: `components/admin/admin-page.module.css`
- Modify as findings require: `components/admin/admin-workspace.module.css`
- Modify as findings require: `components/admin/admin-route-state.module.css`
- Modify as findings require: `app/admin/admin.module.css`
- Modify as findings require: `components/admin/asset-library.module.css`
- Modify: `tests/components/admin-visual-quality.test.ts`
- Modify: `.impeccable/surfaces/admin-workspace.md`

**Interfaces:**
- Consumes: Tasks 1–5 complete presentation system.
- Produces: Final PR C visual contract and human-review checklist with no functional changes.

- [ ] **Step 1: Complete cross-route CSS contract coverage**

Add final assertions for 390px page overflow prevention, 720px and 900px authored breakpoints, local table/code/chart overflow, long-copy wrapping, 44px controls, and reduced-motion overrides.

- [ ] **Step 2: Run the focused Admin suite**

Run: `npx vitest run tests/components/admin-visual-quality.test.ts tests/components/admin-page.test.tsx tests/components/admin-workspace.test.tsx tests/components/admin-route-state.test.tsx tests/components/admin-shell-i18n.test.tsx tests/components/document-admin-layout.test.ts tests/components/document-admin-pages.test.tsx tests/components/document-admin.test.tsx tests/components/document-category-manager.test.tsx tests/components/markdown-authoring-guide.test.tsx tests/components/admin-assets-page.test.tsx tests/components/asset-library.test.tsx tests/components/asset-upload-queue.test.tsx tests/components/analytics-dashboard.test.tsx tests/components/agent-settings.test.tsx`

Expected: PASS.

- [ ] **Step 3: Run repository validation**

Run: `npm run design:check && npm run typecheck && npm run lint && npm run test:unit && npm run build`

Expected: all commands exit 0.

- [ ] **Step 4: Run the Impeccable detector once**

Run: `node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --target 'app/admin/(protected)' --json`

Expected: review every applicable finding, fix real violations, and record any intentional exceptions in the Admin surface brief.

- [ ] **Step 5: Verify representative views manually**

At desktop, tablet, and 390px mobile widths, verify Korean and English for documents list/editor/categories/guide, media empty/populated/upload/error/delete, analytics populated/loading/no-data/error, Agent configured/unconfigured/validating/success/error, navigation, keyboard focus, and page-level overflow. If the local browser cannot run, provide a preview deployment and a concise human checklist instead of claiming visual completion.

- [ ] **Step 6: Update the Admin surface brief and commit final polish**

Record final hierarchy, breakpoint, and state decisions in `.impeccable/surfaces/admin-workspace.md`.

```bash
git add .impeccable/surfaces/admin-workspace.md components/admin/admin-page.module.css components/admin/admin-workspace.module.css components/admin/admin-route-state.module.css app/admin/admin.module.css components/admin/asset-library.module.css tests/components/admin-visual-quality.test.ts
git commit -m "docs: finalize admin visual quality contract"
```

### Task 7: Branch Review and Delivery

**Files:**
- Review: all changes since `origin/main`

**Interfaces:**
- Consumes: Tasks 1–6 and their green validation evidence.
- Produces: A reviewable PR with a functional-boundary summary and human UI checklist.

- [ ] **Step 1: Inspect the complete diff**

Run: `git diff --check origin/main...HEAD && git diff --stat origin/main...HEAD && git status --short`

Expected: no whitespace errors and no uncommitted files.

- [ ] **Step 2: Review functional boundaries**

Confirm the diff contains no API, schema, storage, auth, route, payload, calculation, document lifecycle, media behavior, or Agent behavior changes. Any JSX diff must be presentation-only.

- [ ] **Step 3: Push and open the pull request**

Push `codex/admin-visual-quality` and open a PR describing the shared grammar, route-specific refinements, automated checks, visual-verification status, and the short human checklist.
