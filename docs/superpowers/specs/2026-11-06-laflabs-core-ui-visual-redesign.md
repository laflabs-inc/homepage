# LafLabs Core UI Visual Redesign

## Intent

The Core UI library is functionally broad, but most primitives currently read as
minor variations of the same square outlined box. The previous composition pass
improved workflows and state handling without making the individual components
feel materially more designed. This pass redesigns the high-use primitives
themselves so their purpose, hierarchy, and LafLabs identity remain visible even
when they are viewed in isolation.

The system remains an Operate-mode interface for public pages and Admin tools.
It should feel technical, deliberate, and credible rather than decorative.

## Goals

- Make the visual difference immediately visible on `/design/components`.
- Give each component family a recognizable silhouette and state model while
  retaining one coherent LafLabs grammar.
- Improve harmony when controls are combined in forms, toolbars, panels, and
  overlays.
- Preserve current component semantics, public imports, and application behavior.
- Preserve Paper, Ink, Primary Blue, square geometry, restrained semantic colors,
  and one-pixel structural rules.
- Keep keyboard, focus, reduced-motion, mobile, Korean, and English behavior
  production-ready.

## Non-goals

- Adding rounded corners, shadows, gradients, glass effects, or a second theme.
- Copying shadcn visuals or source.
- Redesigning every low-use primitive in one pass.
- Changing product copy, routes, analytics, server behavior, or data contracts.
- Adding an `expressive` variant that would split the design system into two
  competing visual languages.

## Approaches Considered

### 1. Redesign the six core families — selected

Redesign the most reused component families in place while preserving their APIs.
This creates a visible system-level improvement with bounded regression risk.

### 2. Redesign every primitive

This would maximize consistency but creates a much larger review surface and makes
it difficult to distinguish visual improvements from unrelated regressions.

### 3. Add a new visual variant

This would preserve the current appearance but double documentation and usage
decisions. It also avoids solving the weakness of the default components.

The selected approach is 1 because the user wants visible component changes, not
another recipe-only polish pass, while existing application behavior must remain
stable.

## Visual Direction

The design becomes more authored through structure rather than ornament.

- Ink defines durable outer frames; Line is reserved for internal divisions.
- Primary Blue marks the active decision, not every interactive edge.
- Neutral Wash creates field and support zones without producing nested cards.
- Mono type is reserved for metadata, compact state, and navigational numerals.
- Sans type carries labels and actions with a clearer weight hierarchy.
- Pressed states use a one-pixel inset or controlled color compression rather than
  scale animation that makes operational interfaces feel playful.
- Focus remains a two-pixel blue outline with sufficient offset and no layout shift.

## Family Redesigns

### Actions: Button and Button Group

- Establish a stronger 46px default and 38px compact rhythm while retaining a
  44px minimum mobile touch target.
- Give text and icons a consistent optical gap and align icon buttons to the same
  internal grid.
- Primary uses a decisive Blue plane; Secondary uses Paper with an Ink outer rule;
  Outline becomes a quieter transparent action; Ghost loses unnecessary box-like
  hover treatment.
- Add a distinct pressed state through inset emphasis and tone compression.
- Button Group receives one owned outer frame with Line internal dividers so it
  reads as one control rather than overlapping standalone buttons.

### Forms: Input, Textarea, Native Select, Select, Combobox, and Input Group

- Share one control height, typography, horizontal inset, placeholder tone, and
  disabled surface.
- Default fields use a quiet Line boundary; hover strengthens only the relevant
  edge; focus adds a blue leading rail plus the existing accessible outline.
- Select and Combobox reserve a consistent square icon cell instead of floating an
  icon inside text padding.
- Popup options use a blue side marker and wash background for the active row,
  avoiding a full blue flood for routine navigation.
- Input Group addons become deliberate cells within the shared field chassis and
  no longer compete with the input through equally dark borders.

### Selection: Checkbox, Radio Group, Switch, and Segmented Control

- Checkbox and Radio retain distinct square marks: Checkbox uses a compact check
  or mixed bar; Radio uses a centered solid square.
- Labels receive a larger clickable row with a quiet hover wash and consistent copy
  alignment.
- Switch keeps the approved square track but gains clearer off/on contrast and a
  short mechanical thumb transition.
- Segmented Control uses one Ink frame and a full-height selected plane, with
  separators visible only between inactive peers.

### Feedback: Alert, Toast, Status Label, and Spinner

- Establish one signal language: a colored square/rail, strong title, restrained
  description, and a clearly separated optional action.
- Alert uses a semantic leading cell rather than several equal visual accents.
- Toast becomes a compact notification strip with a stronger content/action split.
- Status Label gains a small semantic block and typographic baseline without a
  surrounding badge.
- Spinner remains the approved non-rotating square-gap loader and is aligned with
  nearby text through explicit component spacing.

### Surfaces: Panel, Dialog, Alert Dialog, Popover, and Side Panel

- Panel gains a recognizable header zone and optional action alignment while the
  body remains visually open.
- Dialog and Alert Dialog receive a top identity rail, more decisive title scale,
  stable close cell, and a footer action zone without decorative separators.
- Popover uses a compact header band and denser body rhythm so it reads as a tool,
  not a miniature generic card.
- Side Panel adopts the same header/body/action grammar at a wider workspace scale.

### Navigation: Pagination and Tabs

- Pagination becomes a lighter rail with direction actions visually separated from
  page numbers; current page uses a blue lower block/plane rather than an oversized
  blue tile.
- Tabs use clearer active typography and a full-width square indicator tied to the
  label, while hover remains quiet.
- Both retain horizontal overflow and 44px touch behavior on mobile.

## Composition Rules

- One outer frame owns a control group; children use internal dividers only.
- A region contains at most one filled Primary action.
- Adjacent components share height and focus geometry.
- Surface headers, bodies, and action zones use repeatable spacing steps rather
  than component-specific arbitrary padding.
- Semantic color is never the only state indicator.
- Loading and disabled states preserve geometry.

## Compatibility and Delivery

- Existing exports and common props remain unchanged.
- CSS Modules and existing Radix/native behavior remain the implementation base.
- Changes land in the existing PR #69 as a new visual-redesign commit.
- Component demos and catalog examples are updated only where required to expose
  the redesigned states; recipes are not the primary deliverable.
- Public generated resources and DESIGN.md remain synchronized.

## Verification

- Targeted component contract and interaction tests.
- Full lint, typecheck, unit suite, design generation check, and production build.
- Desktop and mobile review of the component catalog, including hover, focus,
  selected, disabled, invalid, open, loading, and reduced-motion states.
- Manual review should be able to identify the redesign from the primitive pages
  without relying on recipe pages.
