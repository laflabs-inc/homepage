# Media Authoring Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let administrators select or upload LafLabs media inside the Markdown editor, track immutable document-to-asset references, inspect usage, and create replacement versions without changing already-published media paths.

**Architecture:** Stable `/media/{assetId}/{safeFilename}` paths remain the only document-facing asset contract. A focused Markdown utility extracts those paths and builds insertion snippets; document persistence synchronizes known references in the same SQL statement as each draft mutation, while schedule and publish operations reject unavailable LafLabs assets. The existing Asset service gains version-aware upload intents and usage reads, and one reusable picker composes the existing upload pipeline with the Core UI Dialog.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CodeMirror 6, unified/remark, Drizzle SQL over Neon PostgreSQL, Vercel Blob, Zod, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-10-website-admin-platform-design.md` (Media asset platform → Editor integration and deletion rules), with delivery boundary in `docs/platform-roadmap.md` milestone 5.

## Global Constraints

- Public Markdown stores only stable LafLabs paths shaped as `/media/{assetId}/{safeFilename}`; Blob provider URLs never enter document content.
- Public and private Blob stores remain separate, and this milestone does not add public or anonymous uploads.
- Draft source remains exact Markdown; insertion changes only the current CodeMirror selection and uses the existing in-memory dirty-state flow.
- Drafts may preserve an unavailable LafLabs path for repair, but scheduling and publishing fail with a field-level `bodyMarkdown` error until every LafLabs path resolves to a `ready` or `archived` asset.
- A saved draft references every currently valid LafLabs asset it uses; hard deletion remains blocked while any document revision references the asset.
- Replacement always creates a new immutable asset ID and Blob path in the same family. It never rewrites existing Markdown or reference rows.
- Archived assets remain deliverable and valid for existing revisions but do not appear in the picker.
- All Admin reads require GitHub Admin authorization; all mutations additionally require same-origin validation and bounded schemas.
- Database changes are forward-only and must tolerate old and new application versions overlapping during deployment.
- UI follows the existing square Core UI system, bilingual Admin copy, keyboard operation, and reduced-motion preferences.
- Before changing Next.js application code, read the relevant current guidance in `node_modules/next/dist/docs/` as required by `AGENTS.md`.

## Review Focus

- A Markdown document containing the same asset more than once produces one reference row and remains publishable.
- Reference-style Markdown images resolve definitions correctly; local media embedded through unsupported raw HTML is rejected at publish instead of escaping tracking.
- A replacement upload racing another replacement receives a conflict and cannot create duplicate family versions.
- An asset archived after insertion remains visible in existing previews and publishable, while a deleting or deleted asset blocks publication.
- Closing and reopening the picker, switching Source/Preview, or uploading from the picker cannot lose the CodeMirror selection or insert at the wrong location.

---

### Task 1: Stable Markdown media contract

**Files:**
- Create: `lib/markdown/media-assets.ts`
- Modify: `lib/documents/validation.ts`
- Create: `tests/markdown/media-assets.test.ts`
- Test: `tests/documents/validation.test.ts`

**Interfaces:**
- Produces: `extractLafMediaReferences(source: string): MarkdownMediaReference[]`, where each result is `{ assetId: string; src: string; alt: string }` and duplicate asset IDs are collapsed in first-seen order.
- Produces: `buildMarkdownImage(reference: { src: string; alt: string }): string` with escaped alt text and a stable path only.
- Produces: `UnsupportedLafMediaMarkupError` for `/media/` paths embedded in raw HTML or malformed stable paths.
- Consumes: the existing unified/remark parser and the UUID shape already used by Admin asset routes.

- [ ] **Step 1: Write failing parser and formatter tests**

Add tests that assert direct images, reference-style images, duplicate references, external images, query/hash variants, malformed UUID/path values, escaped alt text, and unsupported raw HTML. Hand-derive all expected asset IDs and snippets.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npx vitest run tests/markdown/media-assets.test.ts`

Expected: FAIL because `lib/markdown/media-assets.ts` does not exist.

