# LafLabs Document AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add essential-cookie-backed anonymous AI identity, configurable token/request/cost guards, AI-assisted summaries, and source-cited per-document questions without retaining prompt or answer text.

**Architecture:** Create an AI identity distinct from analytics identity, reserve bounded usage in Neon before provider calls, and reconcile provider-reported tokens afterward. Select relevant headings locally from the currently published Markdown, stream answer deltas through an NDJSON Route Handler, and keep summary/Q&A orchestration behind injected provider interfaces so tests never require a live OpenAI key.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript 5.9, Neon PostgreSQL, Drizzle ORM/Kit, Zod 4, Vercel AI SDK 6, `@ai-sdk/openai`, Node.js crypto, Vitest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-23-document-publishing-ai-design.md`

## Global Constraints

- Require a current essential consent choice before any public AI request.
- Keep `laf_ai_identity` independent from the analytics-only `laf_visitor` cookie.
- Do not store raw questions, generated answers, selected passage text, source IPs, or browser fingerprints.
- Send only the current published revision and the best three to five bounded sections to OpenAI.
- Use provider-reported input/output/total tokens for final accounting.
- Apply the configured daily token limit, daily question limit, maximum output tokens, monthly estimated-cost guard, timezone, and cookie retention.
- Count admin summary generation against the monthly global budget but not anonymous visitor quota.
- Never let OpenAI failure block document reading or the homepage.
- Do not enable global cross-document search or embeddings in this release.
- Keep site analytics disabled unless the separate analytics choice is active.

---

## File Structure

### Usage and identity

- `lib/db/schema.ts`, `drizzle/0005_document_ai_usage.sql` — daily/monthly usage and short-lived reservation tables.
- `lib/ai/identity.ts` — signed AI cookie, HMAC identifier, and rotation-safe parsing.
- `lib/ai/buckets.ts` — daily/monthly IANA-timezone bucket calculation.
- `lib/ai/cost.ts` — integer micro-USD estimates.
- `lib/ai/quota.ts` — reservation and reconciliation use cases.
- `lib/ai/store.ts` — atomic Neon usage repository.

### Document intelligence

- `lib/ai/sections.ts` — Markdown section splitting and Korean/English lexical ranking.
- `lib/ai/prompts.ts` — strict summary and document-answer instructions.
- `lib/ai/provider.ts` — streaming/non-streaming provider adapter using Agent configuration.
- `lib/ai/summary.ts` — summary policy integration.
- `lib/ai/answer.ts` — published-document Q&A orchestration.

### HTTP and UI

- `app/api/admin/documents/[revisionId]/summary/route.ts` — admin summary generation.
- `app/api/ai/quota/route.ts` — safe initial remaining-limit status.
- `app/api/ai/documents/[revisionId]/ask/route.ts` — consent/quota-gated NDJSON stream.
- `components/content/document-assistant.tsx` — desktop rail/mobile sheet UI.
- `components/content/document-assistant.module.css` — square assistant styling.
- `components/analytics/consent-provider.tsx`, `components/analytics/consent-panel.tsx` — policy v2 and essential AI disclosure.
- `app/api/cron/ai-retention/route.ts` — expired reservation and usage cleanup.
- `docs/ai-operations.md` — limits, failures, privacy, and budget runbook.

---

### Task 1: Add AI usage and reservation schema

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `tests/ai/schema.test.ts`
- Create: `drizzle/0005_document_ai_usage.sql`
- Modify: `drizzle/meta/_journal.json`
- Create: `drizzle/meta/0005_snapshot.json`

**Interfaces:**
- Produces: `aiUsageDaily`, `aiUsageMonthly`, and `aiUsageReservations`.
- Consumed by: Task 3.

- [ ] **Step 1: Write the failing AI schema contract test**

```ts
it("stores quota aggregates without prompt or answer columns", () => {
  expect(getTableConfig(aiUsageDaily).columns.map((c) => c.name)).toEqual([
    "visitor_hash", "date_bucket", "question_count", "input_tokens",
    "output_tokens", "total_tokens", "updated_at",
  ])
  expect(getTableConfig(aiUsageMonthly).columns.map((c) => c.name)).toEqual([
    "month_bucket", "question_count", "summary_count", "input_tokens",
    "output_tokens", "total_tokens", "estimated_cost_microusd", "updated_at",
  ])
  expect(getTableConfig(aiUsageReservations).columns.map((c) => c.name)).toEqual([
    "id", "visitor_hash", "date_bucket", "month_bucket", "kind",
    "reserved_tokens", "reserved_cost_microusd", "expires_at", "created_at",
  ])
})
```

Assert no column name contains `prompt`, `question`, `answer`, `content`, `ip`, or `visitor_id`.

- [ ] **Step 2: Run the schema test and verify RED**

Run: `npm run test:unit -- tests/ai/schema.test.ts`

Expected: FAIL because the usage tables do not exist.

- [ ] **Step 3: Implement tables, composite keys, and retention indexes**

Use `(visitor_hash, date_bucket)` as the daily primary key, `month_bucket` as the monthly primary key, UUID reservation IDs, an enum `question|summary`, and indexes on daily bucket and reservation expiry. Token and micro-USD counts use non-negative bigint number mode; request counts use integer.

- [ ] **Step 4: Generate and inspect the migration**

Run: `npm run db:generate`

Expected: one forward-only migration that preserves every document, Agent, and analytics table.

- [ ] **Step 5: Run schema and full unit tests**

Run: `npm run test:unit -- tests/ai/schema.test.ts && npm run test:unit`

Expected: PASS.

- [ ] **Step 6: Commit the usage schema**

```bash
git add lib/db/schema.ts drizzle tests/ai/schema.test.ts
git commit -m "feat: add bounded AI usage schema"
```

---

### Task 2: Update consent policy and add independent AI identity

**Files:**
- Modify: `lib/analytics/consent.ts`
- Modify: `components/analytics/consent-panel.tsx`
- Modify: `components/analytics/consent-provider.tsx`
- Modify: `app/layout.tsx`
- Create: `lib/ai/identity.ts`
- Create: `tests/ai/identity.test.ts`
- Modify: `tests/analytics/consent.test.ts`
- Modify: `tests/analytics/consent-route.test.ts`
- Modify: `tests/components/consent-panel.test.tsx`
- Modify: `tests/components/root-layout.test.tsx`

**Interfaces:**
- Produces: `AI_IDENTITY_COOKIE`, `createAiIdentityToken`, `matchAiIdentityToken`, `hashAiIdentity`, and consent context `requestConsent()`.
- Consumed by: Task 5.

- [ ] **Step 1: Write failing identity and policy-v2 tests**

Assert signed-token success, tamper rejection, HMAC hashing, no compatibility with analytics tokens, current policy value `2`, and stale policy `1` resolving to unknown. Assert the panel explains that an explicit AI question sends the question and selected public passages to OpenAI while analytics remains a separate choice.

- [ ] **Step 2: Write failing layout/provider analytics-gating tests**

Mock `@vercel/analytics/next` and `@vercel/speed-insights/next`. Assert neither mounts for unknown/essential/DNT states, both mount only for analytics state, and switching from essential to analytics mounts them without a full reload.

- [ ] **Step 3: Run consent and identity tests and verify RED**

Run: `npm run test:unit -- tests/ai/identity.test.ts tests/analytics/consent.test.ts tests/analytics/consent-route.test.ts tests/components/consent-panel.test.tsx tests/components/root-layout.test.tsx`

Expected: FAIL because policy v2, AI identity, consent reopening, and insight gating do not exist.

- [ ] **Step 4: Implement AI identity with the dedicated cookie secret**

Follow the existing signed analytics-token structure but use a distinct version prefix, purpose string, cookie name, and secret. Cookie options receive the admin-configured retention days and always use HttpOnly, SameSite=Lax, Path=/, and production Secure.

- [ ] **Step 5: Bump the policy, update copy, and gate Vercel integrations**

Move `<Analytics />` and `<SpeedInsights />` inside the consent provider so they render only for active analytics consent and no DNT. Add `requestConsent()` that reopens the panel and returns a promise resolved after a choice, allowing the assistant to continue after the user selects essential or analytics. Do not create an AI cookie merely from viewing or accepting the panel.

- [ ] **Step 6: Run consent and identity tests and verify GREEN**

Run: `npm run test:unit -- tests/ai/identity.test.ts tests/analytics tests/components/consent-panel.test.tsx tests/components/root-layout.test.tsx`

Expected: PASS and existing analytics opt-in/withdrawal behavior remains intact.

- [ ] **Step 7: Commit the consent and identity boundary**

```bash
git add lib/analytics lib/ai/identity.ts components/analytics app/layout.tsx tests
git commit -m "feat: disclose essential document AI usage"
```

---

### Task 3: Implement timezone buckets, cost arithmetic, and atomic quota reservations

**Files:**
- Create: `lib/ai/buckets.ts`
- Create: `lib/ai/cost.ts`
- Create: `lib/ai/quota.ts`
- Create: `lib/ai/store.ts`
- Create: `tests/ai/buckets.test.ts`
- Create: `tests/ai/cost.test.ts`
- Create: `tests/ai/quota.test.ts`
- Create: `tests/ai/store.test.ts`

**Interfaces:**
- Produces: `usageBuckets(now, timeZone, dailyResetMinute)`, `estimateCostMicrousd(usage, prices)`, `AiQuotaStore`, `reserveQuestion`, `reserveSummary`, `reconcileUsage`, `releaseReservation`, and `getRemainingQuota`.
- Consumed by: Tasks 4 and 5.

- [ ] **Step 1: Write failing bucket and cost tests**

```ts
expect(usageBuckets(new Date("2026-08-22T15:00:00Z"), "Asia/Seoul", 0)).toEqual({
  day: "2026-08-23", month: "2026-08",
})
expect(estimateCostMicrousd(
  { inputTokens: 1_000_000, outputTokens: 500_000 },
  { inputMicrousdPerMillion: 250_000, outputMicrousdPerMillion: 2_000_000 },
)).toBe(1_250_000)
```

Also test an `Asia/Seoul` 04:00 reset on both sides of the boundary, UTC, `America/New_York` on both sides of DST, reset-minute bounds, exact integer rounding, and invalid timezone rejection. The monthly bucket follows the local calendar month and is not shifted by the daily reset time.

- [ ] **Step 2: Run bucket/cost tests and verify RED**

Run: `npm run test:unit -- tests/ai/buckets.test.ts tests/ai/cost.test.ts`

Expected: FAIL because the helpers do not exist.

- [ ] **Step 3: Implement deterministic buckets and integer cost arithmetic**

Use `Intl.DateTimeFormat(...).formatToParts()` for IANA date buckets and bigint intermediate multiplication for `(tokens * price + 999999) / 1000000`, returning a safe integer after range validation.

- [ ] **Step 4: Run bucket/cost tests and verify GREEN**

Run: `npm run test:unit -- tests/ai/buckets.test.ts tests/ai/cost.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing quota service/store tests**

