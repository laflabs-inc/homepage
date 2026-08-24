# Task 4 report — AI-assisted document summaries

Base: `7a01c85`

## Delivered

- Added a bounded, locale-aware summary prompt that treats the title and at most 16,000 characters of draft Markdown as quoted untrusted data and requests neutral one-line plain text.
- Added an injected `generateText` adapter that uses only the enabled, exact-model verified Agent credential, caps summary output at 256 tokens, maps provider usage to safe token counts, and returns typed safe errors.
- Added summary orchestration that reserves monthly budget before inference, releases pre-result failures, reconciles provider-reported usage once before later mutations, normalizes/caps output safely, and updates only a draft summary.
- Added an audited summary-only document-store mutation, authenticated same-origin admin summary route, and review editor action that requires saving dirty fields first.
- Wrapped immediate publication with the configured summary policy: manual summaries bypass AI, automatic empty summaries generate before publish, and review-mode empty summaries retain the existing validation failure.
- Kept cache invalidation after a successful publication only.

## Fix round 1 hardening

- Keyed summary reservations by the document revision UUID, so the existing reservation primary key rejects concurrent explicit or automatic generation for the same revision before any provider call.
- Re-read the draft after reservation and compare the exact prompt-relevant title, Markdown, and summary snapshot before inference; stale reads release the reservation and return a stable conflict, while an automatic publish safely uses a concurrently saved manual summary.
- Added a row-locking summary compare-and-set that requires draft status and exact prompt fields before updating and auditing. Automatic publication additionally requires the generated snapshot, preventing stale output from publishing.
- Unified draft, publication, and generated-summary storage limits on a 240 Unicode code-point rule. Generated output truncates without splitting surrogate pairs.
- Made the post-save remaining-budget read advisory: a failed estimate returns the saved summary with `remainingMonthlyBudget: null`, avoiding a retry after provider spend.
- Added `aria-busy` to the editor generation control while inference is pending.

## Fix round 2 reservation ownership

- Added migration `0008_summary_reservation_claims` with nullable reservation `subject_id` and `reconciled_at`, backfilled existing summary rows from their revision-keyed IDs, and added a partial unique subject claim.
- Changed each generation attempt to use a fresh random reservation ID while claiming the stable revision UUID as its subject. Concurrent attempts for one revision are rejected without inference, and delayed releases can delete only their own attempt.
- Made reconciliation row-locking and idempotent: actual monthly usage is counted only while `reconciled_at` is null, then reserved amounts are zeroed and the subject claim remains alive for 90 seconds.
- Kept the reconciled claim through the document snapshot compare-and-set and released its exact random ID in `finally` after either CAS success or conflict. A crash leaves the bounded claim to expire normally.

## Fix round 3 cross-month serialization

- Serialized every summary reservation in a consistent subject-then-month order using separate advisory-lock hash domains.
- Executes the subject lock, month lock, and reservation mutation as three transaction statements, so a waiter crossing a month boundary receives a fresh statement snapshot and observes the winning subject claim.
- Preserved month-scoped budget serialization while distinguishing a live subject claim as `in_progress` from a genuine budget rejection as `monthly_limit`.

## Deferred by scope

Public document Q&A remains deferred. This task intentionally does not add `sections.ts` or ranking, `buildAnswerPrompt`, `streamText`, question routes, public AI identity, consent changes, quota identity paths, or assistant UI.

## Verification

- Focused fix-round 3 regression gate: 9 files, 176 tests passed.
- Full `npm test`: typecheck passed, lint passed, 55 test files / 633 tests passed, and the Next.js production build completed successfully with the summary route present.
