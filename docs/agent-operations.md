# Agent operations

The Agent control plane is protected at `/admin/agent`. Keep AI disabled until the selected model and stored credential are verified and the operating limits have been reviewed.

## Deployment secrets

Generate the independent secrets in a trusted terminal and store their output directly in the deployment secret manager:

```bash
openssl rand -base64 32
openssl rand -base64 48
```

Use the first output for `AI_CREDENTIAL_ENCRYPTION_KEY` and the second for `AI_COOKIE_SECRET`. Do not reuse authentication, analytics, provider, or database secrets. Never commit, paste into tickets, or retain command output in shell logs.

To rotate `AI_COOKIE_SECRET`, replace it in the deployment environment and deploy. Existing AI identity cookies become invalid.

To rotate `AI_CREDENTIAL_ENCRYPTION_KEY`, first disable AI and delete the stored credential while the old encryption key is still deployed. Replace the deployment secret, deploy, and then register and test a provider credential again. There is no plaintext-key recovery or in-place re-encryption path.

## First registration and model changes

1. Open **Agent** and choose a supported model under **OpenAI setup**. The recommended cost-sensitive model is selected by default.
2. Enter the OpenAI API key and choose **Verify and save**. The server runs a bounded inference against that exact model, encrypts the key, and saves the verified model and catalog price snapshot in one operation.
3. Review the monthly guardrail and any advanced limits, save **Usage & policy**, then explicitly enable AI.

The browser never submits editable token prices. The server-owned catalog supplies the displayed USD-per-million-token estimate and its checked date. OpenAI's model-list API does not include pricing, so catalog prices are reviewed and deployed with the application rather than fetched during setup.

To change only the model, select it and choose **Verify and apply model**. The server verifies the new model with the stored encrypted credential. To change both the key and model, enter the new key, select the model, and choose **Verify and replace**. A model change leaves AI disabled until it is explicitly enabled again. A failed verification or concurrent settings change preserves the prior credential and settings.

## Kill switch and recovery

Use **Disable AI now** when provider access, pricing, usage, or configuration is uncertain. Document reading remains available. Correct the settings or replace the credential, run **Test connection**, review the estimated monthly guardrail, and explicitly re-enable AI.

A failed replacement leaves the prior encrypted credential intact. Deleting a credential disables AI and cannot be undone; repeat the guided registration to recover.

## Backups and cost interpretation

Database backups contain encrypted credential material. A restored credential is usable only with the matching encryption key from the deployment secret manager; neither the backup nor the key alone is sufficient. If that pairing is unavailable, delete the restored credential and register a new one.

The displayed cost is an estimate from provider-reported token counts and the deployed catalog price snapshot. It is a guardrail, not reconciliation with the OpenAI invoice; review the provider invoice separately and update the catalog whenever provider pricing changes.

## Credential verification diagnostics

When an authenticated Admin credential verification fails, the Agent screen can show an expandable **OpenAI error details** block. Its only fields are **Status**, **Provider code**, **Provider type**, **Provider parameter**, **Request ID**, and **Message**. Fields that OpenAI did not return are omitted. The message is single-line, length-bounded, and redacted for recognizable OpenAI API keys.

Use the **Request ID** (the OpenAI `x-request-id` value) when correlating the failed request with OpenAI support or provider logs. Copy that identifier and the displayed status/code, but never include the API key, authorization headers, encrypted credential material, or the original request body in a support request.

These diagnostics are returned only to an authenticated Admin browser for the request that failed. They are not written to the database, audit history, analytics, or application logs.

The credential check has a fixed 10-second timeout and makes no provider retries. A timeout, abort, or connection problem appears as a provider-unavailable result; resolve the cause before manually testing again.

## Retired database document kinds

`design` is no longer a database-backed document kind. The public `/design` route remains the static LafLabs design guide, but Admin documents, revisions, and API inputs support only `notice`, `legal`, and `disclosure`.

The migration deletes every database-backed `design` document revision and series before replacing the PostgreSQL enum. This deletion is permanent. Verify backups and deploy readiness before applying it.

After the enum migration has run, deployment is roll-forward-only: do not roll the application or database back to a release that still references the `design` enum value. Recover from an issue with a forward corrective release or a separately approved database-restore procedure.