Test exact limits, concurrent reservation rejection, expired reservation exclusion, question-versus-summary accounting, conservative prompt estimate `ceil(utf8Bytes / 2) + 512`, release on provider failure, actual-usage reconciliation, one-request bounded overage, remaining DTO, and absence of raw text in every store argument.

- [ ] **Step 6: Run quota tests and verify RED**

Run: `npm run test:unit -- tests/ai/quota.test.ts tests/ai/store.test.ts`

Expected: FAIL because quota modules do not exist.

- [ ] **Step 7: Implement quota orchestration and atomic SQL reservation**

Use a single parameterized SQL statement that removes expired reservations, sums live reservations for the visitor/day and global month, checks actual plus reserved values against current settings, and inserts a 90-second reservation only when all predicates pass. Reconcile in one transaction by deleting the reservation and upserting actual daily/monthly counters. Summary reservations omit visitor/day changes.

- [ ] **Step 8: Run quota tests and verify GREEN**

Run: `npm run test:unit -- tests/ai/quota.test.ts tests/ai/store.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit quota accounting**

```bash
git add lib/ai/buckets.ts lib/ai/cost.ts lib/ai/quota.ts lib/ai/store.ts tests/ai
git commit -m "feat: enforce AI token and cost budgets"
```

---

### Task 4: Add relevant-section selection and summary generation

**Files:**
- Create: `lib/ai/sections.ts`
- Create: `lib/ai/prompts.ts`
- Create: `lib/ai/provider.ts`
- Create: `lib/ai/summary.ts`
- Create: `tests/ai/sections.test.ts`
- Create: `tests/ai/prompts.test.ts`
- Create: `tests/ai/summary.test.ts`
- Create: `app/api/admin/documents/[revisionId]/summary/route.ts`
- Modify: `app/api/admin/documents/[revisionId]/publish/route.ts`
- Create: `tests/ai/summary-route.test.ts`
- Modify: `components/admin/document-editor.tsx`
- Modify: `tests/components/document-admin.test.tsx`

**Interfaces:**
- Produces: `splitMarkdownSections`, `rankDocumentSections`, `buildSummaryPrompt`, `buildAnswerPrompt`, `AiTextProvider`, `generateDraftSummary`, and `publishWithSummaryPolicy`.
- Consumed by: Task 5.

- [ ] **Step 1: Write failing section-ranking tests**

Use fixed Korean and English fixtures. Assert H2/H3 section boundaries, stable source IDs, question-term ranking, three-section minimum when available, five-section maximum, 16,000-character total bound, and deterministic order for equal scores.

- [ ] **Step 2: Run section tests and verify RED**

Run: `npm run test:unit -- tests/ai/sections.test.ts`

Expected: FAIL because section parsing/ranking does not exist.

- [ ] **Step 3: Implement local lexical ranking**

Strip code-fence contents from scoring but retain them in selected output. Tokenize Latin words and Korean two-character shingles, weight heading matches 4x and body matches 1x, and return selected passages in original document order with their deterministic heading IDs.

- [ ] **Step 4: Run section tests and verify GREEN**

Run: `npm run test:unit -- tests/ai/sections.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing prompt and summary policy tests**

