# Consent analytics operations

This runbook provisions and verifies LafLabs' consented, first-party analytics.
The system intentionally does not observe visitors who have not opted in, so
dashboard numbers are consented traffic only. The consent and privacy copy is an
engineering draft, not a legal conclusion.

## Safety rules

- Keep production, preview, and browser-test databases separate. Do not copy
  production data into preview or test environments.
- Never run Playwright against the production database. The test runner refuses
  a missing `TEST_DATABASE_URL`, an exact `DATABASE_URL` match, or a host under
  the configured production domain. CI must set
  `E2E_PRODUCTION_DATABASE_HOSTNAME` to the exact production database hostname.
  The guard also compares canonical database identity without credentials, URL
  scheme aliases, or query ordering. To prevent libpq-style destination
  overrides from bypassing that comparison, test and protected database URLs
  may use only `sslmode`, `channel_binding`, `connect_timeout`, and
  `application_name` query parameters. Parameters that can override host, port,
  database, service, or driver options—and unknown parameters—fail closed.
- Keep database URLs, OAuth tokens, cookie values, and all secrets out of logs,
  screenshots, issues, and commits. `.env*` remains ignored except for the
  empty-value `.env.example` template.
- Apply migrations to preview first. Confirm collection, deletion, retention,
  and admin access there before migrating production.

## 1. Create and link Neon through Vercel Marketplace

1. Open the LafLabs Vercel project and install Neon from **Marketplace**.
2. Create or link a production database for the production environment.
3. Create a separate Neon branch or database for preview deployments.
4. Create another disposable, isolated database for Playwright. It must never
   be the production branch and must not contain a production data copy.
5. Confirm Vercel scopes the intended `DATABASE_URL` to each environment.

## 2. Pull environment variables locally

Install and authenticate the Vercel CLI, link this checkout to the intended
project, and pull the preview environment into the ignored local file:

```bash
vercel link
vercel env pull .env.local --environment=preview
```

Copy `.env.example` to another ignored local file only if needed. Do not add
real values to `.env.example`.

## 3. Generate independent secrets

Generate separate values; do not reuse one secret for another purpose:

```bash
openssl rand -base64 32 # ANALYTICS_HASH_SECRET
openssl rand -base64 32 # AUTH_SECRET
openssl rand -base64 24 # CRON_SECRET (at least 16 bytes)
```

Set the three values independently in Vercel for preview and production. A
change to `ANALYTICS_HASH_SECRET` invalidates existing signed visitor cookies
and their correlation to stored event hashes. Rotating it therefore requires a
deliberate cookie/data transition. Rotating `AUTH_SECRET` invalidates active
admin sessions.

## 4. Register GitHub OAuth callbacks and canonical hosts

GitHub OAuth applications accept one authorization callback URL. They do not
provide a callback allowlist. Use a separate OAuth application per stable origin,
or deliberately replace the callback when switching a development application;
do not expect one application to accept all of the following simultaneously:

| Environment | GitHub callback URL | `AUTH_URL` |
| --- | --- | --- |
| Production | `https://laflabs.co/api/auth/callback/github` | `https://laflabs.co` |
| Stable preview | `https://<stable-preview-host>/api/auth/callback/github` | `https://<stable-preview-host>` |
| Direct local | `http://127.0.0.1:3200/api/auth/callback/github` | `http://127.0.0.1:3200` |
| Current ngrok | `https://freebase-shamrock-magnetic.ngrok-free.dev/api/auth/callback/github` | `https://freebase-shamrock-magnetic.ngrok-free.dev` |

Use a stable preview alias for OAuth verification; an ephemeral Vercel preview
hostname will not match a callback registered for another deployment. Set each
environment's `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` server-side. For direct
local development, browse the exact `127.0.0.1` origin shown above. For the
current ngrok tunnel, start Next.js locally, expose port 3200 at the stable ngrok
origin, and use that HTTPS origin consistently in both GitHub and `AUTH_URL`.

Set `AUTH_TRUST_HOST=true` only when the reverse proxy and host are controlled
and the canonical `AUTH_URL` is correct; Vercel handles trusted-host inference
on its managed deployment. `next.config.ts` allows Next development resources
from `127.0.0.1` and the current ngrok hostname only. The callback registered at
GitHub must exactly match the origin in use, including scheme and host.

Consent and analytics mutation routes do not trust `Host`, `X-Forwarded-Host`,
or `X-Forwarded-Proto` as external-origin authority. They accept the request URL
origin, exact origins configured through `NEXT_PUBLIC_SITE_URL`, `AUTH_URL`, or
`VERCEL_URL`, and same-port loopback aliases for direct development. Configure
the canonical tunnel/preview origin explicitly; malformed values and scheme,
port, subdomain, or lookalike mismatches fail closed.

