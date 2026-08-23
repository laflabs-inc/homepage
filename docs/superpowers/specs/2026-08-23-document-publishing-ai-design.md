# LafLabs Document Publishing and AI Agent Design

Date: 2026-08-23

## 1. Objective

Extend the existing LafLabs homepage into a small company publishing platform without changing the approved landing-page composition. The platform lets GitHub-organization administrators publish notices, legal notices, disclosures, and design-guide documents from a protected admin area. All four public sections share one branded Markdown rendering system.

The same platform adds an optional OpenAI-powered document assistant. It can draft one-line document summaries and answer questions about the document currently being viewed. AI credentials and all operating limits are configured from a protected `Agent` admin page rather than from source code.

The completed system must preserve these properties of the existing application:

- the homepage and non-document public routes work when the database, OpenAI, or GitHub is unavailable;
- the approved blue, square LafLabs visual language remains intact;
- Korean content is required and English content is optional;
- analytics remains opt-in and separate from essential functionality;
- no AI prompt or answer body is retained by default; and
- no secret is exposed to a Client Component, API response, log, or audit record.

## 2. Scope

### Included

- Public notice, legal, disclosure, and design-guide indexes and detail pages.
- Public read-only content APIs for future LafLabs clients.
- A GitHub-organization-protected document CMS.
- Draft, scheduled/immediate publication, immutable revisions, and archive workflows.
- Korean-required and English-optional localized revisions with no automatic language fallback.
- A shared Markdown renderer styled for LafLabs.
- AI-generated one-line summary drafts or automatic summaries, according to admin policy.
- Per-document AI question and answer with heading-level citations.
- Essential-cookie-gated anonymous AI usage and server-side token accounting.
- An admin Agent page for encrypted OpenAI credentials, model selection, quotas, cost limits, reset timezone, cookie lifetime, and summary policy.
- Audit records for document and Agent changes.
- Scheduled publication and retention cron jobs.

### Excluded

- A global Ask LafLabs search across every document.
- Embeddings or a vector database.
- AI training or fine-tuning on visitor questions.
- Storage of raw questions or answers.
- Advertising, personalization, session replay, or cross-device identity.
- Local admin accounts, invitations, or granular author/reviewer/publisher roles in this release.
- Automatic legal-policy generation or claims that generated legal content is compliant.
- Homepage project/product CMS work; page composition and product presentation remain a separate design-led project.

This document is the follow-on project anticipated by `2026-08-22-consent-analytics-design.md`. It does not relax that specification's analytics consent, minimization, retention, or authorization rules. It supersedes only the earlier statement that CMS work was outside that earlier delivery.

## 3. Architecture

The existing Next.js App Router application remains one deployable unit.

```text
Public browser
  -> public document page
     -> server-side published-document query
     -> shared Markdown renderer
     -> optional Document Assistant client
        -> POST /api/ai/documents/:revisionId/ask
           -> essential consent check
           -> signed anonymous AI identity
           -> quota check
           -> relevant-section selection
           -> OpenAI through server-only provider
           -> usage accounting

Admin browser
  -> GitHub OAuth + laflabs-inc membership
  -> document editor / Agent settings
     -> authenticated admin Route Handlers
        -> Neon PostgreSQL
        -> encrypted OpenAI credential store

Scheduled Vercel requests
  -> publish due document revisions
  -> remove expired AI usage buckets and audit retention data
```

Server Components query repositories directly. Browser mutations use Route Handlers. Every admin Route Handler independently verifies the authenticated GitHub organization member and never relies only on the protected layout.

The implementation is separated into five modules:

1. `documents`: content records, workflows, repositories, APIs, and public pages.
2. `markdown`: safe parsing, table/callout rendering, heading IDs, and table of contents.
3. `agent`: configuration, credential encryption, provider construction, and admin UI.
4. `ai`: relevant-section selection, summary/Q&A prompts, quotas, and usage accounting.
5. `audit`: append-only records for content and Agent changes.

## 4. Public Information Architecture

The following canonical routes are added:

| Route | Purpose |
|---|---|
| `/notices` | Published company notices |
| `/notices/[slug]` | Notice revision selected by current locale |
| `/legal` | Published terms, privacy, cookie, and other legal notices |
| `/legal/[slug]` | Current legal document for the locale |
| `/disclosures` | Published company disclosures |
| `/disclosures/[slug]` | Disclosure detail |
| `/design` | Published design-system and resource guides |
| `/design/[slug]` | Design-guide detail |

The current locale continues to come from `laf_locale`; URLs are not locale-prefixed. A page renders only a published revision in the selected locale. If an English revision does not exist, the English page shows a localized unavailable state and a deliberate Korean-language link. It never silently substitutes Korean content or machine-translates it.

Indexes are ordered by pinned state, publication time, then stable ID. Notices and disclosures support cursor pagination and type filters. Legal and design indexes are small categorized lists.

The footer adds `Notices`, `Legal`, `Disclosures`, and `Design guide` links in Korean and English. No fabricated legal document is seeded or published. Until an administrator publishes one, the legal index displays an honest empty state.

## 5. Document Model

### 5.1 `document_series`

A series is the stable identity shared by all revisions and languages.

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `kind` | enum | `notice`, `legal`, `disclosure`, `design` |
| `slug` | text | Lowercase URL-safe value, unique within kind |
| `category` | text nullable | Allowlisted per kind in application validation |
| `pinned` | boolean | Defaults false |
| `created_by` | text | Stable GitHub user ID |
| `created_at` | timestamptz | Database time |
| `updated_at` | timestamptz | Database time |

Changing a slug is allowed only before the first publication. This avoids silent public-link breakage. Archiving a series hides it from indexes but retains all revisions and audit history.

### 5.2 `document_revisions`

Each locale has an independent revision sequence.

| Column | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `series_id` | UUID | References `document_series` |
| `locale` | enum | `ko` or `en` |
| `revision` | integer | Starts at 1, unique per series and locale |
| `title` | text | 1–160 characters |
| `summary` | text | 1–240 characters; required before publication |
| `body_markdown` | text | 1–200,000 characters |
| `status` | enum | `draft`, `scheduled`, `published`, `archived` |
| `effective_at` | timestamptz nullable | Legal/business effective time |
| `scheduled_at` | timestamptz nullable | Required for scheduled status |
| `published_at` | timestamptz nullable | Set only on publication |
| `created_by` | text | GitHub user ID |
| `updated_by` | text | GitHub user ID |
| `published_by` | text nullable | GitHub user ID or `system:scheduler` |
| `created_at` | timestamptz | Database time |
| `updated_at` | timestamptz | Database time |

Only drafts may be edited or deleted. Publishing creates a new immutable published row or transitions a scheduled immutable snapshot. Editing an already published document begins a new draft revision copied from the published revision. A transaction archives the previously current revision when the replacement publishes.

Korean revision 1 must exist before an English revision can be created. Korean publication is required before its English counterpart can publish. Korean and English schedules remain independent.

### 5.3 Audit records

`admin_audit_log` is append-only and stores:

- action name;
- target type and target ID;
- stable GitHub actor ID plus display name at the time of action;
- non-sensitive structured metadata;
- database timestamp.

Actions include document create/update/delete/schedule/publish/archive, summary generate/accept, Agent settings update, credential register/replace/delete/test, and AI enable/disable. Audit metadata never contains Markdown bodies, API keys, ciphertext, prompts, or answers.

## 6. Publication Workflow

### Draft

- Administrators may create, edit, preview, and delete the draft.
- The editor validates title, summary, slug, category, locale, dates, and Markdown size.
- A draft preview uses the exact public renderer.
- The editor warns about an unpublished Korean counterpart before an English publish action.

### Schedule

- Scheduling freezes the current snapshot and requires a future `scheduled_at`.
- A scheduled revision may be returned to draft before its scheduled time.
- A Vercel cron route publishes due revisions in a database transaction.
- The scheduler records `system:scheduler` as publisher while retaining the scheduling administrator in audit history.

