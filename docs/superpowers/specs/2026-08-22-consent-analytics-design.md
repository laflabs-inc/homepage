# Consent and First-Party Analytics Design

Date: 2026-08-22

## 1. Objective

Add a privacy-conscious analytics loop to the existing LafLabs homepage without changing its public content structure or converting projects into CMS-managed records.

The completed feature must:

- ask for analytics consent on a visitor's first visit;
- send no analytics data before consent;
- collect a small allowlisted set of anonymous product and conversion events after consent;
- let a visitor change or withdraw consent from the footer;
- delete that visitor's raw events when consent is withdrawn;
- show aggregate analytics in a GitHub-protected admin page; and
- leave the public homepage usable when analytics, authentication, or the database is unavailable.

This is an analytics foundation, not a claim of compliance with every jurisdiction. The cookie and privacy copy must receive legal review before production launch.

## 2. Scope

### Included

- Square, bilingual consent panel matching the existing LafLabs visual system.
- Essential consent preference cookie.
- Analytics visitor cookie created only after opt-in.
- First-party event collection through a Next.js Route Handler.
- Neon PostgreSQL provisioned through Vercel Marketplace.
- A read-only `/admin/analytics` dashboard.
- GitHub OAuth admin login restricted to current `laflabs-inc` organization members.
- Raw-event retention and visitor deletion.
- Automated tests for consent, collection, deletion, access control, and graceful degradation.

### Excluded

- Project CMS, GitHub repository synchronization, product editing, and dynamic product pages.
- Contact form storage; the existing email CTA remains unchanged.
- Heatmaps, session replay, mouse tracking, free-form user input capture, and advertising pixels.
- Third-party analytics SDKs.
- Cross-device identity, authenticated public users, cohort targeting, and experimentation.
- Redesigning existing homepage sections.

## 3. System Architecture

The existing Next.js App Router application remains one deployable unit.

```text
Public page
  -> ConsentProvider
     -> POST /api/consent
     -> Analytics client (enabled only after opt-in)
        -> POST /api/analytics/events
           -> validation and anonymization
           -> Neon PostgreSQL

Admin browser
  -> GitHub OAuth
  -> organization membership check
  -> /admin/analytics
     -> authenticated Server Component
     -> direct database query
```

Public and admin Server Components read the database directly. They do not call the application's own Route Handlers. Route Handlers exist only for browser-facing consent and event requests and authentication callbacks.

Server Actions are not required for analytics collection. If they are used for future admin mutations, each action must independently validate the admin session and authorization.

## 4. Consent Experience

### 4.1 Initial state

When the versioned `laf_consent` cookie is absent, invalid, or older than the current policy version, the site displays a non-blocking consent panel fixed to the bottom of the viewport.

The panel:

- follows the site's square geometry, blue accent, border, and monospaced labels;
- supports Korean and English using the current locale;
- contains a short explanation and a link to the cookie/privacy information;
- gives `Essential only` and `Allow analytics` equal visual weight;
- does not use preselected consent or make rejection harder than acceptance;
- remains keyboard accessible and traps no focus; and
- honors reduced-motion preferences.

The site remains fully usable while the panel is visible.

### 4.2 Consent choices

`POST /api/consent` accepts one of two allowlisted choices and the current policy version:

- `essential`: set only `laf_consent`; clear `laf_visitor` if present.
- `analytics`: set `laf_consent` and create a signed `laf_visitor` token if absent.