- [ ] **Step 3: Implement the Markdown media utility**

Parse Markdown once, resolve `imageReference` nodes through definitions, accept only exact root-relative stable paths, deduplicate by asset ID, and reject `/media/` occurrences in unsupported HTML rather than silently leaving them untracked.

- [ ] **Step 4: Add failing publication-validation tests**

Assert that meaningful alt text remains required, malformed LafLabs paths and raw-HTML LafLabs images add a `bodyMarkdown` issue, and valid external or stable Markdown images pass syntax validation.

- [ ] **Step 5: Integrate the utility into `publishDocumentSchema` and verify GREEN**

Run: `npx vitest run tests/markdown/media-assets.test.ts tests/documents/validation.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/markdown/media-assets.ts lib/documents/validation.ts tests/markdown/media-assets.test.ts tests/documents/validation.test.ts
git commit -m "feat(media): define markdown asset contract"
```

### Task 2: Atomic document reference synchronization

**Files:**
- Create: `drizzle/0012_media_authoring.sql`
- Modify: `lib/db/schema.ts`
- Modify: `lib/documents/types.ts`
- Modify: `lib/documents/store.ts`
- Modify: `lib/documents/service.ts`
- Test: `tests/assets/migration.integration.test.ts`
- Test: `tests/documents/workflow.test.ts`
- Test: `tests/documents/publication-store.test.ts`
- Create: `tests/documents/document-asset-store.integration.test.ts`

**Interfaces:**
- Consumes: `extractLafMediaReferences(bodyMarkdown)` from Task 1.
- Produces: `DocumentAssetSnapshot = { assetIds: string[] }`.
- Changes: `DocumentRepository.createDraft`, `createNextDraft`, and `updateDraft` accept a final `assets: DocumentAssetSnapshot` argument.
- Produces: `DocumentRepository.listUnavailableAssetIds(assetIds: string[]): Promise<string[]>`.
- Database invariant: a `document_revision` reference has a non-null `revision_id` foreign key with `ON DELETE CASCADE`; `(owner_type, owner_id, field)` is indexed for replacement queries.

- [ ] **Step 1: Write failing migration and service contract tests**

Assert the forward migration adds the revision foreign key/index, draft create/update/new-revision pass deduplicated asset IDs to the repository, and document deletion can cascade references without changing existing service behavior.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npx vitest run tests/assets/migration.integration.test.ts tests/documents/workflow.test.ts`

Expected: FAIL because the migration and repository arguments do not exist.

- [ ] **Step 3: Add the forward migration and schema relation**

Add the nullable revision FK with `ON DELETE CASCADE` so old rows and old application versions remain valid. Add the owner lookup index; do not rename or remove existing columns.

- [ ] **Step 4: Write failing atomic-store integration tests**

Using the existing PGlite/Drizzle test pattern, assert that create and update replace known `ready`/`archived` references in the same transaction, ignore unknown/deleting IDs in drafts, deduplicate repeats, preserve references on immutable revisions, and remove rows when a revision is permanently deleted.

- [ ] **Step 5: Implement reference-aware document writes**

In each create/update SQL statement, build a UUID input CTE, select only `ready` or `archived` assets, delete the revision's previous `body_markdown` rows, and insert the current valid set before returning success. Copy parsed references when creating a new revision. Keep the document mutation and reference replacement in one database statement.

- [ ] **Step 6: Implement availability reads and service extraction**

`listUnavailableAssetIds` returns requested IDs missing from `ready`/`archived`. The service parses each body once and passes its deduplicated IDs into repository mutations. Map storage conflicts through the existing stable `DocumentServiceError` boundary.

- [ ] **Step 7: Verify GREEN**

Run: `npx vitest run tests/assets/migration.integration.test.ts tests/documents/workflow.test.ts tests/documents/publication-store.test.ts tests/documents/document-asset-store.integration.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add drizzle/0012_media_authoring.sql lib/db/schema.ts lib/documents tests/assets/migration.integration.test.ts tests/documents
git commit -m "feat(documents): track media references"
```

### Task 3: Schedule and publish availability gate

**Files:**
- Modify: `lib/documents/service.ts`
- Modify: `lib/http/admin-documents.ts`
- Modify: `components/admin/document-editor.tsx`
- Modify: `lib/admin/i18n.ts`
- Test: `tests/documents/workflow.test.ts`
- Test: `tests/documents/admin-api.test.ts`
- Test: `tests/components/document-admin.test.tsx`

**Interfaces:**
- Consumes: `DocumentRepository.listUnavailableAssetIds` from Task 2.
- Produces: `DocumentServiceErrorCode` value `asset_unavailable`, with `fields: ["bodyMarkdown"]`.
- Preserves: external HTTPS images and archived LafLabs assets remain publishable.

- [ ] **Step 1: Write failing workflow and route tests**

Assert schedule, immediate publish, summary-assisted publish, and scheduled-cron publish reject a missing/deleting/deleted asset; assert ready and archived assets pass. API responses use `409 { error: "asset_unavailable", fields: ["bodyMarkdown"] }` without exposing asset provider data.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npx vitest run tests/documents/workflow.test.ts tests/documents/admin-api.test.ts`