### Immediate publication

- Publication validates every public field and the locale dependency.
- The new revision becomes current atomically and the prior current revision becomes archived.
- Published data is revalidated for its index, detail route, sitemap, and public API.

### Archive

- Archiving removes the current revision from indexes and detail lookup.
- History and audit data remain available to administrators.
- Restoring archived content requires creating and publishing a new revision.

## 7. Public and Admin APIs

### Public read-only APIs

- `GET /api/content?kind=<kind>&locale=<ko|en>&cursor=<opaque>&limit=<1..50>`
- `GET /api/content/<kind>/<slug>?locale=<ko|en>`

Responses contain published fields only. They include stable pagination cursors, ETags, and conservative public cache headers. Draft IDs, audit identities, schedules, and internal metadata are never serialized.

### Admin APIs

- `GET|POST /api/admin/documents`
- `GET|PATCH|DELETE /api/admin/documents/[revisionId]`
- `POST /api/admin/documents/[revisionId]/schedule`
- `POST /api/admin/documents/[revisionId]/publish`
- `POST /api/admin/documents/[revisionId]/archive`
- `POST /api/admin/documents/[revisionId]/new-revision`
- `POST /api/admin/documents/[revisionId]/summary`
- `GET|PATCH /api/admin/agent`
- `PUT|DELETE /api/admin/agent/credential`
- `POST /api/admin/agent/credential/test`

All mutation APIs require same-origin requests, JSON content types, bounded bodies, Zod validation, and a current organization-member session. Conflicts use HTTP 409, validation uses 400 or 422, authentication uses 401, authorization uses 403, and unavailable dependencies use 503. Browser responses never include raw database or OpenAI errors.

## 8. Markdown Rendering Contract

The shared renderer uses `react-markdown`, `remark-gfm`, and a narrow custom plugin for Obsidian-style callouts. Raw HTML is not rendered.

Supported content:

- heading levels 1–6 with deterministic unique IDs;
- paragraphs, emphasis, strong text, links, and horizontal rules;
- ordered, unordered, and task lists;
- blockquotes;
- fenced and inline code;
- GitHub-flavored tables with a horizontally scrollable mobile wrapper;
- images from HTTPS or local public paths, with required alternative text;
- autolinks and strikethrough;
- Obsidian-style `NOTE`, `INFO`, `TIP`, `SUCCESS`, `WARNING`, and `DANGER` callouts; and
- an automatically generated in-page table of contents from level 2 and 3 headings.

Callouts use this source syntax:

```markdown
> [!WARNING] Optional title
> Callout body written in normal Markdown.
```

External links receive `rel="noreferrer noopener"`. Unsafe URL schemes are removed. Heading, link, code, image, table, and callout output is mapped to LafLabs components rather than accepting arbitrary React components from document authors.

Desktop detail pages use a content column plus sticky table-of-contents/AI rail. Mobile uses a single column, collapsible contents, scrollable tables, and a bottom-sheet assistant. Reduced-motion preferences disable animated entrances and scrolling effects without hiding content.

## 9. Admin Document Experience

The protected admin navigation adds `Documents`, `Agent`, and the existing `Analytics` destination.

`/admin/documents` provides kind, status, and locale filters plus title search. Each row displays the series, locale, revision, status, publisher, and relevant date.

The editor uses a desktop split view and mobile tabs:

- metadata and Markdown source on the left;
- exact public preview on the right;
- explicit Save draft, Schedule, Publish, Archive, and New revision actions;
- unsaved-change warning;
- AI summary generation beside the summary field; and
- immutable-state messaging instead of editable controls for published revisions.

No WYSIWYG abstraction is introduced. Markdown remains the source of truth and may be pasted from Notion or Obsidian after ordinary Markdown export.

## 10. Agent Settings and Credential Storage

### 10.1 Settings

`/admin/agent` manages one singleton configuration with these fields:

| Setting | Initial value | Validation |
|---|---:|---|
| AI enabled | false | Cannot enable without a verified credential and model |
| Model | unset | 1–120 printable characters; must pass connection test |
| Anonymous daily total-token limit | 20,000 | 1,000–1,000,000 |
| Daily question limit | 10 | 1–1,000 |
| Maximum output tokens per question | 600 | 64–8,192 and not above daily limit |
| Monthly cost limit | USD 50.00 | USD 1.00–10,000.00 |
| Input price | unset USD per million tokens | Required before AI can be enabled |
| Output price | unset USD per million tokens | Required before AI can be enabled |
| Daily reset timezone | `Asia/Seoul` | Valid IANA timezone |
| AI identity-cookie retention | 180 days | 1–365 days |
| Summary policy | `review` | `review` or `automatic` |

OpenAI usage reports token counts, not a guaranteed invoice amount. The monthly cost guard therefore calculates an estimate from actual input/output usage and the admin-entered per-million-token prices. The UI labels it `estimated cost`, displays the pricing timestamp, and requires administrators to update prices when the selected model changes.

### 10.2 OpenAI credential

The OpenAI API key is registered from `Agent -> OpenAI connection`.

1. The browser sends the key once over HTTPS to an authenticated same-origin Route Handler.
2. The server tests the configured model with a minimal request.
3. On success, the server encrypts the key with AES-256-GCM.
4. Neon stores ciphertext, a unique IV, the authentication tag, a non-reversible fingerprint, verifier status, actor, and timestamps.
5. The plaintext key is discarded after the request and can never be read back through the UI.

`AI_CREDENTIAL_ENCRYPTION_KEY` is a separate 32-byte base64 Vercel environment secret and is never stored in Neon. If it is missing or invalid, credential mutations and AI calls fail closed while the rest of the site remains available.

Replacing a key first validates and encrypts the candidate. The prior encrypted credential remains active if validation fails. Admins can only Test, Replace, or Delete a stored key. Every action is audited with safe metadata.

The Agent page displays configured/unconfigured status, fingerprint, registration actor/time, last test time, last test result, current-month estimated usage, and a prominent kill switch. It never receives encrypted credential columns.

## 11. Essential Cookie and Consent Behavior

The existing consent policy version increments because the essential-purpose disclosure changes.

The panel continues to offer two equal choices:

- `Essential only`: essential site preferences and optional AI functionality, but no site analytics.
- `Allow analytics`: the same essential functionality plus the existing consented first-party analytics.

The details section explicitly discloses that using the AI feature sends the question and selected public-document passages to OpenAI for response generation. Merely choosing a cookie preference does not send anything to OpenAI.

When a visitor first invokes AI after choosing either valid preference, the server creates a signed HttpOnly `laf_ai_identity` cookie. It is:

- essential and used only for AI quota and abuse control;
- `Secure` in production, `HttpOnly`, `SameSite=Lax`, and `Path=/`;
- retained for the admin-configured number of days; and
- independent from `laf_visitor`, which exists only for analytics opt-in.

If consent is absent or from an older policy version, the assistant asks the shared consent provider to reopen settings. Declining analytics does not disable AI. Withdrawing/resetting essential preferences deletes the AI identity cookie when technically possible; expired usage buckets are removed by retention.

Cookie deletion can reset an individual anonymous quota, so it is not a strong identity boundary. The monthly global cost limit and per-request bounds remain the final cost controls. No fingerprinting or raw IP storage is added to make the anonymous limit harder to evade.

The copy and final legal documents require professional legal review before production enablement.

## 12. AI Summary Workflow

Every published revision requires a one-line summary, so indexes never depend on live AI generation.

### Review policy

- `Generate with AI` sends the draft title and Markdown to the server.
- The generated text fills the editable summary field.
- An administrator may edit or reject it.
- It becomes public only when the document revision is published.

### Automatic policy

- If a draft already contains a manual or previously generated summary, publication preserves it and makes no AI request.
- If the summary is empty, the publish action generates one before the publication transaction.
- A generation failure leaves the revision as a draft and returns a safe actionable error.
- An administrator can enter a manual summary and publish without changing the global policy.

