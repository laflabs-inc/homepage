# AI summary operations

AI is an admin-only document-summary feature. Keep it disabled until this runbook is complete.

## Bootstrap and credentials

Set independent deployment secrets: `AI_CREDENTIAL_ENCRYPTION_KEY` must be canonical base64 for 32 random bytes, and `AI_COOKIE_SECRET` must be a different 32+-character value. Generate and enter them directly in the deployment secret manager; never commit or print them. The cookie secret is a reserved control-plane field in this release: no AI identity cookie is issued.

In **Admin → Agent**, save the exact OpenAI model first, then enter the current input and output USD-per-million-token prices. Add the provider key under **Connection**; registration performs a short test against that exact configured model before encrypting the key. Confirm the saved fingerprint, verified model, and timestamp before enabling AI.

Changing the model disables AI, clears prices, and requires current prices plus another connection test for the new exact model. To replace a provider key, leave AI disabled, register and test the replacement, then explicitly enable AI. Deleting the credential disables AI and is irreversible; register and test a new key to recover.

To replace the encryption key, disable AI and delete the stored credential while the old key is deployed; replace the deployment key, deploy, then register and test a new provider key. A backup credential needs its matching encryption key; otherwise delete it and register a new one.

## Summary and cost controls

Prices are manually maintained estimates, not an OpenAI invoice. Update them whenever the model or provider pricing changes, and reconcile separately against the provider invoice.

Each summary reserves bounded estimated monthly cost before the provider call. On a successful response, provider-reported actual token usage is recorded and the reservation is released; a failed call releases it (or its short expiry does). The monthly value is a guardrail, so one bounded request can cause a small overage before later requests are blocked.

`review` lets an administrator inspect the generated draft summary before publishing. `automatic` generates only when publishing a draft with an empty summary; an existing manual summary is published unchanged. At most the first 16,000 draft characters are sent to OpenAI, and only after an administrator presses **Generate with AI** or that empty-summary automatic publish runs.

Do not log prompts, draft content, provider keys, or generated raw output. The AI flow creates no separate raw-content store; the normal document revision and any saved summary remain subject to their ordinary document controls.

## Operations and release checks

Use **Disable AI now** for provider, pricing, usage, or configuration uncertainty. Document reading and publishing without AI remain available. Correct the issue, test the configured model again, review the monthly guardrail, then explicitly re-enable AI.

`/api/cron/ai-retention` runs daily at `43 3 * * *`. It removes expired reservations, daily aggregates older than 32 days, and monthly aggregates older than 13 calendar months. It returns deletion counts only. In preview, invoke it with the preview `CRON_SECRET`, verify the next run reports zero, and confirm a missing or wrong bearer returns `401`.

Before production, apply migrations in preview, verify the exact-model test, generate/review a synthetic draft, test automatic publication only with an empty summary, confirm the monthly estimate and retention Cron, then repeat after deployment. Check logs and telemetry contain no raw content or secrets.

Public document Q&A, AI cookies, and daily visitor quota are deferred. Related Agent fields remain reserved and are not active in this release.
