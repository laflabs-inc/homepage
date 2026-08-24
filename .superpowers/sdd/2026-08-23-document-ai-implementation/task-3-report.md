# Task 3 report — monthly AI summary cost budget

Base: `d4838bb`

## Scope delivered

- Added local calendar day/month buckets using `Intl.DateTimeFormat().formatToParts()`, including non-midnight daily resets and DST-safe local dates. Monthly buckets never shift with the daily reset.
- Added safe-integer token/cost validation and exact `bigint` ceiling arithmetic for input and output prices in integer micro-US-dollars.
- Added summary-only budget orchestration. `reserveSummary` bounds prompt/source UTF-8 bytes, estimates input as `ceil(bytes / 2) + 512`, adds the configured maximum output, snapshots configured prices for reconciliation, and passes only dates/counts/costs to storage.
- Added a 90-second summary reservation statement that deletes expired rows, locks current settings, totals current-month actual cost plus live reservations, blocks at/over the configured limit, and conditionally inserts a reservation with null visitor/day fields.
- Added idempotent summary reconciliation: deleting the exact live summary reservation gates a single monthly upsert of provider input/output/total tokens, `summary_count`, and actual estimated cost.
- Added exact reservation release and a remaining-monthly-budget status that counts live reservations and clamps an actual overrun to zero remaining.

## RED / GREEN evidence

1. Bucket/cost RED: `npm run test:unit -- tests/ai/buckets.test.ts tests/ai/cost.test.ts`
   - Failed because `lib/ai/buckets.ts` and `lib/ai/cost.ts` did not exist.
2. Bucket/cost GREEN: the same focused command passed with 14 tests.
3. Quota/store RED: `npm run test:unit -- tests/ai/quota.test.ts tests/ai/store.test.ts`
   - Failed because `lib/ai/quota.ts` and `lib/ai/store.ts` did not exist.
4. Quota/store GREEN: the same focused command passed with 16 tests.
5. Bounded-provider-usage RED: reconciliation accepted 601 output tokens against a 600-token reservation.
6. Bounded-provider-usage GREEN: reconciliation now rejects output above the reserved configured maximum.
7. Cost-rounding correction RED: one input and one output token at one micro-USD per million each returned 1 instead of the specified per-component ceiling total of 2.
8. Cost-rounding correction GREEN: each component now uses exact `bigint` ceiling arithmetic before safe-integer summation.

Final focused run: 4 files, 31 tests passed.

## Full verification

- `npm test` — exit 0
  - Typecheck passed.
  - ESLint passed with no findings.
  - 51 Vitest files / 575 tests passed.
  - Next.js 16.3.2 production build passed.
- The repository's existing Vite future-native-config `__dirname` warning remains unchanged.
- No database migration was needed or applied. SQL behavior was verified at the emitted parameterized-query boundary; no live PostgreSQL URL was available for an integration run.

## Privacy and deferred work

Store arguments and SQL parameters contain no prompt, source content, generated summary, IP, cookie, or visitor identity. No new logging was added.

Public document Q&A remains deferred exactly as directed. This task does **not** add `reserveQuestion`, anonymous daily visitor quotas, AI identity/cookies, remaining user quota, a question prompt-estimate API, Q&A routes/UI, or a generalized quota framework. Provider-call wiring belongs to the later summary workflow; that caller must invoke `releaseReservation` on provider failure and `reconcileSummaryUsage` only on a provider response.
