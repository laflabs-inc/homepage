# Dynamic Document Categories and Analytics Implementation Plan

> **For Codex:** Execute this plan sequentially with test-driven development. Keep the taxonomy and Analytics slices independently reversible even though they ship in one PR.

**Goal:** Replace hard-coded document categories with an Admin-managed taxonomy, improve public document discovery, and turn consented Analytics data into an accessible time-series dashboard.

**Architecture:** Add a PostgreSQL-backed category repository/service/API/UI and make document validation depend on active category data at the service boundary. Extend published-document queries with sort and bounded title/summary search. Add canonical content interaction events to the existing consent-aware Analytics client, aggregate a zero-filled UTC daily series, and render it with Recharts plus an accessible table.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Drizzle ORM, Neon PostgreSQL, Zod, Recharts, Vitest, Testing Library.

**Design specification:** `docs/superpowers/specs/2026-08-31-dynamic-categories-analytics-design.md`

---

## Task 1: Persist the category taxonomy

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `lib/document-categories/types.ts`
- Create: `tests/documents/category-schema.test.ts`
- Create via generator: `drizzle/0010_*.sql`
- Modify via generator: `drizzle/meta/_journal.json`
- Create via generator: `drizzle/meta/0010_snapshot.json`

**Step 1: Write the failing schema test**

Assert that `documentCategories` exposes the approved columns, unique `(kind, slug)` identity, active/sort indexes, non-negative order/version checks, and the composite relation used by `documentSeries`.

**Step 2: Run the focused test and confirm failure**

Run: `npm run test:unit -- tests/documents/category-schema.test.ts`

Expected: FAIL because `documentCategories` and its constraints do not exist.

**Step 3: Add the minimum Drizzle schema and shared types**

Define `DocumentCategory`, `DocumentCategoryInput`, and `DocumentCategorySnapshot`. Add the category table, composite uniqueness, indexes/checks, audit fields, and the nullable composite foreign key from `document_series(kind, category)`.

**Step 4: Generate and inspect the migration**

Run: `npm run db:generate`

Amend the generated SQL only where required to seed the 12 canonical categories, add the composite foreign key after seeding, preserve existing null categories, and use idempotent seed insertion.

**Step 5: Add a migration contract test**

Assert ordering: table creation → seed insertion → foreign key addition. Execute the migration against PGlite with representative existing series and verify all rows survive.

**Step 6: Run the focused tests**

Run: `npm run test:unit -- tests/documents/category-schema.test.ts tests/documents/category-migration.test.ts`

Expected: PASS.

**Step 7: Commit**

`git commit -m "feat: persist document categories"`

## Task 2: Build category repository and service rules

**Files:**
- Create: `lib/document-categories/validation.ts`
- Create: `lib/document-categories/store.ts`
- Create: `lib/document-categories/service.ts`
- Create: `tests/documents/category-validation.test.ts`
- Create: `tests/documents/category-service.test.ts`
- Modify: `lib/documents/validation.ts`
- Modify: `lib/documents/service.ts`
- Modify: `lib/documents/store.ts`
- Modify: `tests/documents/validation.test.ts`
- Modify: `tests/documents/workflow.test.ts`
- Modify: `tests/documents/publication-store.test.ts`

**Step 1: Write failing validation and service tests**

Cover slug normalization, localized label bounds, immutable slug/kind, optimistic version conflicts, active/inactive state, stable ordering, atomic reorder, and audit metadata without labels or authored content.

