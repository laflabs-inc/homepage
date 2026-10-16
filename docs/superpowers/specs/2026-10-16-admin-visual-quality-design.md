# Admin Visual Quality Refinement (PR C)

**Status:** Approved direction, implementation pending  
**Date:** 2026-10-16  
**Scope:** Existing authenticated Admin workspace only

## 1. Context

PR A and PR B established a shared Admin shell and moved the existing document, media, analytics, and Agent workflows into common page primitives. The information architecture now works, but the presentation still feels assembled rather than designed as one operating environment.

The main causes are:

- shared page headings and spacing still inherit marketing-page proportions;
- repeated controls do not always share the same visual weight or focus treatment;
- feature-specific screens were fitted into common containers without enough attention to their actual working density;
- borders are used too often as local separators, weakening the sense of one connected surface;
- desktop layouts contain avoidable empty space while mobile headers and forms consume too much vertical space;
- loading, empty, error, success, disabled, configured, and unconfigured states do not yet form one coherent system.

PR C is a presentation-only quality pass. It turns the current structure into a restrained, trustworthy operator workspace without changing how any workflow behaves.

## 2. Goal

Create a coherent Admin experience that feels intentionally designed for repeated operational work:

- page identity and the first useful action are visible quickly;
- dense information remains scannable without looking like a generic dashboard;
- the LafLabs square geometry and primary blue remain recognizable but controlled;
- the same role always looks and behaves the same across routes;
- each workflow receives the density and hierarchy it needs;
- desktop, tablet, Korean, English, and mobile layouts all feel authored rather than reduced versions of one another.

The intended character is **Quiet Operations**: editorial clarity, compact product-UI typography, connected work surfaces, and restrained blue accents.

## 3. Non-goals and hard boundaries

This work must not change:

- API routes, request or response payloads, database structures, or storage behavior;
- authentication, authorization, session, or navigation rules;
- route names, document lifecycle, publication rules, media upload/delete behavior, analytics calculations, or Agent behavior;
- field order, field names, validation meaning, save behavior, or existing data;
- labels or user-facing copy except where a line break or presentational truncation is required;
- dependencies, placeholder data, dark mode, or new product features.

No feature may be removed or silently hidden to simplify a layout. Existing component APIs remain stable unless a new optional, presentation-only prop is required. Such a prop must preserve the current default behavior.

## 4. Design principles

### 4.1 Operate before brand expression

Admin is a working tool, not a marketing surface. Brand appears through square geometry, strong alignment, typography, and measured use of blue—not oversized headlines or decorative animation.

### 4.2 Fixed product typography

Admin typography uses a fixed scale at explicit breakpoints. Marketing-style fluid `clamp()` headings are not used. Page titles must remain prominent without displacing the first task below the fold.

### 4.3 Group with space before lines

Spacing and alignment establish local groups. Borders define the outside edge of a meaningful surface or a real row boundary. They are not added around every control, heading, or subsection.

### 4.4 Blue is semantic

Primary blue is reserved for primary actions, selected states, focus, active navigation, and important data emphasis. It is not a general background filler.

### 4.5 Flat square surfaces

Surfaces remain square and flat. No rounded cards, floating card stacks, soft drop shadows, or decorative pills are introduced.

### 4.6 Same role, same treatment

Page titles, section headings, labels, helper text, data values, filters, destructive actions, and status states must be visually identical wherever they perform the same role.

## 5. Shared visual grammar

### 5.1 Typography

Use the existing LafLabs type families and tokens. The target scale is:

| Role | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| Page title | 40px / 44px | 32px / 36px | Weight 700–750; fixed by breakpoint |
| Page description | 15px / 23px | 14px / 22px | Muted ink; readable measure |
| Section title | 22px / 28px | 20px / 26px | One level below page title |
| Subsection title | 16px / 22px | 16px / 22px | Semibold |
| Body/control | 14px / 21px | 14px / 21px | Default operating text |
| Label/meta | 11px / 15px | 11px / 15px | Uppercase or mono only where already meaningful |
| Key data value | 32–40px / 1 | 28–32px / 1 | Fixed breakpoint values, tabular numerals |

Headings wrap naturally and never use manual line breaks that create an orphaned single word. Long Korean and English labels must wrap without clipping or forcing horizontal page overflow.

### 5.2 Spacing

All new or revised spacing derives from this scale:

`4, 8, 12, 16, 24, 32, 48, 64px`