Both cookies use `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, and a 180-day maximum age in production. The server-rendered layout reads the HttpOnly consent cookie and passes the initial state to the client provider. After an in-page choice, the API response updates the provider state without requiring a reload.

If the browser sends `DNT: 1`, an `analytics` choice is treated as `essential`: the response stores the essential preference, analytics remains disabled, and the panel explains that the browser preference is being honored. No visitor cookie is created.

### 4.3 Changing and withdrawing consent

The footer exposes a persistent `Cookie settings` control. Opening it shows the same two choices.

On withdrawal, the server performs these operations in order:

1. Read the existing HttpOnly visitor identifier.
2. Compute its server-side hash.
3. Delete raw events with that hash.
4. Clear `laf_visitor`.
5. Replace `laf_consent` with the current `essential` preference.
6. Tell the active client collector to stop and clear its queued events.

If deletion fails, the server does not claim success. It leaves the visitor cookie available for a retry and returns a retryable error to the settings panel.

## 5. Data Minimization

The browser visitor identifier is a random UUID carried in a signed HttpOnly token. The server rejects an invalid signature. The database stores only an HMAC of the UUID using `ANALYTICS_HASH_SECRET`; the raw identifier is never logged or persisted server-side.

The collector never stores:

- source IP addresses;
- names, email addresses, form values, or other free-form input;
- full User-Agent strings;
- URL query strings or fragments;
- precise location;
- pointer coordinates;
- page contents; or
- third-party identifiers.

The server derives and stores only coarse values:

- `device_category`: `desktop`, `mobile`, `tablet`, or `unknown`;
- `locale`: `ko` or `en`;
- `referrer_host`: normalized hostname only, without path or query; and
- a sanitized pathname from the site's known public route patterns.

## 6. Event Contract

The initial event allowlist is:

| Event | Optional target | Meaning |
|---|---|---|
| `page_view` | sanitized pathname | A consented public page view |
| `product_click` | project identifier | A click on a product CTA or card link |
| `github_click` | organization or repository identifier | A click to GitHub |
| `contact_click` | `email` | A click on the contact email CTA |
| `locale_change` | `ko` or `en` | A locale toggle after consent |
| `consent_update` | `analytics` | Analytics consent was granted |

Rejection is not sent as an analytics event. Consequently the dashboard must not display a misleading consent acceptance rate, because non-consenting visits are intentionally unobserved.

The client batches at most 20 events per request and sends them with `navigator.sendBeacon` when possible or `fetch(..., { keepalive: true })` otherwise. A failed analytics request is dropped after one bounded retry and never blocks navigation.

The API validates:

- analytics consent from the server-readable cookie;
- request content type and a small body-size limit;
- a maximum of 20 events;
- event names and target formats;
- timestamps within a narrow window of server time; and
- unique event IDs.

Requests without analytics consent receive a no-op response and write nothing. Duplicate event IDs are ignored. A per-visitor, per-minute database counter limits accepted volume. The deployment may add an outer Vercel Firewall limit, but correctness does not depend on a paid firewall feature.

## 7. Database Model

### `analytics_events`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Database primary key |
| `event_id` | UUID | Client event ID, unique |
| `visitor_hash` | text | HMAC of HttpOnly visitor UUID |
| `session_hash` | text | HMAC of per-tab session UUID |
| `event_type` | text | Checked against the allowlist |
| `pathname` | text | Sanitized path |
| `target_id` | text nullable | Validated event target |
| `locale` | text | `ko` or `en` |
| `device_category` | text | Coarse device class |
| `referrer_host` | text nullable | Hostname only |
| `occurred_at` | timestamptz | Clamped client event time |
| `received_at` | timestamptz | Server insertion time |

Indexes cover `received_at`, `event_type`, `visitor_hash`, and the common `(event_type, received_at)` dashboard query. `event_id` has a unique constraint.

### `analytics_rate_windows`

This small table stores an atomic event count keyed by `visitor_hash` and minute bucket. Old buckets are deleted by the same retention job.

No separate public visitor profile, consent history, or fingerprint table is created.

### Retention

A daily Vercel Cron route deletes raw events older than 90 days and expired rate windows. The cron endpoint requires the platform-provided cron secret. The dashboard reports only the retained window; no indefinite aggregate table is introduced in the first version.

## 8. Admin Authentication and Authorization

The admin area uses GitHub OAuth with the minimum scope required to read the authenticated user's organization membership. A successful OAuth identity is not sufficient by itself: the server also verifies an active `laflabs-inc` membership returned by GitHub.

- Organization membership is checked during sign-in.
- The admin session is short-lived and membership is revalidated periodically.
- Failure to verify membership denies or locks admin access; it does not fail open.
- Every `/admin` request verifies the authenticated session.
- Admin API and future Server Actions repeat authorization at the operation boundary.
- OAuth access tokens and application secrets remain server-only and are never exposed to Client Components.

The first version has one `admin` capability for verified organization members. It does not add local users, invitations, or role management.

## 9. Analytics Dashboard

`/admin/analytics` is a read-only Server Component dashboard in the existing square LafLabs visual language.

It supports 7-day, 30-day, and 90-day ranges and displays:

- unique consented visitors;
- page views;
- product clicks by target;
- GitHub outbound clicks by target;
- contact clicks;
- the consented page-view to product-click to contact-click funnel;
- Korean and English event share;
- desktop, mobile, tablet, and unknown share; and
- referrer host totals.

Every label says or implies `consented` where necessary. Counts are not presented as total site traffic because non-consenting visits are deliberately absent.

The empty state explains that no consented events have been collected. Query failures show an admin-only error state and do not affect the public site.

## 10. Failure Handling

- Database unavailable during collection: return a no-content or service-unavailable response, log a redacted operational error, and leave the public interaction uninterrupted.
- Malformed or oversized analytics request: reject without insertion.
- Missing or invalid consent cookie: write nothing.
- Duplicate delivery: ignore through the unique event constraint.
- Consent withdrawal deletion failure: show a retryable settings error and preserve the identifier needed to retry deletion.
- GitHub unavailable during sign-in or revalidation: deny admin access until verification succeeds.
- Dashboard query failure: show an admin error boundary with retry; never surface database details.
- Cookie parsing failure: treat the visitor as unconsented and show the panel again.

Application logs must not include cookie values, visitor identifiers, OAuth tokens, request bodies, or raw database connection errors returned to a browser.

## 11. Cache and Rendering Behavior

The existing public homepage retains its current rendering and caching behavior. Consent UI is initialized from server-read cookies and hydrated client-side. Analytics never forces the entire landing page to become client-rendered.

The admin dashboard is dynamically rendered and uncached per authenticated request. Aggregate queries run directly against PostgreSQL.

## 12. Environment and Platform Configuration

Production requires:

- a Vercel project for `laflabs.co`;
- a Neon PostgreSQL integration;
- GitHub OAuth application credentials;
- an OAuth callback URL for production and an approved local callback;
- `ADMIN_GITHUB_ORG=laflabs-inc`;
- `ANALYTICS_HASH_SECRET` generated independently from authentication secrets;
- an authentication session secret;
- a versioned consent policy constant; and
- Vercel Cron authorization.

Preview deployments use a separate database branch or database and separate callback URL. Production data must not be copied into previews.

## 13. Verification Strategy

### Unit tests

- Consent state transitions and policy-version invalidation.
- Cookie option construction.
- Event schema and target allowlists.
- Path, referrer, locale, and device normalization.
- HMAC stability without exposing raw identifiers.
- Dashboard aggregation queries.

### Integration tests

- Event request before consent writes zero rows.
- Analytics consent creates both required cookies.
- Essential-only choice creates no visitor cookie.
- Valid consented events insert successfully.
- Duplicate event IDs insert once.
- Invalid and oversized batches are rejected.
- Withdrawal deletes the visitor's events before clearing the visitor cookie.
- Retention removes records older than 90 days.
- Admin routes reject unauthenticated and non-member identities.

### Browser tests

- First visit shows the bilingual consent panel.
- Rejecting consent produces no event network request.
- Accepting consent enables collection without reloading.
- Footer settings reopen the controls.
- Withdrawal stops collection and clears the visitor cookie.
- Locale changes keep the consent state and translate the panel.
- Mobile layout, keyboard navigation, focus visibility, and reduced motion remain correct.
- Analytics endpoint failure does not break product, GitHub, contact, locale, or scroll interactions.

### Release checks

- TypeScript, lint, production build, and database migrations pass.
- Cookie flags are inspected on the production domain.
- No analytics request occurs in a clean browser before opt-in.
- Admin access succeeds for an organization member and fails for an unrelated GitHub account.
- Raw events older than the retention boundary are removed in a staging cron test.

## 14. Delivery Sequence

1. Add database integration and migrations.
2. Add consent domain logic and cookie endpoints.
3. Add the bilingual consent panel and footer settings control.
4. Add the guarded client event collector and instrument the existing CTAs.
5. Add retention and withdrawal deletion.
6. Add GitHub OAuth and organization authorization.
7. Add the read-only analytics dashboard.
8. Complete automated and production-domain verification.

The CMS and GitHub repository synchronization remain separate future projects. This implementation must not introduce abstractions for them in advance.

## 15. Primary Technical References

- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js backend-for-frontend guidance: https://nextjs.org/docs/app/guides/backend-for-frontend
- Next.js data mutation security: https://nextjs.org/docs/app/getting-started/mutating-data
- Vercel Postgres integrations: https://vercel.com/docs/postgres
- Neon for Vercel: https://vercel.com/marketplace/neon
- GitHub organization membership API: https://docs.github.com/en/rest/orgs/members
