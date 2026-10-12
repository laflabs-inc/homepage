---
version: 1
slug: "app-careers-page-tsx"
primary_target: "app/careers/page.tsx"
related_targets: ["components/careers/careers-page.tsx","components/careers/careers-work-field.tsx","components/careers/careers.module.css"]
---

## Scope and Mode

Careers, Persuade. Primary audience is a developer or operator considering working with LafLabs; secondary audiences are investors and partners checking how the company works.

## Visitor Job and Actions

Understand which problems LafLabs chooses, how the company builds and operates software, check whether a role is open, and start one open-application conversation when relevant.

## Content and Constraints

Use verified bilingual copy from `lib/careers.ts`. The first release has an honest empty role collection. Do not invent jobs, benefits, headcount, locations, hiring timelines, or working conditions. Preserve the compact public Navbar, Footer access, keyboard focus, locale switching, and reduced-motion behavior. Open applications use `contact@laflabs.co` until the Inquiry platform replaces the destination.

## Chosen Direction

Open Door. Approved comp: `.impeccable/mocks/decision/careers-open-door.png`.

The memorable moment is the cobalt work field that reveals BUILD, OPERATE, and SHARE as one connected route. The field explains the job rather than decorating the page with generic people photography.

## Surface Inventory

- Ground: off-white `#f8fafc`; primary type: deep navy `#0f172a`; one cobalt accent: `#2563eb`.
- Geometry: square field, nodes, controls, and thin rules; no decorative radius or elevation.
- Type: existing Pretendard/Geist Sans system with Geist Mono only for short operational marks.
- Hero: concise company statement at approximately 45%, work field at approximately 55%.
- Roles: typed role rows or one truthful compact empty state.
- Narrative: editorial problem columns, one stepped principle sequence, a flexible conversation process, and one open-application close.
- Motion: BUILD, OPERATE, SHARE and their route reveal once; reduced motion reaches the complete state immediately.
- Mobile: stacked copy and a wide, short work field with no horizontal overflow.
- Discovery: Footer, localized search, metadata, and Sitemap point to `/careers`; the primary Navbar remains unchanged.

## Future Boundary

Milestone 9 may replace `readCareersContent()` with Admin-managed role publishing without rebuilding the page components. The Inquiry platform may replace only the final mail destination.

## Unresolved Decisions

No decisions block the first release. Actual roles and employment details must come from Admin-managed verified data later.