- 4–8px: icon/label and tightly related metadata;
- 12–16px: fields, compact rows, and local control groups;
- 24–32px: subsections and related panels;
- 48–64px: major page regions.

Arbitrary one-off gaps are removed where the shared scale provides an equivalent.

### 5.3 Shell and content width

- Retain the 232px desktop navigation rail and existing responsive shell behavior.
- Retain the 1500px maximum workspace contract.
- Use consistent inner gutters: 48px on wide desktop, 32px on tablet/small desktop, and 16px on mobile.
- Data-heavy regions may use the full available width; prose, configuration forms, and editor settings use a narrower readable measure inside the same shell.
- A route must not create a second unrelated outer width system.

### 5.4 Surfaces and borders

Three surface levels are available:

1. page paper/background;
2. working canvas or primary panel;
3. selected/active row using a subtle blue tint.

Default borders use the shared neutral line token. Strong ink borders are reserved for selected controls, focused fields, destructive confirmation boundaries, or truly primary containers. Nested panels do not repeat a border at every level.

### 5.5 Controls and actions

- Interactive targets remain at least 44px in either dimension.
- Each region has at most one visually primary action.
- Secondary actions use neutral or outline treatment.
- Destructive actions remain visually distinct but are not made louder than the task until confirmation is required.
- Focus-visible treatment is identical across inputs, selects, comboboxes, textareas, buttons, segmented controls, and editor controls.
- Busy and disabled states preserve layout and label width to prevent visual jumping.

### 5.6 Motion

Motion is limited to 150–220ms state feedback for hover, focus, opening, selection, and successful local updates. There is no decorative page-load choreography. `prefers-reduced-motion` removes nonessential transitions.

## 6. Shared Admin primitives

### 6.1 AdminWorkspace

- Keep navigation stable while reducing visual competition with the working area.
- Active navigation uses one unambiguous blue/ink treatment rather than multiple simultaneous indicators.
- Product name, environment/status information, and account actions align to a repeatable vertical rhythm.
- On mobile, navigation becomes a compact bar/drawer without duplicating page actions.

### 6.2 AdminPage and AdminPageHeader

- Page title, supporting description, metadata, and actions form one compact header block.
- Desktop actions align to the title block's top or baseline according to available width.
- Mobile actions move below the description in task order; they do not create an oversized control wall.
- The first page section begins within 32–48px of the header, not after a marketing-sized void.

### 6.3 AdminToolbar

- Filters, search, sort, and view controls appear as one operating group.
- Desktop uses a compact grid or inline arrangement; mobile uses a deliberate single-column order.
- The toolbar does not appear as a heavy box nested inside another heavy box.
- Apply/reset states remain clear even when filters are immediate.

### 6.4 AdminSection

- Section titles and optional actions align consistently.
- A section is not automatically a card. A border is introduced only when the content needs a bounded working canvas.
- Repeated sections use identical heading gaps and action placement.

### 6.5 Feedback and no-data states

Loading, empty, error, success, disabled, configured, and unconfigured states share:

- a concise state title;
- one sentence of useful explanation;
- no more than one primary recovery or next action;
- consistent icon/loader size and spacing;
- a compact footprint appropriate to the surrounding task.

State UI must never resemble a marketing hero or occupy the full viewport unless the route genuinely has no other content.

## 7. Route-specific refinement

### 7.1 Documents list and categories

- Connect filters and results visually through shared alignment and spacing rather than two unrelated bordered blocks.
- Keep document identity, type/category, state, updated time, and actions in a stable scan order.
- Reduce row-action noise until hover/focus where accessibility permits.
- Empty and loading states occupy the result region without changing toolbar position.
- Category management uses the same row, status, action, and confirmation grammar as the document list.

### 7.2 Document editor and guide

- Treat the editor as the primary working canvas and document settings as a supporting region.
- Preserve the current field order and editing behavior.
- Publication state and the primary save/publish action remain visible without using multiple competing blue buttons.
- Metadata, summary, dates, category, slug, and lifecycle controls are grouped by task, not individually boxed.
- Editor toolbar, source/preview switch, validation, and helper content use consistent control height and focus rules.
- The authoring guide remains accessible but visually secondary to the document being edited.

### 7.3 Media library

- Upload is a clear entry task, not a full-page promotional drop zone.
- Filters and search become denser while remaining touch-friendly.
- Image cards prioritize thumbnail, filename/title, format/dimensions/size, status, and actions in that order.
- Metadata and destructive actions must not compete with the image preview.
- Uploading, queued, completed, failed, and deletion states retain card dimensions to avoid layout jumping.
- Mobile uses a readable single-column/list pattern rather than shrinking desktop cards beyond usefulness.