Assert prompts mark document text as untrusted, forbid outside knowledge, preserve locale, request plain-text summary, and never concatenate administrator secrets. Test review generation updating only the draft summary, automatic publication generating only when empty, manual summary bypassing AI, generation failure leaving draft status unchanged, and monthly-only usage accounting.

- [ ] **Step 6: Run prompt/summary tests and verify RED**

Run: `npm run test:unit -- tests/ai/prompts.test.ts tests/ai/summary.test.ts`

Expected: FAIL because prompts and summary service do not exist.

- [ ] **Step 7: Implement provider adapter and summary orchestration**

Read the current installed AI SDK docs/source before using `generateText` and `streamText`. `AiTextProvider.generateSummary` returns `{ text, usage }`; normalize whitespace, enforce 180 visible characters from the prompt and 240 at storage, reconcile global usage in `finally`, and never log source Markdown.

- [ ] **Step 8: Run prompt/summary tests and verify GREEN**

Run: `npm run test:unit -- tests/ai/prompts.test.ts tests/ai/summary.test.ts`

Expected: PASS.

- [ ] **Step 9: Write failing summary API/editor tests**

Test authorization, same origin, draft-only behavior, safe provider errors, generated summary payload, automatic publish behavior, editable generated text, and loading/error announcements.

- [ ] **Step 10: Implement summary Route Handler and editor action**

