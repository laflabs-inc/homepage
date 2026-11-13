# Evidence-led `/home` Design

## Intent

Build an experimental homepage at `/home` that preserves the current LafLabs layout language while removing the final “AI-generated” impression. The page should feel authored by a real software company because every prominent visual either shows a verifiable artifact or explains a real working principle.

## Goals

- Keep `/` unchanged while `/home` becomes the review surface.
- Preserve the existing square geometry, blue identity, typography, header, footer, bilingual behavior, and company-first positioning.
- Replace abstract 3D product metaphors with product UI, code, repository, document, and system artifacts grounded in existing public information.
- Introduce a restrained flat-illustration language for concepts that cannot be photographed or captured directly.
- Make the result credible to developers and investors without inventing customers, usage metrics, availability, or product capabilities.

## Non-goals and anti-goals

- Do not redesign the global navigation, footer, admin system, or document surfaces.
- Do not modify the production homepage at `/` in this phase.
- Do not add generic AI imagery, glossy 3D objects, purple gradients, fake dashboards, fake customer logos, or fabricated testimonials.
- Do not add sections only to make the page longer.
- Do not require a new image-generation service, video pipeline, or CMS schema.

## Considered approaches

### 1. Asset replacement only

Replace the three generated-looking work images and leave every surrounding composition untouched. This is the lowest-risk option, but it leaves the page without a reusable visual system and only partially addresses the repeated-template feeling.

### 2. Evidence-led editorial system — selected

Keep the page skeleton while assigning each visual one of three jobs: authentic artifact, technical flat illustration, or purposeful motion. This removes the weak imagery, gives future products and notices a repeatable media language, and remains easy to promote from `/home` to `/`.

### 3. Film-led brand overhaul

Lead with photographed people, offices, and a full brand film. This can be strongest eventually, but the source material does not exist yet and it would turn a narrow refinement into a new brand production project.

## Visual authority

The rendered homepage on current `main` is the visual authority for this experiment. The older dark “Signal Routing Field” description in `DESIGN.md` does not override the current light paper, blue, navy, hard-rule, and square-panel implementation. The experiment may refine rhythm and media composition, but it must remain recognizably the same LafLabs site.

## Page sequence and proof

1. **Hero — code becomes a company surface.** Keep the current proposition and compact supporting copy. The focal visual is a transparent, editorial code-to-render scene using real LafLabs naming rather than a generic blue block or product-specific claim.
2. **Company — product, foundation, operation.** Preserve the dark company statement. Support it with a quiet two-dimensional system illustration whose geometry explains the relationship instead of decorating the section.
3. **Method — ASK / BUILD / RUN.** Keep the three-step story and horizontal mobile affordance. Each step receives a compact flat technical scene, but the words remain primary.
4. **Selected work — artifacts, not metaphors.** Laf ID uses a standards-based authentication-flow specimen; lafetch uses its real public TypeScript usage; lafwall uses a clearly labeled architecture study based only on its published description. Status remains visible.
5. **Open source — public evidence.** Present lafetch through code, repository language, license, and public destination. Undisclosed work stays undisclosed and is not visualized as a finished product.
6. **Latest signals.** Reuse the current dynamic notice/disclosure section without inventing editorial thumbnails.

## Asset system

### Authentic artifacts

- Source from existing public LafLabs code, repository metadata, standards named in current copy, and current site content.
- Preserve readable strings at the focal point and simplify only peripheral context.
- Every artifact must have an internal source note in code or content data.

### Technical flat illustrations

- Use blue, navy, off-white, and existing neutral tokens only.
- Use hard-edged rectangles, straight routes, clipped planes, and one consistent stroke weight.
- Avoid people, mascots, faux physical objects, decorative sparkles, gradients, soft blobs, and 3D perspective.
- Illustrations explain relationships such as request → policy → response; they do not stand in for product proof.

### Motion

- Motion must have a cause: code is typed, a request passes through a boundary, or a result resolves.
- One focal movement per scene; 6–10 seconds maximum for a loop.
- Static poster/final state must communicate the same idea.
- Respect `prefers-reduced-motion` and avoid scroll-jacking.

## Responsive behavior

- Desktop may pair copy and evidence side by side.
- Mobile uses purpose-built compact compositions, not scaled-down desktop screenshots.
- Horizontal work navigation must reveal the first card and a visible portion or control indicating that more content exists.
- Real strings, actions, and final states may not be cropped; only filler context may bleed outside a stage.

## Accessibility and performance

- Use semantic headings, links, buttons, and descriptive alt text.
- Decorative diagrams are hidden from assistive technology when nearby copy communicates the same information.
- No essential information exists only in motion or color.
- Prefer HTML/CSS/SVG scenes over heavy raster media; any future video needs WebM/MP4, a poster, muted autoplay, and a reduced-motion fallback.
- Reuse current fonts and dependencies.

## Success criteria

- `/` is unchanged and `/home` is independently reviewable.
- The three abstract 3D work images do not appear on `/home`.
- The hero, method, selected work, and open-source areas each contain at least one credible, content-specific artifact.
- Korean and English layouts remain intentional at desktop and mobile widths.
- The page passes the existing unit, type, lint, design-system, and production-build checks.

## Promotion path

The experiment keeps its content and presentation isolated under `components/home-experiment/`. Once approved, promotion to `/` should be a small composition swap rather than a second redesign. Shared global navigation, footer, locale provider, analytics attributes, and public content APIs remain unchanged.
