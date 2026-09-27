# Media Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an authenticated LafLabs media library that stages untrusted browser uploads privately, validates and sanitizes them, promotes immutable public images, and manages their metadata and lifecycle from Admin.

**Architecture:** The browser uploads directly to a private Vercel Blob store through exact-path, short-lived tokens. A Node.js finalizer reads the staged bytes, validates and sanitizes them, stores metadata and audit transitions in Neon, and promotes one immutable object to the public Blob store; `/media/{assetId}/{safeFilename}` is the stable application-owned delivery contract. Provider SDKs remain behind one server adapter and one browser adapter, while the Admin library uses the existing Core UI and bilingual Admin shell.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript 5.9, Neon Postgres, Drizzle ORM, Vercel Blob, Sharp, `@xmldom/xmldom`, Zod, Vitest, Testing Library, PGlite.

**Spec:** `docs/superpowers/specs/2026-09-26-media-platform-foundation-design.md`

## Global Constraints

- Use separate `BLOB_PUBLIC_READ_WRITE_TOKEN` and `BLOB_PRIVATE_READ_WRITE_TOKEN` credentials; parse them lazily so unrelated builds and routes remain available when media is not configured.
- Never make unvalidated bytes public. The only accepted final formats are JPEG, PNG, WebP, AVIF, and strictly sanitized SVG.
- Enforce a 10 MiB input limit, 40 megapixel decoded limit, 16,384-pixel per-axis limit, and 2 MiB SVG limit.
- Public Blob pathnames are `media/{assetId}/{safeFilename}`, are written without overwrite, and never change after readiness.
- Private staging pathnames are `staging/{assetId}/{uploadNonce}`; user filenames never control a storage prefix.
- All browser mutations require GitHub organization Admin authorization and same-origin validation. Only the signed Blob completion callback omits those browser checks.
- Expose bounded error codes only. Never log or return credentials, upload tokens, provider bodies, private URLs, file bytes, or source metadata.
- Hard deletion requires `archived` or `failed`, zero references, explicit confirmation, and atomic acquisition of `deleting`; delivery never reopens after acquisition.
- Keep Markdown insertion, automatic reference extraction, version replacement, private final attachments, and non-image uploads out of this milestone.
- Use existing LafLabs Core UI primitives, square geometry, bilingual copy, visible keyboard focus, and 320px-safe layouts.

## Review Focus

- A MIME-spoofed, polyglot, animated, malformed, oversized, or decompression-bomb input must fail with a safe code and must never produce a public Blob.
- Duplicate or out-of-order Blob callbacks and finalize requests must be idempotent, including the browser closing after upload.
- A public write followed by a database failure, or a staging delete failure after readiness, must remain retryable without overwriting public bytes.
- Reference creation racing hard deletion must either complete before deletion acquisition or be rejected after `deleting`; it must never leave a live reference to a deleted asset.
- Mixed-success multi-file uploads, long bilingual metadata, mobile keyboards, and missing media credentials must degrade per file without breaking the Admin shell or unrelated pages.

---

### Task 1: Add media domain types, audit ownership, and the additive database migration

**Files:**
- Create: `lib/audit/types.ts`
- Modify: `lib/audit/store.ts`, `lib/documents/types.ts`, `lib/db/schema.ts`
- Create: `lib/assets/types.ts`
- Modify: `docs/platform-roadmap.md`
- Create: `drizzle/0011_media_platform.sql`, `drizzle/meta/0011_snapshot.json`
- Modify: `drizzle/meta/_journal.json`
- Create: `tests/assets/schema.test.ts`, `tests/assets/migration.integration.test.ts`
- Modify: document and audit tests whose imports move to `lib/audit/types.ts`