Reuse the Agent configuration and credential provider boundary. Return only the generated summary and remaining global-budget status; never return prompts, context, or provider raw responses.

- [ ] **Step 11: Run summary integration tests**

Run: `npm run test:unit -- tests/ai/summary-route.test.ts tests/components/document-admin.test.tsx`

Expected: PASS.

- [ ] **Step 12: Commit AI summaries**

```bash
git add lib/ai app/api/admin/documents components/admin tests/ai tests/components/document-admin.test.tsx
git commit -m "feat: add AI-assisted document summaries"
```

---

### Task 5: Add streamed per-document question and answer

**Files:**
- Create: `lib/ai/answer.ts`
- Create: `app/api/ai/quota/route.ts`
- Create: `app/api/ai/documents/[revisionId]/ask/route.ts`
- Create: `tests/ai/answer.test.ts`
- Create: `tests/ai/ask-route.test.ts`
- Create: `components/content/document-assistant.tsx`
- Create: `components/content/document-assistant.module.css`
- Modify: `components/content/document-detail.tsx`
- Create: `tests/components/document-assistant.test.tsx`

**Interfaces:**
- Consumes: published-document repository, current Agent configuration/provider, AI identity, section ranker, quota service, and consent cookie parser.
- Produces: `answerDocumentQuestion`, a safe quota-status endpoint, an `application/x-ndjson` ask endpoint, and `DocumentAssistant`.

