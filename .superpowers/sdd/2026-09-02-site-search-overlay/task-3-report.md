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
