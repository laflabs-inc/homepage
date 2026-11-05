---
target: LafLabs design-system component compositions
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-11-05T06-31-02Z
slug: components-design-system-recipes
---
# LafLabs component composition critique

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Loading and error states are clear, but settings saving has no initiating action or success endpoint. |
| 2 | Match System / Real World | 3 | Document-management terminology and ordering are familiar. |
| 3 | User Control and Freedom | 2 | The settings composition has no explicit save or cancel path. |
| 4 | Consistency and Standards | 3 | Tokens are consistent, but the Alert shorthand breaks the intended action layout. |
| 5 | Error Prevention | 3 | Validation is strong, while immediate publishing receives little visual caution. |
| 6 | Recognition Rather Than Recall | 3 | Labels are strong, but empty overlay shells do not expose the controls they promise. |
| 7 | Flexibility and Efficiency | 2 | Primitives are keyboard capable, but composed workflows lack clear completion paths. |
| 8 | Aesthetic and Minimalist Design | 2 | Nested rules, boxes, and equal-weight surfaces flatten hierarchy. |
| 9 | Error Recovery | 3 | Retry and inline errors are actionable. |
| 10 | Help and Documentation | 3 | Guidance is strong, but incomplete examples teach anatomy more than real usage. |
| **Total** | | **27/40** | **Acceptable, close to Good** |

## Design Specificity Verdict

The primitives form a coherent LafLabs family through Paper/Ink, square geometry, restrained Primary Blue, mono metadata, and one-pixel rules. The compositions are less authored: without the text, several scenes could belong to any CMS. The opportunity is to make every scene demonstrate one complete operational story with a focal action and stable payoff.

The deterministic detector returned zero failures and zero advisories across 74 scoped TSX files. The remaining issues are therefore compositional and rendered-behavior concerns rather than detectable markup anti-patterns. Browser visualization was unavailable because no executable browser binary was installed, so no user-visible overlay or screenshot evidence exists.

## Overall Impression

The parts match, but too many parts claim equal visual authority when combined. The main improvement is to define one shell, one focal task, one action rail, and one completion state per composition.

## What's Working

- Buttons, fields, panels, tables, status labels, and overlays share compatible geometry, color, and interaction scales.
- Responsive composition changes are intentional: tables become Items, actions stack, and touch targets grow instead of simply shrinking the desktop layout.
- Invalid, loading, populated, empty, error, draft, and publishing copy is concrete and product-grounded.

## Priority Issues

### P1 — Alert actions do not compose through the title shorthand

The title branch nests every child inside AlertDescription while CSS expects AlertAction as a sibling grid child. Search and collection error recipes therefore cannot use the intended action column reliably.

Fix: add an explicit action prop or require compound slots so AlertContent and AlertAction are siblings. Update the search and collection recipes to one anatomy.

### P1 — Compact publishing toolbar loses split-action hierarchy

At narrow widths, Save, Publish, separator, and caret stop reading as two actions with Publish options.

Fix: make Save a separate secondary action on row one and keep Publish plus caret as one nested split group on row two. Remove the standalone separator in compact mode.

### P1 — Settings form has no cause, focal action, or payoff

Four editable decisions suddenly become disabled with Alert and Spinner, but no Save action caused the change and no completion state follows.

Fix: add a stable Cancel/Save action rail, put loading on Save, group Pin and Publish under a publishing-behavior subsection, and finish with a quiet saved state or Toast.

### P2 — Collection states change geometry and accumulate equal-weight frames

Panel, Table, Pagination, Status Labels, and the preview all draw boundaries. Loading, empty, and error states also move or remove the primary action.

Fix: keep one stable shell and header action across states; make Table and Pagination seamless inside Panel; skeletonize the real table geometry; let one top rule and row dividers carry structure.

### P2 — Overlay demonstrations are empty shells

The filter Popover contains no filters and the Side Panel contains no settings, so their spacing and component harmony cannot be judged as real product UI.

Fix: add two or three real status filters to the Popover and visibility, slug, and publication controls to the Side Panel.

## Persona Red Flags

- Alex, power user: no explicit commit action in settings and a split-action relationship that breaks on compact screens.
- Jordan, first-timer: labels promise filters and settings but reveal empty shells, weakening trust.
- Casey, distracted mobile user: collection actions move between states and Publish becomes separated from its options.

## Minor Observations

- Hide or disable the search clear action when the query is empty.
- Do not enable Next when the example only presents a single numbered page.
- End-align dates in mono and let the document column take most width.
- Reduce EmptyState and SidePanel title scale inside compact Operate surfaces.
- Replace the universal bordered recipe-preview frame with a context-aware neutral ground or unframed treatment.

## Questions to Consider

- Is each recipe documenting anatomy or modelling a shippable workflow?
- Should every recipe show trigger, state, recovery, and payoff?
- Can the system define a seamless-inside-Panel composition rule?
- What is the single focal object in each scene: container, content, or next action?
