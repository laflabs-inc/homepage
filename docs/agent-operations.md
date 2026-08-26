# Agent operations

The Agent control plane is protected at `/admin/agent`. Keep AI disabled until the model, pricing, stored credential, and connection test are all current.

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

1. Open **Agent**, set the model, and save. Enter the current input/output USD-per-million prices and the operating limits, then save again.
2. Enter the OpenAI credential once under **Connection**. Registration runs a minimal inference against the selected model before encrypting and storing the credential.
3. Confirm the masked fingerprint and verified status, then explicitly enable AI.

Changing the model disables AI, clears its prices, and invalidates prior verification. Save the new model, enter current prices, run **Test connection**, and only then enable AI again.

## Kill switch and recovery

Use **Disable AI now** when provider access, pricing, usage, or configuration is uncertain. Document reading remains available. Correct the settings or replace the credential, run **Test connection**, review the estimated monthly guardrail, and explicitly re-enable AI.

A failed replacement leaves the prior encrypted credential intact. Deleting a credential disables AI and cannot be undone; register a new provider credential to recover.

## Backups and cost interpretation

Database backups contain encrypted credential material. A restored credential is usable only with the matching encryption key from the deployment secret manager; neither the backup nor the key alone is sufficient. If that pairing is unavailable, delete the restored credential and register a new one.

The displayed cost is an estimate from provider-reported token counts and administrator-maintained prices. It is a guardrail, not reconciliation with the OpenAI invoice; review the provider invoice separately and update prices whenever they change.
