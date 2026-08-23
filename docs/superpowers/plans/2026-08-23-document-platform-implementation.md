# LafLabs Document Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the versioned notice, legal, disclosure, and design-guide publishing platform, shared Markdown renderer, public pages/APIs, and protected document editor.

**Architecture:** Add document series and immutable localized revision tables to the existing Neon/Drizzle database. Keep workflow rules in a server-only document service, public reads in a repository with tagged cache wrappers, browser mutations in independently authorized Route Handlers, and rendering in one safe Markdown component shared by public and admin preview pages.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript 5.9, Neon PostgreSQL, Drizzle ORM/Kit, Auth.js, Zod 4, React Markdown, remark-gfm, rehype-slug, github-slugger, Vitest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-23-document-publishing-ai-design.md`

## Global Constraints

- Support only `notice`, `legal`, `disclosure`, and `design` document kinds.
- Require a Korean revision before creating English and require Korean publication before English publication.
- Never automatically translate or silently fall back between locales.
- Only drafts may be edited or deleted; published revisions are immutable.
- Require a 1–240-character one-line summary before publication.
- Keep homepage project/product content outside this plan.
- Render no raw HTML from Markdown and allow only HTTPS, HTTP, mailto, hash, and root-relative links.
- Reuse the existing GitHub `laflabs-inc` organization authorization and verify it again in every admin API.
- Do not publish fabricated legal text or claim legal compliance.
- Preserve the existing homepage if document storage is unavailable.
- The five-minute publication schedule requires Vercel Pro or Enterprise; Hobby permits only daily Cron invocations and must not receive an invalid five-minute expression.

---

## File Structure

### Database and domain

- `lib/db/schema.ts` — add document series, revisions, and append-only audit tables plus enums.
- `drizzle/0003_document_platform.sql` and Drizzle metadata — forward-only schema migration.
- `lib/documents/types.ts` — stable public/admin types and repository contracts.
- `lib/documents/validation.ts` — Zod request schemas and kind/category/slug rules.
- `lib/documents/service.ts` — workflow orchestration and immutable-state rules.
- `lib/documents/store.ts` — Neon/Drizzle repository and publication transactions.
- `lib/audit/store.ts` — append-only audit insertion.

### Authorization and HTTP

- `types/next-auth.d.ts`, `lib/auth/config.ts` — expose stable GitHub actor ID in the server session.
- `lib/auth/admin-api.ts` — return JSON-safe 401/403 decisions and `AdminActor`.
- `lib/http/json-body.ts` — bounded JSON parsing used by mutation routes.
- `app/api/admin/documents/**` — CRUD and workflow Route Handlers.
- `app/api/content/**` — published read-only APIs.
- `app/api/cron/document-publication/route.ts` — publish due scheduled revisions.

### Markdown and public UI

- `lib/markdown/callouts.ts` — transform allowlisted Obsidian-style callouts.
- `lib/markdown/outline.ts` — deterministic H2/H3 table of contents.
- `components/content/markdown-document.tsx` — safe LafLabs component map.
- `components/content/document-index.tsx` — reusable published list.
- `components/content/document-detail.tsx` — title, metadata, contents, and Markdown.
- `components/content/content.module.css` — square responsive content styles.
- `app/(documents)/**` — four public indexes and four detail-route families.
- `app/(documents)/error.tsx` — retryable dependency failure state.
- `app/sitemap.ts` — published document URLs.
- `components/layout/site-footer.tsx`, `lib/content.ts` — bilingual document navigation.

### Admin UI

- `components/admin/admin-nav.tsx` — Analytics/Documents/Agent navigation.
- `components/admin/document-list.tsx` — filters and revision table.
- `components/admin/document-editor.tsx` — metadata/Markdown editor and workflow actions.
- `components/admin/document-preview.tsx` — exact shared renderer preview.
- `app/admin/(protected)/documents/**` — list, new, and revision editor pages.
- `app/admin/admin.module.css` — extend existing square admin system.

---

### Task 1: Add document and audit database schema

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `tests/documents/schema.test.ts`
- Create: `drizzle/0003_document_platform.sql`
- Modify: `drizzle/meta/_journal.json`
- Create: `drizzle/meta/0003_snapshot.json`

**Interfaces:**
- Produces: `documentKindEnum`, `documentLocaleEnum`, `documentStatusEnum`, `documentSeries`, `documentRevisions`, `adminAuditLog`.
- Consumed by: Tasks 3, 5, and 6.

- [ ] **Step 1: Write the failing schema contract test**

```ts
import { getTableConfig } from "drizzle-orm/pg-core"
import { describe, expect, it } from "vitest"
import { adminAuditLog, documentRevisions, documentSeries } from "@/lib/db/schema"

describe("document schema", () => {
  it("separates stable series from immutable localized revisions", () => {
    expect(getTableConfig(documentSeries).columns.map((c) => c.name)).toEqual([
      "id", "kind", "slug", "category", "pinned", "archived_at",
      "created_by", "created_at", "updated_at",
    ])
    expect(getTableConfig(documentRevisions).columns.map((c) => c.name)).toEqual([
      "id", "series_id", "locale", "revision", "title", "summary",
      "body_markdown", "status", "effective_at", "scheduled_at",
      "published_at", "created_by", "updated_by", "published_by",
      "created_at", "updated_at",
    ])
  })

  it("keeps audit metadata separate from document bodies", () => {
    expect(getTableConfig(adminAuditLog).columns.map((c) => c.name)).toEqual([
      "id", "action", "target_type", "target_id", "actor_github_id",
      "actor_name", "metadata", "created_at",
    ])
  })
})
```

- [ ] **Step 2: Run the schema test and verify RED**

Run: `npm run test:unit -- tests/documents/schema.test.ts`

Expected: FAIL because the document exports do not exist.

- [ ] **Step 3: Add enum-backed tables and indexes**

Implement the columns above with these constraints:

```ts
export const documentKindEnum = pgEnum("document_kind", ["notice", "legal", "disclosure", "design"])
export const documentLocaleEnum = pgEnum("document_locale", ["ko", "en"])
export const documentStatusEnum = pgEnum("document_status", ["draft", "scheduled", "published", "archived"])
```

Add unique indexes on `(kind, slug)` and `(series_id, locale, revision)`, indexes on `(kind, archived_at)`, `(series_id, locale, status)`, and `(status, scheduled_at)`, and a foreign key from revisions to series with delete restriction.

- [ ] **Step 4: Generate and inspect the forward-only migration**

Run: `npm run db:generate`

Expected: one new migration creating only the document enums/tables/indexes without dropping analytics objects.

- [ ] **Step 5: Run the schema test and full unit suite**

Run: `npm run test:unit -- tests/documents/schema.test.ts && npm run test:unit`

Expected: PASS with zero failures.

- [ ] **Step 6: Commit the schema boundary**

```bash
git add lib/db/schema.ts drizzle tests/documents/schema.test.ts
git commit -m "feat: add versioned document schema"
```

---

### Task 2: Add stable GitHub actor authorization for admin APIs

**Files:**
- Modify: `lib/auth/config.ts`
- Modify: `types/next-auth.d.ts`
- Create: `lib/auth/admin-api.ts`
- Create: `tests/auth/admin-api.test.ts`
- Modify: `tests/auth/config.test.ts`

**Interfaces:**
- Produces: `AdminActor { githubId: string; name: string }` and `authorizeAdminApi(): Promise<{ ok: true; actor: AdminActor } | { ok: false; response: Response }>`.
- Consumed by: all admin mutation routes in Task 5 and the later Agent plan.

- [ ] **Step 1: Write failing tests for stable actor propagation and 401/403 behavior**

```ts
it("copies the GitHub provider account ID into the session", async () => {
  const token = await config.callbacks!.jwt!({
    token: {}, account: { providerAccountId: "4242", access_token: "token" },
  } as never)
  expect(token.githubId).toBe("4242")
})

it("returns a stable actor for an organization member", async () => {
  authMock.mockResolvedValue({
    user: { name: "Laf Admin", githubId: "4242", orgMember: true },
    expires: "2099-01-01",
  })
  await expect(authorizeAdminApi()).resolves.toEqual({
    ok: true,
    actor: { githubId: "4242", name: "Laf Admin" },
  })
})
```

Also assert null session returns 401, signed-in non-member returns 403, and a member without a stable GitHub ID fails closed with 403.

- [ ] **Step 2: Run the authorization tests and verify RED**

Run: `npm run test:unit -- tests/auth/config.test.ts tests/auth/admin-api.test.ts`

Expected: FAIL because `githubId` and `authorizeAdminApi` do not exist.

- [ ] **Step 3: Propagate the actor ID and implement the API guard**

In the JWT callback, set `githubId` from `account.providerAccountId` only when an account is present, preserve it on later refreshes, and map it into `session.user`. Implement the guard without redirects:

```ts
export type AdminActor = { githubId: string; name: string }

export async function authorizeAdminApi(): Promise<AdminApiAuthorization> {
  const session = await auth()
  if (!session) return { ok: false, response: Response.json({ error: "unauthenticated" }, { status: 401 }) }
  if (!session.user.orgMember || !session.user.githubId) {
    return { ok: false, response: Response.json({ error: "forbidden" }, { status: 403 }) }
  }
  return {
    ok: true,
    actor: { githubId: session.user.githubId, name: session.user.name ?? "GitHub admin" },
  }
}
```

- [ ] **Step 4: Run focused and existing auth tests**

Run: `npm run test:unit -- tests/auth`

Expected: PASS with existing organization-membership behavior unchanged.

- [ ] **Step 5: Commit the admin actor boundary**

```bash
git add lib/auth/config.ts lib/auth/admin-api.ts types/next-auth.d.ts tests/auth
git commit -m "feat: expose stable admin actors to APIs"
```

---

### Task 3: Implement document validation and workflow services

**Files:**
- Create: `lib/documents/types.ts`
- Create: `lib/documents/validation.ts`
- Create: `lib/documents/service.ts`
- Create: `lib/documents/store.ts`
- Create: `lib/audit/store.ts`
- Create: `tests/documents/validation.test.ts`
- Create: `tests/documents/workflow.test.ts`
- Create: `tests/documents/publication-store.test.ts`

**Interfaces:**
- Produces: `DocumentKind`, `DocumentStatus`, `DocumentDraftInput`, `DocumentRevision`, `PublishedDocument`, `DocumentRepository`, `documentService`, `documentStore`.
- `DocumentRepository` methods: `createDraft`, `getRevision`, `updateDraft`, `deleteDraft`, `createNextDraft`, `scheduleRevision`, `returnScheduledToDraft`, `publishRevision`, `archiveCurrent`, `listAdmin`, `listPublished`, `getPublished`, `publishDue`.
- Consumed by: Tasks 5 and 6 and both later plans.

- [ ] **Step 1: Write failing validation tests**

Cover literal expected outcomes for:

```ts
expect(documentDraftSchema.safeParse({
  kind: "notice", locale: "ko", slug: "service-update",
  title: "서비스 업데이트", summary: "변경 사항을 안내합니다.",
  bodyMarkdown: "## 변경 사항\n본문",
}).success).toBe(true)
expect(documentDraftSchema.safeParse({ /* same values, slug: "Bad Slug" */ }).success).toBe(false)
expect(documentDraftSchema.safeParse({ /* same values, summary: "" */ }).success).toBe(true)
expect(publishDocumentSchema.safeParse({ summary: "" }).success).toBe(false)
```

Test the 160/240/200,000-character limits, the four kinds, two locales, scheduled future date, and explicit categories for each kind.

- [ ] **Step 2: Run validation tests and verify RED**

Run: `npm run test:unit -- tests/documents/validation.test.ts`

Expected: FAIL because the schemas do not exist.

- [ ] **Step 3: Implement document types and Zod schemas**

Use a lowercase slug regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Draft saves allow an empty summary; publish validation requires one. Export `categoriesByKind` so the editor and API share one allowlist.

- [ ] **Step 4: Run validation tests and verify GREEN**

Run: `npm run test:unit -- tests/documents/validation.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing workflow tests with an in-memory repository**

