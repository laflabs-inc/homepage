# Media Platform Foundation Design

Status: Proposed
Date: 2026-09-26
Roadmap milestone: 4, Media platform foundation

## Purpose

Build a dependable internal media service for LafLabs public websites. Administrators must be able to upload, inspect, describe, find, archive, restore, and safely delete website images without committing files to the application repository. Published consumers will use stable LafLabs media paths rather than provider URLs.

This milestone establishes storage, metadata, lifecycle, delivery, Admin inspection, and operational cleanup. Markdown insertion, automatic document reference extraction, and version replacement remain in the next Media authoring integration milestone.

## Success criteria

- An authenticated LafLabs administrator can upload supported images directly from the browser without proxying the incoming upload through a Next.js function.
- No unvalidated upload becomes publicly readable.
- A validated public asset receives one immutable LafLabs path and one immutable Blob object.
- The Admin library exposes upload progress, safe errors, metadata, search, archive, restore, and dependency-aware deletion.
- Existing and future consumers depend on application-owned asset types and paths, not Vercel SDK response shapes.
- The system behaves safely when Blob, Neon, the upload callback, or image processing fails partway through an operation.

## Scope

### Included

- Two Vercel Blob stores: one public delivery store and one private staging store.
- Direct private client uploads using short-lived Blob upload tokens.
- Raster validation and metadata removal for JPEG, PNG, WebP, and AVIF.
- Strict sanitation and validation for SVG.
- Neon asset and reference records with additive migrations.
- Stable public delivery route at `/media/{assetId}/{safeFilename}`.
- Admin asset library at `/admin/assets`.
- Metadata editing, tag search, archive, restore, and hard deletion.
- Pending-upload cleanup through an authenticated cron route.
- Audit records and bounded operational counters.

### Deferred

- Markdown editor asset picker and image insertion.
- Reference extraction from Markdown and publication validation.
- Version replacement UI and automatic migration to a new version.
- Public or anonymous uploads.
- Final private attachments and public inquiry attachments.
- Video, audio, PDF, GIF, animated image, or general document uploads.
- Image transformations requested by public URLs.

## Chosen architecture

### Two-store staged promotion

Raw browser uploads go to a private Blob store under a staging prefix. A server-side finalizer retrieves the private object, verifies its real content, strips image metadata or sanitizes SVG, calculates the checksum and dimensions, then writes one immutable object to the public Blob store. The private staging object is deleted after successful promotion.

This is preferred over direct public upload because direct public upload exposes an object before application validation. It is preferred over a server-proxied upload because browser-to-Blob transfer avoids request-body limits and unnecessary upload transfer through the application function.

The private store is also the future boundary for protected attachments, but this milestone issues upload intents only for public website images. Future private assets will use a separate prefix and explicit policy without changing the public asset contract.

### Provider isolation

Server-side `@vercel/blob` calls live behind `lib/assets/blob-store.ts`. The browser-only `@vercel/blob/client` call lives behind `lib/assets/client-upload.ts` so it does not pull server credentials or server-only modules into the client bundle. Application services and components exchange LafLabs-owned values such as `StagedBlob`, `PublicBlob`, `UploadProgress`, and `BlobStoreError`; no Vercel SDK object crosses those adapter boundaries.

This boundary is deliberately small. It is not a general storage-provider plugin framework.

## Storage configuration

The deployment provides two explicit credentials:

- `BLOB_PUBLIC_READ_WRITE_TOKEN`
- `BLOB_PRIVATE_READ_WRITE_TOKEN`

The application fails closed for media mutations when either credential is missing. Existing routes and builds remain usable because media environment parsing is lazy and limited to media operations.

Private staging path:

```text
staging/{assetId}/{uploadNonce}
```

Public Blob path:

```text
media/{assetId}/{safeFilename}
```

`assetId` and `uploadNonce` are server-generated random values. User filenames never determine a storage prefix. Public objects are created without overwrite and receive long-lived immutable cache headers.

## Data model

### Enums

`media_asset_visibility`:

- `public`
- `private`

`media_asset_status`:

- `pending`: upload intent exists or the staging upload has completed but validation has not started
- `processing`: one finalizer owns the validation and promotion attempt
- `ready`: validated public object and metadata are available
- `failed`: validation or promotion failed with a safe reason code
- `archived`: hidden from new selection while existing delivery remains valid
- `deleting`: delivery is disabled while Blob deletion is pending or being retried
- `deleted`: Blob objects have been removed and delivery is disabled

