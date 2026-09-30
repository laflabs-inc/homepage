# Media platform operations

The Admin media library uses a private staging store and a separate public
delivery store. Keeping the credentials and stores separate is a security
boundary: unverified browser uploads must never be readable from a public URL.

## Provisioning

1. Create two Vercel Blob stores per deployment environment:
   `laflabs-media-public` and `laflabs-media-private` (or equally explicit
   names). The first store must be Public and the second must be Private.
2. Connect the public store to the Vercel project with the custom prefix
   `PUBLIC`. Connect the private store with the custom prefix `PRIVATE`. Scope
   each connection to the intended Production, Preview, or Development
   environments; never connect a Production store to Preview.
3. Verify that Vercel created `PUBLIC_BLOB_STORE_ID`,
   `PRIVATE_BLOB_STORE_ID`, and `PRIVATE_BLOB_WEBHOOK_PUBLIC_KEY`. The
   application rejects missing values or one store reused across both trust
   boundaries. Do not create or copy a long-lived Blob read-write token: the
   SDK obtains Vercel's short-lived OIDC identity at request time.
4. Redeploy after connecting or changing either store. For local verification,
   run `vercel link` once, then `vercel env pull .env.local` before starting the
   app. The SDK refreshes an expired development OIDC credential through the
   linked Vercel CLI session; pull again only after project, store, or environment
   connections change.
5. Set `CRON_SECRET` independently. The daily cleanup request uses
   `Authorization: Bearer <CRON_SECRET>`.
6. Apply database migrations `0011_media_platform.sql` and
   `0012_media_authoring.sql` before deploying code that exposes the Admin
   media routes. Migration 0012 adds only a nullable revision foreign key and
   an owner lookup index, so it remains compatible while old and new
   application versions overlap. Then deploy and verify the migration journal
   matches the release.

## Authoring workflow

1. In a document draft, choose **Insert managed image** in the Markdown
   toolbar. The picker lists only `ready` assets; archived assets remain
   deliverable but are intentionally hidden from new selection.
2. Enter meaningful alternative text in the document language. If it differs
   from the asset metadata, the picker saves that locale before inserting.
3. The editor inserts only
   `/media/{assetId}/{safeFilename}` Markdown. Never paste a Blob provider URL.
4. Saving a draft synchronizes its valid references atomically. A broken local
   media path may remain in a draft for repair, but schedule and publish reject
   it with `asset_unavailable` until the asset is `ready` or `archived`.
5. Use **Document usage** on an asset before cleanup. It lists at most 100
   referencing revisions and links to their Admin editor pages without
   returning document bodies.

## Archive, replacement, and deletion

- **Archive** hides an asset from the picker while keeping every existing
  stable path available. Restore makes it selectable again.
- **Create a new version** uploads a new immutable asset ID in the same family.
  The old file, path, metadata, and document references are never rewritten.
- **Delete permanently** is available only for archived or failed assets and
  remains blocked with `409 asset_referenced` while any saved revision uses the
  asset. Open Document usage and update or delete those revisions first.
- A failed replacement does not affect the previous version. Retry the new
  pending/failed asset or start another replacement; do not mutate the old
  public object.

## Release verification

Use a disposable image without sensitive metadata.

1. Sign in as a GitHub organization administrator.
2. Create an upload intent and confirm the returned pathname begins with
   `staging/{assetId}/` and contains no original filename.
3. Upload and finalize it. Confirm the Admin response exposes only
   `/media/{assetId}/{safeFilename}`, not either provider URL.
4. Open the stable media path. It must return `308` only for a ready or archived
   public asset, with a one-year immutable cache policy. Archiving hides an
   asset from new selection without breaking existing delivery.
5. Insert the asset through the document picker, save the draft, and confirm
   Document usage links back to that revision. Scheduling or publishing must
   reject missing, deleting, or deleted local assets.
6. Create a replacement and confirm it receives a new ID and the next family
   version while the original Markdown path remains unchanged.
7. Archive and restore the asset, then archive and delete it. Referenced assets
   must return `409 asset_referenced` instead of deleting.
8. Check that the private object disappears after successful promotion and the
   public object remains immutable.

## Cleanup and manual recovery

Vercel invokes `/api/cron/assets/cleanup` daily at `04:29 UTC`. It processes
bounded batches and reports counts only:

- `processingTimedOut`: processing rows older than one hour moved to failed;
- `stagingDeleted`: pending or failed staging objects older than 24 hours removed;
- `deletionsCompleted`: `deleting` rows whose Blob cleanup completed;
- `failures`: operations left intact for the next retry.

Invoke it manually from a trusted shell without printing the secret:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://laflabs.co/api/cron/assets/cleanup
```

A nonzero `failures` count is retryable. Check Vercel function and Blob service
health, then invoke the job again. Never edit a `deleting` row back to `ready`.

## Callback troubleshooting

- `401` or `403` while requesting a presigned upload URL: confirm the Admin session,
  exact site Origin, and organization membership.
- `invalid_callback`: confirm the browser uses the intent's exact pathname,
  `/api/admin/assets/upload`, and the private store connection.
- `unavailable` before an upload begins: confirm both store IDs are present,
  the Vercel project has OIDC enabled, and the deployment was created after the
  stores were connected.
- Configuration remains unavailable even though both stores are connected:
  remove a leftover generic `BLOB_READ_WRITE_TOKEN`. The SDK would otherwise be
  able to fall back to that token and select a store outside the configured
  public/private boundary.
- Upload completed but finalization cannot find it: inspect the asset's expected
  staging pathname and the private store. Do not paste a provider URL into the
  database or retry with a client-chosen pathname.
- A row remains `processing`: retry after the provider recovers, or allow the
  one-hour timeout to settle it safely.

## Orphan inspection

The application never automatically deletes an unknown public object. Compare
public-store pathnames with non-deleted database `public_pathname` values. An
unknown object should be recorded as an incident, checked against deployment
logs and backups, and removed manually only after ownership is established.
Private objects under `staging/` may be matched to the asset ID in the path and
the corresponding row before manual deletion.

## OIDC credential lifecycle

Vercel issues short-lived OIDC credentials to deployments and rotates them
automatically. There is no application token to generate, paste, or rotate.
When a store connection must change:

1. Connect the replacement store with the same `PUBLIC` or `PRIVATE` prefix in
   the intended environment only.
2. Redeploy so the new store ID and webhook public key reach the Functions.
3. Complete release verification before disconnecting the previous store.
4. Change one store at a time so the failing boundary is unambiguous.

Never swap the public and private connections or introduce a shared read-write
token as a shortcut.

## Rollback

Roll back application code without rolling back or deleting `media_assets`,
`media_asset_references`, or either Blob store. Database rows and objects are
the recovery record. A disconnected setup leaves the media Admin entry visible
with setup guidance; keep the cleanup job active when compatible, and redeploy
the last known-good version.
If the previous release predates media support, temporarily disable only the
asset cleanup schedule while preserving all rows and objects for a forward fix.
The nullable migration 0012 foreign key and owner index can remain in place
during rollback. Existing stable paths and every previous asset version remain
valid; do not reverse the migration or rewrite Markdown.
