# LafLabs Homepage Rework Design

## Objective

Rework the existing bilingual homepage into a credible B2B software company surface for developers and investors. Product discovery is the primary conversion path. Direct inquiry is secondary.

## Product Truth

- LafLabs is a software company building Laf ID, Laf Pay, and LafDock.
- The homepage may describe only claims already present in the repository or confirmed by the user.
- The official domain is `laflabs.co` and the contact address is `contact@laflabs.co`.
- The official GitHub organization symbol replaces the current generated frontend mark.
- Blue and square geometry remain binding brand commitments.

## Visual Direction

The approved direction is **Signal Routing Field**, composition C. The first viewport uses a deep navy field, a left-aligned company statement, and one large routing plane that connects the three products to Identity, Payments, and Cloud. The routing diagram is functional navigation, not decorative dashboard chrome.

Approved comp: `.impeccable/mocks/homepage/signal-routing-c.png`

### Direction Contract

**THESIS:** LafLabs is one software company routing three infrastructure products through a coherent system. The page refuses the generic light SaaS hero with a fake product screenshot.

**OWN-WORLD:** Deep navy ground, official blue, off-white type, square controls, thin signal paths, and restrained technical labels.

**STORY:** The visitor understands the company, enters a product, verifies engineering substance through open source and principles, then contacts LafLabs if appropriate.

**FIRST VIEWPORT:** Company statement and actions occupy the left. A large three-route product plane occupies the right. Product access is visible without scrolling.

**FORM:** Signal Routing Field, grounded direction 6, seed `96cc2c91`.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Information Architecture

Keep the existing single-page route and stable anchors:

1. Header
2. Hero and product routing plane
3. Company statement
4. Products
5. Technology strip
6. Open source
7. Principles
8. Name story
9. Contact CTA
10. Footer

The implementation may compress or visually combine adjacent sections, but it must preserve their factual content and anchor behavior.

## Component Strategy

- Reuse the existing Next.js, Tailwind, Motion, locale provider, copy tables, and reveal utility.
- Replace the handwritten logo SVG with an image asset derived from the official GitHub organization avatar.
- Recompose the hero and product presentation around one reusable routing visual; do not add a new graphics dependency.
- Retain separate section components where they already provide useful content boundaries.
- Remove repeated editorial labels and section numbering where they create template-like rhythm.

## Approved Comp Inventory

| Ingredient | Implementation medium | Commitment |
| --- | --- | --- |
| Official symbol | Existing raster asset with recorded GitHub origin | Exact recognizable mark, never regenerated |
| Hero copy and actions | Semantic HTML and CSS | Product CTA primary, contact secondary |
| Product routing plane | CSS Grid and SVG paths | One large plane, three named routes, square endpoints |
| Signal response | Existing Motion dependency | One restrained path reveal; static under reduced motion |
| Navy surface texture | CSS background | Very subtle; must not obscure text or routes |
| Typography | Existing self-hosted Geist Sans and Mono | Large Korean headline, small technical labels |
| Remaining sections | Semantic HTML, existing content data | Same visual grammar without repeating the hero diagram |

Generated comp text is not source copy. The implementation uses `lib/content.ts` and the confirmed domain and email. Product-specific icons invented by the image model are not carried forward.

## Responsive Behavior

- Desktop: 45/55 hero split with the routing plane visible beside the message.
- Tablet: reduce diagram density while keeping all three product links visible.
- Mobile: stack the message above three direct product routes; no miniature desktop diagram and no horizontal overflow.
- Header remains one line on desktop and collapses to the existing essential actions on small screens.

## Accessibility and Motion

- Preserve semantic headings, landmarks, keyboard access, focus indicators, bilingual text, and WCAG AA contrast.
- Product routes are real links with accessible names.
- Motion communicates the split from one company into three products and uses only transform, opacity, or SVG drawing.
- `prefers-reduced-motion` receives the complete static state.

## Verification

- Run typecheck, lint, and production build.
- Verify Korean and English modes, light and dark theme behavior, all product and contact links, and reduced motion.
- Inspect desktop and mobile screenshots in one bounded review pass.
- Run the Impeccable detector on changed UI targets and address mechanical findings.

## Deliberate Limits

- No new UI, animation, or graphics dependency.
- No fabricated customers, testimonials, metrics, pricing, or product availability.
- No new routes, CMS, contact form, analytics system, or investor data room.