**Interfaces:**
- `lib/audit/types.ts` owns `AuditAction`; document and media code import it from the audit domain.
- `lib/assets/types.ts` exports `MediaAssetVisibility`, `MediaAssetStatus`, `MediaType`, `MediaAsset`, `MediaAssetReference`, `MediaAssetListFilter`, `MediaAssetPage`, `UploadIntentInput`, and `UploadIntent`. Exact value arrays are `mediaAssetVisibilities = ["public", "private"]`, `mediaAssetStatuses = ["pending", "processing", "ready", "failed", "archived", "deleting", "deleted"]`, and `mediaTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"]`.
- Drizzle exports `mediaAssetVisibilityEnum`, `mediaAssetStatusEnum`, `mediaAssetReferenceOwnerTypeEnum`, `mediaAssets`, and `mediaAssetReferences`.

- [ ] **Step 1: Write failing schema and migration tests**

```ts
it("declares the complete lifecycle and immutable-path constraints", () => {
  expect(mediaAssetStatuses).toEqual([
    "pending", "processing", "ready", "failed", "archived", "deleting", "deleted",
  ])
  expect(readFileSync(migrationPath, "utf8")).toContain("media_public_pathname_unique")
})

it("prevents reference deletion from cascading into assets", async () => {
  await expect(deleteReferencedAsset(database)).rejects.toThrow()
})
```

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run: `npm run test:unit -- tests/assets/schema.test.ts tests/assets/migration.integration.test.ts`

Expected: FAIL because the media schema, migration, and types do not exist.

- [ ] **Step 3: Move `AuditAction`, add domain types, and define the Drizzle schema**

Use text actor IDs, actor-name snapshots, text-array tags, unique nullable Blob pathnames, status/created/checksum/family indexes, a positive version check, nonnegative byte/dimension checks, and a restricted `media_asset_references.asset_id` foreign key. Keep `owner_type` bounded initially to `document_revision`. Move both roadmap status tables from `Designing` to `In progress` when implementation starts.

- [ ] **Step 4: Generate and inspect the additive migration**

Run: `npm run db:generate -- --name media_platform`

Expected: `0011_media_platform.sql`, its snapshot, and journal entry are created without modifying prior migrations. Rename only if the generated filename differs, keeping journal metadata consistent.

- [ ] **Step 5: Run schema, migration, audit, document, type, and lint checks**

Run: `npm run test:unit -- tests/assets/schema.test.ts tests/assets/migration.integration.test.ts tests/documents/schema.test.ts && npm run typecheck && npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit the database boundary**

```bash
git add lib/audit lib/documents/types.ts lib/db/schema.ts lib/assets/types.ts drizzle tests/assets tests/documents docs/platform-roadmap.md
git commit -m "feat(media): add asset lifecycle schema"
```

---

### Task 2: Implement bounded image validation and sanitation

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `lib/assets/errors.ts`, `lib/assets/policy.ts`, `lib/assets/filename.ts`
- Create: `lib/assets/svg-sanitizer.ts`, `lib/assets/image-processor.ts`
- Create: `tests/assets/policy.test.ts`, `tests/assets/filename.test.ts`
- Create: `tests/assets/svg-sanitizer.test.ts`, `tests/assets/image-processor.test.ts`

**Interfaces:**
- `AssetError` exposes only `code: AssetErrorCode`; codes include `invalid_input`, `unsupported_type`, `file_too_large`, `invalid_image`, `pixel_limit_exceeded`, `dimension_limit_exceeded`, `animated_image`, `unsafe_svg`, and `processing_unavailable`.
- `parseUploadIntent(value: unknown): UploadIntentInput` validates the declared 10 MiB boundary before an upload token is issued.
- `safeFilename(originalFilename: string, mediaType: MediaType): string` returns at most 160 Unicode code points in total, including the verified extension.
- `processAsset(bytes: Uint8Array, originalFilename: string): Promise<ProcessedAsset>` returns `{ bytes, mediaType, byteSize, width, height, checksumSha256, safeFilename }` after sanitation.

- [ ] **Step 1: Install only the processing dependencies**

Run: `npm install sharp @xmldom/xmldom`

Expected: both packages are direct production dependencies; no storage dependency is added yet.

- [ ] **Step 2: Write failing boundary and hostile-input tests**

```ts
it.each([
  [oversizedBytes, "file_too_large"],
  [mimeSpoofedBytes, "unsupported_type"],
  [animatedWebpBytes, "animated_image"],
  [fortyMegapixelPlusBytes, "pixel_limit_exceeded"],
])("rejects unsafe raster input before publication", async (bytes, code) => {
  await expect(processAsset(bytes, "upload.bin")).rejects.toMatchObject({ code })
})

