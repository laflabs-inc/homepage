# Admin Stability and Design Document Retirement

## Goal

Ship the first stability increment for the LafLabs homepage administration system:

1. make every Admin workflow switch cleanly between Korean and English;
2. make OpenAI credential verification compatible with the configured GPT-5.6 models and expose safe, actionable failure details;
3. retire the database-backed `design` document kind while preserving the static `/design` guide.

This is the first of four independent increments. Homepage motion, dynamic document categories and Analytics, and site search remain separate follow-up projects.

## Scope

### Included

- Admin interface chrome, navigation, headings, forms, status messages, confirmations, empty states, errors, and accessibility labels in Korean and English.
- A KO/EN control in the Admin shell using the existing `laf_locale` cookie and root `LocaleProvider`.
- A bounded OpenAI Responses API credential check using the selected catalog model.
- Safe propagation of OpenAI status, error code, parameter, request ID, and a redacted provider message to authenticated Admin users.
- Removal of `design` from document types, validation, Admin UI, public content APIs, dynamic document routing, and homepage signal aggregation.
- A database migration that deletes any `design` revisions and series before removing the enum value.
- Regression tests for all three changes.

### Excluded

- Recharts and Analytics query changes.
- Dynamic category CRUD.
- Notices toolbar redesign.
- Search, embeddings, vector storage, or public AI answers.
- BuildLoop and SIGNAL animation changes.
- Changes to the static `/design` design guide.
- Translation of authored document bodies, Markdown examples, or the public `/markdown-guide.md` source. The Admin Markdown-guide shell is localized, while the guide remains a Korean authoring reference.

## Confirmed Decisions

- Work is split into small, independently deployable pull requests.
- The static `/design` page remains public.
- Database-backed `design` documents are permanently retired.
- Existing `design` rows may be deleted during migration; the user confirmed no production data needs preservation.
- GPT-5.6 Luna, Terra, and Sol remain the supported model catalog. Their identifiers and stored prices match the official OpenAI model catalog as checked on 2026-08-29.
- Raw API keys, authorization headers, request bodies, and encrypted credential material must never be returned to the browser or written to logs.

## Admin Internationalization

### Copy catalog

Create a typed Admin copy catalog with `ko` and `en` entries. The catalog owns all user-facing Admin text, including interpolated messages such as publisher names, dates, versions, and credential status.

Server-rendered Admin pages resolve the locale from the existing `laf_locale` cookie and `Accept-Language` fallback through one server-only helper. Client components select the same catalog through the existing `useLocale()` hook. No separate Admin locale state or cookie is introduced.

### Language control

Add an Admin-specific language toggle to the Admin header. Selection performs three actions:

1. update the existing locale cookie and client context;
2. update `<html lang>` through the existing locale provider;
3. call `router.refresh()` so server-rendered Admin copy is refreshed without changing the URL.

The control follows the existing homepage toggle interaction but uses Admin CSS classes so it cannot inherit homepage positioning bugs. It remains keyboard accessible, exposes pressed state, and honors reduced motion.

### Rendering boundary

- Server pages resolve copy before rendering headings and server-owned empty/error states.
- Client forms and dashboards react immediately through `useLocale()`.
- Admin APIs continue returning stable machine-readable error codes. Localization remains a presentation concern.
- Dates and numbers use the selected locale while IDs, slugs, model names, and audit identifiers remain unchanged.

## OpenAI Credential Verification

### Request contract

The credential verifier continues using the AI SDK OpenAI provider and the Responses API. It sends one minimal generation request:

- selected catalog model;
- prompt: `Reply with exactly OK.`;
- maximum output: 16 tokens;
- no temperature or other sampling override;
- OpenAI provider option `reasoningEffort: "none"`;
- no retries;
- a 10-second abort timeout.

The request proves authentication and access to the exact selected model without generating meaningful billable content. Model pricing remains server-owned catalog data.

### Diagnostic model

Extend the verification error with an optional diagnostic object:

```ts
type CredentialVerificationDiagnostic = {
  statusCode: number | null
  providerCode: string | null
  providerType: string | null
  providerParam: string | null
  requestId: string | null
  providerMessage: string | null
}
```

For AI SDK `APICallError`, parse the structured OpenAI error response and the `x-request-id` response header. The provider message is limited to 300 visible characters, normalized to one line, and redacts strings matching OpenAI key prefixes before it can cross the service boundary. Invalid JSON or unexpected shapes produce null diagnostic fields.

