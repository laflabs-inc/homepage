# Homepage Motion Design

**Status:** Approved direction, ready for implementation planning

**Date:** 2026-08-30

## Purpose

Enrich the LafLabs homepage with motion that explains how the company turns product work into durable systems. Preserve the current brand, content hierarchy, routes, conversion paths, square geometry, and cobalt-blue identity.

The primary audiences remain developers evaluating technical credibility and investors evaluating the company. Product visits remain the main conversion path. Contact remains secondary.

## Design Read

This is a targeted evolution of a B2B software-company landing page for technical and investor audiences. The visual language is square, cobalt blue, editorial, and developer-led. Motion should feel precise and authored rather than cinematic or decorative.

- Design variance: 7
- Motion intensity: 7
- Visual density: 4
- Surface mode: Persuade with one Experience-level focal sequence
- Theme: preserve the existing page-level visual world
- Shape system: square controls, nodes, panels, and endpoints
- Accent: the existing LafLabs blue only

## Current-State Audit

### What already works

- The page has a recognizable square and blue identity.
- The hero has its own motion graphic and should remain the first authored moment.
- Product discovery is prominent and uses a distinct horizontal desktop presentation.
- The Build Loop already has a sticky desktop container and scroll progress input.
- Latest Signals has complete loading, ready, empty, and error states.
- Motion uses the installed `motion` package and reduced-motion hooks.

### Problems to solve

- The Build Loop displays all four steps at once. Scroll changes opacity and position, but does not reveal new meaning.
- The final Build Loop step is currently Open source, so the sequence does not land on the promised system outcome.
- The COMPANY copy has an entry animation, but its sequence is too weak to register as a deliberate transition.
- SIGNAL uses a short, one-time glitch that is easy to miss and does not react when content becomes available.
- Desktop behavior is being reused too literally on smaller devices. Mobile needs a natural vertical story rather than pinned scroll choreography.

## Goals

1. Make scroll explain `Product → Shared foundation → Operations → System`.
2. Show one dominant Build Loop state at a time on desktop.
3. Preserve a lightweight, readable vertical sequence on mobile.
4. Make COMPANY and SIGNAL feel alive without competing with the hero or Build Loop.
5. Keep all content legible when scripts fail or reduced motion is requested.
6. Add no new animation, canvas, 3D, or video dependency.

## Non-Goals

- Redesigning the hero or replacing its current video.
- Changing product names, availability, links, navigation labels, routes, or analytics event names.
- Adding unverified metrics, customers, testimonials, or product claims.
- Rebuilding the complete homepage information architecture.
- Introducing GSAP, Three.js, WebGL, scroll hijacking on mobile, or a second horizontal marquee.
- Redesigning Latest Signals document loading or Admin document management.
- Adding a new light/dark theme system in this increment.

## Motion Thesis

### Focal moment

The Build Loop is the single primary scroll narrative. A lone product node becomes shared infrastructure, gains operational boundaries, and resolves into a stable system. Removing the motion would remove the explanation, not merely decoration.

### Continuity

The visual topology must accumulate. Each scene inherits the result of the previous scene so the visitor sees one structure mature rather than four unrelated slides.

### Feedback and supporting motion

- COMPANY acknowledges section entry with one right-to-left arrival sequence.
- SIGNAL acknowledges two meaningful states: the section enters, then the latest-content request settles successfully.
- Existing product, CTA, carousel, and navigation feedback remains unchanged unless a regression is found.

### Performance budget

- Animate transforms, opacity, and bounded clip paths only.
- Do not write continuous scroll values into React state.
- Do not attach a new `window` scroll listener.
- Use the existing Motion library and isolated Client Components.
- Limit SIGNAL to two clipped text layers and one scan line.
- Do not add continuous noise, full-page filters, shader work, or perpetual animation.

## Build Loop Experience

### Content sequence

The bilingual sequence becomes:

1. Product / 제품
2. Shared foundation / 기반 기술
3. Operations / 운영
4. System / 시스템

Open source remains a separate homepage section and is described as one possible outcome of proven internal systems, not the final Build Loop state.

### Desktop composition

At viewports wider than 900 pixels:

- The section occupies `320svh`.
- A `100svh` stage sticks to the top while the visitor scrolls through the sequence.
- The left side contains the section title, lede, and compact four-step index.
- The right side contains one content viewport and one cumulative system topology.
- Only one step title and body is visually exposed at a time.
- Inactive copy stays in semantic DOM order but is visually hidden with opacity and transform, with no interactive descendants.
- The topology remains in place and gains structure at each threshold.

The stable reading intervals are `0-0.20`, `0.28-0.45`, `0.53-0.70`, and `0.78-1.00`. The gaps between them are transitions between adjacent states. These thresholds may move by at most `0.02` during browser tuning, while the order and one-state-at-a-time behavior remain fixed.

### Topology language

The visual is an abstract technical diagram, not a fake product screenshot.

- Product: one blue square node with one clear input/output route.
- Shared foundation: reusable square modules split from the product route.
- Operations: boundary, health, and failure-path lines appear around the modules.
- System: routes and modules settle into one aligned, stable square field marked `LAF`.

The diagram uses semantic HTML/CSS geometry and simple lines. It must not imitate a dashboard, terminal, or fabricated product interface.

### Scroll architecture

- `useScroll({ target })` produces section progress.
- `useTransform` maps progress to scene opacity and transform values.
- React state must not receive per-frame scroll progress.
- A discrete active index is allowed only if required for accessibility or deterministic testing, and must update only when a scene boundary is crossed.
- All scene content exists in the DOM in source order.
- Base CSS leaves content visible. Motion enhancement must not create a blank section when hydration fails.