Expected: FAIL because publication does not check asset availability.

- [ ] **Step 3: Add the service gate and safe response mapping**

Run availability after pure Markdown validation and before schedule/publish persistence. Apply the same gate through the shared publication path so cron and AI-summary publication cannot bypass it.

- [ ] **Step 4: Add localized editor feedback**

Map `asset_unavailable` to a concise Korean/English message beside the existing mutation error region, retaining focus behavior and `bodyMarkdown` field semantics.

- [ ] **Step 5: Verify GREEN**

Run: `npx vitest run tests/documents/workflow.test.ts tests/documents/admin-api.test.ts tests/components/document-admin.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/documents/service.ts lib/http/admin-documents.ts components/admin/document-editor.tsx lib/admin/i18n.ts tests/documents tests/components/document-admin.test.tsx
git commit -m "feat(documents): guard media publication"
```

### Task 4: Immutable asset version replacement

**Files:**
- Modify: `lib/assets/types.ts`
- Modify: `lib/assets/policy.ts`
- Modify: `lib/assets/store.ts`
- Modify: `lib/assets/service.ts`
- Modify: `lib/http/admin-assets.ts`
- Modify: `components/admin/asset-upload-queue.tsx`
- Modify: `components/admin/asset-library.tsx`
- Modify: `components/admin/asset-library.module.css`
- Modify: `lib/admin/i18n.ts`
- Test: `tests/assets/policy.test.ts`
- Test: `tests/assets/service.test.ts`
- Test: `tests/assets/store.integration.test.ts`
- Test: `tests/assets/upload-api.test.ts`
- Test: `tests/components/asset-upload-queue.test.tsx`
- Test: `tests/components/asset-library.test.tsx`

**Interfaces:**
- Changes: `UploadIntentInput` accepts optional `replaceAssetId: string`.
- Changes: `MediaAssetRepository.createPending` resolves a replacement target under row lock and returns a new pending asset with the target family, `previousAssetId`, and `max(family.version) + 1`.
- Changes: `AssetUploadQueue` accepts optional `replaceAssetId`, `multiple`, and `onReady` without exposing Blob responses.
- Invariant: old asset status, public path, references, and Blob remain untouched.

- [ ] **Step 1: Write failing policy/service/store tests**

