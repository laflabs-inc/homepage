# Admin Operational Adoption (PR B) Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the remaining document, media, analytics, and AI settings surfaces into the shared Admin workspace grammar without changing any business behavior, API contract, data, dependency, or provider configuration.

**Architecture:** Server route pages continue to own authorization and data loading, then compose `AdminPage` and `AdminPageHeader`. Existing client feature components keep all mutations and local state, but organize their content with `AdminToolbar`, `AdminSection`, and the existing Core UI primitives. Route-specific shell styles are removed only after no consumer remains. The separate PR C will refine visual quality after every real Admin surface shares this predictable structure.

**Tech Stack:** Next.js 16.3.6 App Router, React 19.2.6, TypeScript 5.9, CSS Modules, LafLabs Core UI, Vitest/Testing Library, Playwright, Recharts.

**Approved specification:** `docs/superpowers/specs/2026-10-12-admin-workspace-design.md`

---

## Fixed constraints

- Do not add features, API routes, database migrations, dependencies, environment variables, metrics, or placeholder data.
- Preserve Admin authorization, document lifecycle behavior, media upload behavior, analytics calculations, Agent payloads, and endpoint methods exactly.
- Preserve Korean and English operation and existing localized copy unless a composition label is genuinely missing.
- Reuse current Core UI and Admin layout contracts; do not introduce a second page-shell or visual primitive.
- Keep all icon-only controls named, all inputs associated with labels, and all real data tables semantic.
- Keep the page free of horizontal overflow at 390px. Any table overflow must be bounded inside its own region.
- Treat PR B as structural adoption. Defer typography, visual density, spacing nuance, and decorative refinement to PR C unless a defect blocks use.

## Review focus

1. Draft, scheduled, published, archived, immutable, and translation document paths retain their current actions and payloads.
2. Media configured/unconfigured, upload queue, filtering, lifecycle actions, references, and dialogs remain functional.
3. Analytics range links, zero-data behavior, charts, funnel values, distributions, and accessible source tables remain exact.
4. Agent unconfigured/configured, verification diagnostics, credential replacement/deletion, budget settings, and version-conflict recovery remain exact.
5. Every changed route works in Korean and English at 1440px and 390px without page-level overflow.

## Task 1: Adopt the Admin page contract in document creation, editing, and the Markdown guide

**Files:**

- Modify: `app/admin/(protected)/documents/new/page.tsx`
- Modify: `app/admin/(protected)/documents/[revisionId]/page.tsx`
- Modify: `app/admin/(protected)/documents/markdown-guide/page.tsx`
- Modify: `components/admin/document-editor.tsx`
- Modify: `app/admin/admin.module.css`
- Modify: `tests/components/document-admin-pages.test.tsx`
- Modify: `tests/components/document-admin.test.tsx`
- Test: `tests/components/markdown-authoring-guide.test.tsx`

**Step 1: Write failing composition assertions**

Add route-level assertions that new, revision, and guide pages render one shared page heading, preserve the document-specific actions/links, and expose a bounded editor or guide section. Extend editor assertions only where needed to prove that editable and immutable workflows still expose the same controls.

Run:

```bash
npx vitest run tests/components/document-admin-pages.test.tsx tests/components/document-admin.test.tsx tests/components/markdown-authoring-guide.test.tsx
```

Expected: FAIL because these routes still own legacy page wrappers and the editor has not adopted the shared section composition.

**Step 2: Replace route-owned shell markup**

- Wrap new and revision routes in `AdminPage`.
- Use `AdminPageHeader` for document identity and route context.
- Keep `DocumentEditor` responsible for form state, publication actions, and status feedback.
- Convert the Markdown guide toolbar into header actions/breadcrumbs while retaining the Admin-list and raw Markdown links.
- Do not change service calls, query validation, category loading, template loading, metadata, or link targets.

**Step 3: Organize the existing editor with shared sections**