it.each([svgWithScript, svgWithForeignObject, svgWithExternalHref, svgWithDoctype])(
  "rejects active SVG content",
  async (svg) => expect(processAsset(bytes(svg), "mark.svg"))
    .rejects.toMatchObject({ code: "unsafe_svg" }),
)
```

- [ ] **Step 3: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/assets/policy.test.ts tests/assets/filename.test.ts tests/assets/svg-sanitizer.test.ts tests/assets/image-processor.test.ts`

Expected: FAIL because the processor modules do not exist.

- [ ] **Step 4: Implement the policy, filename, raster, SVG, and checksum pipeline**

Use Sharp metadata/decoder results rather than browser MIME or extension. Auto-orient and re-encode the verified raster format without source metadata; reject multi-page/animated inputs. Reject SVG declarations/entities up front and parse as UTF-8 XML. Allow exactly `svg`, `g`, `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `text`, `tspan`, `defs`, `linearGradient`, `radialGradient`, `stop`, `clipPath`, `mask`, `use`, `title`, and `desc`; allow geometry, transform, paint, opacity, gradient, viewport, namespace, role, and `aria-*` attributes but no `style` or event attribute. Permit `href`/`xlink:href` only as a local `#fragment`, serialize, and parse the sanitized result again. Derive the extension after verified media type and hash the final output bytes.

- [ ] **Step 5: Add success tests for format preservation and metadata removal**

```ts
expect(await sharp(result.bytes).metadata()).toMatchObject({ format: "jpeg", orientation: undefined })
expect(result.safeFilename).toMatch(/\.jpg$/)
expect(result.checksumSha256).toMatch(/^[a-f0-9]{64}$/)
expect(new TextDecoder().decode(svgResult.bytes)).not.toMatch(/script|https?:|data:/i)
```

- [ ] **Step 6: Run focused tests, typecheck, and lint; commit**

Run: `npm run test:unit -- tests/assets/policy.test.ts tests/assets/filename.test.ts tests/assets/svg-sanitizer.test.ts tests/assets/image-processor.test.ts && npm run typecheck && npm run lint`

```bash
git add package.json package-lock.json lib/assets tests/assets
git commit -m "feat(media): validate and sanitize image uploads"
```

---

### Task 3: Add lazy media configuration and provider-isolated Blob adapters

**Files:**
- Modify: `package.json`, `package-lock.json`, `lib/env.ts`, `.env.example`
- Create: `lib/assets/blob-store.ts`, `lib/assets/client-upload.ts`
- Create: `tests/assets/env.test.ts`, `tests/assets/blob-store.test.ts`, `tests/assets/client-upload.test.ts`

**Interfaces:**
- `getMediaEnv()` returns exactly `{ BLOB_PUBLIC_READ_WRITE_TOKEN, BLOB_PRIVATE_READ_WRITE_TOKEN }` and is called only by media adapters; `isMediaConfigured()` returns a boolean based on valid presence without exposing either value.
- `BlobStore` exposes `handlePrivateClientUpload(request, callbacks)`, `readPrivate(pathname)`, `putPublic(pathname, bytes, contentType)`, `headPublic(pathname)`, `deletePrivate(pathname)`, and `deletePublic(pathname)` using LafLabs-owned `StagedBlob` and `PublicBlob` values.
- `uploadStagedAsset({ file, pathname, assetId, onProgress }): Promise<void>` is the only browser import site for `@vercel/blob/client`.
- `BlobStoreError` normalizes `unavailable`, `not_found`, `conflict`, and `invalid_callback` without retaining provider payloads.

