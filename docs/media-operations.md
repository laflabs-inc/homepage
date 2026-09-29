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
6. Apply database migration `0011_media_platform.sql` before deploying code
   that exposes the Admin media routes. Then deploy and verify the migration
   journal matches the release.

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
5. Archive and restore the asset, then archive and delete it. Referenced assets
   must return `409 asset_referenced` instead of deleting.
6. Check that the private object disappears after successful promotion and the
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
