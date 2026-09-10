# LafLabs Website and Admin Platform Design

Date: 2026-09-10
Status: Design approved in discussion; written specification pending review

## Goal

Define a coherent architecture and delivery order for the next LafLabs website and Admin capabilities:

- public document index refinement
- an integrated Markdown editing workspace
- a secure media asset platform
- a careers page that can later become Admin-managed
- a public inquiry form and Admin inbox
- optional inquiry AI assistance
- restrained site-wide logo motion

The design must build on the current Next.js, Neon, GitHub Admin, document publishing, Agent settings, analytics, and search systems without replacing working foundations.

## Scope model

The work is divided into independent vertical milestones. It is not implemented as one generic CMS. Shared infrastructure is extracted only where at least two approved consumers need it.

```text
Public website
  Document indexes
  Careers
  Contact
  Shared Logo

Admin
  Documents
  Assets
  Inquiries
  Agent settings

Services
  Document service
  Asset service
  Inquiry service
  AI usage service
  Email service

Storage
  Neon Postgres: metadata and workflow state
  Vercel Blob public store: website media
  Vercel Blob private store: protected future files
```

## Current-state findings

1. Public document indexes use a 1120px content width while the Navbar uses the 1280px `--shell` token. The mismatch causes visible alignment drift.
2. Document details intentionally use a 920px reading column and should remain unchanged.
3. The document editor already renders the exact shared Markdown preview live. Desktop shows source and preview in two columns; mobile shows tabs.
4. The current `Logo` component renders the official PNG symbol through `next/image` and renders the LafLabs wordmark as text.
5. Neon already contains document lifecycle, audit, analytics, AI settings, provider credentials, and usage tables.
6. Vercel Blob is the first storage provider because the application is already deployed on Vercel and Blob supports direct public and private uploads. Blob access remains isolated behind a focused application module.
7. Transactional inquiry email uses Resend with React Email through the Vercel integration. LafLabs does not operate an SMTP server.

## Design decisions

### No general CMS

Documents, careers, media, and inquiries have different lifecycle and privacy rules. They share infrastructure such as Admin auth, audit logging, localization helpers, and error conventions, but they keep separate services and tables.

### Server components own reads

Public pages and initial Admin pages remain Server Components. Client Components are limited to editing state, filters, uploads, carousels, and other interactions.

### Route Handlers own mutations

Every Admin mutation independently verifies the authenticated actor, request origin, payload size, and schema. UI protection is not treated as authorization.

### Public and private media are distinct

Public media may be cached and linked from documents. Private media requires authenticated, expiring access. Visibility cannot be changed in place because that can accidentally expose a previously private object. Changing visibility creates a new asset version.

### AI remains optional assistance

Inquiry submission works when AI is disabled. Inquiry AI tools require global Agent enablement, an inquiry-specific enable switch, a verified model, available monthly budget, and explicit consent on the inquiry.

## 1. Public document index design

### Composition

The public index root uses `width: var(--shell)` so its left and right edges align with the Navbar and Footer. The detail root retains its existing 920px width.

The oversized page banner is replaced with a compact document masthead:

1. document title
2. one short description
3. document-type navigation for Notices, Disclosures, and Legal
4. one blue active indicator with square geometry

The discovery toolbar sits directly below the masthead. Its controls and the document list share the same alignment grid.

### Responsive behavior

- Desktop: full shell width, compact title scale, inline document-type navigation.
- Tablet: title and type navigation stack while preserving one shell.
- Mobile: 20px outer gutter, horizontally scrollable type navigation if labels do not fit, single-column discovery controls, no viewport overflow.

### Preserved behavior

- locale query parameters
- category and sort filters
- search terms
- cursor pagination
- legal-document grouping
- loading-independent server rendering
- 920px detail reading width

### Acceptance criteria

- Navbar, masthead, toolbar, and list begin and end on the same desktop guide.
- Detail pages have no width or Markdown typography regression.
- Every index remains usable with zero documents and with more than one page of documents.
- Query-string state survives navigation between list pages.

## 2. Document editor workspace

### View modes

Replace the mobile-only two-tab state with a view mode available at every viewport:

- Edit: source form uses the full workspace.
- Split: source and preview share the workspace.
- Preview: rendered document uses the full workspace.

Desktop defaults to Split. Mobile defaults to Edit. The last selected mode is stored as a presentation preference in local storage. Document content is never stored there.

The control is an accessible segmented button group. It uses `aria-pressed` and clear labels rather than pretending three mutually exclusive buttons are page-navigation tabs.

### Preview data flow

```text
EditorValues in memory
  -> React deferred value
  -> DocumentPreview
  -> shared MarkdownDocument renderer
```

The preview never requires saving a draft. `useDeferredValue` lets source input remain responsive while KaTeX, highlighted code, raw-safe HTML, and Mermaid content render at lower priority. The public document and Admin preview continue to share one renderer and sanitation policy.

### Workspace layout

- The view control and save state remain sticky within the Admin content region on desktop.
- Split mode gives the Markdown body meaningful vertical space and lets each pane scroll independently.
- Metadata fields remain above the body editor rather than being duplicated in the preview.
- Preview mode shows the unsaved title and body.
- Switching modes does not alter dirty state.
- Published and archived immutable revisions keep the current read-only preview layout.

### Acceptance criteria

- Switching modes never saves or discards content.
- A newly typed formula, table, code block, HTML block, and Mermaid diagram appears using the production renderer.
- Mobile shows only one pane at a time.
- A refresh restores the view preference but not unsaved document content.
- Existing save, summary, schedule, publish, archive, delete, and dirty-navigation tests remain valid.

## 3. Media asset platform

### Storage model

The first implementation uses Vercel Blob:

- one public Blob store for website media
- one private Blob store for future protected files
- direct browser uploads through short-lived upload tokens
- Neon records as the source of truth for metadata and lifecycle

Blob SDK calls are isolated in `lib/assets/blob-store.ts`. The rest of the application depends on narrow asset operations rather than Vercel SDK response objects. This is an isolation boundary, not a multi-provider plugin system.

### Stable addressing

Public Markdown and content records store a LafLabs asset path:

```text
/media/{assetId}/{safeFilename}
```

The public media route resolves one immutable asset-version ID and redirects to its immutable public Blob URL with cache headers. Replacing an image creates a new asset ID linked through version lineage, so already published content continues to resolve the version it originally referenced.

Private assets have no public media route. Admin preview and download requests verify authorization and return short-lived access.

### Asset record

An asset record contains:

- UUID
- visibility: public or private
- lifecycle: pending, ready, failed, archived, or deleted
- Blob pathname and URL
- original filename and safe display filename
- media type and byte size
- pixel width and height when applicable
- SHA-256 checksum
- Korean and English alternative text
- tags
- creator and timestamps
- archived timestamp and actor
- current version lineage

An asset reference record contains asset ID, owner type, owner ID, field, revision ID when applicable, and timestamps.

### Upload flow

```text
Admin selects file
  -> application issues a scoped client-upload token
  -> browser uploads directly to Blob
  -> finalize endpoint validates Blob metadata and file content
  -> image metadata and checksum are recorded
  -> asset becomes ready
```

Pending uploads that are not finalized are cleaned up by a scheduled job. Failed validation removes the Blob and records a safe failure reason.

### Supported files

The public image release supports JPEG, PNG, WebP, AVIF, and sanitized SVG. GIF is excluded from the first release. The default public file limit is 10 MiB. Private future files default to 25 MiB. Both limits are server configuration with bounded validation.

SVG is parsed and sanitized before it becomes public. Scripts, event attributes, embedded foreign objects, data URLs, and external resource references are rejected.

### Admin asset library

Route: `/admin/assets`

Capabilities:

- drag-and-drop and multi-file upload
- upload progress and per-file errors
- thumbnail grid and compact list views
- filename, dimensions, type, and size
- Korean and English alternative text
- tags and search
- public URL copy
- Markdown copy
- usage references
- archive and restore
- version replacement
- hard delete only when no references exist

### Deletion rules

- Archive hides an asset from new selection but preserves all existing references.
- Restore makes an archived asset selectable again.
- Replace creates a new version and leaves published references unchanged until an editor selects the new version.
- Hard delete requires an archived asset, zero references, explicit confirmation, and an audit-log entry.
- Private retention cleanup uses the same dependency check.