- [ ] **Step 1: Install Vercel Blob and write failing adapter tests**

Run: `npm install @vercel/blob`

```ts
it("keeps media configuration lazy", async () => {
  expect(() => parseServerEnv(baseEnvironment)).not.toThrow()
  expect(() => getMediaEnv()).toThrow()
})

it("writes public bytes without overwrite using only the public token", async () => {
  await store.putPublic(pathname, bytes, "image/png")
  expect(put).toHaveBeenCalledWith(pathname, bytes, expect.objectContaining({
    access: "public", addRandomSuffix: false, allowOverwrite: false, token: publicToken,
  }))
})
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/assets/env.test.ts tests/assets/blob-store.test.ts tests/assets/client-upload.test.ts`

Expected: FAIL because media environment and adapters do not exist.

- [ ] **Step 3: Implement the server adapter and exact credential separation**

Keep `server-only` in `blob-store.ts`; pass the private token only to staging operations and the public token only to immutable delivery operations. Map signed callback results immediately into `StagedBlob` and validate returned pathnames before invoking application callbacks.

- [ ] **Step 4: Implement the browser adapter**

Wrap `upload()` with `access: "private"`, the exact server pathname, `/api/admin/assets/upload` as the handler, bounded `{ assetId }` client payload, and normalized progress `{ loaded, total, percentage }`. Do not expose Blob results to React components.

- [ ] **Step 5: Run focused tests, typecheck, and lint; commit**

Run: `npm run test:unit -- tests/assets/env.test.ts tests/assets/blob-store.test.ts tests/assets/client-upload.test.ts && npm run typecheck && npm run lint`

```bash
git add package.json package-lock.json lib/env.ts .env.example lib/assets tests/assets
git commit -m "feat(media): add staged Blob adapters"
```

---

### Task 4: Implement the repository, lifecycle service, audit events, and retry model

**Files:**
- Create: `lib/assets/store.ts`, `lib/assets/service.ts`, `lib/assets/telemetry.ts`
- Create: `tests/assets/store.integration.test.ts`, `tests/assets/service.test.ts`, `tests/assets/telemetry.test.ts`

**Interfaces:**
- `createAssetStore(database): MediaAssetRepository` implements pending creation, signed-callback recording, compare-and-set processing acquisition, ready/failed completion, listing/detail, metadata update, archive/restore, deletion acquisition/completion, and reference insertion.
- `createAssetService({ repository, blobStore, processAsset, telemetry, now }): AssetService` exposes `createIntent`, `recordUploadCompleted`, `finalize`, `list`, `get`, `updateMetadata`, `archive`, `restore`, and `delete`.
- `MediaTelemetry.record(name, fields)` accepts only asset IDs, safe codes, media types, counts, and byte sizes. Names are `media.intent_created`, `media.upload_completed`, `media.finalized`, `media.finalize_failed`, `media.duplicate_detected`, `media.deleted`, and `media.cleanup_completed`.
- Each successful state mutation writes its matching `media.*` audit row in the same SQL statement/transaction as the state change.

- [ ] **Step 1: Write failing lifecycle and concurrency tests**

```ts
it("lets only one finalizer acquire a pending asset", async () => {
  const attempts = await Promise.all([store.acquireProcessing(id), store.acquireProcessing(id)])
  expect(attempts.filter((value) => value.status === "acquired")).toHaveLength(1)
})

it("blocks a reference racing a hard delete", async () => {
  const [deletion, reference] = await Promise.allSettled([
    store.acquireDeletion(id, actor),
    store.addReference(referenceInput),
  ])
  expect([deletion.status, reference.status]).toContain("rejected")
})
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/assets/store.integration.test.ts tests/assets/service.test.ts tests/assets/telemetry.test.ts`

Expected: FAIL because repository and service modules do not exist.

- [ ] **Step 3: Implement SQL mapping and transactional lifecycle transitions**