**Step 2: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/documents/category-validation.test.ts tests/documents/category-service.test.ts`

Expected: FAIL because the taxonomy modules do not exist.

**Step 3: Implement validation, repository, and service**

Keep SQL in the repository, authorization-independent business rules in the service, and stable error codes at the boundary. Use a transaction and version checks for reorder.

**Step 4: Move document category checks to the service boundary**

Keep structural draft validation synchronous. Before create/update/publish, load categories for the document kind and accept only active categories, except an unchanged inactive category on an existing series.

**Step 5: Remove hard-coded category arrays from workflow SQL**

Replace publication-transition allowlists in `lib/documents/store.ts` with category-table existence checks while preserving the current metadata-lock semantics.

**Step 6: Run focused tests**

Run: `npm run test:unit -- tests/documents/category-validation.test.ts tests/documents/category-service.test.ts tests/documents/validation.test.ts tests/documents/workflow.test.ts tests/documents/publication-store.test.ts`

Expected: PASS.

**Step 7: Commit**

`git commit -m "feat: enforce managed document categories"`

## Task 3: Expose protected category APIs

**Files:**
- Create: `lib/http/admin-document-categories.ts`
- Create: `app/api/admin/document-categories/route.ts`
- Create: `app/api/admin/document-categories/[id]/route.ts`
- Create: `app/api/admin/document-categories/reorder/route.ts`
- Create: `tests/documents/category-admin-api.test.ts`

**Step 1: Write failing route-contract tests**

Cover Admin authorization, same-origin mutation checks, bounded JSON, no-store responses, create/update/deactivate/reorder success, version conflict, duplicate slug, malformed ID, and unavailable storage.

**Step 2: Run the test and confirm failure**

Run: `npm run test:unit -- tests/documents/category-admin-api.test.ts`

Expected: FAIL because the routes do not exist.

**Step 3: Implement shared authorization/error mapping**

Reuse the existing Admin API patterns. Map service errors to 400/409/503 without exposing database messages.

**Step 4: Implement route handlers**

GET supports optional kind and active filters. POST creates. PATCH updates labels/order/active with expected version. Reorder accepts the full ordered ID/version set for one kind.

**Step 5: Run focused tests**

Run: `npm run test:unit -- tests/documents/category-admin-api.test.ts tests/auth/admin-api.test.ts`

Expected: PASS.

**Step 6: Commit**

`git commit -m "feat: add document category admin api"`

## Task 4: Add the Admin category workspace

**Files:**
- Create: `app/admin/(protected)/documents/categories/page.tsx`
- Create: `components/admin/document-category-manager.tsx`
- Modify: `app/admin/(protected)/documents/page.tsx`
- Modify: `components/admin/admin-nav.tsx`
- Modify: `lib/admin/i18n.ts`
- Modify: `app/admin/admin.module.css`
- Create: `tests/components/document-category-manager.test.tsx`
- Modify: `tests/admin/i18n.test.ts`
- Modify: `tests/components/admin-shell-i18n.test.tsx`

**Step 1: Read the UI craft floor before editing UI**

Read: `/home/singlethread/.codex/skills/impeccable/reference/craft-floor.md`

**Step 2: Write failing component and i18n tests**

Cover localized rows, create form, inline label edit, deactivate/reactivate confirmation, keyboard reorder controls, conflict refresh message, and category-workspace navigation.

**Step 3: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/components/document-category-manager.test.tsx tests/admin/i18n.test.ts tests/components/admin-shell-i18n.test.tsx`

Expected: FAIL because the page and copy do not exist.

**Step 4: Implement the protected server page and client manager**

Use the existing square, flat Admin language. Keep one primary action per state, visible labels, deterministic pending states, and native controls. Do not introduce a generic form framework.

**Step 5: Add responsive CSS**

Verify one-column mobile editing, no 390 px overflow, 44 px touch targets, strong focus-visible states, and no motion when reduced motion is requested.

**Step 6: Run focused tests**

Run: `npm run test:unit -- tests/components/document-category-manager.test.tsx tests/admin/i18n.test.ts tests/components/admin-shell-i18n.test.tsx`

Expected: PASS.

**Step 7: Commit**

`git commit -m "feat: manage document categories in admin"`

## Task 5: Integrate managed categories into Admin documents

**Files:**
- Modify: `app/admin/(protected)/documents/page.tsx`
- Modify: `app/admin/(protected)/documents/new/page.tsx`
- Modify: `app/admin/(protected)/documents/[revisionId]/page.tsx`
- Modify: `components/admin/document-editor.tsx`
- Modify: `components/admin/document-list.tsx`
- Modify: `lib/documents/admin-list.ts`
- Modify: `lib/documents/types.ts`
- Modify: `tests/components/document-admin.test.tsx`
- Modify: `tests/components/document-admin-pages.test.tsx`
- Modify: `tests/documents/admin-list.test.ts`

**Step 1: Write failing integration tests**

Assert editors receive categories from the server, inactive current categories remain visible but cannot be newly selected, and document-list filters update the URL immediately without client-filtering only the loaded page.