Test these service outcomes independently:

```ts
await expect(service.updateDraft(published.id, input, actor)).rejects.toMatchObject({ code: "immutable_revision" })
await expect(service.createEnglishDraft(seriesWithoutKorean.id, input, actor)).rejects.toMatchObject({ code: "korean_required" })
await expect(service.publish(english.id, actor, now)).rejects.toMatchObject({ code: "korean_not_published" })
await expect(service.schedule(draft.id, new Date(now.getTime() - 1), actor, now)).rejects.toMatchObject({ code: "invalid_schedule" })
```

Also assert publication archives the prior current revision, creates the audit action, and never modifies the prior title/body.

- [ ] **Step 6: Run workflow tests and verify RED**

Run: `npm run test:unit -- tests/documents/workflow.test.ts`

Expected: FAIL because the workflow service does not exist.

- [ ] **Step 7: Implement the workflow service and error contract**

Use `DocumentServiceError` with stable codes: `not_found`, `conflict`, `immutable_revision`, `korean_required`, `korean_not_published`, `invalid_schedule`, and `unavailable`. Keep the service free of Next.js imports so it is testable with an in-memory repository.

- [ ] **Step 8: Run workflow tests and verify GREEN**

Run: `npm run test:unit -- tests/documents/workflow.test.ts`