Use row locks for deletion/reference interaction, compare-and-set updates for processing, opaque `{ createdAt, id }` pagination, case-insensitive original/safe filename search, normalized tags, and audit CTEs. Ready and archived count as duplicate-check candidates. A repeated callback or already-ready finalize returns the stored representation without another public write.

- [ ] **Step 4: Implement cross-system orchestration and retry rules**

Read only the stored expected staging pathname. Before public write, call `headPublic(expectedPath)` so a retry can adopt an existing immutable object only after its checksum and size match the freshly processed output. On validation failure, mark `failed` and attempt staging deletion. After readiness, retry staging deletion independently and clear stored staging fields only after confirmed deletion. Keep unresolved public-write/database failures observable and retryable.

- [ ] **Step 5: Pin the partial-failure and idempotency review cases**

```ts
expect(await service.finalize(id, actor)).toMatchObject({ id, status: "ready" })
expect(await service.finalize(id, actor)).toMatchObject({ id, status: "ready" })
expect(blobStore.putPublic).toHaveBeenCalledTimes(1)
expect(telemetry.record).toHaveBeenCalledWith("media.finalize_failed", expect.not.objectContaining({
  privateUrl: expect.anything(), providerError: expect.anything(),
}))
```

- [ ] **Step 6: Run focused tests, typecheck, and lint; commit**

Run: `npm run test:unit -- tests/assets/store.integration.test.ts tests/assets/service.test.ts tests/assets/telemetry.test.ts && npm run typecheck && npm run lint`

```bash
git add lib/assets tests/assets
git commit -m "feat(media): add asset lifecycle service"
```

---

### Task 5: Add authenticated upload intent, token callback, and finalization routes

**Files:**
- Create: `lib/http/admin-assets.ts`
- Create: `app/api/admin/assets/intents/route.ts`
- Create: `app/api/admin/assets/upload/route.ts`
- Create: `app/api/admin/assets/[id]/finalize/route.ts`
- Create: `tests/assets/upload-api.test.ts`

**Interfaces:**
- `authorizeAssetRead()` and `authorizeAssetMutation(request)` mirror existing Admin helpers and always return no-store responses.
- `assetErrorResponse(error)` maps domain codes to 400, 404, 409, 413, 415, 422, or 503 without returning an internal message.
- `toAdminAsset(asset)` is the only HTTP serializer and omits staging pathname/URL, provider public URL, actor snapshots, and failure internals; it returns the stable `/media/{id}/{safeFilename}` path when deliverable.
- Intent response is `{ intent: { assetId, pathname, acceptedTypes, maxBytes } }`.
- Finalize response is `{ asset }`; an already-ready asset returns 200 and the same representation.

- [ ] **Step 1: Write failing route tests for authorization, origin, bounds, and callbacks**

```ts
it("rejects cross-origin intent creation before reading JSON", async () => {
  const response = await handleCreateIntent(request, deniedOriginDependencies)
  expect(response.status).toBe(403)
  expect(readBody).not.toHaveBeenCalled()
})

it("accepts a valid signed Blob callback without an Admin session", async () => {
  const response = await handleAssetUpload(callbackRequest, callbackDependencies)
  expect(response.status).toBe(200)
  expect(authorize).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/assets/upload-api.test.ts`

Expected: FAIL because the routes and shared HTTP adapter do not exist.

- [ ] **Step 3: Implement intent and Blob handler dispatch**

For token generation, authenticate Admin, enforce same origin, load the pending asset, and return exact pathname/type/size restrictions. For completion, rely on the provider signature verification inside the Blob adapter, compare callback pathname to the pending row, and record completion using the actor snapshot stored at intent creation. Client payload contains only a UUID asset ID.

- [ ] **Step 4: Implement explicit Node.js finalization**

Export `runtime = "nodejs"`; validate the path UUID, authorize and enforce same origin, call `service.finalize(id, actor)`, and return no-store JSON. The route never accepts a Blob URL, pathname, MIME, dimensions, or checksum from the client.

- [ ] **Step 5: Run focused and existing Admin security tests; commit**