- [ ] **Step 1: Write failing Q&A orchestration tests**

Test current-published-only lookup, 1–300-character question validation, selected passage bounds, unsupported-question instruction, locale preservation, three-to-five source descriptors, provider failure releasing reservation, success reconciling actual usage, and no prompt/answer arguments reaching the usage store.

- [ ] **Step 2: Run Q&A service tests and verify RED**

Run: `npm run test:unit -- tests/ai/answer.test.ts`

Expected: FAIL because answer orchestration does not exist.

- [ ] **Step 3: Implement the answer service**

Return an internal stream contract:

```ts
type DocumentAnswerStream = {
  sources: Array<{ id: string; heading: string }>
  textStream: AsyncIterable<string>
  completion: Promise<{ usage: TokenUsage }>
  cancel: () => void
}
```

Reserve quota before provider construction, release it on pre-stream failure, and reconcile once on completion. Treat document Markdown as quoted untrusted context and instruct the model to answer `문서에서 확인할 수 없습니다` or its English equivalent when unsupported.

- [ ] **Step 4: Run Q&A service tests and verify GREEN**

Run: `npm run test:unit -- tests/ai/answer.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing ask-route tests**

Test the quota-status response for a visitor with no identity, current identity, stale consent, and disabled Agent. Test no/stale consent, essential and analytics consent acceptance, first-request identity cookie creation, invalid/tampered identity replacement, configured retention, disabled Agent, quota errors, archived revision rejection, and NDJSON order:

```json
{"type":"sources","sources":[{"id":"security","heading":"보안"}]}
{"type":"delta","text":"문서에 따르면"}
{"type":"done","remaining":{"questions":9,"tokens":19320}}
```

Assert `Cache-Control: no-store`, no provider call before all guards, and no raw provider error in the stream.

- [ ] **Step 6: Run ask-route tests and verify RED**

Run: `npm run test:unit -- tests/ai/ask-route.test.ts`

Expected: FAIL because the ask handler does not exist.

- [ ] **Step 7: Implement the bounded NDJSON Route Handler**

The GET quota endpoint returns configured full limits without creating an identity when none exists, or remaining daily values for a valid identity. Enforce same origin, `application/json`, and a 4 KiB request body on POST Ask. Set a new signed identity cookie before returning the stream when needed. Encode one JSON object per newline with `TextEncoder`; cancel the provider and release/reconcile once on stream cancellation. Normalize errors to `consent_required`, `ai_disabled`, `quota_exhausted`, `budget_exhausted`, `document_unavailable`, or `provider_unavailable`.

- [ ] **Step 8: Run ask-route tests and verify GREEN**

Run: `npm run test:unit -- tests/ai/ask-route.test.ts`

Expected: PASS.

- [ ] **Step 9: Write failing assistant component tests**

Test consent reopening, initial quota-status fetch, 300-character counter, empty-question rejection, NDJSON partial reads, visible streaming text, source links, remaining quota, Stop, Retry, disabled/global-budget messages, keyboard focus, mobile-sheet semantics, and no analytics data attributes on question text.

- [ ] **Step 10: Run assistant tests and verify RED**

Run: `npm run test:unit -- tests/components/document-assistant.test.tsx`

Expected: FAIL because the assistant UI does not exist.

- [ ] **Step 11: Implement the desktop rail and mobile assistant sheet**

Use `fetch` plus `ReadableStreamDefaultReader` and a buffered newline parser. Render model text as plain text paragraphs, not Markdown. Source buttons scroll to existing heading IDs and return focus to the question input. Respect reduced motion and abort the request when the component unmounts.

- [ ] **Step 12: Run Q&A integration tests**

Run: `npm run test:unit -- tests/ai tests/components/document-assistant.test.tsx && npm run typecheck && npm run lint`

Expected: PASS.

- [ ] **Step 13: Commit document Q&A**

```bash
git add lib/ai app/api/ai components/content tests/ai tests/components/document-assistant.test.tsx
git commit -m "feat: add source-cited document AI"
```

---

### Task 6: Add retention, browser coverage, and operations documentation

**Files:**
- Create: `app/api/cron/ai-retention/route.ts`
- Create: `tests/ai/retention.test.ts`
- Modify: `vercel.json`
- Create: `e2e/document-ai.spec.ts`
- Create: `e2e/support/document-database.ts`
- Modify: `e2e/support/fixtures.ts`
- Modify: `e2e/consent-analytics.spec.ts`
- Create: `docs/ai-operations.md`
- Modify: `README.md`
- Modify: `docs/analytics-operations.md`
- Modify: `tests/deployment/vercel-build.test.ts`

**Interfaces:**
- Consumes: all three implementation plans.
- Produces: automated retention, public browser verification, and operator handoff.

- [ ] **Step 1: Write failing retention tests**

Assert timing-safe cron authentication, reservations older than their expiry removed immediately, daily rows older than 32 days removed, monthly rows older than 13 calendar months removed, and returned output limited to deletion counts.

- [ ] **Step 2: Run retention tests and verify RED**

Run: `npm run test:unit -- tests/ai/retention.test.ts`

Expected: FAIL because the retention route/service does not exist.

- [ ] **Step 3: Implement retention and schedule it**

Reuse `lib/http/cron-auth.ts`, add `/api/cron/ai-retention` at `43 3 * * *`, and preserve analytics-retention and five-minute publication cron entries.

- [ ] **Step 4: Run retention tests and verify GREEN**

Run: `npm run test:unit -- tests/ai/retention.test.ts tests/deployment/vercel-build.test.ts`

Expected: PASS.

- [ ] **Step 5: Add browser fixtures and failing public flows**

Seed one Korean and one English published notice in the disposable database. Test index/detail navigation, Markdown table/callout/contents, missing-English behavior, policy-v2 re-consent, essential-only AI access with an intercepted NDJSON response, separate analytics behavior, mobile assistant sheet, and zero OpenAI requests before clicking Ask.

- [ ] **Step 6: Run targeted browser tests and verify RED**

Run: `npm run test:e2e -- e2e/document-ai.spec.ts`

Expected: FAIL on the newly specified flows before final wiring/fixtures are complete.

- [ ] **Step 7: Complete browser wiring and cleanup**

Make database fixture cleanup delete only seeded series/revisions/usage rows by known IDs or hashes. Update existing consent cookie assertions from version 1 to version 2. Never point the suite at production; retain every existing database guard.

- [ ] **Step 8: Run targeted browser tests and verify GREEN**

Run: `npm run test:e2e -- e2e/document-ai.spec.ts e2e/consent-analytics.spec.ts`

Expected: PASS on configured disposable test database. If `TEST_DATABASE_URL` is absent, record the guard refusal and do not substitute `DATABASE_URL`.

- [ ] **Step 9: Write the AI operations runbook**

Document Agent bootstrap, key replacement/deletion, model and price updates, daily/monthly guard semantics, timezone resets, cookie retention, no-content logging rule, kill switch, failed-stream reconciliation, retention, OpenAI data-processing disclosure, and production validation. Update the analytics runbook to state that Vercel Analytics and Speed Insights mount only for analytics consent.

- [ ] **Step 10: Run complete fresh verification**

Run: `npm run typecheck && npm run lint && npm run test:unit && npm run build`

Expected: all commands exit 0 with zero failing unit tests.

Run when a guarded disposable database is configured: `npm run test:e2e`

Expected: all browser projects pass; otherwise the runner must refuse before connecting and that environmental limitation must be reported.

- [ ] **Step 11: Inspect for secret and content leakage**

Run: `rg -n "OPENAI_API_KEY|sk-[A-Za-z0-9_-]{12,}|ciphertext|bodyMarkdown|question" .next docs tests app lib components -g '!*.map'`

Expected: only schema/property names, documentation, and deliberate test fixtures appear; no real key, decrypted value, logged prompt, or answer content exists.

- [ ] **Step 12: Commit the release integration**

```bash
git add app/api/cron vercel.json e2e docs README.md tests
git commit -m "test: verify document AI release flows"
```