### Mobile and tablet behavior

At 900 pixels and below:

- Sticky positioning and artificial section height are removed.
- The four stages render as a natural vertical sequence.
- Each stage includes its title, body, and the corresponding accumulated topology state.
- Entry motion is a short opacity and vertical transform triggered once per stage.
- There is no horizontal pan, pinned scroll, or gesture interception.
- The visual order matches the reading order.

### Reduced-motion behavior

- The section uses normal document flow and no pinned scroll choreography.
- All four text stages remain readable.
- The final complete system topology is shown statically after the stages.
- No spatial movement is required to understand the relationship.

## COMPANY Transition

The existing manifesto layout and copy remain.

- The title remains visually stable.
- The explanatory paragraph enters from the right by approximately 48-64 pixels.
- `BUILD QUIETLY. WORK RELIABLY.` follows after a short delay.
- The sequence runs once when roughly 40-45 percent of the content is visible.
- Movement uses the standard confident arrival easing `[0.16, 1, 0.3, 1]`.
- Blur is removed or kept below 3 pixels so the transition stays crisp and inexpensive.
- Reduced motion renders both elements immediately.

This transition communicates that the company's operating principle follows from its broader statement. It is not tied continuously to page scroll.

## SIGNAL Transition

SIGNAL should feel like a transmission becoming legible, not a cyberpunk glitch loop.

### Entry state

- Stable `SIGNAL` text is always present.
- Two clipped duplicate layers offset briefly along the x-axis.
- One thin scan line crosses the word once.
- The total entry sequence lasts approximately 450-600 milliseconds.

### Content-settled state

- A second, quieter 180-260 millisecond alignment pulse may run when the content state changes from loading to ready.
- Empty and error states do not claim successful signal lock.
- Locale changes can produce the settled pulse again only when the newly requested locale reaches ready.

### Guardrails

- No infinite loop.
- No full-panel noise texture.
- No animated background repaint.
- No randomized values that make visual tests unstable.
- Reduced motion displays the stable word only.

## Alignment and Layout Rules

- Reuse the established `--shell` and `--gutter` tokens.
- The Build Loop, Latest Signals, Open Source, Principles, and Contact sections must share the same primary content edges unless an intentional full-bleed visual is documented.
- The topology may extend within its stage, but copy must stay on the shared grid.
- Mobile content uses the same gutter as the rest of the homepage.
- No new rounded container system is introduced.

## Content Changes

Only Build Loop copy changes are allowed in this increment.

Korean final step:

- Title: `시스템`
- Body: `운영에서 확인한 경계와 반복 작업을 오래 쓰는 시스템으로 남깁니다.`

English final step:

- Title: `System`
- Body: `Turn proven boundaries and repeated work into a system designed to last.`

All other factual homepage copy remains unchanged unless a grammatical or layout-breaking defect is found and separately documented.

## Component Boundaries

The implementation plan should preserve these responsibilities:

- `components/sections/build-loop.tsx`: semantic content, progress mapping, desktop/mobile scene rendering.
- `components/sections/build-loop.module.css`: sticky stage, topology geometry, responsive and reduced-motion layout.
- `components/landing.tsx`: COMPANY sequence orchestration only; no new continuous scroll state.
- `components/sections/latest-signals.tsx`: request lifecycle and SIGNAL state trigger.
- `components/sections/latest-signals.module.css`: clipped signal layers and responsive styling.
- `lib/content.ts`: bilingual final-step copy.

If Build Loop becomes difficult to test or reason about in one file, the topology may be extracted into one focused local component. It must remain colocated with the section and receive explicit scene progress or state.

## Accessibility

- Preserve heading levels and section labels.
- The topology is decorative and hidden from assistive technology.
- The complete ordered process remains available as semantic text.
- Keyboard navigation and focus order do not depend on animation state.
- No animation captures wheel, touch, or keyboard input.
- Reduced motion is an intentional alternate composition, not a blank or partially hidden version.
- Text and controls preserve WCAG AA contrast.

## Testing and Acceptance

### Component tests

- Korean and English Build Loop expose the four approved step labels.
- The final canonical step is System, not Open source.
- The topology has deterministic scene markers for all four states.
- Reduced-motion rendering exposes all textual steps and a complete static topology.
- SIGNAL renders stable text in every load state.
- The settled pulse is limited to ready state and never reveals content errors as success.

### Browser tests

At 390, 768, and 1440 pixels:

- No horizontal document overflow.
- Mobile and tablet use natural vertical Build Loop flow.
- Desktop uses the sticky one-state-at-a-time narrative.
- Scrolling through desktop reaches all four scene markers and the final system topology.
- COMPANY copy arrives from the right once and remains readable.
- SIGNAL entry is deterministic and the stable word remains visible.
- Korean and English layouts remain intact.
- Reduced motion removes pinned spatial choreography and preserves content.

### Release gate

- Typecheck, lint, unit/component tests, and production build pass.
- Focused Playwright projects pass.
- Browser inspection finds meaningful content, no framework overlay, and no client errors.
- The implementation does not add a new runtime dependency.

## Delivery and Branching

- Work occurs on `codex/homepage-motion` in an isolated worktree.
- The branch starts from `origin/main` at `b8bac3b`.
- PR #13 contains the preceding Admin stability increment. Before implementation integration, update this branch from the latest `main` after PR #13 merges, or document the temporary stacked relationship if it has not merged.
- Homepage motion changes should remain separable from Admin, database, and OpenAI work.