### `media_assets`

- `id`: UUID primary key
- `visibility`: visibility enum; this milestone creates only public records
- `status`: lifecycle enum
- `original_filename`: administrator-visible original name
- `safe_filename`: normalized display and public-path filename
- `declared_media_type`: browser-declared type retained for diagnostics
- `media_type`: verified final media type
- `byte_size`: verified final output size
- `width`, `height`: verified pixel dimensions when applicable
- `checksum_sha256`: checksum of the sanitized public output
- `staging_pathname`, `staging_url`: private temporary object location
- `public_pathname`, `public_url`: immutable public object location
- `alt_ko`, `alt_en`: nullable localized alternative text
- `tags`: normalized, deduplicated string array
- `failure_code`: nullable safe internal code, never provider payload text
- `family_id`: UUID shared by future replacement versions
- `previous_asset_id`: nullable self-reference for future lineage
- `version`: positive integer within one family, initially `1`
- `created_by`, `updated_by`: GitHub actor IDs
- `created_by_name`, `updated_by_name`: actor-name snapshots for audit continuity
- `created_at`, `updated_at`, `ready_at`, `archived_at`, `deleted_at`
- `archived_by`, `deleted_by`

Indexes cover status and creation order, checksum, family/version, and case-insensitive filename search. A unique constraint prevents two versions in one family from sharing a version number. Blob pathnames are unique when present.

### `media_asset_references`

- `id`: UUID primary key
- `asset_id`: restricted foreign key to `media_assets`
- `owner_type`: bounded application enum, beginning with `document_revision`
- `owner_id`: owning entity UUID or stable identifier
- `field`: bounded field name such as `body_markdown`
- `revision_id`: nullable immutable revision UUID
- `created_at`, `updated_at`

A unique constraint prevents duplicate references for the same asset, owner, field, and revision. This table exists in the foundation but is populated by the later authoring integration.

## Asset lifecycle

Allowed transitions:

```text
pending -> processing -> ready -> archived -> ready
pending -> processing -> failed
pending -> failed
pending -> deleting -> deleted
failed -> deleting -> deleted
archived -> deleting -> deleted
```

`ready -> deleted` is forbidden. `processing` is acquired with a conditional database update so concurrent finalizers cannot process the same object. A repeated finalize request for an already ready asset returns the ready representation. A repeated Blob completion callback is idempotent.

Archive changes only database visibility. It does not remove the public Blob object or break the stable media route. Restore returns the asset to `ready`.

Hard delete requires `pending`, `archived`, or `failed`, zero reference rows, and explicit confirmation. Allowing `pending` deletion lets an administrator cancel an interrupted direct upload and clean up its staging object. One database transaction locks the asset, rechecks the reference count, and conditionally moves it to `deleting`. Reference creation takes a compatible row lock and rejects assets outside `ready` or `archived`, so it cannot race past deletion acquisition. The public route never resolves `deleting` assets. Blob deletion then runs outside the transaction, and a missing Blob is treated as already deleted. Success moves the record to `deleted`; failure leaves it in `deleting` so the administrator or cleanup job can retry without reopening delivery.

## Upload and finalization flow

1. The Admin client requests an upload intent with filename, declared type, and byte size.
2. The API authenticates the administrator, enforces same origin, validates the declared type and 10 MiB limit, generates the asset ID and upload nonce, and inserts a pending record.
3. The Admin client calls `upload()` from `@vercel/blob/client` with the exact private staging pathname and the asset ID as bounded client payload.
4. The Blob token route authenticates token requests, rechecks same origin, loads the pending record, and issues a token limited to the exact staging path, allowed content types, and maximum size.
5. The Blob completion callback verifies its signed payload through `handleUpload()`, records the returned staging location idempotently, and returns quickly. It does not perform image processing.
6. The client requests finalization. The service conditionally acquires `processing`, reads the expected private pathname directly from Blob, and never trusts a client-supplied Blob URL.
7. The validator enforces byte count, media signature, decoder success, dimensions, and format policy. It derives the immutable safe filename from the verified format, then calculates the sanitized output checksum and duplicate warning.
8. The service writes the sanitized output once to the public store, records the final filename, metadata, and `ready` status, appends the audit event, then deletes the staging object.
9. If validation fails, the staging object is deleted when possible and the record becomes `failed` with a bounded failure code. Provider payloads and file contents are not persisted in errors or logs.

