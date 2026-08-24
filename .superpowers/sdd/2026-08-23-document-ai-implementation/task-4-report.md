# Task 4 report — AI-assisted document summaries

Base: `7a01c85`

## Delivered

- Added a bounded, locale-aware summary prompt that treats the title and at most 16,000 characters of draft Markdown as quoted untrusted data and requests neutral one-line plain text.
- Added an injected `generateText` adapter that uses only the enabled, exact-model verified Agent credential, caps summary output at 256 tokens, maps provider usage to safe token counts, and returns typed safe errors.
- Added summary orchestration that reserves monthly budget before inference, releases pre-result failures, reconciles provider-reported usage once before later mutations, normalizes/caps output safely, and updates only a draft summary.
- Added an audited summary-only document-store mutation, authenticated same-origin admin summary route, and review editor action that requires saving dirty fields first.
- Wrapped immediate publication with the configured summary policy: manual summaries bypass AI, automatic empty summaries generate before publish, and review-mode empty summaries retain the existing validation failure.
- Kept cache invalidation after a successful publication only.

## Deferred by scope

Public document Q&A remains deferred. This task intentionally does not add `sections.ts` or ranking, `buildAnswerPrompt`, `streamText`, question routes, public AI identity, consent changes, quota identity paths, or assistant UI.

## Verification

- Focused Task 4 regression gate: 10 files, 178 tests passed.
- Full `npm test`: typecheck passed, lint passed, 55 test files / 614 tests passed, and the Next.js production build completed successfully with the new summary route present.
