# LafLabs Website and Admin Platform Roadmap

Status: Planned
Last updated: 2026-09-10

## Objective

Evolve the LafLabs website from a company homepage with document publishing into a small, dependable company platform. Public pages should remain focused and trustworthy while the Admin area becomes the operational surface for documents, media, careers, inquiries, and optional AI assistance.

## Product principles

1. Public information stays useful without requiring AI, analytics consent, or an account.
2. Admin workflows share authentication, audit logging, localization, and error handling.
3. Files live in object storage. Neon stores relational metadata and workflow state.
4. Public and private assets use separate access policies from the first release.
5. AI assists an authenticated administrator and never sends an answer automatically.
6. New pages use the existing square, light, blue-accent LafLabs visual language.
7. Each milestone ships independently and has a rollback boundary.

## Existing foundation

- Next.js App Router on Vercel
- GitHub authenticated Admin area
- Neon Postgres with Drizzle migrations
- Versioned Markdown documents with scheduled publishing
- Shared Markdown renderer for public documents and Admin previews
- Configurable OpenAI provider, budget controls, and usage accounting
- Consent-aware first-party analytics
- Site-wide search

## Delivery sequence

| Order | Milestone | Outcome | Size | Depends on |
| --- | --- | --- | --- | --- |
| 1 | Public document index polish | Notices, disclosures, and legal indexes align to the Navbar shell and use a compact document masthead without redundant cross-navigation | S | Existing document platform |
| 2 | Document editor workspace | Explicit Edit, Split, and Preview modes with responsive behavior and a deferred live preview | M | Shared Markdown renderer |
| 3 | Logo motion | Restrained one-time logo reveal plus hover or focus replay with reduced-motion fallback | S | Existing official logo |
| 4 | Media platform foundation | Vercel Blob storage, Neon metadata, protected upload APIs, validation, and Admin asset library | L | Admin auth and audit log |
| 5 | Media authoring integration | Asset picker, Markdown insertion, reference tracking, safe archive, and deletion rules | M | Media platform foundation |
| 6 | Careers page | Bilingual, API-ready careers page backed by typed local content and a real empty state | M | Media platform for reusable visuals |
| 7 | Inquiry platform | Public contact form, protected API, Admin inbox, status workflow, retention, and abuse controls | L | Admin foundation |
| 8 | Inquiry email and AI assistance | Resend notifications, delivery history, optional AI classification, summary, and reply drafts | M | Inquiry platform and Agent settings |
| 9 | Careers publishing | Admin-managed roles with localized draft, published, closed, and archived states | L | Careers page and document workflow patterns |

## Milestone boundaries

### 1. Public document index polish

- Change only `/notices`, `/disclosures`, and `/legal` index composition.
- Keep the current narrow document detail reading width.
- Keep document-type access in the Footer and site search instead of repeating it in every index masthead.
- Preserve query-string filtering, pagination, locale, and public cache behavior.

### 2. Document editor workspace

- Reuse the current renderer and unsaved draft state.
- Add Edit, Split, and Preview controls on every viewport.
- Default to Split on desktop and Edit on mobile.
- Persist the view preference locally without storing document content.
- Keep publishing lifecycle controls unchanged.

### 3. Logo motion

- Preserve the official PNG mark and current wordmark.
- Animate reveal only, without redrawing or distorting the logo.
- Play once per browser session and replay only on deliberate hover or keyboard focus.
- Render the existing static logo when reduced motion is requested.

### 4. Media platform foundation

- Use Vercel Blob for the first storage provider.
- Use direct client upload tokens instead of proxying file bytes through the application server.
- Store searchable metadata, ownership, lifecycle, and audit data in Neon.
- Separate public website media from private future attachments.
- Provide immutable public delivery paths and expiring private access.

### 5. Media authoring integration

- Insert selected assets into Markdown with localized alternative text.
- Record references from documents and future content entities.
- Prevent hard deletion while references exist.
- Support archive, restore, and version replacement without breaking published documents.

### 6. Careers page

- Route: `/careers`.
- Sections: introduction, problems we work on, open roles, working principles, hiring process, and open application.
- Do not invent jobs, benefits, employee counts, or hiring claims.
- When no role is open, show an honest empty state and route proposals to Contact.
- Register the page in Footer, search, metadata, and Sitemap.

### 7. Inquiry platform

- Route: `/contact`.
- Capture inquiry type, name, organization, email, subject, message, required privacy consent, and optional AI-processing consent.
- Route career proposals through the same platform using a career inquiry type.
- Provide an Admin inbox with New, Reviewing, Waiting, Resolved, Spam, and Archived states.
- Keep the initial release text-only while the private media boundary remains ready for later attachments.

### 8. Inquiry email and AI assistance

- Use Resend and React Email rather than operating a mail server.
- Send an administrator notification and a user receipt with idempotent delivery records.
- Process only inquiries with explicit AI consent.
- AI may classify, summarize, prioritize, recommend related public documents, and draft a reply.
- AI never sends a message or changes inquiry status without an administrator action.

### 9. Careers publishing

- Replace the typed local source behind the careers read function without changing page components.
- Reuse document-platform conventions for localization, immutable published revisions, scheduling, and audit history where they fit.
- Keep applications in the inquiry platform instead of building a separate applicant tracking system.

## Release gates shared by every milestone

- Typecheck, lint, unit tests, and production build pass.
- Desktop and mobile layouts are verified in Korean and English.
- Keyboard navigation, focus visibility, and reduced motion are verified.
- New mutations enforce Admin authorization, same-origin checks, schema validation, and bounded request sizes.
- Database changes ship as forward migrations and tolerate a deployment where old and new application versions overlap.
- Error states disclose actionable codes to administrators without exposing credentials or provider payloads.
- Analytics events use the shared `useAnalytics()` or data-attribute system and remain consent-aware.

## Explicitly deferred

- A general-purpose CMS shared by every page
- A standalone applicant tracking system
- Self-hosted SMTP or inbound mail server operation
- Automatic AI replies
- Anonymous public file uploads
- Public inquiry attachments in the first inquiry release
- Real-time collaborative document editing

## Roadmap maintenance

This document records delivery order and product boundaries. Each milestone receives a separate design specification and implementation plan before code changes begin. A milestone moves from Planned to In progress only when its preceding dependency has shipped or the dependency is explicitly removed by an approved design revision.