If the browser closes after direct upload, the callback may still record the object. The cleanup cron removes stale pending or failed staging objects after 24 hours. Processing records older than one hour are returned to `failed` with `processing_timeout` before cleanup.

## File policy

### Shared limits

- Maximum declared and verified public input size: 10 MiB.
- Maximum decoded pixel count: 40 megapixels.
- Maximum dimension on either axis: 16,384 pixels.
- Empty files are rejected.
- Filename display length is limited to 160 Unicode code points.
- Tags are lowercase-normalized for matching, limited to 20 tags and 40 code points per tag.

### Raster images

Allowed verified formats are JPEG, PNG, WebP, and AVIF. Browser MIME and extension are hints only. The decoder and detected signature determine the accepted format.

Raster output is auto-oriented and re-encoded in its verified format without EXIF, XMP, ICC location data, comments, or other source metadata. Animation and multi-page inputs are rejected. Output dimensions and checksum are calculated after sanitation.

### SVG

SVG is parsed as UTF-8 XML with a 2 MiB input limit inside the overall limit. The sanitizer uses an explicit allowlist of presentation elements and attributes. It rejects scripts, event attributes, `foreignObject`, embedded HTML, external references, network URLs, data URLs, stylesheet imports, filters that reference external content, entity declarations, and malformed XML.

The sanitized output is parsed again before readiness. Width and height are recorded only when a safe numeric viewport can be established. An SVG that cannot be sanitized without ambiguity is rejected rather than repaired heuristically.

### Duplicate handling

A matching checksum on an existing ready or archived asset produces a duplicate warning with the existing asset ID. It does not silently replace, alias, or delete either record. The administrator may keep the new asset or archive it.

## HTTP surface

### Admin API

- `GET /api/admin/assets`: cursor-paginated listing with search, type, status, and tag filters
- `POST /api/admin/assets/intents`: create one bounded upload intent
- `POST /api/admin/assets/upload`: Blob client-token exchange and completion callback
- `POST /api/admin/assets/{id}/finalize`: validate, sanitize, and promote one staged upload
- `GET /api/admin/assets/{id}`: metadata and reference count
- `PATCH /api/admin/assets/{id}`: update localized alt text and tags; stable filenames never change in place
- `POST /api/admin/assets/{id}/archive`: archive a ready asset
- `POST /api/admin/assets/{id}/restore`: restore an archived asset
- `DELETE /api/admin/assets/{id}`: cancel a pending upload or start/retry hard deletion of an archived, failed, or deleting unreferenced asset
- `GET /api/cron/assets/cleanup`: remove expired staging objects and settle stale records

All Admin reads require GitHub organization authorization. All browser-originated mutations additionally require same-origin validation. Request JSON uses the shared bounded parser. List limits are between 1 and 100 and use an opaque cursor.

The Blob completion callback is the only mutation without an Admin session or Origin requirement. `handleUpload()` authenticates that callback, and its token payload contains only the asset ID, expected pathname, and actor ID captured during token generation.

### Public delivery

`GET /media/{assetId}/{safeFilename}` resolves only `ready` or `archived` public assets. The filename must match the stored safe filename exactly. Successful requests issue a permanent redirect to the immutable public Blob URL with long-lived public cache headers. Pending, processing, failed, deleting, private, deleted, unknown, and filename-mismatched assets return 404.

No public endpoint exposes a private Blob URL.

## Admin asset library

`/admin/assets` follows the existing square Core UI system and Admin shell. It contains:

- compact page heading and upload action
- search plus type, status, and tag filters with immediate application
- grid and compact list views
- direct multi-file upload queue with progress and per-file status
- thumbnail or safe file-type fallback
- original filename, verified type, dimensions, byte size, status, and creation metadata
- Korean and English alternative-text fields
- normalized tags
- stable public path copy action
- duplicate warning linking to the existing asset
- archive, restore, and confirmed hard-delete actions
- empty, loading, unavailable, partial-upload, and per-file validation states

The upload queue is an isolated Client Component. Listing and initial filters remain server-rendered. Failed files stay in the queue with an actionable safe error code and can be removed or retried with a new upload intent.

Version replacement and usage-reference browsing are shown as unavailable until Media authoring integration ships. The interface does not simulate unsupported behavior.