The existing stable application error codes remain unchanged: credential, access, model, invalid request, quota, rate limit, and provider availability. The authenticated Admin API may return `{ error, diagnostic }`; public APIs never receive these diagnostics.

### Admin presentation

The Agent screen shows:

- a localized primary explanation and suggested action;
- the stable LafLabs error code;
- available OpenAI status, provider code, parameter, and request ID;
- the sanitized provider message in a compact disclosure block.

The UI must distinguish invalid key, unavailable model, project access, exhausted quota, rate limiting, malformed verification request, timeout/network failure, and unknown provider failure. Credential inputs are cleared after every submission attempt as they are now.

### Failure state

Failed connection tests keep the current behavior of marking the credential failed and disabling AI when required. Diagnostics are request-scoped and are not persisted in the database or audit metadata.

## Retiring the `design` Document Kind

### Application model

`DocumentKind` becomes `notice | legal | disclosure`. Remove `design` from:

- document schemas and filters;
- Admin create/edit controls and list filters;
- category validation;
- public content API query validation;
- public document routing helpers;
- homepage latest-signal kinds, destinations, and copy;
- tests and fixtures that treat design content as a publishable document.

Delete the dynamic `/design/[slug]` route. Keep `/design` and its static `DesignGuide` component. Design-guide navigation and footer links continue targeting `/design`.

### Database migration

The migration executes in this order:

1. delete `document_revisions` whose series belongs to kind `design`;
2. delete matching `document_series` rows;
3. temporarily cast `document_series.kind` to text;
4. replace the PostgreSQL `document_kind` enum with `notice`, `legal`, and `disclosure`;
5. cast `document_series.kind` back to the replacement enum;
6. restore column constraints and indexes represented by the Drizzle schema.

The migration is intentionally destructive only for the retired kind. Notice, legal, disclosure, audit, Analytics, and AI data are untouched. Migration SQL is reviewed directly because enum value removal is not safely reversible through a simple generated statement.

### Compatibility behavior

After deployment:

- `/design` returns the static guide;
- `/design/<slug>` returns the normal not-found response;
- Admin and public APIs reject `kind=design` as invalid input;
- old external links to published design documents no longer resolve;
- Latest Signals requests only notices and disclosures.

No compatibility alias or redirect is added because there is no content to preserve.

## Testing

### Admin i18n

- Unit-test the copy catalog for identical key structure across locales.
- Component-test Admin navigation, Analytics, Documents, Agent, editor, and sign-in in both locales.
- Browser-test the Admin language toggle, cookie update, server refresh, focus behavior, and mobile layout.

### OpenAI verification

- Verify the exact AI SDK request excludes temperature and includes `reasoningEffort: "none"`.
- Verify status/code/parameter/request-ID extraction from representative OpenAI errors.
- Verify malformed provider bodies remain safe.
- Verify API keys and raw request bodies never appear in serialized errors.
- Verify each stable error class maps to localized Admin guidance.
- Run a manual credential test against each model available to the configured OpenAI project after deployment credentials are present.

### Design retirement

- Test document-kind schemas and Admin controls no longer accept or show design.
- Test the public content API rejects design.
- Test Latest Signals requests only notice and disclosure content.
- Test `/design` still renders and `/design/example` is not found.
- Apply the migration to a temporary database containing one row for every document kind and confirm only design rows are removed.

### Full regression

Run typecheck, lint, all unit tests, production build, and focused Playwright tests at 390, 768, and 1440 pixel widths.

## Deployment and Rollback

Deploy the database migration and application in the normal Vercel migration-before-build flow. Because the migration removes an enum member and deletes retired rows, database rollback would require recreating the enum value; there is no design content to restore. Application rollback to a version that still writes `design` is therefore unsupported after migration. If deployment fails after migration, roll forward with the fixed application rather than deploying an older build.

## Success Criteria

- Every Admin workflow can switch its interface copy between Korean and English without navigating away; authored content remains in its original locale.
- A failed OpenAI credential test tells an authenticated Admin which provider condition failed without exposing a secret.
- A valid project credential can verify at least one selected supported model.
- `design` cannot be created, queried, filtered, or published as a document.
- The static `/design` guide remains available.
- The migration and full test suite complete without affecting the remaining document kinds.