- Use `AdminSection` and existing `Panel`/Field composition for source, properties, publication controls, immutable metadata, and preview.
- Keep the current explicit source/preview editor modes and CodeMirror state.
- Keep all current button labels, lifecycle confirmation behavior, fetch requests, and router transitions.
- Avoid additional nesting when a section rule is sufficient.

**Step 4: Remove only document shell CSS made unreachable by this task**

Delete legacy `.documentsPage`, `.documentsHeading`, `.markdownGuidePage`, and equivalent route-frame declarations only after `rg` shows no consumers. Keep editor-specific layout declarations needed by `DocumentEditor`.

**Step 5: Verify and commit**

Run:

```bash
npx vitest run tests/components/document-admin-pages.test.tsx tests/components/document-admin.test.tsx tests/components/markdown-authoring-guide.test.tsx
git add 'app/admin/(protected)/documents' components/admin/document-editor.tsx app/admin/admin.module.css tests/components/document-admin-pages.test.tsx tests/components/document-admin.test.tsx
git commit -m "refactor: adopt admin workspace in document editor"
```

## Task 2: Adopt the Admin page contract in the media library

**Files:**

- Modify: `app/admin/(protected)/assets/page.tsx`
- Modify: `app/admin/(protected)/assets/loading.tsx`
- Modify: `components/admin/asset-library.tsx`
- Modify: `components/admin/asset-library.module.css`
- Modify: `tests/components/admin-assets-page.test.tsx`
- Modify: `tests/components/asset-library.test.tsx`
- Test: `tests/components/asset-upload-queue.test.tsx`

**Step 1: Write failing page-structure and responsive assertions**

Assert that configured and unconfigured media routes share the Admin page heading, that filters live in one labelled Admin toolbar, and that the result/upload regions retain their accessible names and mobile single-column contract.

Run:

```bash
npx vitest run tests/components/admin-assets-page.test.tsx tests/components/asset-library.test.tsx tests/components/asset-upload-queue.test.tsx
```

Expected: FAIL because the media library still renders its own page heading and route wrapper.

**Step 2: Move route framing to the server page**

- Resolve locale and render `AdminPage` plus `AdminPageHeader` for both configured and unavailable states.
- Keep `isMediaConfigured()`, query parsing, cursor validation, service reads, and props untouched.
- Keep upload as the first operational section; do not add a fake upload button disconnected from the queue.
- Make the loading route use the same final header/section geometry to prevent layout shift.

**Step 3: Convert the client library to operational sections**

- Remove its duplicate page heading.
- Wrap search/type/status/tag controls with `AdminToolbar` while preserving debounce and URL replacement behavior.
- Group upload, collection metadata/view control, results, pagination, and local feedback with `AdminSection` or existing primitives.
- Preserve dialogs, upload queue, metadata editing, copy, replace, reference inspection, archive, restore, pending cleanup, and delete behavior.

**Step 4: Collapse redundant media shell CSS**

Remove local page/header/toolbar frame rules superseded by shared Admin layout. Retain media-specific grid, preview, queue, metadata, usage, and responsive rules.

**Step 5: Verify and commit**

Run:

```bash
npx vitest run tests/components/admin-assets-page.test.tsx tests/components/asset-library.test.tsx tests/components/asset-upload-queue.test.tsx
git add 'app/admin/(protected)/assets' components/admin/asset-library.tsx components/admin/asset-library.module.css tests/components/admin-assets-page.test.tsx tests/components/asset-library.test.tsx
git commit -m "refactor: adopt admin workspace in media library"
```

## Task 3: Adopt the Admin page contract in analytics

**Files:**

- Modify: `app/admin/(protected)/analytics/page.tsx`
- Modify: `app/admin/(protected)/analytics/error.tsx`
- Modify: `components/admin/analytics-dashboard.tsx`
- Modify: `components/admin/analytics-charts.tsx`
- Modify: `app/admin/admin.module.css`
- Modify: `tests/components/analytics-dashboard.test.tsx`

