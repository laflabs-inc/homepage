# Agent Setup Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the order-dependent free-text Agent registration flow with one verified model-and-credential setup backed by server-owned prices and a compact advanced-settings UI.

**Architecture:** A small server-only model catalog is the source of truth for supported model IDs and estimated prices. The credential mutation verifies either a submitted key or the stored encrypted key against the selected model, then one repository transaction updates the model-price snapshot and credential verification state with optimistic concurrency. General settings no longer accept model or price changes.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript 5.9, Zod 4, Drizzle SQL, Vercel AI SDK 6, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-27-admin-ai-document-lifecycle-design.md`

## Global Constraints

- Never expose, log, or audit an API key, ciphertext, IV, authentication tag, prompt, or provider response body.
- Use `gpt-5.6-luna` as the default supported model.
- Resolve model prices on the server; do not accept price values from the credential request.
- Preserve a working credential and settings when verification, encryption, or optimistic concurrency fails.
- Permit stored-key model verification only when the credential generation read before the provider call is still current at commit time.
- Keep AI disabled after a model change until the administrator explicitly enables it.
- Keep existing limit ranges and estimated-cost wording.
- Do not require a real OpenAI key in tests.

---

## File Structure

- `lib/agent/model-catalog.ts` — supported model metadata, price snapshots, and lookup helpers.
- `lib/agent/types.ts` — setup inputs, catalog DTOs, and atomic repository result types.
- `lib/agent/validation.ts` — separate runtime-settings and credential-setup schemas.
- `lib/agent/service.ts` — candidate/stored key selection, verification, encryption, and safe errors.
- `lib/agent/store.ts` — atomic settings/credential setup SQL.
- `app/api/admin/agent/route.ts` — limit/policy updates only.
- `app/api/admin/agent/credential/route.ts` — model-and-credential setup boundary.
- `components/admin/agent-settings.tsx` — guided setup and advanced disclosure.
- `app/admin/admin.module.css` — compact setup/catalog styles.
- `tests/agent/model-catalog.test.ts` — exact catalog and lookup contract.
- `tests/agent/validation.test.ts` — payload boundary tests.
- `tests/agent/service.test.ts` — setup ordering, rollback, and concurrency tests.
- `tests/agent/service.test.ts` — service behavior and atomic-store SQL result mapping.
- `tests/agent/admin-api.test.ts` — protected request/response contract.
- `tests/components/agent-settings.test.tsx` — administrator interaction flow.
- `docs/agent-operations.md` — corrected bootstrap steps and pricing maintenance.

---

### Task 1: Add the supported model catalog and request schemas

**Files:**
- Create: `lib/agent/model-catalog.ts`
- Modify: `lib/agent/types.ts`
- Modify: `lib/agent/validation.ts`
- Create: `tests/agent/model-catalog.test.ts`
- Modify: `tests/agent/validation.test.ts`

**Interfaces:**
- Produces: `SupportedAgentModelId`, `AgentModelCatalogItem`, `agentModelCatalog`, `defaultAgentModelId`, `getAgentModel(modelId)`, `agentCredentialSetupSchema`, and `agentRuntimeSettingsUpdateSchema`.
- Consumes: the existing integer micro-USD price representation and current settings validation limits.

- [ ] **Step 1: Write failing catalog tests**

```ts
expect(defaultAgentModelId).toBe("gpt-5.6-luna")
expect(getAgentModel("gpt-5.6-luna")).toMatchObject({
  inputPriceMicrousdPerMillion: 200_000,
  outputPriceMicrousdPerMillion: 1_200_000,
  recommended: true,
})
expect(getAgentModel("not-supported")).toBeNull()
expect(agentModelCatalog.every(({ pricingSource }) => pricingSource.startsWith("https://developers.openai.com/"))).toBe(true)
```

- [ ] **Step 2: Run the catalog test and verify RED**

Run: `npm run test:unit -- tests/agent/model-catalog.test.ts`

Expected: FAIL because `lib/agent/model-catalog.ts` does not exist.

- [ ] **Step 3: Implement the immutable catalog**

```ts
export const agentModelCatalog = [
  { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", inputPriceMicrousdPerMillion: 200_000, outputPriceMicrousdPerMillion: 1_200_000, pricingCheckedAt: "2026-08-27T00:00:00.000Z", pricingSource: "https://developers.openai.com/api/docs/models", recommended: true },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", inputPriceMicrousdPerMillion: 2_000_000, outputPriceMicrousdPerMillion: 12_000_000, pricingCheckedAt: "2026-08-27T00:00:00.000Z", pricingSource: "https://developers.openai.com/api/docs/models", recommended: false },
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", inputPriceMicrousdPerMillion: 4_000_000, outputPriceMicrousdPerMillion: 20_000_000, pricingCheckedAt: "2026-08-27T00:00:00.000Z", pricingSource: "https://developers.openai.com/api/docs/models", recommended: false },
] as const satisfies readonly AgentModelCatalogItem[]
```

Freeze the exported array in development and return `null` from `getAgentModel` for every non-exact ID.

- [ ] **Step 4: Write failing schema tests**

```ts
expect(agentCredentialSetupSchema.parse({ apiKey: "sk-project", model: "gpt-5.6-luna", version: 3 })).toEqual({
  apiKey: "sk-project", model: "gpt-5.6-luna", version: 3,
})
expect(agentCredentialSetupSchema.safeParse({ model: "custom-model", version: 3 }).success).toBe(false)
expect(agentRuntimeSettingsUpdateSchema.safeParse({ ...runtimeSettings, model: "gpt-5.6-luna" }).success).toBe(false)
```

- [ ] **Step 5: Implement schemas and types**

Define `SupportedAgentModelId` from the catalog tuple, `AgentCredentialSetupInput` as `{ apiKey?: string; model: SupportedAgentModelId; version: number }`, and `AgentRuntimeSettingsUpdate` as the existing mutable limits/policies plus `enabled` and `version`, excluding `model`, both prices, and `pricingCheckedAt`. Use `z.enum(["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol"])`, the existing printable key rule, `.strict()`, and a positive integer version.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm run test:unit -- tests/agent/model-catalog.test.ts tests/agent/validation.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the catalog boundary**

```bash
git add lib/agent/model-catalog.ts lib/agent/types.ts lib/agent/validation.ts tests/agent/model-catalog.test.ts tests/agent/validation.test.ts
git commit -m "feat: add supported AI model catalog"
```

---

### Task 2: Implement atomic verified setup in the service and store

**Files:**
- Modify: `lib/agent/types.ts`
- Modify: `lib/agent/service.ts`
- Modify: `lib/agent/store.ts`
- Modify: `tests/agent/service.test.ts`

**Interfaces:**
- Consumes: `getAgentModel`, `AgentCredentialSetupInput`, `decryptCredential`, `encryptCredential`, `CredentialVerifier`.
- Produces: `AgentRepository.applyVerifiedSetup(input, actor)`, `agentService.configureCredential(input, actor)`, and safe errors `unsupported_model`, `credential_required`, `version_conflict`.

- [ ] **Step 1: Write failing service tests for first-time and stored-key setup**

```ts
await agent.configureCredential({ apiKey: "sk-candidate", model: "gpt-5.6-luna", version: 3 }, actor)
expect(verify).toHaveBeenCalledWith("sk-candidate", "gpt-5.6-luna")
expect(repository.settings).toMatchObject({
  model: "gpt-5.6-luna",
  inputPriceMicrousdPerMillion: 200_000,
  outputPriceMicrousdPerMillion: 1_200_000,
})

await agent.configureCredential({ model: "gpt-5.6-terra", version: repository.settings.version }, actor)
expect(verify).toHaveBeenLastCalledWith("sk-candidate", "gpt-5.6-terra")
expect(repository.credential).toMatchObject({ verifiedModel: "gpt-5.6-terra" })
```

Also assert missing first key returns `credential_required`, unknown model returns `unsupported_model`, failed verification preserves prior state, model change disables AI, and a changed credential generation returns `version_conflict`.

- [ ] **Step 2: Run service tests and verify RED**

Run: `npm run test:unit -- tests/agent/service.test.ts`

Expected: FAIL because `configureCredential` and `applyVerifiedSetup` do not exist.

- [ ] **Step 3: Add setup mutation types**

```ts
export type VerifiedAgentSetup = {
  version: number
  model: SupportedAgentModelId
  inputPriceMicrousdPerMillion: number
  outputPriceMicrousdPerMillion: number
  pricingCheckedAt: Date
  credential: CredentialReplacement
  expectedCredential: CredentialTestGeneration | null
  replacingKey: boolean
}

export type VerifiedAgentSetupResult =
  | { status: "updated"; settings: AgentSettings; credential: StoredCredential }
  | { status: "version_conflict" }
```

- [ ] **Step 4: Implement `configureCredential` minimally**

Read settings and credential together. Validate the catalog ID. Use the submitted key when present; otherwise decrypt the stored credential or throw `credential_required`. Verify the exact model, encrypt only a submitted key, build a `CredentialReplacement`, and call `applyVerifiedSetup`. Map stale settings or credential identity to `version_conflict`. Return `configuration(result.settings, result.credential)` and never return the key.

- [ ] **Step 5: Write failing store mapping tests**

Mock SQL rows for `updateStatus: "updated"` and `updateStatus: "version_conflict"`. Assert updated rows map both settings and credential, model prices are present in the generated query parameters, and audit metadata parameters contain no secret/envelope values.

- [ ] **Step 6: Implement one SQL setup transaction**

Lock singleton settings and the OpenAI credential. Require the submitted settings version and expected credential fingerprint/generation to match. Upsert the verified credential, update model and catalog prices, set `pricing_checked_at` to the catalog timestamp, disable only when the model changed, increment settings version, and append one safe audit event. Preserve credential `created_by`/`created_at` when `replacingKey` is false.

- [ ] **Step 7: Keep runtime settings model-safe**

Change service `updateSettings` to accept `AgentRuntimeSettingsUpdate`, read current settings, and compose the internal repository `AgentSettingsUpdate` with the current model and price snapshot. This keeps the existing store validation while preventing the general API from changing verified model fields.

- [ ] **Step 8: Run Agent domain tests and verify GREEN**

Run: `npm run test:unit -- tests/agent`

Expected: PASS with no serialized key or credential-envelope fields.

- [ ] **Step 9: Commit the atomic setup layer**

```bash
git add lib/agent tests/agent
git commit -m "fix: make AI setup atomic"
```

---

### Task 3: Update the protected APIs

**Files:**
- Modify: `app/api/admin/agent/route.ts`
- Modify: `app/api/admin/agent/credential/route.ts`
- Modify: `tests/agent/admin-api.test.ts`

**Interfaces:**
- Consumes: `agentCredentialSetupSchema`, `agentRuntimeSettingsUpdateSchema`, `agentService.configureCredential`.
- Produces: `PUT /api/admin/agent/credential` with `{ apiKey?, model, version }` and a model-safe `PATCH /api/admin/agent`.

- [ ] **Step 1: Write failing API tests**

```ts
const response = await handlePutCredential(jsonRequest("/api/admin/agent/credential", "PUT", {
  apiKey: "sk-project", model: "gpt-5.6-luna", version: 3,
}), deps)
expect(deps.service.configureCredential).toHaveBeenCalledWith({
  apiKey: "sk-project", model: "gpt-5.6-luna", version: 3,
}, actor)
```

Assert unsupported IDs return 422 without service invocation, stored-key model application accepts omitted `apiKey`, settings PATCH rejects `model` and price keys, and response scans contain no secret fields.

- [ ] **Step 2: Run the API tests and verify RED**

Run: `npm run test:unit -- tests/agent/admin-api.test.ts`

Expected: FAIL on the new request contract.

- [ ] **Step 3: Implement the API contract**

Parse strict schemas after bounded JSON and authorization. Call `configureCredential`. Extend safe error/status mapping: `unsupported_model` and `credential_required` use 422/409 respectively, provider failures use 502, encryption failures use 503, and optimistic conflict uses 409. Continue returning `Cache-Control: no-store`.

- [ ] **Step 4: Run API and security-boundary tests**

Run: `npm run test:unit -- tests/agent/admin-api.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the API update**

```bash
git add app/api/admin/agent tests/agent/admin-api.test.ts
git commit -m "fix: guide AI credential registration"
```

---

### Task 4: Rework the Agent admin page

**Files:**
- Modify: `components/admin/agent-settings.tsx`
- Modify: `app/admin/admin.module.css`
- Modify: `tests/components/agent-settings.test.tsx`

**Interfaces:**
- Consumes: the safe `AgentConfiguration`, exported catalog display metadata, and updated APIs.
- Produces: a single `OpenAI setup` flow plus a native `details` advanced-settings disclosure.

- [ ] **Step 1: Write failing page tests**

Assert a fresh configuration preselects `GPT-5.6 Luna`, displays `$0.20 input / $1.20 output`, submits model/key/version in one request, applies a changed model with an omitted key when a credential exists, renders a legacy unknown model warning, clears the password field after failure, maps each safe error, and keeps advanced inputs hidden inside a labeled disclosure until opened.

- [ ] **Step 2: Run component tests and verify RED**

Run: `npm run test:unit -- tests/components/agent-settings.test.tsx`

Expected: FAIL because the page still renders connection and free-text pricing as separate sections.

- [ ] **Step 3: Implement the guided setup component**

Use a controlled model select and an uncontrolled password input. Derive selected catalog metadata locally for immediate display, but submit only `{ apiKey?, model, version }`. Label actions `Verify and save`, `Verify and replace`, or `Verify and apply model` from credential/key/model state. Preserve Test/Delete credential and the kill switch.

- [ ] **Step 4: Move optional controls into `details`**

Keep summary policy, monthly limit, enablement, and Save visible. Move daily limits, reset controls, and cookie retention into `<details><summary>Advanced limits</summary>…</details>`. Remove editable price and free-text model inputs. Add compact square catalog-price/status styles using existing tokens.

- [ ] **Step 5: Run component and accessibility tests**

Run: `npm run test:unit -- tests/components/agent-settings.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the Agent experience**

```bash
git add components/admin/agent-settings.tsx app/admin/admin.module.css tests/components/agent-settings.test.tsx
git commit -m "feat: simplify the Agent control plane"
```

---

### Task 5: Update operations guidance and verify the subsystem

**Files:**
- Modify: `docs/agent-operations.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: final setup UI and model catalog behavior.
- Produces: accurate deployment and rotation instructions with no committed secrets.

- [ ] **Step 1: Update the runbook**

Document the single guided setup, server-owned price source, catalog update process, legacy-model migration, encryption-key prerequisite, rotation behavior, kill switch, and the rule that exposed keys must be revoked rather than reused.

- [ ] **Step 2: Scan documentation for secret-shaped examples**

Run: `rg -n "sk-(proj-)?[A-Za-z0-9_-]{20,}|OPENAI_API_KEY=" README.md docs .env.example`

Expected: no real or realistic API-key value is committed.

- [ ] **Step 3: Run subsystem verification**

Run: `npm run typecheck && npm run lint && npm run test:unit -- tests/agent tests/components/agent-settings.test.tsx`

Expected: every command exits 0.

- [ ] **Step 4: Commit documentation**

```bash
git add docs/agent-operations.md README.md
git commit -m "docs: explain guided AI setup"
```
