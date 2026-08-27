# LafLabs Admin AI Setup and Document Lifecycle Design

Date: 2026-08-27

## 1. Objective

Make the existing Agent and document administration flows understandable and reliable without expanding the public AI feature set. Administrators should be able to configure a supported OpenAI model and credential in one guided action, see the model's estimated token prices without entering them manually, understand why an archive action is blocked, and permanently delete content only after it has been archived.

This work is a focused correction to the control plane described in `2026-08-23-document-publishing-ai-design.md`. It does not add document Q&A, embeddings, a model marketplace, or automatic remote price synchronization.

## 2. Confirmed Product Decisions

- OpenAI credentials remain server-only and are entered once from the protected Agent page.
- The first-time setup combines model selection, credential verification, encryption, and persistence into one action.
- The model field is a select control backed by a small server-owned catalog of supported text models.
- Catalog prices are estimates displayed in USD per one million tokens and are not presented as invoice reconciliation.
- Less common limits and policies remain configurable under an initially collapsed advanced-settings region.
- Archiving remains the normal way to remove a published document from the public site.
- Permanent deletion is available only for archived revisions and requires typed confirmation.
- A Korean revision that is still required by English revisions cannot be deleted. A published English revision must be archived before its published Korean counterpart.
- The existing publication-feedback PR remains separate; this work is delivered as a stacked follow-up branch and PR.

## 3. Model Catalog Strategy

OpenAI's Models API exposes model identity and ownership metadata, but not token pricing. Runtime model discovery therefore cannot satisfy price autofill by itself. The application will use a versioned, server-owned catalog containing only models approved for LafLabs document-summary generation.

Each catalog record contains:

- stable model ID;
- administrator-facing label and short capability description;
- input and output price in integer micro-USD per one million tokens;
- pricing source URL;
- date on which the price was checked; and
- a recommended flag.

The initial catalog contains `gpt-5.6-luna` as the cost-sensitive default, with `gpt-5.6-terra` and `gpt-5.6-sol` as higher-capability choices. Before implementation is finalized, the values are checked against the official OpenAI model catalog. Catalog values are kept in server code so a price change is reviewed and deployed like any other cost-control change.

The admin API, not the browser, resolves model prices. A client may submit only a catalog model ID. This prevents stale or manipulated browser prices from becoming the server's cost guardrail.

If the database already contains a model that is not in the current catalog, the page shows it as a read-only legacy selection while AI is disabled. The administrator must choose a supported model and verify it before re-enabling AI. No existing credential or setting is silently deleted.

## 4. Guided Agent Setup

### 4.1 First-time registration

The first card on `/admin/agent` becomes `OpenAI setup` and contains:

1. a supported-model select with the recommended model preselected when no model is stored;
2. read-only input/output price labels and a pricing-checked date;
3. a password input for the OpenAI API key; and
4. one `Verify and save` action.

The server performs the following sequence:

1. validate the model against the server catalog;
2. perform the existing bounded inference verification against that exact model;
3. encrypt the candidate key with `AI_CREDENTIAL_ENCRYPTION_KEY`;
4. atomically persist the selected model, catalog prices, pricing timestamp, and encrypted credential;
5. disable AI if the selected model changed; and
6. return only the safe configuration DTO.

Candidate verification and encryption happen before replacing a working credential. If either fails, the prior configuration stays usable.

### 4.2 Existing credential and model changes

When a credential already exists:

- replacing the key uses the same selected model and `Verify and replace` action;
- changing the model offers `Verify and apply model`, which decrypts the stored key only on the server, tests the selected model, and then atomically updates the verified model and prices;
- the browser never receives the stored key or encrypted envelope; and
- selecting a different model does not clear visible pricing fields because the catalog immediately supplies the candidate prices.

If the administrator wants to change both model and credential, entering a new key and choosing a model handles both in the same operation.

### 4.3 Basic and advanced controls

The always-visible area contains connection status, model, catalog price, AI enablement, summary policy, monthly cost limit, and the kill switch.

An accessible native disclosure labeled `Advanced limits` contains:

- anonymous daily token limit;
- daily question limit;
- maximum output tokens;
- daily reset timezone and time; and
- AI identity-cookie retention.

Existing values and validation ranges remain unchanged. The UI continues to identify monthly spend as an estimate.

## 5. Agent API and Domain Changes

`PUT /api/admin/agent/credential` accepts a bounded body containing:

```ts
{
  apiKey?: string
  model: SupportedAgentModelId
  version: number
}
```

`apiKey` is required when no credential exists and optional when applying a model with a stored credential. The service resolves prices from the catalog and uses optimistic version matching. A concurrent settings change returns `version_conflict` without overwriting either row.

The existing settings `PATCH` endpoint remains responsible for limits, policy, budget, and enablement. Model and price changes are removed from that general settings payload so they cannot bypass verification.

Safe error codes gain actionable distinctions:

- `unsupported_model`: choose a model from the current catalog;
- `credential_required`: enter a key for first-time setup;
- `credential_invalid`: the key or selected model was rejected;
- `provider_unavailable`: verification could not currently reach OpenAI;
- `encryption_unavailable`: the deployment encryption secret is missing or invalid;
- `version_conflict`: reload the latest configuration and retry.

Provider error bodies, submitted keys, prompts, ciphertext, IVs, and authentication tags are never returned or audited.

## 6. Archive Feedback and Permanent Deletion

### 6.1 Archive feedback

Archive conflicts become typed domain errors rather than a generic `conflict` response:

- `archive_dependency` when a published English revision must be archived first;
- `revision_changed` when the requested row is no longer the current published revision; and
- `invalid_state` when the revision is not published.

The document editor maps each error to a specific message next to the workflow actions. The error region receives focus after a failed mutation so failures remain visible even on long document pages. Successful archival updates the displayed status to `Archived`, removes public cache entries, and announces completion.

### 6.2 Permanent deletion

The existing revision DELETE endpoint is extended to accept only drafts and archived revisions. Draft deletion keeps its current confirmation. Archived deletion requires a second, explicit request field:

```ts
{ permanent: true, confirmation: "<document title>" }
```

The server compares the normalized confirmation with the current revision title. The UI shows `Delete permanently` only for an archived revision and requires the administrator to type that title. Closing the confirmation cancels with no request.

Deletion rules:

- scheduled and published revisions can never be deleted directly;
- deleting the final Korean revision is blocked while any English revision remains;
- deleting the last revision removes its now-empty series in the same transaction;
- deleting one archived historical revision leaves the series and all other revisions intact;
- the deletion transaction writes `document.delete` audit metadata containing only series ID, locale, revision number, prior status, and actor; and
- deletion is irreversible and the deleted Markdown is not copied into the audit log.

After successful archived deletion, the editor retires its navigation guard and returns to `/admin/documents`. Public document cache tags are revalidated conservatively.

## 7. UI States

The Agent setup card has explicit `Not configured`, `Verified`, `Verification failed`, and `Configuration unavailable` states. Buttons show a busy label and remain disabled during mutations. The password field is cleared after every attempt and is never repopulated.

Document action errors appear inside the immutable document action area rather than only near the page heading. Archive and delete dialogs explain dependencies and irreversibility in plain language. Destructive actions use the existing square danger style without introducing a new modal library.

## 8. Testing and Verification

Implementation follows test-driven development and adds coverage for:

- catalog model validation and server-side price resolution;
- first-time atomic model/credential registration;
- stored-key model changes and candidate-key replacement;
- rollback behavior on provider, encryption, and optimistic-concurrency failures;
- absence of secret/envelope fields in every API response and audit record;
- legacy unknown-model display and forced migration to a supported model;
- archive dependency and stale-revision messages in the editor;
- archived-only typed permanent deletion;
- Korean/English deletion invariants and last-series cleanup;
- focus and status announcements for failed and successful actions; and
- all existing document, Agent, authorization, and public-content behavior.

Final verification runs type checking, linting, the full unit suite, and the Next.js production build. Tests mock provider verification; no real OpenAI key is needed or accepted through the development environment.

## 9. Rollout and Operations

No schema migration is expected. The model catalog is an application release artifact, and existing nullable pricing columns continue to store the selected catalog snapshot for deterministic cost estimation.

The deployment still requires a valid 32-byte base64 `AI_CREDENTIAL_ENCRYPTION_KEY`. The administrator registers a newly issued OpenAI project key only through the corrected Agent page after deployment. Any key previously pasted into chat or another plaintext channel must be revoked and is not used by this implementation.

This branch is based on `codex/document-publish-fix`. Its pull request initially targets that branch so PR #7 remains independently reviewable. After PR #7 merges, the follow-up PR can be retargeted to `main` without combining unrelated history.