**Step 2: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/components/document-admin.test.tsx tests/components/document-admin-pages.test.tsx tests/documents/admin-list.test.ts`

Expected: FAIL against the hard-coded/client-only behavior.

**Step 3: Pass category data through server pages**

Fetch active categories by kind once per request. Remove category label maps from Admin copy while retaining UI labels unrelated to taxonomy.

**Step 4: Replace Apply filters**

Use router-backed immediate selects and a bounded debounced search. Preserve current server results with `aria-busy` during navigation; never apply a second client-only filter.

**Step 5: Run focused tests**

Run: `npm run test:unit -- tests/components/document-admin.test.tsx tests/components/document-admin-pages.test.tsx tests/documents/admin-list.test.ts tests/documents/admin-api.test.ts`

Expected: PASS.

**Step 6: Commit**

`git commit -m "feat: connect documents to managed categories"`

## Task 6: Improve public document discovery

**Files:**
- Modify: `lib/documents/types.ts`
- Modify: `lib/documents/store.ts`
- Modify: `lib/documents/cache.ts`
- Modify: `components/content/document-index.tsx`
- Create: `components/content/document-index-toolbar.tsx`
- Modify: `components/content/content.module.css`
- Modify: `app/(documents)/notices/page.tsx`
- Modify: `app/(documents)/legal/page.tsx`
- Modify: `app/(documents)/disclosures/page.tsx`
- Modify: `app/api/content/route.ts`
- Modify: `lib/content.ts`
- Modify: `tests/components/document-pages.test.tsx`
- Modify: `tests/documents/public-api.test.ts`
- Modify: `tests/documents/cache.test.ts`

**Step 1: Write failing discovery tests**

Cover dynamic active categories, latest/oldest ordering, escaped case-insensitive title/summary search, 100-character bounds, invalid parameter canonicalization, cursor preservation, no shared cache for `q`, and mobile toolbar layout.

**Step 2: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/components/document-pages.test.tsx tests/documents/public-api.test.ts tests/documents/cache.test.ts`

Expected: FAIL because sort/search and managed category data are missing.

**Step 3: Extend repository queries**

Parameterize order direction and escaped `ILIKE` matching. Keep pinned-first ordering and cursor comparison symmetric for latest and oldest.

**Step 4: Update caching**

Cache category/sort list requests with category and sort in the key. Call the repository directly for non-empty `q`. Add category cache tags and invalidate them after mutations.

**Step 5: Build the accessible toolbar**

Use native category/sort selects, bounded search, explicit clear, URL-backed state, localized labels, and responsive single-row/two-row layout.

**Step 6: Run focused tests**

Run: `npm run test:unit -- tests/components/document-pages.test.tsx tests/documents/public-api.test.ts tests/documents/cache.test.ts`

Expected: PASS.

**Step 7: Commit**

`git commit -m "feat: improve public document discovery"`

## Task 7: Add consent-aware content interaction events

**Files:**
- Modify: `lib/analytics/normalize.ts`
- Create: `lib/analytics/use-analytics.ts`
- Modify: `components/analytics/consent-provider.tsx`
- Modify: `components/content/document-index-toolbar.tsx`
- Modify: `tests/analytics/normalize.test.ts`
- Modify: `tests/analytics/client.test.ts`
- Create: `tests/components/use-analytics.test.tsx`

**Step 1: Write failing event-contract tests**

Cover `content_filter`, `content_sort`, and `content_search`; canonical bounded target IDs; rejection of raw query-shaped targets; no events before Analytics consent; stop after withdrawal; and no Admin-path tracking.

