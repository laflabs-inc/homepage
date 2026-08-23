# LafLabs AI Agent Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the protected Agent page, configurable AI operating limits, encrypted OpenAI credential registration, connection testing, and a server-only provider boundary.

**Architecture:** Store non-secret Agent settings in a singleton Neon row and store the OpenAI key only as AES-256-GCM ciphertext in a separate credential row. A server-only service validates settings and credentials, constructs an OpenAI provider only at request time, exposes safe DTOs to administrators, and writes non-sensitive audit records for every change.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript 5.9, Neon PostgreSQL, Drizzle ORM/Kit, Auth.js, Zod 4, Node.js crypto, Vercel AI SDK 6, `@ai-sdk/openai`, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-23-document-publishing-ai-design.md`

## Global Constraints

- Keep AI disabled until a credential, model, input/output prices, and a successful connection test exist.
- Accept an OpenAI key only at the credential mutation boundary and never return it or its ciphertext.
- Encrypt every stored key with AES-256-GCM and a new 96-bit IV.
- Keep `AI_CREDENTIAL_ENCRYPTION_KEY` only in the deployment environment.
- Do not silently reuse `AUTH_SECRET`, analytics secrets, or OpenAI keys as encryption keys.
- Preserve the previous credential when candidate validation or encryption fails.
- Treat displayed monthly cost as an estimate based on admin-maintained prices.
- Require same-origin and current GitHub organization membership for every mutation.
- Keep public routes and the existing analytics dashboard usable when Agent configuration is absent.

---

## File Structure

- `lib/db/schema.ts`, `drizzle/0004_agent_control_plane.sql` — settings and encrypted credential storage.
- `lib/env.ts`, `.env.example` — lazy AI security environment parsing.
- `lib/agent/types.ts` — settings, safe credential status, and provider interfaces.
- `lib/agent/validation.ts` — settings and credential request schemas.
- `lib/agent/crypto.ts` — authenticated encryption and fingerprinting.
- `lib/agent/store.ts` — singleton settings/credential repository.
- `lib/agent/provider.ts` — dynamic OpenAI provider and minimal verifier.
- `lib/agent/service.ts` — update, enable, register, replace, test, delete, and safe DTO use cases.
- `app/api/admin/agent/**` — protected Agent and credential APIs.
- `components/admin/agent-settings.tsx` — settings and credential UI.
- `app/admin/(protected)/agent/page.tsx` — dynamic protected Agent page.
- `docs/agent-operations.md` — bootstrap, rotation, recovery, and cost-setting runbook.

---

### Task 1: Add Agent settings and credential schema

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `tests/agent/schema.test.ts`
- Create: `drizzle/0004_agent_control_plane.sql`
- Modify: `drizzle/meta/_journal.json`
- Create: `drizzle/meta/0004_snapshot.json`

**Interfaces:**
- Produces: `summaryPolicyEnum`, `agentSettings`, and `aiProviderCredentials`.
- Consumed by: Tasks 3 and 4 and the Document AI plan.

- [ ] **Step 1: Write the failing schema contract test**

```ts
it("stores configurable limits separately from provider ciphertext", () => {
  expect(getTableConfig(agentSettings).columns.map((c) => c.name)).toEqual([
    "id", "enabled", "model", "daily_token_limit", "daily_question_limit",
    "max_output_tokens", "monthly_cost_limit_microusd",
    "input_price_microusd_per_million", "output_price_microusd_per_million",
    "pricing_checked_at", "reset_timezone", "daily_reset_minute", "cookie_retention_days",
    "summary_policy", "version", "updated_by", "created_at", "updated_at",
  ])
  expect(getTableConfig(aiProviderCredentials).columns.map((c) => c.name)).toEqual([
    "provider", "ciphertext", "iv", "auth_tag", "fingerprint",
    "verified_model", "verification_status", "verified_at", "created_by",
    "created_at", "updated_at",
  ])
})
```

- [ ] **Step 2: Run the schema test and verify RED**

Run: `npm run test:unit -- tests/agent/schema.test.ts`

Expected: FAIL because the Agent tables do not exist.

- [ ] **Step 3: Implement the singleton schema with safe defaults**

Use `id = "default"`, `enabled = false`, daily tokens `20000`, questions `10`, output tokens `600`, monthly limit `50000000` micro-USD, timezone `Asia/Seoul`, daily reset minute `0`, cookie retention `180`, summary policy `review`, and version `1`. Model and both price fields start null. Use `provider = "openai"` as the credential primary key.

- [ ] **Step 4: Generate and inspect the migration**

Run: `npm run db:generate`

Expected: migration adds only Agent tables/enum/indexes and inserts the singleton settings row idempotently.

- [ ] **Step 5: Run schema and full unit tests**

Run: `npm run test:unit -- tests/agent/schema.test.ts && npm run test:unit`

Expected: PASS.

- [ ] **Step 6: Commit the Agent schema**

```bash
git add lib/db/schema.ts drizzle tests/agent/schema.test.ts
git commit -m "feat: add AI agent settings schema"
```

---

### Task 2: Add AI security environment and authenticated encryption

**Files:**
- Modify: `lib/env.ts`
- Modify: `.env.example`
- Create: `lib/agent/crypto.ts`
- Create: `tests/agent/crypto.test.ts`
- Create: `tests/agent/env.test.ts`

**Interfaces:**
- Produces: `getAiSecurityEnv(): { AI_CREDENTIAL_ENCRYPTION_KEY: string; AI_COOKIE_SECRET: string }`, `encryptCredential(plaintext, key)`, `decryptCredential(envelope, key)`, and `credentialFingerprint(plaintext)`.
- Consumed by: credential service and later AI identity service.

- [ ] **Step 1: Write failing environment and crypto tests**

Use fixed 32-byte test keys and assert:

```ts
expect(decryptCredential(encryptCredential("sk-test-value", key), key)).toBe("sk-test-value")
expect(encryptCredential("same", key).iv).not.toBe(encryptCredential("same", key).iv)
expect(() => decryptCredential(envelope, wrongKey)).toThrowError(/decrypt/i)
expect(credentialFingerprint("sk-one")).toMatch(/^[a-f0-9]{12}$/)
```

Also assert invalid base64, decoded keys other than 32 bytes, short cookie secrets, and equal encryption/cookie secrets are rejected without including their values in errors.

- [ ] **Step 2: Run security tests and verify RED**

Run: `npm run test:unit -- tests/agent/crypto.test.ts tests/agent/env.test.ts`

Expected: FAIL because the AI environment and crypto helpers do not exist.

- [ ] **Step 3: Implement lazy environment parsing and AES-256-GCM**

Decode the base64 encryption key into exactly 32 bytes. Generate a 12-byte IV with `randomBytes`, use a 16-byte GCM tag, and encode envelope parts as base64. Normalize every decrypt failure to `CredentialDecryptionError` without exposing crypto details. Fingerprint with SHA-256 and return the first 12 hexadecimal characters.

- [ ] **Step 4: Run security tests and verify GREEN**

Run: `npm run test:unit -- tests/agent/crypto.test.ts tests/agent/env.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the secret boundary**

```bash
git add lib/env.ts .env.example lib/agent/crypto.ts tests/agent
git commit -m "feat: encrypt AI provider credentials"
```

---

### Task 3: Implement Agent validation, provider, repository, and service

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lib/agent/types.ts`
- Create: `lib/agent/validation.ts`
- Create: `lib/agent/provider.ts`
- Create: `lib/agent/store.ts`
- Create: `lib/agent/service.ts`
- Create: `tests/agent/validation.test.ts`
- Create: `tests/agent/provider.test.ts`
- Create: `tests/agent/service.test.ts`

**Interfaces:**
- Produces: `AgentSettingsDto`, `CredentialStatusDto`, `AgentConfiguration`, `CredentialVerifier`, `TextModelFactory`, `agentStore`, and `agentService`.
- Consumed by: Task 4 and the Document AI plan.

- [ ] **Step 1: Install and inspect the current OpenAI provider SDK**

Run: `npm install ai @ai-sdk/openai && rg -n "createOpenAI|generateText|maxOutputTokens" node_modules/@ai-sdk/openai node_modules/ai/docs node_modules/ai/src | head -80`

Expected: installed AI SDK documentation/source confirms the exact current provider construction and generation option names before production code is written.

- [ ] **Step 2: Write failing settings validation tests**

Test exact lower/upper boundaries from the spec, IANA timezone validation with `Intl.DateTimeFormat`, daily reset minutes `0` through `1439`, decimal USD-per-million parsing into integer micro-USD, optimistic `version`, and enablement rejection when model/prices/verified credential are absent.

- [ ] **Step 3: Run validation tests and verify RED**

Run: `npm run test:unit -- tests/agent/validation.test.ts`

Expected: FAIL because Agent schemas do not exist.

- [ ] **Step 4: Implement Agent types and validation**

Expose only safe DTO fields. Use these service errors: `invalid_settings`, `version_conflict`, `credential_unavailable`, `credential_invalid`, `model_unverified`, `encryption_unavailable`, and `provider_unavailable`.

- [ ] **Step 5: Run validation tests and verify GREEN**

Run: `npm run test:unit -- tests/agent/validation.test.ts`

Expected: PASS.

- [ ] **Step 6: Write failing provider and service tests**

Use injected verifier/factory functions. Prove that:

- candidate verification occurs before store replacement;
- failed candidate verification leaves the prior encrypted row untouched;
- successful replacement stores only ciphertext/envelope/fingerprint metadata;
- returned DTOs contain no `apiKey`, `ciphertext`, `iv`, or `authTag` keys;
- enabling rejects an unverified credential or mismatched verified model;
- model change automatically disables AI until retested;
- delete disables AI before removing the credential; and
- audit metadata contains only provider, fingerprint, model, result, and changed setting names.

- [ ] **Step 7: Run provider/service tests and verify RED**

Run: `npm run test:unit -- tests/agent/provider.test.ts tests/agent/service.test.ts`

Expected: FAIL because provider and service modules do not exist.

- [ ] **Step 8: Implement the dynamic OpenAI provider and service**

Construct the provider only inside server-only functions:

```ts
const openai = createOpenAI({ apiKey })
return openai(modelId)
```

The verifier performs one minimal deterministic text request with at most four output tokens and a five-second abort signal. Do not call the Models API or trust a model name without an inference test. Map all provider errors to safe status codes and retain redacted diagnostic details only in server logs.

Use optimistic version matching for settings updates. Encrypt validated candidate keys before the database replacement transaction. Decrypt only long enough to build the provider for one operation.

- [ ] **Step 9: Run all Agent domain tests**

Run: `npm run test:unit -- tests/agent`

Expected: PASS and no test snapshot contains key material.

- [ ] **Step 10: Commit the Agent service layer**

```bash
git add package.json package-lock.json lib/agent tests/agent
git commit -m "feat: add configurable OpenAI agent service"
```

---

### Task 4: Add protected Agent APIs and admin page

**Files:**
- Create: `app/api/admin/agent/route.ts`
- Create: `app/api/admin/agent/credential/route.ts`
- Create: `app/api/admin/agent/credential/test/route.ts`
- Create: `tests/agent/admin-api.test.ts`
- Create: `components/admin/agent-settings.tsx`
- Create: `app/admin/(protected)/agent/page.tsx`
- Modify: `components/admin/admin-nav.tsx`
- Modify: `app/admin/admin.module.css`
- Create: `tests/components/agent-settings.test.tsx`
- Create: `docs/agent-operations.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: `authorizeAdminApi`, `isSameOriginRequest`, `readBoundedJson`, and `agentService`.
- Produces: safe Agent settings UI and credential lifecycle APIs used by administrators.

- [ ] **Step 1: Write failing Agent API boundary tests**

Test GET safe DTO, PATCH settings with version, PUT candidate credential, DELETE credential, POST test, 401/403, cross-origin rejection, 16 KiB body cap, invalid key shape, safe provider failure, and response-key scans proving no secret/envelope properties are serialized.

- [ ] **Step 2: Run Agent API tests and verify RED**

Run: `npm run test:unit -- tests/agent/admin-api.test.ts`

Expected: FAIL because Agent routes do not exist.

- [ ] **Step 3: Implement protected Agent Route Handlers**

Keep exported injected `handle*` functions for tests. Set `Cache-Control: no-store` on every response. Accept the key only in `PUT /credential`; never include the submitted body in an error or log. Map version conflicts to 409, invalid settings to 422, provider failures to 502, and missing encryption configuration to 503.

- [ ] **Step 4: Run Agent API tests and verify GREEN**

Run: `npm run test:unit -- tests/agent/admin-api.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing Agent page interaction tests**

Assert the initial disabled state, every configured field, pricing timestamp, USD formatting, model-change warning, masked credential status, one-time password input clearing after submit, Test/Replace/Delete actions, optimistic conflict refresh, kill switch, and accessible error/success announcements.

- [ ] **Step 6: Run Agent page tests and verify RED**

Run: `npm run test:unit -- tests/components/agent-settings.test.tsx`

Expected: FAIL because the page component does not exist.

- [ ] **Step 7: Implement the Agent page in the existing admin visual system**

Use a Server Component for initial safe settings and a Client Component for forms. Group controls into `Connection`, `Model & pricing`, `Visitor limits`, `Budget`, `Cookie`, and `Summary` square sections. Require explicit confirmation before deleting a credential or enabling AI. Never set a password input value from server data.

- [ ] **Step 8: Write the operations runbook**

Document generation/rotation of the two deployment secrets, first credential registration, model/pricing verification, kill-switch recovery, inability to recover a plaintext key, database backup implications, and the distinction between estimated cost and the OpenAI invoice. Do not include actual secret values or example key strings in committed files.

- [ ] **Step 9: Run control-plane verification**

Run: `npm run typecheck && npm run lint && npm run test:unit -- tests/agent tests/components/agent-settings.test.tsx && npm run build`

Expected: all commands exit 0 and `/admin/agent` appears in the route output.

- [ ] **Step 10: Commit the Agent control plane**

```bash
git add app/api/admin/agent app/admin components/admin lib/agent docs/agent-operations.md README.md tests package.json package-lock.json
git commit -m "feat: add AI agent control plane"
```