Expected: PASS.

- [ ] **Step 9: Write failing store contract tests**

Use an injected fake Drizzle boundary to prove `publishRevision` performs one atomic operation that locks the draft, rechecks status, archives the old current revision, publishes the new revision, and appends audit metadata without body content.

- [ ] **Step 10: Implement the Neon repository and audit insertion**

Use Drizzle queries for reads and one parameterized SQL CTE or transaction for each publication mutation. Public DTO mappers must explicitly select allowed columns rather than spreading database rows.

- [ ] **Step 11: Run document domain tests**

Run: `npm run test:unit -- tests/documents`

Expected: PASS.

- [ ] **Step 12: Commit the document domain**

```bash
git add lib/documents lib/audit tests/documents
git commit -m "feat: add document publication workflow"
```

---

### Task 4: Build the safe shared Markdown renderer

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lib/markdown/callouts.ts`
- Create: `lib/markdown/outline.ts`
- Create: `components/content/markdown-document.tsx`
- Create: `components/content/content.module.css`
- Create: `tests/markdown/callouts.test.ts`
- Create: `tests/markdown/outline.test.ts`
- Create: `tests/components/markdown-document.test.tsx`

**Interfaces:**
- Produces: `MarkdownDocument({ source, title })`, `buildDocumentOutline(source)`, and `remarkLafCallouts()`.
- Consumed by: public details and admin preview.

- [ ] **Step 1: Install the renderer dependencies**

Run: `npm install react-markdown remark-gfm rehype-slug github-slugger unified remark-parse mdast-util-to-string unist-util-visit`

Expected: package manifest and lockfile contain direct dependencies without unrelated upgrades.

- [ ] **Step 2: Write failing outline and callout tests**

```ts
expect(buildDocumentOutline("## 시작\n### 표\n## 시작")).toEqual([
  { depth: 2, id: "시작", text: "시작" },
  { depth: 3, id: "표", text: "표" },
  { depth: 2, id: "시작-1", text: "시작" },
])
```

Parse `> [!WARNING] 배포 전\n> 반드시 검토하세요.` and assert the blockquote node receives only the allowlisted `warning` type and title. Assert an unknown `[!SCRIPT]` remains an ordinary blockquote.

- [ ] **Step 3: Run parser tests and verify RED**

Run: `npm run test:unit -- tests/markdown`

Expected: FAIL because parser helpers do not exist.

- [ ] **Step 4: Implement AST-based outline and callout parsing**

Use one fresh `GithubSlugger` per document so outline IDs match `rehype-slug`. Visit only H2/H3 nodes for the outline. For callouts, inspect only the first text node in the first paragraph of a blockquote and attach `data-callout`/`data-callout-title` properties for the six allowed names.

- [ ] **Step 5: Run parser tests and verify GREEN**

Run: `npm run test:unit -- tests/markdown`

Expected: PASS.

- [ ] **Step 6: Write the failing rendered-component tests**

Render a fixture containing a table, task list, HTTPS link, `javascript:` link, image alt text, fenced code, duplicate headings, and warning callout. Assert semantic table/heading output, horizontal wrapper class, external-link rel, removal of the unsafe href, and callout text/type.

- [ ] **Step 7: Run renderer tests and verify RED**

Run: `npm run test:unit -- tests/components/markdown-document.test.tsx`

Expected: FAIL because `MarkdownDocument` does not exist.

- [ ] **Step 8: Implement the LafLabs renderer and responsive styles**

Configure `remark-gfm`, `remarkLafCallouts`, and `rehype-slug`; do not enable `rehype-raw`. Map headings, links, blockquotes, tables, pre/code, images, and task lists to square components. Wrap tables in a focusable overflow region with an accessible label. Use `urlTransform` to allow only `http:`, `https:`, `mailto:`, `#`, and `/` targets.