Run: `npm run test:unit -- tests/assets/upload-api.test.ts tests/auth/admin-api.test.ts tests/documents/admin-api.test.ts && npm run typecheck && npm run lint`

```bash
git add lib/http/admin-assets.ts app/api/admin/assets tests/assets/upload-api.test.ts
git commit -m "feat(media): add protected upload APIs"
```

---

### Task 6: Add management APIs and stable public delivery

**Files:**
- Create: `lib/assets/cursor.ts`
- Create: `app/api/admin/assets/route.ts`
- Create: `app/api/admin/assets/[id]/route.ts`
- Create: `app/api/admin/assets/[id]/archive/route.ts`
- Create: `app/api/admin/assets/[id]/restore/route.ts`
- Create: `app/media/[assetId]/[safeFilename]/route.ts`
- Create: `tests/assets/cursor.test.ts`, `tests/assets/admin-api.test.ts`, `tests/assets/public-delivery.test.ts`

**Interfaces:**
- Asset list query accepts one each of `search`, `type`, `status`, `tag`, `limit` (1–100), and opaque `cursor`; duplicate or unknown parameters return 400.
- Metadata PATCH accepts only `{ altKo: string | null, altEn: string | null, tags: string[] }`; filename and Blob fields are never mutable.
- DELETE requires JSON `{ confirm: true }` and supports first acquisition or retry from `deleting`.
- Public delivery returns 308 only for an exact UUID/filename match in `ready` or `archived`; all other states return a cache-safe 404.

- [ ] **Step 1: Write failing cursor, management, and public-state tests**

```ts
it.each(["pending", "processing", "failed", "deleting", "deleted"])(
  "does not deliver %s assets",
  async (state) => expect((await handleMediaDelivery(request, depsFor(state))).status).toBe(404),
)

expect((await handleMediaDelivery(request, depsFor("ready", "private"))).status).toBe(404)

it("refuses deletion while references exist", async () => {
  const response = await handleDeleteAsset(request, id, dependencies)
  expect(response.status).toBe(409)
  await expect(response.json()).resolves.toEqual({ error: "asset_referenced" })
})
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/assets/cursor.test.ts tests/assets/admin-api.test.ts tests/assets/public-delivery.test.ts`

Expected: FAIL because management and delivery routes do not exist.

- [ ] **Step 3: Implement validated list/detail/metadata/lifecycle handlers**

Reuse `authorizeAssetRead`, `authorizeAssetMutation`, `readBoundedJson`, and `assetErrorResponse`. Every response is no-store; archive/restore/delete are POST/DELETE mutations with same-origin checks and audit-backed service calls.

- [ ] **Step 4: Implement stable public redirect semantics**

Validate the UUID and decode the single filename segment without normalization. Match the stored safe filename exactly and construct a 308 response with `Location: publicUrl` and `Cache-Control: public, max-age=31536000, immutable`; return a no-store 404 without leaking whether an unavailable/private asset exists.

- [ ] **Step 5: Run focused tests, typecheck, and lint; commit**

Run: `npm run test:unit -- tests/assets/cursor.test.ts tests/assets/admin-api.test.ts tests/assets/public-delivery.test.ts && npm run typecheck && npm run lint`

```bash
git add lib/assets/cursor.ts app/api/admin/assets app/media tests/assets
git commit -m "feat(media): add asset management and delivery APIs"
```

---

### Task 7: Add stale-upload cleanup and operator documentation

**Files:**
- Create: `app/api/cron/assets/cleanup/route.ts`
- Modify: `lib/assets/store.ts`, `lib/assets/service.ts`, `lib/assets/telemetry.ts`
- Modify: `vercel.json`, `.env.example`, `README.md`
- Create: `docs/media-operations.md`
- Create: `tests/assets/cleanup.test.ts`, `tests/assets/cleanup-route.test.ts`