**Step 2: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/analytics/normalize.test.ts tests/analytics/client.test.ts tests/components/use-analytics.test.tsx`

Expected: FAIL because the event types and hook do not exist.

**Step 3: Extend normalization and expose the hook**

Keep the client as the only queue/transport. The hook delegates to the consent-owned client and returns a no-op when unavailable. Do not add a wrapper component.

**Step 4: Instrument public discovery**

Track only the canonical operation/slug/sort target after an intentional user change. Track search submission as `<kind>:search`; never pass search text.

**Step 5: Run focused tests**

Run: `npm run test:unit -- tests/analytics/normalize.test.ts tests/analytics/client.test.ts tests/components/use-analytics.test.tsx tests/components/consent-panel.test.tsx`

Expected: PASS.

**Step 6: Commit**

`git commit -m "feat: track consented content discovery"`

## Task 8: Aggregate daily Analytics series

**Files:**
- Modify: `lib/analytics/store.ts`
- Modify: `tests/analytics/dashboard.test.ts`
- Modify: `tests/analytics/schema.test.ts`

**Step 1: Write failing aggregation tests**

Cover UTC day boundaries, 7/30/90-day lengths, zero-filled missing days, daily distinct visitors, all eight metrics, malformed database JSON normalization, and unchanged aggregate totals/funnel privacy.

**Step 2: Run the focused test and confirm failure**

Run: `npm run test:unit -- tests/analytics/dashboard.test.ts tests/analytics/schema.test.ts`

Expected: FAIL because `daily` is absent.

**Step 3: Add the daily SQL aggregation and normalization**

Group selected consented events by UTC received date, aggregate approved event types, normalize the database payload, and fill the complete date range in application code.

**Step 4: Run focused tests**

Run: `npm run test:unit -- tests/analytics/dashboard.test.ts tests/analytics/schema.test.ts tests/analytics/service.test.ts`

Expected: PASS.

**Step 5: Commit**

`git commit -m "feat: aggregate daily analytics"`

## Task 9: Render the Analytics charts accessibly

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `components/admin/analytics-charts.tsx`
- Modify: `components/admin/analytics-dashboard.tsx`
- Modify: `app/admin/admin.module.css`
- Modify: `lib/admin/i18n.ts`
- Modify: `tests/components/analytics-dashboard.test.tsx`
- Modify: `tests/admin/i18n.test.ts`

**Step 1: Install the approved chart dependency**

Run: `npm install recharts`

**Step 2: Write failing dashboard tests**

Cover traffic and interaction chart regions, localized legends/tooltips/table headings, exact accessible table values, empty state, reduced-motion animation disabling, and preservation of totals/funnel/distributions.

**Step 3: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/components/analytics-dashboard.test.tsx tests/admin/i18n.test.ts`

Expected: FAIL because chart components and copy do not exist.

**Step 4: Implement the client chart island**

Render a two-series traffic line/area chart and stacked interaction bars. Keep chart data presentation-only, add a semantic daily table, and use existing Route Blue/blue-grey/navy tokens without gradients or shadows.

**Step 5: Add responsive and reduced-motion styling**

Prevent horizontal page overflow at 390/768/1440 px. Keep legends inspectable and exact values available without hover.

**Step 6: Run focused tests**

Run: `npm run test:unit -- tests/components/analytics-dashboard.test.tsx tests/admin/i18n.test.ts`

Expected: PASS.

**Step 7: Commit**

`git commit -m "feat: visualize analytics trends"`

## Task 10: Final verification and PR readiness

**Files:**
- Modify if needed: `README.md`
- Inspect: all files changed since `origin/main`

**Step 1: Run focused regression groups**

Run: `npm run test:unit -- tests/documents tests/analytics tests/components/document-admin.test.tsx tests/components/document-admin-pages.test.tsx tests/components/document-pages.test.tsx tests/components/analytics-dashboard.test.tsx`

Expected: PASS.

**Step 2: Run the Impeccable detector exactly once**

Run: `node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json app/admin/'(protected)'/documents/categories/page.tsx components/admin/document-category-manager.tsx components/admin/document-list.tsx components/content/document-index-toolbar.tsx components/admin/analytics-charts.tsx components/admin/analytics-dashboard.tsx app/admin/admin.module.css components/content/content.module.css`

Resolve all blocking findings. Do not run the detector a second time.

**Step 3: Run the full quality gate**

Run: `npm test`

Expected: typecheck, lint, unit tests, and production build all PASS.

**Step 4: Inspect the migration and diff**

Run: `git diff --check origin/main...HEAD`

Confirm migration ordering, no secret/config changes, no raw search terms in Analytics, no hard-coded category allowlists, and no unrelated changes.

**Step 5: Perform visual browser verification**

Verify Admin categories, Admin documents, public notices/legal/disclosures, and Analytics at 390, 768, and 1440 px in Korean and English. Confirm keyboard operation, focus, no overflow, reduced motion, and consent/no-consent tracking behavior.

**Step 6: Commit any verification fixes**

`git commit -m "fix: complete content analytics verification"`

**Step 7: Push and open the PR**

Push `codex/admin-content-analytics` and create one PR describing the two independently reversible slices, migration/rollback notes, test evidence, and screenshots.