## Security boundaries

- Only authenticated GitHub organization administrators may create upload tokens or mutate metadata.
- Upload tokens are short-lived, exact-path scoped, content-type scoped, and size bounded.
- Client pathnames, MIME values, filenames, Blob URLs, dimensions, and checksums are untrusted until server verification.
- The private store is the only destination for unvalidated bytes.
- Public output is written under a new immutable path with overwrite disabled.
- SVG and raster parsers run with explicit byte and pixel bounds.
- Error responses expose stable codes, not storage credentials, provider bodies, stack traces, or file content.
- Audit metadata contains asset IDs, safe state changes, media type, and byte size only. It excludes upload tokens, private URLs, source bytes, and provider errors.
- CSP and `nosniff` protections from Blob do not replace application validation.

## Failure and consistency model

Neon is the lifecycle source of truth. Blob is the byte store. Cross-system operations are designed to be retryable rather than pretending to be one transaction.

- Intent creation is complete only after the pending database record exists.
- Token generation never creates another record.
- Finalization is guarded by a conditional status transition.
- Public upload uses a unique immutable path, so retry never overwrites an existing object.
- A public Blob written before the final database update is an orphan. Finalization retry discovers the expected object, verifies it, and completes the record; cleanup reports unresolved orphans for manual inspection rather than deleting unknown public files automatically.
- Staging deletion is best effort after readiness and is retried by cleanup.
- Hard deletion atomically acquires the `deleting` state only after checking references, is idempotent on retry, and never restores public delivery after acquisition.
- Rollback does not drop tables or delete Blob objects automatically.

## Audit and observability

Audit actions:

- `media.intent_created`
- `media.upload_completed`
- `media.finalized`
- `media.finalize_failed`
- `media.metadata_updated`
- `media.archived`
- `media.restored`
- `media.deleted`
- `media.cleanup_completed`

Administrator actions use the actor captured by the authenticated request. Callback actions use the actor snapshot stored on the pending asset. Scheduled cleanup uses the explicit system actor `system:cron` with the display name `Asset cleanup`.

Operational counts include upload intents, completed staging uploads, finalized assets, validation failures by safe code, duplicate warnings, bytes promoted, staging cleanup count, and public delivery misses. Logs use asset IDs and error codes and never store original bytes or credentials.

The shared audit action type moves from the document domain into `lib/audit/types.ts` so assets and documents depend on the audit layer rather than on each other.

## Testing strategy

### Unit and service tests

- filename, tag, MIME, byte, dimension, and SVG policy boundaries
- signature mismatch and decoder failure
- metadata removal and stable checksum generation
- lifecycle transition matrix and concurrent finalization ownership
- duplicate warning without automatic deduplication
- archive, restore, deletion acquisition, and reference-race rules
- Blob adapter error normalization and idempotent missing-object deletion

### Route tests

- Admin authentication and same-origin checks
- exact upload-token path, content-type, and size scope
- callback behavior without an Admin session and rejection of invalid callback payloads
- bounded request bodies and list cursors
- public delivery for ready and archived assets only
- cleanup cron authentication and idempotency

### Database tests

- additive migration on an existing schema
- constraints, unique indexes, and restricted reference deletion
- compare-and-set processing acquisition
- reference count enforcement during hard delete

### Component and browser tests

- upload queue progress, mixed success and failure, and retry
- keyboard-accessible grid/list view and actions
- localized alt fields and safe error messages
- desktop and mobile overflow
- empty, loading, unavailable, and filtered-empty states

## Deployment and rollback

1. Apply additive database migration.
2. Provision and connect one private and one public Blob store.
3. Configure explicit public and private tokens in Preview and Production.
4. Deploy APIs and Admin UI together while the navigation entry remains hidden if media environment health fails.
5. Enable cleanup only after Admin inspection is available.

Rollback disables the Admin navigation and media mutations. It does not drop tables or delete Blob objects. Existing immutable `/media` paths continue resolving while the prior deployment remains available.

## External references

- [Vercel Blob](https://vercel.com/docs/vercel-blob)
- [Vercel Blob client uploads](https://vercel.com/docs/vercel-blob/client-upload)
- [Vercel Blob private storage](https://vercel.com/docs/vercel-blob/private-storage)
- [Vercel Blob security](https://vercel.com/docs/vercel-blob/security)