Assert malformed replacement IDs fail, a ready or archived source creates the next version in its family, two concurrent attempts cannot share a version, pending/failed/deleting/deleted sources fail, and ordinary uploads remain version 1 with their own family.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npx vitest run tests/assets/policy.test.ts tests/assets/service.test.ts tests/assets/store.integration.test.ts`

Expected: FAIL because replacement intents are unsupported.

- [ ] **Step 3: Implement version-aware intent creation**

Keep generated asset IDs and staging paths unchanged. Resolve family/version only inside the repository lock, translate uniqueness races to `conflict`, and preserve the existing OIDC upload/finalize flow.

- [ ] **Step 4: Write failing API and component tests**

Assert `replaceAssetId` is bounded and same-origin protected, the upload queue sends it only for replacement, the library exposes Replace on ready/archived assets, and successful replacement inserts the new version without mutating the old card.

- [ ] **Step 5: Add the replacement UI and verify GREEN**

Use the existing Core UI Dialog and upload queue with a single-file input. Remove the `versionUnavailable` placeholder, display lineage/version in the dialog, and provide actionable bilingual conflict/error copy.

Run: `npx vitest run tests/assets/policy.test.ts tests/assets/service.test.ts tests/assets/store.integration.test.ts tests/assets/upload-api.test.ts tests/components/asset-upload-queue.test.tsx tests/components/asset-library.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/assets lib/http/admin-assets.ts components/admin/asset-* lib/admin/i18n.ts tests/assets tests/components/asset-*.test.tsx
git commit -m "feat(media): add immutable replacements"
```

### Task 5: Reusable asset picker and Markdown insertion

**Files:**
- Create: `components/admin/asset-picker-dialog.tsx`
- Create: `components/admin/asset-picker-dialog.module.css`
- Modify: `components/admin/markdown-live-editor.tsx`
- Modify: `components/admin/document-editor.tsx`
- Modify: `components/admin/markdown-editor-commands.ts`
- Modify: `lib/admin/i18n.ts`
- Create: `tests/components/asset-picker-dialog.test.tsx`
- Create: `tests/components/markdown-live-editor.test.tsx`
- Test: `tests/components/markdown-editor-commands.test.ts`
- Test: `tests/components/document-admin.test.tsx`

**Interfaces:**
- Consumes: Admin `GET /api/admin/assets?status=ready`, metadata `PATCH`, `AssetUploadQueue`, and `buildMarkdownImage` from Task 1.
- Changes: `MarkdownLiveEditor` accepts `documentLocale: "ko" | "en"`.
- Produces: `insertMarkdownBlock(view: EditorView, markdown: string): void`, inserting at the current selection with only the newlines required to keep a standalone block.
- Picker result: `{ src: string; alt: string }` only; the editor never receives a Blob URL.

- [ ] **Step 1: Write failing insertion-command tests**

Assert insertion into empty source, mid-line selection, a collapsed cursor between paragraphs, replacement of selected text, max-length rejection, focus restoration, and exactly one dirty-state change.

- [ ] **Step 2: Run the command tests and verify RED**

Run: `npx vitest run tests/components/markdown-editor-commands.test.ts`

Expected: FAIL because `insertMarkdownBlock` does not exist.

- [ ] **Step 3: Implement the CodeMirror insertion boundary**

Keep the last CodeMirror selection while Preview is visible. On picker completion switch to Source, insert the generated image block through one transaction, scroll/focus the selection, and rely on the existing update listener for form state.

- [ ] **Step 4: Write failing picker interaction tests**

Assert authenticated API paging/search, ready-only results, keyboard selection, current-locale alt prefill, required alt before insertion, metadata PATCH when alt changes, picker upload refresh, empty/error/loading states, and dialog focus return.

- [ ] **Step 5: Implement the picker**

Use a compact square Dialog with search, responsive thumbnail grid, load-more pagination, current locale alt field, and an embedded upload action. Uploaded assets enter the current result set immediately. Do not duplicate the full asset-management interface.

- [ ] **Step 6: Wire the picker into the editor and verify GREEN**

Pass the document locale from `DocumentEditor`; expose one icon-labelled Insert image action in the Markdown toolbar. Keep Source/Preview behavior and all existing editor lifecycle actions unchanged.

Run: `npx vitest run tests/components/asset-picker-dialog.test.tsx tests/components/markdown-live-editor.test.tsx tests/components/markdown-editor-commands.test.ts tests/components/document-admin.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/admin/asset-picker-dialog* components/admin/markdown-* components/admin/document-editor.tsx lib/admin/i18n.ts tests/components
git commit -m "feat(editor): insert managed media"
```

### Task 6: Asset usage inspection

**Files:**
- Modify: `lib/assets/types.ts`
- Modify: `lib/assets/store.ts`
- Modify: `lib/assets/service.ts`
- Create: `app/api/admin/assets/[id]/references/route.ts`
- Modify: `components/admin/asset-library.tsx`
- Modify: `components/admin/asset-library.module.css`
- Modify: `lib/admin/i18n.ts`
- Test: `tests/assets/store.integration.test.ts`
- Test: `tests/assets/admin-api.test.ts`
- Test: `tests/components/asset-library.test.tsx`

**Interfaces:**
- Produces: `MediaAssetUsage = { revisionId, kind, locale, title, status, field, updatedAt }`.
- Produces: `AssetService.listUsage(assetId)` and authenticated `GET /api/admin/assets/{id}/references` returning `{ references: MediaAssetUsage[] }`.
- Consumes: reference rows maintained by Task 2.

- [ ] **Step 1: Write failing store and API tests**

Assert references join to document metadata, are ordered newest first, omit document bodies, reject malformed IDs, require Admin auth, and return an empty list for an unused existing asset.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npx vitest run tests/assets/store.integration.test.ts tests/assets/admin-api.test.ts`