- [ ] **Step 9: Run renderer tests, typecheck, and lint**

Run: `npm run test:unit -- tests/markdown tests/components/markdown-document.test.tsx && npm run typecheck && npm run lint`

Expected: PASS with zero lint errors.

- [ ] **Step 10: Commit the shared renderer**

```bash
git add package.json package-lock.json lib/markdown components/content tests/markdown tests/components/markdown-document.test.tsx
git commit -m "feat: add LafLabs markdown renderer"
```

---

### Task 5: Add public document APIs and pages

**Files:**
- Create: `lib/documents/cache.ts`
- Create: `lib/http/cursor.ts`
- Create: `app/api/content/route.ts`
- Create: `app/api/content/[kind]/[slug]/route.ts`
- Create: `tests/documents/public-api.test.ts`
- Create: `components/content/document-index.tsx`
- Create: `components/content/document-detail.tsx`
- Create: `app/(documents)/layout.tsx`
- Create: `app/(documents)/error.tsx`
- Create: `app/(documents)/not-found.tsx`
- Create: `app/(documents)/notices/page.tsx`
- Create: `app/(documents)/notices/[slug]/page.tsx`
- Create: `app/(documents)/legal/page.tsx`
- Create: `app/(documents)/legal/[slug]/page.tsx`
- Create: `app/(documents)/disclosures/page.tsx`
- Create: `app/(documents)/disclosures/[slug]/page.tsx`
- Create: `app/(documents)/design/page.tsx`
- Create: `app/(documents)/design/[slug]/page.tsx`
- Create: `tests/components/document-pages.test.tsx`
- Create: `app/sitemap.ts`
- Modify: `components/layout/site-footer.tsx`
- Modify: `lib/content.ts`

