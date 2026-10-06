# LafLabs Core UI v2 C3D Recipes Design

Date: 2026-10-06

## Context

Core UI v2 now documents individual actions, selections, forms, overlays,
navigation, structure, and feedback components. The component detail pages are
useful for learning one contract at a time, but they do not yet answer the next
implementation question: which components should be assembled for a real
LafLabs task, and how should that assembly respond across states and viewport
sizes?

C3D will close that gap with production-backed Recipes. A Recipe is a documented
composition of existing Core UI components. It is not a new component, page
template, or abstraction layer.

The site and design system remain private and actively changing, so this
delivery does not publish a migration guide. Deprecated compatibility wrappers
stay tested until their planned removal, but the public design documentation
only recommends current contracts.

## Outcome

Developers, designers, and AI agents can select a common LafLabs task, inspect
the real composition in Korean or English, copy formatted TSX, and understand
its responsive, state, and accessibility rules without reverse-engineering an
application page.

The delivery is successful when:

- every published Recipe renders production components rather than illustrative
  lookalikes;
- Recipe metadata, live previews, copyable code, generated Markdown, AI context,
  Skill references, and `DESIGN.md` come from one typed source;
- the Recipes remain usable at 320px width, 200% text zoom, by keyboard, and
  with reduced motion;
- no application behavior, route, analytics event, or Admin mutation changes as
  a side effect.

## Scope

### Included

1. A typed Recipe catalog in the design-system domain.
2. A Recipe index and one detail route per Recipe.
3. Production-component previews, usage guidance, anatomy, states, responsive
   behavior, accessibility notes, and copyable TSX.
4. Deterministic serialization into the provider-neutral guide, context bundle,
   Skill references, and generated repository guide.
5. Four representative Recipes:
   - Document publishing toolbar
   - Search and filter field
   - Document settings form
   - Collection state surface
6. Automated schema, route, rendering, formatting, localization, and generation
   tests.

### Excluded

- Migration or deprecation documentation.
- New reusable UI primitives created only for a Recipe.
- Broad application adoption or visual rewrites.
- A free-form playground, visual builder, or editable code sandbox.
- New business data, invented product claims, or placeholder customer content.

Representative application adoption remains the next C3D slice after the
Recipe contract is published and reviewed.

## Information Architecture

The existing `/design/patterns` page keeps its role as the high-level
composition-rule reference. Recipes receive their own section because they
contain live controls, multiple states, and copyable implementation code.

| Route | Purpose |
| --- | --- |
| `/design/recipes` | Searchable, category-filterable Recipe inventory |
| `/design/recipes/[slug]` | Full Recipe contract and live production preview |

`Recipes` is added to the design shell navigation. Pattern entries may link to
related Recipes, but Patterns are not renamed or duplicated.

## Typed Recipe Contract

The catalog adds a `RecipeEntry` type with these fields:

- `id`: stable kebab-case identifier and route slug;
- `title`, `summary`, `whenToUse`, `whenNotToUse`, and `accessibility`: bilingual
  text;
- `category`: `action`, `form`, `collection`, or `system-state`;
- `demoKey`: a finite key resolved by an exhaustive Recipe demo registry;
- `components`: IDs of existing catalog components used by the composition;
- `anatomy`: ordered bilingual descriptions of meaningful regions;
- `states`: documented Recipe states using the same `fixture`, `interactive`,
  and `environment` inspection contract as component states;
- `responsive`: ordered bilingual behavior rules;
- `sourcePaths`: repository-relative implementation references;
- `usageExample`: canonical formatted TSX.

Catalog validation rejects duplicate IDs, missing translations, unsafe source
paths, missing component references, unsupported demo keys, incomplete
inspection instructions, and unformatted or empty usage examples.

## Initial Recipes

### Document publishing toolbar

Composes ButtonGroup, Button, Dropdown Menu, and Status Label. It demonstrates a
draft status, save action, primary publish action, and secondary publish options.
The narrow layout wraps status metadata above a full-width action group without
changing action order.