**Interfaces:**
- Add cleanup-candidate queries to `MediaAssetRepository` and add `service.cleanup(now)`, which marks `processing` rows older than one hour as `failed/processing_timeout`, deletes staging objects for pending or failed rows older than 24 hours, retries `deleting` assets, and returns bounded counts only.
- `GET /api/cron/assets/cleanup` accepts only the existing `Authorization: Bearer ${CRON_SECRET}` contract.
- The Vercel schedule is daily and does not collide with the three existing cron minutes.

- [ ] **Step 1: Write failing cleanup and authorization tests**

```ts
it("settles timed-out processing before removing expired staging objects", async () => {
  const result = await service.cleanup(new Date("2026-09-27T04:00:00Z"))
  expect(result).toEqual(expect.objectContaining({ processingTimedOut: 1, stagingDeleted: 2 }))
})

it("returns only bounded counts", async () => {
  const body = await response.json()
  expect(JSON.stringify(body)).not.toMatch(/token|url|pathname|provider/i)
})
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/assets/cleanup.test.ts tests/assets/cleanup-route.test.ts`

Expected: FAIL because cleanup orchestration and route do not exist.

- [ ] **Step 3: Implement cleanup and schedule it at `29 4 * * *`**

Process bounded batches and make every operation idempotent. A failed provider deletion increments a failure count and leaves the row retryable; unknown public orphans are reported, never auto-deleted.

- [ ] **Step 4: Document provisioning, deployment, rollback, and incident checks**

Document creation of separate public/private stores, Preview/Production token scoping, migration order, health verification, callback troubleshooting, manual cron invocation, orphan inspection, token rotation, and rollback that preserves database rows and Blobs.

- [ ] **Step 5: Run checks and commit**

Run: `npm run test:unit -- tests/assets/cleanup.test.ts tests/assets/cleanup-route.test.ts && npm run typecheck && npm run lint`

```bash
git add app/api/cron/assets vercel.json .env.example README.md docs tests/assets
git commit -m "feat(media): add asset cleanup operations"
```

---

### Task 8: Build the bilingual Admin asset library and direct upload queue

**Files:**
- Create: `app/admin/(protected)/assets/page.tsx`
- Modify: `app/admin/(protected)/layout.tsx`
- Create: `components/admin/asset-library.tsx`, `components/admin/asset-upload-queue.tsx`
- Create: `components/admin/asset-library.module.css`
- Modify: `components/admin/admin-nav.tsx`, `lib/admin/i18n.ts`
- Create: `tests/components/asset-library.test.tsx`, `tests/components/asset-upload-queue.test.tsx`, `tests/components/admin-assets-page.test.tsx`
- Modify: `tests/components/admin-shell-i18n.test.tsx`

**Interfaces:**
- The server page authorizes with `requireAdmin()`, reads the locale, obtains the initial filtered page, and passes serializable asset summaries to `AssetLibrary`.
- `AssetUploadQueue` accepts multiple supported image files, creates one intent per file, calls `uploadStagedAsset`, finalizes, and reports isolated `queued/uploading/processing/ready/failed` rows.
- `AssetLibrary` owns URL-backed immediate filters, grid/list view, metadata editing, stable path copy, archive/restore/delete actions, and localized safe feedback.

- [ ] **Step 1: Write failing page, queue, interaction, and mobile-contract tests**

```tsx
it("keeps mixed upload results independent", async () => {
  await selectFiles([validPng, invalidGif])
  expect(await screen.findByText("Ready")).toBeInTheDocument()
  expect(await screen.findByText("Unsupported file type")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Remove failed upload" })).toBeEnabled()
})

it("does not render the Assets nav entry when media health is unavailable", async () => {
  render(<AdminNav mediaAvailable={false} />)
  expect(screen.queryByRole("link", { name: "Assets" })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/components/asset-library.test.tsx tests/components/asset-upload-queue.test.tsx tests/components/admin-assets-page.test.tsx tests/components/admin-shell-i18n.test.tsx`

Expected: FAIL because the page and components do not exist.

- [ ] **Step 3: Implement the protected server page and health-aware navigation**

Use a non-secret `isMediaConfigured()` check that only reports whether both tokens are present. Hide the navigation entry and render a localized unavailable state if configuration is incomplete; never parse or expose token values to the client.