Expected: FAIL because usage reads do not exist.

- [ ] **Step 3: Implement the usage boundary**

Keep the response bounded to 100 references, no cursor until a real asset exceeds that limit, and return only safe document-identifying fields and Admin edit links derived in the UI.

- [ ] **Step 4: Write failing library UI tests**

Assert Usage opens a Dialog, displays linked document title/locale/status, shows an honest empty state, and a referenced-asset deletion conflict directs the administrator to Usage.

- [ ] **Step 5: Implement the usage dialog and verify GREEN**

Remove the `referencesUnavailable` placeholder and add a compact usage action to asset cards/details. Preserve archive and delete actions; referenced archives remain allowed while hard delete stays blocked.

Run: `npx vitest run tests/assets/store.integration.test.ts tests/assets/admin-api.test.ts tests/components/asset-library.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/assets app/api/admin/assets components/admin/asset-library* lib/admin/i18n.ts tests/assets tests/components/asset-library.test.tsx
git commit -m "feat(media): show document usage"
```

### Task 7: Operations, roadmap, and release verification

**Files:**
- Modify: `docs/media-operations.md`
- Modify: `docs/platform-roadmap.md`
- Modify: `README.md`
- Test: `e2e/admin-media-authoring.spec.ts`
- Modify: `playwright.config.ts` only if the existing Admin project cannot include the new spec without configuration.

**Interfaces:**
- Consumes: all Tasks 1–6.
- Produces: operator guidance for migration, replacement, reference conflicts, and rollback; roadmap status `Media authoring integration — Shipped` only after all release gates pass.

- [ ] **Step 1: Add the end-to-end scenario**

Cover one authenticated Korean draft: open picker, upload/select an asset, supply alt text, insert stable Markdown, save, preview, and verify usage. Add a replacement and assert the old Markdown path does not change. Skip cleanly only when the documented media test environment is absent.

- [ ] **Step 2: Run the E2E test against the configured local test stack**

Run: `npx playwright test e2e/admin-media-authoring.spec.ts`

Expected: PASS, or an explicit environment skip recorded in the verification report; no silent omission.

- [ ] **Step 3: Update operations and roadmap documentation**

Document stable-path insertion, localized alt text, archive/delete behavior, version replacement, usage lookup, failure recovery, and rollback that leaves old paths intact. Specify migration-first deployment: the nullable FK/index are safe for old code, while new code works before the index is present and does not require a destructive schema transition. Move milestone 4 to Shipped and milestone 5 to Shipped only after verification; set Careers page as the next planned milestone.

- [ ] **Step 4: Run complete verification**

Run: `npm test`

Expected: design check, TypeScript, ESLint, all unit/integration tests, and production build PASS.

Run: `git diff --check`

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add docs README.md e2e playwright.config.ts
git commit -m "docs(media): complete authoring integration"
```