The summary prompt requests the document locale, a factual neutral tone, plain text, and at most 180 visible characters. The server enforces the 240-character storage limit and records the model and generation timestamp in audit metadata, not in public output.

Summary-generation usage counts against the monthly global cost limit but not an anonymous visitor's daily quota.

## 13. Per-Document Question and Answer

The first release answers only from the currently published revision.

1. The client submits a question of 1–300 characters and the public revision ID.
2. The server verifies current essential consent and issues or validates the signed AI identity.
3. It loads the published revision directly; draft or archived content is rejected.
4. A deterministic lexical ranker splits Markdown by headings and selects the best three to five sections, bounded to 16,000 characters.
5. The provider receives the question, document title, selected passages, locale, and instructions to refuse unsupported claims.
6. The response streams to the browser and includes cited heading IDs.
7. On completion, actual input/output/total token usage is recorded without prompt or answer text.

Answers must say when the document does not contain enough information. They do not provide legal, financial, or investment advice and do not answer from model memory when the question is outside the supplied passages.

The assistant UI shows remaining daily questions and tokens before submission, a clear error for quota/global-cap/provider failures, Stop and Retry controls, and source links that scroll to cited headings.

## 14. Quotas, Cost Guard, and Usage Records

`ai_usage_daily` is keyed by HMAC-hashed AI identity plus the date bucket calculated in the configured timezone. It stores request count and actual input, output, and total tokens.

`ai_usage_monthly` is keyed by calendar month and stores summary/Q&A request counts, actual tokens, and estimated cost in integer micro-US-dollars.

Before a request, the service rejects it when:

- AI is disabled or misconfigured;
- the daily request count is at its limit;
- recorded daily total tokens are already at the daily limit;
- the configured monthly estimated cost is at its limit; or
- the requested output allowance cannot fit inside the remaining daily budget after a conservative context estimate.

After the provider response, actual usage is added atomically. Because provider-side tokenization is authoritative only after generation, one accepted request may exceed the daily or monthly threshold by at most that request's bounded usage. Subsequent requests are blocked. The UI and runbook describe the monthly limit as a guardrail rather than invoice reconciliation.

Daily usage rows are retained for 32 days. Monthly aggregate rows are retained for 13 months. They contain no prompt, answer, pathname history, source IP, or analytics visitor ID.

## 15. Cache and Revalidation

Public document indexes and details use tagged server caching. Publication or archive invalidates only the affected kind index, locale index, document detail, sitemap, and feed tags.

Admin pages, preview pages, Agent settings, credential operations, and AI routes are dynamic and uncached. Sensitive responses use `Cache-Control: no-store`.

Public APIs use ETags and short shared-cache freshness with stale-while-revalidate. They never expose a response until a revision is published and current.

## 16. Security and Failure Handling

- Credential encryption uses authenticated encryption with a new IV for every write.
- Secret-bearing input is accepted only by the credential endpoint and never placed in shared form state, URLs, analytics, audit metadata, or logs.
- Admin mutation handlers verify authorization and same-origin independently.
- Markdown raw HTML is disabled and URL protocols are allowlisted.
- Prompt construction marks document text as untrusted context and ignores instructions found inside documents.
- Only published passages are sent to OpenAI for public Q&A.
- AI errors are normalized to stable public codes; provider bodies remain server-only.
- Database failure gives document routes a safe retryable error and never breaks the homepage or other non-document routes; OpenAI failure never blocks document reading.
- Credential decryption failure disables AI and emits only redacted operational logs.
- Schedule cron requests require the existing cron bearer authorization pattern.
- Public AI requests have strict JSON sizes and no user-controlled model or system prompt.
- The existing analytics collector never records AI questions or answers.

## 17. Accessibility and Visual Design

New pages inherit the current square geometry, `--blue`, `--ink`, `--paper`, line system, Geist/Pretendard typography, and reduced-motion behavior.

