# Evidence-led `/home` Review

## Scope

- Review surface: `/home`
- Existing `/` composition: unchanged
- Review date: 2026-11-13
- Visual direction: verified software artifacts and restrained technical geometry inside the current Paper, Ink, and Primary Blue system

## Automated checks

- `npm test`
  - design catalog check passed
  - TypeScript check passed
  - ESLint passed
  - 148 test files and 1,443 tests passed
  - production build passed and included `/home`
- Impeccable detector returned no findings for the route and route-local scene files.

## Render review

The first and confirmation passes used these viewports:

- Desktop Korean: `1440 × 1000`, normal motion
- Mobile Korean: `390 × 844`, normal motion
- Mobile English: `390 × 844`, reduced motion

Reviewed in one batch:

- company-first heading hierarchy and intentional Korean/English line breaks
- readable code, standards, and architecture evidence at desktop and mobile sizes
- no use of `/work/*.webp` abstract 3D imagery
- visible selected-work continuation edge and named previous/next controls on mobile
- unavailable Laf ID and lafwall destinations remaining non-interactive
- verified lafetch repository destination
- complete content under reduced motion
- accidental horizontal overflow and cropped content

The initial pass found one Korean word split in the company proof title. `word-break: keep-all` corrected it. The confirmation pass measured zero document-width overflow at all three viewports, and the corrected title remained two lines on both Korean captures.

## Branch review follow-up

The final changed-file review found that the first server response blurred the hero and hid two work items before JavaScript enhancement. The route now serves a complete, readable hero and all three evidence items in the initial HTML, then enables the carousel controls after hydration. The same pass corrected the open-source destination to the exact `lafetch` repository and removed four references to CSS-module classes that were never defined.

Regression coverage now checks the unenhanced server markup and the exact public repository destination.

## Remaining asset limits

- Laf ID is represented by its published OAuth 2.0 and OpenID Connect standards flow, not an unverified product screenshot.
- lafwall is explicitly presented as an architecture study because no public product screen or destination is available.
- No customer photography, customer logos, metrics, or testimonials are used because none have been verified.
- lafetch uses public repository code and the verified GitHub destination as its primary evidence.

## Promotion to `/`

When the experiment is approved, promote it without rewriting the sections:

1. In `app/page.tsx`, replace the `Landing` import and `<Landing />` composition with `EvidenceHome` from `components/home-experiment/evidence-home`.
2. Keep the existing Organization schema, `SiteHeader`, and `SiteFooter` in place.
3. Run the full automated suite and repeat the three render captures against `/`.
4. After production verification, either redirect `/home` to `/` or remove the experiment route in a separate cleanup change.