**Step 1: Write failing composition assertions**

Assert one page heading, an accessible range selector in the header/toolbar, shared named sections for traffic/funnel/distributions/tables, and the existing exact metric values. Add an error-state assertion that the retry UI appears within the shared Admin page geometry and still redacts the source error.

Run:

```bash
npx vitest run tests/components/analytics-dashboard.test.tsx
```

Expected: FAIL because the dashboard and error boundary still own legacy shell markup.

**Step 2: Put page identity and range selection in the route composition**

- Resolve Admin locale in the server page and render `AdminPage`/`AdminPageHeader`.
- Render the existing 7/30/90 range links as a shared header action or toolbar without converting them into client-only state.
- Pass only the existing summary data and presentation inputs to the dashboard.
- Preserve `parseAnalyticsRange()`, query timing, and all calculations.

**Step 3: Convert data regions to shared sections**

- Keep metrics as one connected definition list.
- Use `AdminSection` for traffic, funnel, distributions, and aggregate tables.
- Keep Recharts presentational output and the visually hidden semantic daily table.
- Keep aggregate tables as semantic tables with local overflow when required.
- Render the current empty copy through the existing `EmptyState` contract without inventing data.

**Step 4: Adopt the shared error frame and prune obsolete dashboard shell CSS**

Keep `reset()` behavior and redaction unchanged. Remove only dashboard page-heading or section-heading CSS that has been superseded, preserving chart, metric, bar, funnel, and table visualization rules.

**Step 5: Verify and commit**

Run:

```bash
npx vitest run tests/components/analytics-dashboard.test.tsx tests/analytics
git add 'app/admin/(protected)/analytics' components/admin/analytics-dashboard.tsx components/admin/analytics-charts.tsx app/admin/admin.module.css tests/components/analytics-dashboard.test.tsx
git commit -m "refactor: adopt admin workspace in analytics"
```

## Task 4: Adopt the Admin page contract in Agent settings

**Files:**

- Modify: `app/admin/(protected)/agent/page.tsx`
- Modify: `components/admin/agent-settings.tsx`
- Modify: `app/admin/admin.module.css`
- Modify: `tests/components/agent-settings.test.tsx`

**Step 1: Write failing structural assertions around existing behavior**

Assert one page heading and distinct accessible sections for connection, usage/policy, and advanced limits while preserving all current field names and action labels. Keep the existing request-body and diagnostic assertions as non-negotiable regression coverage.

Run:

```bash
npx vitest run tests/components/agent-settings.test.tsx
```

Expected: FAIL because Agent settings still owns a custom numbered page/section shell.

**Step 2: Move page identity and the immediate stop action to the server/client boundary**

- Render `AdminPage` and `AdminPageHeader` in the route.
- Keep the state-dependent “disable now” action inside `AgentSettings`, in one coherent action region near status/feedback.
- Do not move secrets or unsafe configuration into server-rendered markup beyond the existing safe configuration DTO.

**Step 3: Compose connection and policy settings from shared sections**

- Replace numbered custom sections with `AdminSection` plus deliberate `Panel`/Field composition.
- Keep model selection, pricing context, API key handling, connection test, credential deletion, settings save, enable confirmation, advanced fields, and localized diagnostics unchanged.
- Preserve API methods, paths, payload shapes, password clearing, busy states, and version-conflict refresh logic byte-for-byte where possible.

**Step 4: Remove unreachable Agent shell styles**

Delete `.agentPage`, `.agentHeading`, `.agentSection`, and equivalent custom frame declarations after confirming no consumers. Keep feature-specific model, diagnostics, action, grid, and advanced disclosure rules still required by the component.

**Step 5: Verify and commit**

Run:

```bash
npx vitest run tests/components/agent-settings.test.tsx tests/agent
git add 'app/admin/(protected)/agent/page.tsx' components/admin/agent-settings.tsx app/admin/admin.module.css tests/components/agent-settings.test.tsx
git commit -m "refactor: adopt admin workspace in agent settings"
```