- [ ] **Step 4: Implement the direct multi-file queue**

Validate extensions/types/sizes early for feedback but treat the server as authoritative. Show per-file progress and processing states; retry creates a new intent. Keep completed files in the library, failed files removable, and browser-close recovery dependent on server callback/cleanup rather than local persistence.

- [ ] **Step 5: Implement the library controls with existing Core UI**

Use `Button`, `Input`, `Select`, `StatusLabel`, `Progress`, `Dialog`/`AlertDialog`, `SegmentedToggle`, `EmptyState`, and `Skeleton`. Debounce search by 250ms, apply type/status/tag filters immediately, keep long metadata wrapping, and collapse grid/list controls without horizontal overflow at 320px. Show version replacement and reference browsing as explicitly unavailable.

- [ ] **Step 6: Run component tests, typecheck, lint, and commit**

Run: `npm run test:unit -- tests/components/asset-library.test.tsx tests/components/asset-upload-queue.test.tsx tests/components/admin-assets-page.test.tsx tests/components/admin-shell-i18n.test.tsx && npm run typecheck && npm run lint`

```bash
git add app/admin components/admin lib/admin/i18n.ts tests/components
git commit -m "feat(media): add Admin asset library"
```

---

### Task 9: Verify the complete media foundation and prepare delivery

**Files:**
- Modify production files only for verified defects.
- Modify: `docs/platform-roadmap.md` after all release gates pass.

**Interfaces:**
- No new product interface. This task verifies the spec, migration, provider boundary, security controls, Admin UX, and operational rollback as one release.

- [ ] **Step 1: Run every focused media and affected regression suite**

Run: `npm run test:unit -- tests/assets tests/components/asset-library.test.tsx tests/components/asset-upload-queue.test.tsx tests/components/admin-assets-page.test.tsx tests/components/admin-shell-i18n.test.tsx tests/auth tests/documents/schema.test.ts`

Expected: PASS with no real Blob credentials or network calls.

- [ ] **Step 2: Run the complete repository gate**

Run: `npm test && git diff --check`

Expected: design generation check, typecheck, lint, all unit tests, production build, and whitespace validation pass.

- [ ] **Step 3: Verify the additive migration in an isolated database when available**

Run: `DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate`

Expected: migration succeeds twice without changing prior document, analytics, or agent records. If the guarded disposable database is unavailable, record the guard refusal and never substitute production.

- [ ] **Step 4: Perform human browser verification in Preview**

Verify Korean and English at desktop and 320px: multi-file mixed outcomes, progress, retry, search/filter, grid/list, alt/tags, copy path, archive/restore/delete confirmation, keyboard-only use, 200% zoom, missing-config state, and no horizontal overflow. Upload representative JPEG, PNG, WebP, AVIF, safe SVG, oversized input, renamed spoof, animated input, and hostile SVG; only the five supported sanitized results may resolve through `/media/...`.

- [ ] **Step 5: Exercise failure and cleanup recovery in Preview**

Interrupt after staging upload, repeat callback/finalize, simulate failed staging deletion, invoke cleanup twice, and confirm the second run is idempotent. Verify logs and audit rows contain IDs/safe codes only and that a deleting or private asset always returns 404 publicly.

- [ ] **Step 6: Mark the milestone shipped and perform final review**

Update both roadmap status tables to `Shipped` only after Steps 1–5 pass. Run a fresh whole-branch review focused on credential separation, untrusted file parsing, callback authentication, deletion races, and Blob/DB partial failures; fix Critical/Important findings with regression tests and rerun `npm test`.

- [ ] **Step 7: Commit verification, push, and open the PR**

```bash
git add docs/platform-roadmap.md
git commit -m "chore(media): verify media platform foundation"
git push -u origin codex/media-platform-foundation
gh pr create --base main --head codex/media-platform-foundation \
  --title "feat: add media platform foundation" \
  --body-file /tmp/media-platform-pr.md
```