**Interfaces:**
- Consumes: `documentStore.listPublished`, `documentStore.getPublished`, `MarkdownDocument`, and `buildDocumentOutline`.
- Produces: cached `listPublishedDocuments` and `getPublishedDocument`, public JSON DTOs, public document pages, and sitemap entries.

- [ ] **Step 1: Write failing public API tests**

Test `handleContentList` and `handleContentDetail` with an injected repository. Assert kind/locale/limit validation, opaque cursor rejection, 404 for missing locale without fallback, published-only fields, stable ETag, and `Cache-Control` headers.

- [ ] **Step 2: Run public API tests and verify RED**

Run: `npm run test:unit -- tests/documents/public-api.test.ts`

Expected: FAIL because the handlers do not exist.

- [ ] **Step 3: Implement cursor helpers, cache wrappers, and public handlers**

Encode cursors as URL-safe base64 JSON containing only publication timestamp and UUID, validate decoded structure with Zod, and cap limits at 50. Wrap repository reads with `unstable_cache` and document-kind/locale/detail tags. Return explicit DTO objects and quoted SHA-256 ETags.

- [ ] **Step 4: Run public API tests and verify GREEN**

Run: `npm run test:unit -- tests/documents/public-api.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing public component tests**

Assert the Korean index empty state, English-missing state with an explicit Korean link, article metadata dates, H2/H3 contents links, and renderer output. Mock only the document repository boundary, not child UI components.

- [ ] **Step 6: Run public component tests and verify RED**

Run: `npm run test:unit -- tests/components/document-pages.test.tsx`

Expected: FAIL because public document components do not exist.

- [ ] **Step 7: Implement the four route families with shared components**

Create small route files that pass fixed kind/copy into shared index/detail components. Generate localized metadata from the published record. Use `notFound()` only for a missing series; render the English-missing state when the Korean series exists. Catch database errors in the route-group error boundary without affecting `/`.

- [ ] **Step 8: Add footer navigation and sitemap entries**

Extend bilingual footer copy with four labels and add published document URLs to the sitemap. A sitemap database failure returns the homepage entry rather than failing sitemap generation.

- [ ] **Step 9: Run public tests and production build**

Run: `npm run test:unit -- tests/documents/public-api.test.ts tests/components/document-pages.test.tsx && npm run build`

Expected: PASS and all eight page families appear in the Next.js route output.

- [ ] **Step 10: Commit the public document experience**

```bash
git add lib/documents/cache.ts lib/http/cursor.ts app/api/content 'app/(documents)' components/content app/sitemap.ts components/layout/site-footer.tsx lib/content.ts tests
git commit -m "feat: publish company document pages"
```

---

### Task 6: Add protected document APIs, editor, and scheduler

**Files:**
- Create: `lib/http/json-body.ts`
- Create: `app/api/admin/documents/route.ts`
- Create: `app/api/admin/documents/[revisionId]/route.ts`
- Create: `app/api/admin/documents/[revisionId]/schedule/route.ts`
- Create: `app/api/admin/documents/[revisionId]/publish/route.ts`
- Create: `app/api/admin/documents/[revisionId]/archive/route.ts`
- Create: `app/api/admin/documents/[revisionId]/new-revision/route.ts`
- Create: `tests/documents/admin-api.test.ts`
- Create: `components/admin/admin-nav.tsx`
- Create: `components/admin/document-list.tsx`
- Create: `components/admin/document-editor.tsx`
- Create: `components/admin/document-preview.tsx`
- Create: `app/admin/(protected)/documents/page.tsx`
- Create: `app/admin/(protected)/documents/new/page.tsx`
- Create: `app/admin/(protected)/documents/[revisionId]/page.tsx`
- Modify: `app/admin/(protected)/layout.tsx`
- Modify: `app/admin/(protected)/page.tsx`
- Modify: `app/admin/admin.module.css`
- Create: `tests/components/document-admin.test.tsx`
- Create: `app/api/cron/document-publication/route.ts`
- Create: `tests/documents/publication-cron.test.ts`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: `authorizeAdminApi`, `isSameOriginRequest`, `documentService`, `MarkdownDocument`, and existing cron secret validation pattern.
- Produces: complete admin document workflow and scheduled publishing.

- [ ] **Step 1: Write failing bounded-JSON and admin-route tests**

Test invalid content type, body over 256 KiB, malformed JSON, cross-origin request, 401, 403, valid draft creation, immutable update conflict, schedule, publish, archive, and new revision. Inject authorization and service functions into exported `handle*` functions.

- [ ] **Step 2: Run admin API tests and verify RED**

Run: `npm run test:unit -- tests/documents/admin-api.test.ts`

Expected: FAIL because the routes and bounded JSON helper do not exist.

- [ ] **Step 3: Implement the admin Route Handlers**

Each mutation performs checks in this order: authorization, same origin, bounded JSON parsing, Zod validation, service call, safe error mapping. Return `{ revision }` or `{ ok: true }`, set `Cache-Control: no-store`, and call `revalidateTag(tag, "max")` only after a committed public-state change.

- [ ] **Step 4: Run admin API tests and verify GREEN**

Run: `npm run test:unit -- tests/documents/admin-api.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing editor interaction tests**