## Task 5: Cross-route cleanup, responsive proof, and PR B release

**Files:**

- Modify: `app/admin/admin.module.css`
- Modify: `components/admin/asset-library.module.css`
- Modify: `lib/admin/i18n.ts` only if a shared composition label is missing
- Modify: `tests/admin/i18n.test.ts` only if localized keys change
- Modify: `docs/platform-roadmap.md`
- Modify: `.impeccable/surfaces/admin-workspace.md`
- Create or modify: focused Admin workspace browser verification under `e2e/` and its dedicated config only if current coverage cannot exercise the changed routes safely
- Replace: `.impeccable/review/admin-pr-b-*.png`

**Step 1: Audit and remove superseded shell selectors**

Use `rg` to prove legacy document/media/dashboard/Agent page-frame selectors have no consumers before deleting them. Do not perform unrelated CSS cleanup.

**Step 2: Run focused regression suites**

Run:

```bash
npx vitest run \
  tests/components/document-admin-pages.test.tsx \
  tests/components/document-admin.test.tsx \
  tests/components/markdown-authoring-guide.test.tsx \
  tests/components/admin-assets-page.test.tsx \
  tests/components/asset-library.test.tsx \
  tests/components/asset-upload-queue.test.tsx \
  tests/components/analytics-dashboard.test.tsx \
  tests/components/agent-settings.test.tsx
```

Expected: PASS with no weakened request/payload assertions.

**Step 3: Verify real Admin layouts**

At 1440px and 390px, verify Korean and English for:

- document create, editable detail, immutable detail, and Markdown guide;
- media configured, unavailable, empty, filtered, and populated states where fixtures permit;
- analytics populated, zero-data, and retry states;
- Agent configured and unconfigured states;
- keyboard focus order, labelled icon controls, local table overflow, and page-level `scrollWidth === clientWidth`.

Capture representative desktop/mobile screenshots in `.impeccable/review/`. Do not use screenshots as the only proof of behavior.

**Step 4: Run all release gates**

Run:

```bash
npm run design:check
npm run typecheck
npm run lint
npm run test:unit
npm run build
node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json \
  'app/admin/(protected)' components/admin app/admin/admin.module.css components/admin/asset-library.module.css
```

Expected: every command succeeds and the detector reports no unresolved findings in the changed Admin surfaces.

**Step 5: Update delivery records**

- Mark PR B shipped only after all gates pass.
- Add PR C as the next delivery: visual quality refinement of hierarchy, typography, spacing, density, feedback, and real-data composition after shared adoption.
- Record that PR C remains presentation-only and must not alter APIs or operational behavior.

**Step 6: Final review and pull request**

Review the complete diff against the approved spec, explicitly checking for new dependencies, API/data changes, copy invention, and behavior drift. Then commit the final verification/docs slice, push `codex/admin-operational-adoption`, and open a PR to `main` with:

- route-by-route adoption summary;
- preserved behavior/contracts;
- automated verification results;
- desktop/mobile evidence;
- PR C follow-up boundary.

```bash
git add app/admin components/admin lib/admin tests docs .impeccable
git commit -m "docs: complete admin operational adoption"
git push -u origin codex/admin-operational-adoption
gh pr create --base main --head codex/admin-operational-adoption --title "refactor: unify admin operational pages" --body-file /tmp/laflabs-admin-pr-b.md
```

## PR C handoff (not implemented in this plan)

PR C is a deliberate visual-quality pass after PR B is merged or approved for merge. It should compare all real Admin routes side by side and refine:

- page/header scale and line length;
- vertical rhythm and information density;
- toolbar and form alignment;
- connected versus separated panel treatment;
- metric, table, chart, empty, alert, and loading-state hierarchy;
- mobile control economy and touch rhythm;
- Korean/English typographic balance.

PR C must begin with its own short visual brief and approved implementation plan. It should not reopen data architecture or add Admin features.