### Search and filter field

Composes Field, Input Group, Combobox, and Button. It demonstrates a named search
field, a filter trigger, clear action, empty results, invalid input, and keyboard
navigation. On narrow screens, filters move below the search input while the
label and error relationship remain intact.

### Document settings form

Composes FieldSet, Field, Input, Native Select, Checkbox, Switch, and Alert. It
shows the complete spacing and semantic relationship of an Admin form rather
than an isolated input gallery. Default, invalid, disabled, and saving states
are documented.

### Collection state surface

Composes Panel, Table or Item rows, Pagination, Skeleton, Empty State, Alert,
Status Label, and Button. Separate state fixtures show loading, populated,
empty, and error outcomes without inventing customer or product claims.

## Preview Architecture

Recipe data remains server-safe and serializable. React previews live under
`components/design-system/recipes/` and are selected through an exhaustive
`recipe-demo-registry.tsx` mapping.

Each preview receives `locale` and an optional `state`. Interactive examples
isolate client behavior in the smallest leaf component. The detail page uses the
existing inspection labels so a reader can distinguish a fixed fixture from a
state they must trigger or an environment preference they must change.

Recipes reuse production exports from `components/ui/*`. Preview-only layout is
allowed, but it may arrange components only; it must not reproduce their visual
or behavioral contract.

## Page Design

The Recipe index follows the existing square Paper, Ink, Line, and Primary Blue
system. It uses full-width rows rather than a generic card grid. Each row shows
the Recipe name, short purpose, category, and component set.

The detail page uses this order:

1. Title, summary, category, and component set.
2. Primary production preview.
3. When to use and when not to use.
4. Anatomy.
5. States and inspection instructions.
6. Responsive behavior.
7. Accessibility contract.
8. Copyable import and usage code.
9. Related component and Pattern links.
10. Source paths.

The preview is generous enough to show the assembly as a real task but does not
imitate an entire Admin page. At small widths it follows the Recipe's documented
collapse behavior instead of scaling a desktop layout.

## Generated and AI Resources

The serializers add a Recipes section to:

- `/design/guide.md`;
- `/design/context.json`;
- `/design/skill/references/patterns.md`;
- repository `DESIGN.md`.

The Skill reference tells an agent to choose a Recipe before composing a common
task, use only its declared component IDs, preserve semantics and order, and
avoid inventing a replacement component. Generated output includes guidance and
formatted TSX, but excludes React runtime code and non-public operational data.

## Accessibility and Responsive Requirements

- Every Recipe has one visible heading or legend that names the task.
- Keyboard order follows visual and task order in all responsive layouts.
- Icon-only actions keep explicit accessible names.
- Errors remain adjacent and programmatically connected to their field.
- Live feedback uses the existing Alert and Toast contracts without duplicate
  announcements.
- Controls retain a 44px target on small screens.
- Focus outlines are not clipped by Recipe preview frames.
- Reduced motion shows a complete stable state immediately.
- At 200% text zoom, action labels wrap only where their component contract
  permits and no action is obscured.

## Testing and Verification

Automated tests cover:

- Recipe schema validation and exhaustive demo-key coverage;
- valid component and Pattern references;
- localized index and detail routes;
- a production preview for every Recipe and state;
- inspection-mode labels and instructions;
- formatted multiline TSX with copy controls;
- deterministic guide, context, Skill, and `DESIGN.md` generation;
- accessibility names, group semantics, field relationships, and state regions;
- typecheck, lint, unit tests, and production build.

Browser verification covers Korean and English at desktop, 320px width, and
200% text zoom, followed by keyboard-only checks for the interactive Recipe
states. Popup layering, long labels, reduced motion, and focus restoration are
verified where the chosen production components require them.

## Delivery Boundary

This PR completes the Recipe publication contract only. The subsequent C3D PR
will select representative existing Admin surfaces, replace local composition
with the documented Recipes where the behavior already matches, and verify that
the documentation survives real application use. That adoption must not add a
second abstraction layer unless repeated application code proves one necessary.
