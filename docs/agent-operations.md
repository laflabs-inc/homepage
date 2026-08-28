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
