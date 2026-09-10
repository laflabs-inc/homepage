# Task 2 Report: Strict public search API

## Status

Complete. Task 2 implements the public `GET /api/search` route with strict query validation, bounded trimmed input, stable error responses, and no-store caching headers.

## Files

- `app/api/search/route.ts`
  - Added `handleSiteSearch(request, repository?)` for direct tests.
  - Added the Next.js `GET(request)` route export.
  - Rejects duplicate and unknown parameters before schema parsing.
  - Validates a trimmed two-to-one-hundred-character `q` and supported `locale`.
  - Returns the `SiteSearchResponse` payload with `Cache-Control: no-store`.
  - Maps unexpected search failures to `{ error: "unavailable" }` without exposing messages.
- `tests/search/search-api.test.ts`
  - Covers missing, one-character, over-limit, duplicate, unknown, and unsupported-locale inputs.
  - Covers trimming, forwarding the locale/repository, payload passthrough, no-store headers, and sanitized failures.

## Commits

- `e647978 feat: expose public site search api`

## Exact RED/GREEN verification

RED:

```text
npm run test:unit -- tests/search/search-api.test.ts
```

Failed because `@/app/api/search/route` did not exist; Vitest reported that the import could not be resolved and ran 0 tests.

GREEN:

```text
npm run test:unit -- tests/search/search-api.test.ts && npm run typecheck
```

Passed: 1 test file, 8 tests; TypeScript completed with no errors.

## Self-review

- Validation is performed before calling `searchSite`.
- Duplicate keys are detected independently of Zod’s object parsing.
- Query whitespace is removed before forwarding and before the length bounds are evaluated.
- Unknown keys cannot reach the search service.
- Error responses contain only the documented error code and use no-store headers.
- No user input is logged.
- The default repository is `documentStore`, while direct tests can inject a `PublishedDocumentReader`.

## Concerns

- Vitest emits the repository’s existing warning that `__dirname` in `vitest.config.ts` is unsupported by native config loading; it does not fail the tests.
- The focused suite mocks `searchSite` to isolate route validation/response behavior; `tests/search/site-search.test.ts` covers the search implementation separately.
