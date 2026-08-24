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

## Deferred by scope

Public document Q&A remains deferred. This task intentionally does not add `sections.ts` or ranking, `buildAnswerPrompt`, `streamText`, question routes, public AI identity, consent changes, quota identity paths, or assistant UI.

## Verification

- Focused fix-round regression gate: 9 files, 190 tests passed.
- Full `npm test`: typecheck passed, lint passed, 55 test files / 628 tests passed, and the Next.js production build completed successfully with the summary route present.