### 7.4 Analytics

- The metric strip provides a fast summary with equal label/value hierarchy.
- Charts share axis, legend, tooltip, grid, and color rules.
- Primary blue represents the main series; secondary series use ordered neutrals or existing semantic colors.
- Funnel, distribution, and table regions use appropriate layouts rather than identical cards.
- Date/range controls remain close to the data they affect.
- Loading and no-data states preserve chart dimensions.
- Tables use local horizontal overflow on narrow screens; the page itself never scrolls horizontally.

### 7.5 Agent settings

- Divide the page into connection, model/policy, limits, and advanced configuration according to user intent.
- Connection state and verification feedback are visible near the relevant control.
- Optional advanced limits remain discoverable without making the default path feel like a long undifferentiated form.
- Numeric usage/cost limits use aligned labels, units, descriptions, and validation.
- The save action and unsaved/busy/success/error states remain stable in position.

## 8. Responsive behavior

Use three authored ranges:

- **Wide/desktop:** 1100px and above;
- **Tablet/small desktop:** 721–1099px;
- **Mobile:** 720px and below.

At every range:

- no page-level horizontal overflow is allowed, including at 390px;
- headings and actions reflow by task priority, not by arbitrary source order;
- tables, code, and charts may use their own local overflow containers;
- mobile does not merely stack every desktop box at full width;
- the first viewport exposes the page identity and either the first task, current state, or primary action;
- fixed or sticky actions must not cover fields, feedback, or browser safe areas.

## 9. Accessibility and language parity

- Keep semantic heading order and existing form associations.
- Maintain visible keyboard focus and logical tab order.
- Preserve at least 44px touch targets.
- Do not rely on color alone for status, selection, or validation.
- Korean and English receive the same information hierarchy and functionality.
- Layouts must tolerate longer English labels and compact Korean labels without separate component structures.
- Tables retain headers and accessible names; chart summaries remain available as text where already provided.

## 10. Implementation sequence

Implementation follows presentation dependency order:

1. tighten shared Admin typography, spacing, gutters, focus, and surface variables;
2. refine `AdminWorkspace`, `AdminPageHeader`, `AdminToolbar`, `AdminSection`, and shared state UI;
3. apply the grammar to documents and editor surfaces;
4. apply it to media;
5. apply it to analytics;
6. apply it to Agent settings;
7. perform cross-route responsive, language, and state consistency passes.

Likely touched areas include:

- `components/admin/admin-workspace.*`;
- `components/admin/admin-page.*`;
- `app/admin/admin.module.css` and Admin route presentation files;
- `components/admin/asset-library.*`;
- shared Admin-only state and control styles.

Functional modules are changed only when required to attach existing content to revised presentation primitives. Business logic changes are out of scope.

## 11. Verification

Automated verification must include the repository's available:

- type checking;
- linting;
- unit/component tests;
- production build;
- design-system validation.

Visual and interaction verification must cover representative routes in Korean and English at desktop, tablet, and mobile widths:

- documents list, category management, editor, and guide;
- media empty, populated, uploading, failed, and deletion-confirmation states;
- analytics populated, loading, and no-data states;
- Agent unconfigured, configured, validating, success, and error states;
- Admin navigation, focus order, overflow, disabled, and busy states.

Run the Impeccable detector once after implementation and resolve applicable findings. Capture representative screenshots or preview evidence for human UI review. Browser-environment limitations must be reported explicitly rather than treated as successful visual verification.

## 12. Success criteria

PR C is complete when:

- elements with the same role are visually and behaviorally consistent across Admin routes;
- no Admin page uses oversized marketing typography;
- the interface reads as connected working surfaces rather than a collection of bordered cards;
- documents, media, analytics, and Agent workflows retain their full existing functionality and field order;
- mobile first view exposes useful context/action and remains free of page-level horizontal overflow at 390px;
- all defined states remain legible and stable without layout jumps;
- both Korean and English pass the same visual hierarchy and interaction checks;
- automated checks pass and the final human review has a concise route/state checklist.

## 13. Rollback

Because PR C is presentation-only, it can be reverted as one branch/PR without data migration or API rollback. Any optional presentation prop added to a shared component must retain the previous default so individual route refinements can also be reverted independently.
