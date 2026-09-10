# Task 3 Report: Full-screen overlay and header integration

## Status

Complete. The shared header now opens a localized full-screen site-search surface below the fixed 76px header. The overlay implements explicit-submit fetching, request cancellation, grouped results, complete idle/invalid/loading/results/no-results/partial/unavailable states, focus and covered-region management, keyboard dismissal/opening, and privacy-safe analytics.

## Files

- `components/search/site-search-overlay.tsx`
  - Adds the client overlay and shared `SITE_SEARCH_OVERLAY_ID`.
  - Owns query, response, pending, error, abort, focus, scroll-lock, inert, locale-change, and result-group behavior.
  - Uses `role="dialog"` with `aria-labelledby` and intentionally omits `aria-modal`.
  - Renders accessible live status, retry, fallbacks, and plain-text result metadata.
- `components/search/site-search-overlay.module.css`
  - Adds the fixed LafLabs paper/ink/blue surface, oversized ruled input, square submit action, rule-separated result rows, internal scrolling, mobile 44px targets, focus-compatible controls, and reduced-motion overrides.
- `components/layout/site-header.tsx`
  - Owns overlay visibility and trigger focus.
  - Adds the localized 34px search/close control with `aria-expanded` and `aria-controls`.
  - Adds Command/Ctrl+K outside editable controls and records `search_open`.
- `lib/content.ts`
  - Adds shape-checked Korean and English copy for every specified search label and state.
- `lib/analytics/normalize.ts`
  - Widens the existing analytics event allowlist for the three search events.
  - Restricts targets to null, aggregate length/count data, or an allowlisted result group.
- `tests/components/site-search-overlay.test.tsx`
  - Covers localized open/focus, non-modal dialog semantics, trigger state, active-locale submission, grouped results, local short-query validation, Escape close, focus restoration, scroll restoration, and inert restoration.
- `tests/analytics/normalize.test.ts`
  - Covers accepted search event targets and rejection of raw query/destination targets.

## Commits

- `fdf35c8c1fd1f82affd224218c6bef85d9467e2d feat: add full-screen site search overlay`

## Exact RED/GREEN verification

### Component RED

```text
npm run test:unit -- tests/components/site-search-overlay.test.tsx
```

Failed as intended: 1 test file failed, 4 tests failed because the accessible `검색` trigger and overlay did not exist.

### Analytics contract RED

```text
npm run test:unit -- tests/analytics/normalize.test.ts
```

Failed as intended: the 3 new `search_open`, `search_submit`, and `search_result_click` allowlist cases were rejected by the pre-existing schema.

### Component GREEN

```text
npm run test:unit -- tests/components/site-search-overlay.test.tsx
```

Passed: 1 test file, 4 tests.

### Combined focused GREEN

```text
npm run test:unit -- tests/components/site-search-overlay.test.tsx tests/analytics/normalize.test.ts && npm run lint && npm run typecheck && git diff --check
```

Passed: 2 test files, 24 tests; ESLint exited successfully; TypeScript exited successfully; diff check was clean. ESLint reported one pre-existing warning in `lib/search/site-search.ts` for `_keywords`.

### Required final command

```text
npm run test:unit -- tests/components/site-search-overlay.test.tsx && npm run lint && npm run typecheck
```

Passed: 1 component test file, 4 tests; ESLint exited successfully with the same pre-existing warning; TypeScript exited successfully.

## Self-review

- Search submits only through the form and trims before enforcing the 2–100 Unicode-character range.
- Every submit aborts prior work; aborted and stale responses cannot replace the current state.
- Changing locale hides prior-locale results, aborts in-flight work, and preserves the editable query for explicit resubmission.
- Closing unmounts local state so every reopening starts clean.
- Body overflow and each covered `main`/`footer` inert attribute restore their exact previous values on close/unmount.
- Search analytics never include query text, titles, slugs, or hrefs. Submit targets contain only query length and result count; click targets contain only the result group.
- The implementation consumes only the shared `SiteSearchResponse` client contract and `/api/search`; it imports no server search module into the client graph.
- Result descriptions render as React text, with no injected HTML or highlighting.

## Accessibility and design checks

- Visible heading labels the dialog; no `aria-modal` is used because the fixed header remains available.
- Search uses a native search form, explicit hidden input label, labelled submit button, polite live status, and `aria-busy`.
- Opening focuses the searchbox. Escape closes and restores trigger focus.
- The page behind the overlay is removed from the keyboard order with restored inert state and cannot scroll while open.
- Command/Ctrl+K ignores input, textarea, select, and contenteditable targets.
- Header control is 34px desktop and 44px mobile; other mobile interactive targets meet or exceed 44px.
- Fixed geometry begins at 76px; the result region scrolls internally and uses overscroll containment.
- The surface uses existing paper/ink/blue/deep/line/muted tokens, square controls, blue top rule, strong input rule, and rule-separated rows; it introduces no floating cards or black reference palette.
- Motion is a short opacity/vertical transition and becomes zero-duration under reduced motion; CSS transitions are also removed by the reduced-motion media query.
- Focus rings inherit the project-wide `:focus-visible` treatment; caret and scrollbars use the brand blue.

