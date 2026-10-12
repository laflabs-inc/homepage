# LafLabs Careers Page Design

Date: 2026-10-11  
Status: Approved by delegated choice  
Route: `/careers`

## Goal

Create a bilingual careers page that explains what LafLabs works on, how the company works, and how a prospective teammate can approach the company. The page must remain complete and useful when no role is open.

The page is a company surface first and a job listing second. It should strengthen technical credibility for developers and investors without inventing hiring claims.

## Confirmed constraints

- Preserve the current light LafLabs visual system: off-white ground, deep navy text, one cobalt accent, square geometry, bold sans typography, thin rules, and restrained motion.
- Do not invent jobs, benefits, headcount, locations, timelines, customers, or employment conditions.
- Keep the first release local and typed. Do not add the Careers Admin API in this milestone.
- Keep the page components independent from the local data source so Milestone 9 can replace the reader without rebuilding the page.
- The current application path is `mailto:contact@laflabs.co`. The future Inquiry platform may replace this destination without changing the page composition.
- Support Korean and English through the existing locale provider.
- Register the page in Footer, site search, metadata, and Sitemap. Do not add Careers to the compact primary Navbar in this milestone.

## Chosen direction: Open Door

Reference comp: `.impeccable/mocks/decision/careers-open-door.png`

The first viewport uses a 45/55 asymmetric split. A concise recruitment statement and one action sit on the left. A large blue work field on the right connects `BUILD`, `OPERATE`, and `SHARE` with square-ended routes. The field communicates the job itself rather than showing decorative people photography.

The comp supplies composition and hierarchy, not literal UI copy. Its decorative section numbering, vertical side label, extra Navbar item, location label, and any unconfirmed metadata must not ship.

## Page narrative

1. **Introduction**
   - Korean headline: `함께 오래 쓸 시스템을 만듭니다.`
   - English headline: `Build systems that stay useful.`
   - Explain in one short paragraph that LafLabs turns product problems into shared technology and operates what it builds.
   - Primary action jumps to the working-principles section.

2. **Open roles status**
   - Render from a typed `roles` collection.
   - With no entries, show an honest compact empty state: no role is currently open.
   - Offer one open-application action to `contact@laflabs.co`.
   - When roles are added later, the same region renders role rows without changing the surrounding layout.

3. **Problems we work on**
   - Describe three verified areas: product problems, shared foundations, and direct operation.
   - Use concise editorial columns rather than cards or invented project case studies.

4. **Working principles**
   - Reuse and adapt existing company principles: simplicity, reliability, security, scalability, and consistency.
   - Avoid repeating the homepage component. Use a stepped square sequence that reads as one system.

5. **Hiring process**
   - Do not claim a fixed number of interviews or response time.
   - Explain only the stable boundary: introduction, role conversation, mutual scope alignment, and next-step agreement. State that details depend on the role.

6. **Open application**
   - Close with a direct invitation to send an introduction, relevant experience, and the problem area the person wants to work on.
   - Use one email action. Do not add a second competing contact CTA.

## Content model

Create a typed read boundary with localized values:

```ts
type CareerRole = {
  id: string
  slug: string
  title: LocalizedText
  summary: LocalizedText
  team: LocalizedText
  location?: LocalizedText
  employmentType?: LocalizedText
  href?: string
}

type CareersPageContent = {
  hero: LocalizedSection
  problems: readonly LocalizedItem[]
  principles: readonly LocalizedItem[]
  process: readonly LocalizedItem[]
  openApplication: LocalizedSection
  roles: readonly CareerRole[]
}
```

The route consumes only the read function. The first implementation returns typed local content with `roles: []`. A future repository or API may replace that implementation.

## Interaction and motion

- The blue work field reveals its three words and connecting routes once on entry.
- Motion communicates sequence: build, operate, share. It does not loop.
- Section content uses the existing restrained reveal primitive.
- Under reduced motion, all content renders immediately and the route diagram remains complete.
- The mobile layout stacks the copy before the work field. The work field becomes a wide, short composition rather than a desktop square squeezed into the viewport.

## Accessibility and responsive behavior

- Keep semantic heading order, real links, and a proper empty-state message.
- Preserve keyboard focus and existing header/search behavior.
- Keep Korean phrases together where helpful without causing horizontal overflow.
- Verify at desktop and mobile widths in both locales.
- The role status is text, not color alone.

## Analytics

Use the existing consent-aware data attributes for:

- Careers page view through existing page analytics.
- Working-principles jump.
- Open-application email click.
- Future role click when a role exists.

No new analytics subsystem is introduced.

## SEO and discovery

- Add localized page metadata and canonical `/careers`.
- Add `/careers` to `app/sitemap.ts`.
- Add a localized page entry to site search with careers, jobs, hiring, 채용, 합류, and 지원 keywords.
- Add Careers to the Company column in the Footer.

## Testing

- Content reader returns both locales and an empty role collection.
- Empty state and open-application link render in Korean and English.
- A fixture role renders through the same role-list component.
- Footer, search registry, metadata, and Sitemap include `/careers`.
- Reduced-motion behavior does not hide content.
- Full typecheck, lint, unit suite, and production build pass.

## Out of scope

- Admin role CRUD, role detail publishing, scheduling, and audit history.
- Applicant tracking, file uploads, or resume storage.
- Claims about benefits, compensation, team size, hiring volume, or response time.
- A public contact form. That belongs to the Inquiry platform milestone.
