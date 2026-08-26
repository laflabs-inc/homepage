# Task 3 report — monthly AI summary cost budget

Base: `d4838bb`

## Scope delivered

- Added local calendar day/month buckets using `Intl.DateTimeFormat().formatToParts()`, including non-midnight daily resets and DST-safe local dates. Monthly buckets never shift with the daily reset.
- Added safe-integer token/cost validation and exact `bigint` ceiling arithmetic for input and output prices in integer micro-US-dollars.
- Added summary-only budget orchestration. `reserveSummary` bounds prompt/source UTF-8 bytes, estimates input as `ceil(bytes / 2) + 512`, adds the configured maximum output, snapshots configured prices for reconciliation, and passes only dates/counts/costs to storage.
- Added a 90-second summary reservation transaction: a month-keyed advisory lock statement runs first, then a fresh-snapshot statement deletes expired rows, totals current-month actual cost plus live reservations, blocks at/over the configured limit, and conditionally inserts a reservation with null visitor/day fields.
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

## Fix round 1 — concurrent reservations and DST transitions

Controller ruling: summary reservation requires two statements in one transaction. A `FOR UPDATE` reached inside the original READ COMMITTED statement could wait behind another reservation while retaining the stale statement snapshot, so it could not guarantee concurrent rejection. The replacement transaction first acquires `pg_advisory_xact_lock(hashtextextended(month, 0))` using only the stable `YYYY-MM` bucket, then executes cleanup/sum/check/insert. The second statement therefore receives its READ COMMITTED snapshot after the month lock is held. Neon/Drizzle's existing batch transaction support commits both statements together.

The daily bucket now finds the earliest valid instant on the local calendar date at or after the configured wall-clock reset minute using bounded `Intl.formatToParts()` minute search. A fall-back fold chooses the first occurrence, so the quota day cannot move backward during the repeated hour; a spring-forward gap advances to the first valid minute. The local calendar month remains independent of this reset calculation.

TDD evidence:

- RED: `npm run test:unit -- tests/ai/buckets.test.ts tests/ai/store.test.ts` failed because the second New York 01:15 occurrence moved back to the prior quota day and reservation still called one non-transactional statement.
- GREEN: the same focused command passed with 2 files / 17 tests; `npm run typecheck` passed.
- Transaction-shaped tests assert two concurrent attempts use the same month-only advisory lock, each lock is statement one, each reservation query is statement two, and both statements are submitted through one injected transaction executor.
- Final focused run: 4 AI files / 34 tests passed; ESLint and `git diff --check` passed.
- Full `npm test`: exit 0; typecheck and ESLint passed, 51 Vitest files / 578 tests passed, and the Next.js 16.3.2 production build passed.
