# Media platform operations

The Admin media library uses a private staging store and a separate public
delivery store. Keeping the credentials and stores separate is a security
boundary: unverified browser uploads must never be readable from a public URL.

## Provisioning

1. Create two Vercel Blob stores per deployment environment:
   `laflabs-media-public` and `laflabs-media-private` (or equally explicit
   names). Do not connect one store to both variables.
2. Scope Preview tokens to Preview and Production tokens to Production. Never
   copy Production tokens into local or Preview environments.
3. Set `BLOB_PUBLIC_READ_WRITE_TOKEN` from the public store and
   `BLOB_PRIVATE_READ_WRITE_TOKEN` from the private store. The application
   rejects missing or identical values when a media operation begins; unrelated
   pages remain available.
4. Set `CRON_SECRET` independently. The daily cleanup request uses
   `Authorization: Bearer <CRON_SECRET>`.
5. Apply database migration `0011_media_platform.sql` before deploying code
   that exposes the Admin media routes. Then deploy and verify the migration
   journal matches the release.

## Release verification

Use a disposable image without sensitive metadata.

1. Sign in as a GitHub organization administrator.
2. Create an upload intent and confirm the returned pathname begins with
   `staging/{assetId}/` and contains no original filename.
3. Upload and finalize it. Confirm the Admin response exposes only
   `/media/{assetId}/{safeFilename}`, not either provider URL.
4. Open the stable media path. It must return `308` only for a ready public
   asset, with a one-year immutable cache policy.
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

- `401` or `403` while requesting an upload token: confirm the Admin session,
  exact site Origin, and organization membership.
- `invalid_callback`: confirm the browser uses the intent's exact pathname,
  `/api/admin/assets/upload`, and the private store token.
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

## Token rotation

Rotate one store at a time.

1. Create the replacement token in Vercel Blob.
2. update the matching Preview or Production environment variable;
3. deploy and complete the release verification for that store;
4. revoke the previous token only after the new deployment is healthy;
5. repeat for the other store.

Never swap the public and private variables, and never rotate both stores in a
single unverified deployment.

## Rollback

Roll back application code without rolling back or deleting `media_assets`,
`media_asset_references`, or either Blob store. Database rows and objects are
the recovery record. Disable the media Admin entry if necessary, keep the
cleanup job active when compatible, and redeploy the last known-good version.
If the previous release predates media support, temporarily disable only the
asset cleanup schedule while preserving all rows and objects for a forward fix.