- All document and admin actions are keyboard accessible.
- Focus is visible and never obscured by the sticky header or mobile assistant.
- Tables have captions when supplied and remain operable at 320 CSS pixels.
- Heading hierarchy remains valid even when the source begins at the wrong level; the renderer normalizes the public page title separately from body headings.
- Assistant streaming updates use restrained live-region announcements.
- Color never carries status alone.
- Empty, loading, error, scheduled, and archived states use text plus shape/icon cues.

## 18. Verification Strategy

### Unit tests

- Slug, locale, category, workflow, and immutable-revision validation.
- Published-revision selection without language fallback.
- Markdown heading IDs, safe links, callouts, tables, and hostile HTML handling.
- Agent-settings bounds and enablement prerequisites.
- AES-GCM encrypt/decrypt, unique IVs, wrong-key rejection, and safe credential DTOs.
- Date buckets for `Asia/Seoul`, UTC, and daylight-saving timezones.
- Relevant-section ranking for Korean and English documents.
- Quota decisions and cost arithmetic at exact boundaries.
- Prompt construction that separates untrusted document text from instructions.

### Integration tests

- Admin APIs reject unauthenticated, non-member, cross-origin, and malformed requests.
- Draft create/update/delete and published immutability.
- Immediate and scheduled publication transactions.
- English publication dependency on Korean publication.
- Public APIs return only current published revisions.
- Credential replacement preserves the prior key on failed verification.
- Credential values never appear in responses or audit logs.
- AI refuses absent/old consent and creates an identity after current essential consent.
- Daily token/request limits and monthly cost guard block subsequent calls.
- Provider usage is recorded without raw prompts or answers.
- Automatic and review summary policies follow their distinct workflows.

### Browser tests

- Public index/detail navigation in both locales.
- Missing English revision state and explicit Korean link.
- Markdown table, callout, contents navigation, and mobile overflow.
- Admin document authoring, preview, publication, revision, and archive flows.
- Agent settings validation, masked connection state, and kill switch.
- Consent-policy update, essential-only AI access, analytics opt-in independence, and consent settings reopening.
- AI Q&A streaming, citations, quota message, mobile bottom sheet, and reduced motion.

### Release checks

- Database migrations run against a disposable test database before production.
- TypeScript, ESLint, Vitest, Playwright, and production build pass.
- A production-domain check confirms no analytics request before opt-in.
- A production-domain check confirms no OpenAI request before an explicit AI action.
- Secret scanning confirms no plaintext credential in Git history, build output, browser bundles, logs, or API payloads.
- Legal and privacy copy receives human legal review before AI is enabled.

## 19. Delivery Order

1. Add document schema, repositories, workflows, migrations, and tests.
2. Add public content APIs, pages, Markdown renderer, and navigation.
3. Add protected document admin APIs and editor.
4. Add audit records and scheduled publication.
5. Add Agent settings, credential encryption, and protected admin UI.
6. Update the essential-cookie disclosure and add the AI identity boundary.
7. Add summary generation, per-document Q&A, quotas, and cost accounting.
8. Add end-to-end coverage, operations documentation, and production verification steps.

Each delivery step must leave the public homepage usable and the database migration forward-only. AI remains disabled until an administrator registers a verified key, selects a tested model, supplies pricing, and explicitly enables it.

## 20. Required Runtime Configuration

Existing database, analytics, authentication, and cron configuration remains unchanged. This project adds:

- `AI_CREDENTIAL_ENCRYPTION_KEY`: 32 random bytes encoded as base64.
- `AI_COOKIE_SECRET`: at least 32 random bytes, independent from analytics and authentication secrets.

The OpenAI API key is not a deployment environment variable. It is registered later through the Agent admin page and stored only as AES-GCM ciphertext in Neon.

## 21. Primary Technical References

- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js data security: https://nextjs.org/docs/app/guides/data-security
- Next.js cache APIs: https://nextjs.org/docs/app/getting-started/caching-and-revalidating
- OpenAI Responses API: https://developers.openai.com/api/reference/resources/responses/methods/create
- OpenAI API data controls: https://platform.openai.com/docs/guides/your-data
- Korean Personal Information Protection Act, Article 30: https://www.law.go.kr/