### Editor integration

The Markdown editor receives an Insert image action after the asset foundation ships. It opens a modal asset picker, supports upload without leaving the editor, requires appropriate alternative text, and inserts the stable LafLabs media path.

Reference records are updated when a draft is saved. Publishing uses the references captured for that immutable revision. A body that contains an unknown or deleted asset path fails publish validation with a field-level error.

### Security and operations

- GitHub Admin authorization on every management endpoint
- same-origin enforcement on mutations
- short-lived tokens limited to allowed paths and content types
- randomized storage path independent of user filename
- server-side MIME and signature validation
- EXIF and location metadata removal before public readiness
- SVG sanitation
- checksum-based duplicate warning
- bounded list pagination
- audit logs for upload finalization, metadata changes, archive, restore, replace, and delete
- metrics for upload success, validation failure, bytes stored, orphan cleanup, and delivery resolution errors

## 4. Careers page

### Information architecture

Route: `/careers`

Sections:

1. company and work introduction
2. problems LafLabs works on
3. open positions
4. working principles
5. hiring process
6. open application

The structure is informed by the PacketStream careers page, but the content is specific to LafLabs. Team size, benefits, salary, location policy, and openings are shown only when verified.

### Initial content source

The first release uses typed local data returned by one server-only `getCareersPage(locale)` function. Page components do not import the array directly. The later Admin implementation replaces this function's internals without changing the page contract.

The open-role array may be empty. Empty is a designed state, not sample content. The open-application action links to `/contact?type=career`.

### Public integration

- bilingual metadata
- canonical URL and social metadata
- Footer company navigation
- site-search registry
- Sitemap
- consent-aware view and CTA analytics
- responsive square layout using the existing blue accent

### Future careers publishing

Career records support department, localized title and body, location mode, employment type, sort order, application destination, and draft, published, closed, and archived states. An applicant tracking system is not part of this platform. Applications remain inquiries.

## 5. Inquiry platform

### Public form

Route: `/contact`

Fields:

- inquiry type
- name
- organization, optional
- email
- subject
- message
- required privacy consent
- optional AI-processing consent

Initial inquiry types are Product, Engineering partnership, Business or investment, Career, Media, and Other. The public API accepts stable enum values while labels remain localized.

The first release is text-only. The asset system's private boundary allows a later attachment field without changing inquiry ownership or access rules.

### Submission flow

```text
Validated public form
  -> abuse and rate checks
  -> inquiry transaction in Neon
  -> durable inquiry event
  -> success response with reference ID
  -> asynchronous administrator notification attempt
```

Email delivery failure never loses the inquiry. The Admin inbox reads Neon, not the email provider.

### Inquiry records

The inquiry record stores content, normalized email, inquiry type, locale, status, AI consent, privacy-policy version, source path, created and updated timestamps, resolved timestamp, retention deadline, and latest assigned administrator when present.

Append-only inquiry events store status transitions, internal notes, outbound reply attempts, AI actions, and actor identity. Sensitive provider payloads and API credentials are never copied into the event metadata.

### Admin inbox

Route: `/admin/inquiries`

States:

- New
- Reviewing
- Waiting
- Resolved
- Spam
- Archived

The list supports server-side search, type, status, and date filters. Detail view supports internal notes, status changes, related public-document links, reply composition, email delivery history, and audit history.

### Abuse controls

- Zod schema and bounded JSON body
- same-origin policy
- honeypot field
- minimum completion-time check
- visitor and normalized-email rate windows using the existing database-backed pattern
- message length limits
- generic public error responses
- administrator-visible reason codes
- no client-provided HTML rendering

### Privacy and retention

- The form links to the published privacy notice and records its version.
- AI consent is independent from inquiry submission.
- Resolved inquiries default to deletion or irreversible anonymization after 365 days.
- Spam defaults to deletion after 30 days.
- Legal hold is an explicit Admin action recorded in the event log.
- Analytics visitor identifiers are not joined to inquiry identity.

## 6. Transactional email

The platform uses Resend through the Vercel Marketplace and React Email templates.

Initial messages:

- administrator new-inquiry notification
- user submission receipt
- administrator-authored reply

Each outbound message has a local delivery record and deterministic idempotency key. Webhook events update delivered, bounced, complained, and suppressed states. Provider failure surfaces in Admin and can be retried without duplicating a successfully accepted message.

The sending domain must be verified with SPF and DKIM before production replies. Test environments use provider-approved test identities and never impersonate `laflabs.co`.

## 7. Inquiry AI assistance

### Enablement gates

AI actions are available only when all conditions are true:

1. global Agent setting is enabled
2. inquiry assistance setting is enabled
3. provider credential and selected model are verified
4. monthly budget remains
5. the inquiry includes AI-processing consent

### Supported actions

- concise summary
- inquiry type suggestion
- priority suggestion with reasons
- related published-document suggestions
- reply draft in the inquiry locale

Outputs are stored as versioned AI artifacts with model, prompt-template version, token usage, cost, creator, and timestamp. Regeneration creates another artifact rather than overwriting history.

### Safety boundary

- No automatic email send.
- No automatic status transition.
- No training claim is shown to users.
- Prompt inputs exclude internal notes unless an administrator explicitly selects them.
- Public documents used as context are cited in the Admin result.
- Provider errors use the existing safe Agent error taxonomy.

## 8. Logo motion

### Visual behavior

The official symbol appears through a short rectangular mask reveal. The Laf and Labs wordmark segments follow with a restrained horizontal and opacity transition. Geometry, text, and final dimensions remain identical to the current logo.

### Playback

- Intro plays once per browser session.
- Hover and keyboard focus may replay one short cycle.
- Repeated pointer movement cannot queue animations.
- Reduced motion renders the final static state immediately.
- The animation changes only transform, clip path, and opacity and reserves final layout dimensions from the first frame.

The logo remains a link with the same accessible name. Footer usage may remain static if repeated motion makes the page ending distracting.

## Cross-cutting observability

New systems add structured operational events without storing full private content:

- asset upload started, finalized, failed, archived, restored, and deleted
- inquiry submitted, status changed, email accepted, email failed, AI requested, and AI failed
- careers viewed and application CTA selected through consent-aware analytics
- editor view mode changed through Admin-only operational telemetry if needed

Operational logs use IDs and error codes. They do not log Markdown bodies, inquiry messages, email bodies, uploaded file bytes, provider credentials, or AI prompts.

## Testing strategy

### Public UI

- semantic component tests for document masthead, careers empty and populated states, and contact success and error states
- responsive browser tests for mobile overflow and desktop shell alignment
- Korean and English copy assertions
- keyboard and focus tests
- reduced-motion assertions for logo animation

### Editor

- Edit, Split, and Preview mode transitions
- local preference restoration
- no dirty-state changes from mode switches
- exact renderer fixtures for GFM, HTML, code, KaTeX, and Mermaid
- large-document typing responsiveness smoke test

### Assets

- upload-token authorization and path scope
- MIME spoof, oversized file, unsafe SVG, duplicate checksum, and incomplete upload cases
- reference creation and removal on draft saves
- archive, restore, replace, and hard-delete dependency rules
- public route resolution and private access rejection
- cleanup idempotency

### Inquiries

- validation, origin, honeypot, rate limiting, and duplicate submission handling
- transaction durability when email fails
- Admin status transition rules and audit events
- retention and legal-hold behavior
- idempotent email retries and webhook verification
- every AI enablement gate, budget reservation, consent denial, artifact versioning, and no-auto-send boundary

## Delivery and rollback

Each milestone ships in a separate pull request. Database milestones use additive migrations first. New UI remains hidden until its backing service passes health checks. A rollback never deletes new tables or Blob objects automatically. Scheduled cleanup begins only after the corresponding Admin inspection and audit surfaces are available.

The implementation sequence is maintained in `docs/platform-roadmap.md`. Detailed implementation plans are written per milestone after this design is reviewed.

## Sources

- [PacketStream Careers](https://packet.stream/ko/careers)
- [Vercel Blob documentation](https://vercel.com/docs/vercel-blob)
- [Resend documentation](https://resend.com/docs)
- [React Email documentation](https://react.email/docs/introduction)