Test navigation links, kind/locale fields, Markdown preview, save payload, unsaved navigation warning, disabled editing for published records, Schedule/Publish/Archive confirmations, and API error announcements.

- [ ] **Step 6: Run editor tests and verify RED**

Run: `npm run test:unit -- tests/components/document-admin.test.tsx`

Expected: FAIL because the admin components do not exist.

- [ ] **Step 7: Implement the protected document pages and square editor UI**

Keep server pages responsible for authentication and initial queries. Use one focused Client Component for form state and fetch mutations. Desktop uses source/preview columns; mobile uses accessible Source/Preview tabs. Published pages render metadata and a `Create new revision` action instead of editable fields.

- [ ] **Step 8: Run editor tests and accessibility assertions**

Run: `npm run test:unit -- tests/components/document-admin.test.tsx`

Expected: PASS with form errors announced through `role="alert"` and tabs/buttons available by role.

- [ ] **Step 9: Write the failing publication-cron tests**

Assert invalid bearer returns 401, valid bearer publishes all due snapshots, future snapshots remain scheduled, one failed publication does not hide successful IDs, and the response contains only counts/IDs.

- [ ] **Step 10: Implement scheduled publication and update Vercel Cron**

Reuse the existing timing-safe bearer comparison by extracting it to `lib/http/cron-auth.ts`. Confirm the linked production team is Pro or Enterprise, schedule `/api/cron/document-publication` at `*/5 * * * *`, and preserve the analytics retention schedule. If the project is Hobby, stop before changing `vercel.json` and ask whether to accept the deployment-safe daily schedule `7 4 * * *` or upgrade; Vercel rejects more-frequent Hobby expressions. Reference: https://vercel.com/docs/cron-jobs/usage-and-pricing

- [ ] **Step 11: Run document platform verification**

Run: `npm run typecheck && npm run lint && npm run test:unit -- tests/documents tests/markdown tests/components/document-admin.test.tsx tests/components/document-pages.test.tsx && npm run build`

Expected: all commands exit 0.

- [ ] **Step 12: Commit the admin publishing platform**

```bash
git add lib/http app/api/admin app/api/cron app/admin components/admin vercel.json tests
git commit -m "feat: add document publishing admin"
```