The application deliberately pins `next-auth@5.0.0-beta.32`. Auth.js v5 is a
beta dependency; do not loosen the pin or upgrade it through a routine package
refresh. Review v5 release notes and rerun the real provider/config, session
serialization, OAuth start, protected-route, and member/non-member checks before
every upgrade.

## 5. Set the administrator organization

Set `ADMIN_GITHUB_ORG=laflabs-inc` in preview and production. GitHub OAuth alone
does not grant access: the callback and protected analytics operation require an
active organization membership. The requested GitHub scope is exactly
`read:user read:org`.

## 6. Run migrations in preview, then production

Review the generated SQL in `drizzle/` before applying it. With the target
environment's database URL loaded as `DATABASE_URL`, run:

```bash
npm run db:migrate
```

Apply to preview and inspect the three analytics tables and indexes first. Run
the unit/build gates and the isolated Playwright suite against preview-like test
infrastructure. Only then switch to the production URL and run the same command
once. Never substitute `TEST_DATABASE_URL` with production merely to make a test
pass.

For the isolated browser database:

```bash
DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate
npm run test:e2e
```

The Playwright suite starts Next.js on `127.0.0.1:3200` and executes the same
eight flows on desktop `1440x1000` and mobile `390x844`. It performs direct
cleanup and assertions only through the guarded `TEST_DATABASE_URL`.

## 7. Deploy and inspect cookie flags

Deploy preview, opt in once, and inspect the response cookies in browser
developer tools. In production, both cookies must be `Secure`, `HttpOnly`,
`SameSite=Lax`, `Path=/`, and have a 180-day maximum age:

- `laf_consent` exists after either explicit choice.
- `laf_visitor` exists only after analytics opt-in.

Withdrawing through the footer must delete the visitor's raw events and rate
window before the visitor cookie is cleared. If deletion fails, the UI must
show a retryable error and preserve the visitor cookie for retry.

## 8. Verify consent, DNT, and public failure isolation

Use a clean browser profile and open the Network panel before loading the page:

1. Confirm the bilingual panel is visible and the page remains scrollable.
2. Wait at least one second and confirm there is no request to
   `/api/analytics/events` before a choice.
3. Choose **Essential only** and confirm there is no analytics request or
   `laf_visitor` cookie.
4. In a fresh profile, choose **Allow analytics** and confirm first-party event
   requests begin without a reload.
5. Repeat with the `DNT: 1` request header. An analytics choice must resolve to
   essential-only, show the DNT notice, and create no visitor cookie.
6. Force the analytics endpoint to return `503`; product, GitHub, email, locale,
   and scroll interactions must continue to work.

Collection is deliberately limited to allowlisted event names and targets. Do
not add IPs, raw User-Agent strings, query strings, form values, coordinates,
page contents, or third-party identifiers.

## 9. Verify organization-member access

In preview, complete the GitHub flow with two real accounts:

1. An active `laflabs-inc` member reaches `/admin/analytics` and sees only
   aggregate consented metrics.
2. A non-member is denied. Removing or suspending membership must also deny the
   next revalidation; GitHub outages fail closed.

An unauthenticated request to `/admin/analytics` must redirect to
`/admin/sign-in`. Placeholder OAuth values are sufficient only for that redirect
test; they do not verify real GitHub access.

## 10. Verify retention in preview

Set a preview-only `CRON_SECRET` and invoke the retention route with its bearer
secret:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://<preview-host>/api/cron/analytics-retention
```

Seed only synthetic preview rows on both sides of the 90-day cutoff. Confirm the
first response reports deletion of only expired rows and windows. Invoke the
same request again and confirm deletion counts are zero, proving idempotence.
Also confirm an absent or incorrect bearer value receives `401`. Vercel Cron is
scheduled daily by `vercel.json`.

## 11. Complete legal review before production collection

Have qualified counsel review the Korean and English consent/privacy copy,
cookie purposes and duration, withdrawal behavior, retention period, and any
jurisdiction-specific disclosure before enabling production collection. Record
the approved policy version and release date. Until that review is complete,
keep production analytics collection disabled or hold the deployment.

## Release and incident checklist

Before release, run `npm test`, the isolated `npm run test:e2e`,
`npm audit --omit=dev`, and `git diff --check`. Confirm no test is skipped and no
browser flow is reported as passing unless it actually executed. A missing test
database is a blocked release check, not a pass.

If collection or the database degrades, keep the public page online, disable
collection at the route/deployment boundary if necessary, and preserve the
withdrawal path. Do not log request bodies, cookies, raw identifiers, OAuth
tokens, or raw connection errors while diagnosing the incident.