## Concerns

- Vitest emits the repository's existing native-config warning for `__dirname` in `vitest.config.ts`.
- ESLint emits the pre-existing `_keywords` warning in Task 1's `lib/search/site-search.ts`; Task 3 adds no lint warning or error.
- Per the task split, desktop/mobile browser-state inspection remains for Task 4; this task completed component-level interaction, lint, type, and code-level accessibility/design checks only.
- The dedicated patch helper could not start its loopback sandbox in this environment (`RTM_NEWADDR`); changes were applied as narrow unified diffs through Git in the isolated worktree.

## Fix round 1 — validated findings

### Status

Complete. All three Important findings and the requested test-coverage finding are resolved in commit `6a25c58068c412fef3fbfbdde42bb22b2b9b2075`.

### Changed files

- `components/search/site-search-overlay.tsx`
  - Removed the UTF-16 DOM `maxLength` constraint so component validation is authoritative and counts Unicode code points.
  - Clears results for invalid and unavailable submissions.
  - Clears response, error, and pending state on every locale transition while preserving the query, and aborts the active controller.
- `components/search/site-search-overlay.module.css`
  - Added a short-height viewport rule that scrolls the full overlay surface and lets results participate in that scroll.
- `tests/components/site-search-overlay.test.tsx`
  - Added Unicode boundary, locale round-trip, stale state, retry, stale response ordering, no-result, partial-result, editable-target shortcut, and short-height source coverage.

### Commit

- `6a25c58068c412fef3fbfbdde42bb22b2b9b2075 fix: harden site search overlay states`

### Exact RED/GREEN commands and outcomes

#### Initial expanded-suite RED

```text
npm run test:unit -- tests/components/site-search-overlay.test.tsx
```

Failed as intended after the new tests were added: 1 test file, 12 tests total, 8 failed and 4 passed. Three failures were test-harness issues (queued fetch mocks, contenteditable setup, and CSS path resolution); those test-only issues were corrected before production changes.

#### Isolated production RED

```text
npm run test:unit -- tests/components/site-search-overlay.test.tsx
```

Failed as intended: 1 test file, 12 tests total, 5 failed and 7 passed. The five failures were the UTF-16 `maxlength`, locale round-trip resurrection, stale results after invalid input, stale results after unavailable response, and missing short-height rule.

#### Focused component GREEN

```text
npm run test:unit -- tests/components/site-search-overlay.test.tsx
```

Passed: 1 test file, 12 tests.

#### Required combined GREEN

```text
npm run test:unit -- tests/components/site-search-overlay.test.tsx tests/analytics/normalize.test.ts && npm run lint && npm run typecheck && git diff --check
```

Passed: 2 test files, 32 tests; ESLint exited successfully with 0 errors and one pre-existing unrelated warning; TypeScript exited successfully; diff check was clean.

### Self-review

- One hundred astral Unicode code points are accepted and submitted; 101 code points reach the localized invalid state without a network request.
- Locale changes use React's guarded state-adjustment pattern to clear result, error, and loading state before commit while retaining the query for explicit resubmission.
- The locale effect is limited to synchronizing the external AbortController and no longer causes a lint-invalid state cascade.
- Invalid and unavailable states cannot render alongside prior results.
- Late resolution from an aborted request cannot replace the latest response.
- Retry reuses the retained query and no-result and partial-result paths remain reachable.
- The implementation stays within Task 3 files and does not change the API or shared search contract.

### Accessibility and design checks

- Command/Ctrl+K is verified against input, textarea, select, and contenteditable targets, while a non-editable target still opens search.
- Existing localized live-status, focus restoration, inert background, non-modal dialog semantics, and reduced-motion behavior remain covered and unchanged.
- At heights up to 600px, the overlay becomes the scrolling container, the inner surface grows with content, and the result region no longer clips independently.
- The short-height rule preserves the established full-screen surface, typography, square controls, rules, and brand tokens.

### Concerns

- Vitest still emits the repository's existing native-config warning for `__dirname` in `vitest.config.ts`.
- ESLint still emits the pre-existing `_keywords` warning in `lib/search/site-search.ts:138`; the fix round adds no lint warning or error.
- Browser-level 568×320 visual verification remains in Task 4; this round adds a focused CSS/source contract because jsdom does not compute responsive layout.
- The dedicated patch helper still cannot create its loopback sandbox in this environment (`RTM_NEWADDR`), so narrow unified diffs were applied through Git in the isolated worktree.
