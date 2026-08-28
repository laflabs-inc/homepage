# Homepage Signal Stories Design

## Objective

Make the current LafLabs homepage feel more active and substantial without turning it into a news portal or replacing the visual direction the user already approved. The change repairs the inactive build-loop sequence and adds one useful editorial section that surfaces real company publishing activity.

The result should help developers and investors answer two questions while scrolling:

1. How does LafLabs turn product work into reusable engineering?
2. What has the company published recently?

## Scope

This change covers two connected homepage improvements:

- Repair and clarify the motion in “제품에서 시작해 시스템으로 남깁니다.”
- Add a single “Latest Signals” section backed by the existing published-document API.

The hero, product panels, open-source section, principles, contact section, footer information architecture, document routes, and admin publishing flow stay intact.

## Reference Translation

The supplied Samsung and LG references contribute only their information patterns:

- A horizontal story rail that makes several destinations visible without a long vertical list.
- One stronger editorial lead area paired with compact supporting entries.
- Clear corporate information hierarchy that works for both casual visitors and investors.
- Dense utility navigation belongs in the footer or dedicated pages, not in the homepage body.

The homepage will not copy their photography, card styling, rounded geometry, corporate claims, or large navigation systems. LafLabs keeps its square shapes, white and ink surfaces, structural blue, Geist and Pretendard typography, and direct technical tone.

## Design Direction

**Reading:** a corporate developer homepage for developers and investors, with a sharp editorial and technical language.

- `DESIGN_VARIANCE: 7` because the new section uses an asymmetric lead panel and horizontal rail while preserving the existing grid.
- `MOTION_INTENSITY: 6` because motion explains progression and live publishing signals, but never runs as ambient noise.
- `VISUAL_DENSITY: 5` because the page needs more substance while remaining easy to scan.

The implementation extends the incumbent light, square homepage rather than reviving an older dark comp. Blue remains the only accent. No new font, radius, shadow system, or decorative image style is introduced.

## Build Loop Motion

### Desktop

The build-loop section remains a scroll-led sequence. Its timeline begins when the section enters the viewport rather than waiting until its top reaches the top edge. The headline, lead copy, rail, and four steps resolve in a clear order.

- Headline and lead copy enter from the right into their final positions.
- The rail fills from top to bottom.
- Each step moves from right to left while becoming fully opaque.
- Ranges overlap slightly so the sequence feels continuous rather than like four separate page transitions.

### Mobile

The mobile section remains in normal document flow. Each step receives its own viewport entry transition. The existing CSS rule that forcibly removes every transform and opacity animation is removed.

### Reduced Motion

All content renders in its final state. The rail is complete and no animated transform is applied.

## Latest Signals Section

The section sits after the build loop and before open source. This placement turns the operating model into evidence: the company explains how it works, then shows what it has published.

### Composition

The section has two unequal parts on desktop:

- A square blue signal panel with a short bilingual statement and the one-time glitch moment.
- A horizontally scrollable editorial rail containing up to three of the latest published notices, disclosures, and design documents.

The rail uses native horizontal scrolling, scroll snap, visible overflow cues, keyboard-operable previous and next controls, and touch swiping. It is not a scroll hijack. On mobile, the lead panel and rail stack, and each item remains wide enough to read while the next item peeks into view.

Each document entry shows only verified fields already supplied by the publishing system: kind, category when present, publication date, title, summary, and a link to the existing detail route. The section never invents metrics, clients, media coverage, or company milestones.

### Glitch Motion

The “치지직” effect communicates that a new signal is being received. It runs once when the panel first enters view:

- Two or three cropped copies of the same word shift horizontally for a few frames.
- A thin scan band crosses the panel once.
- The panel resolves immediately into clean, stable type.

Only transform and opacity animate. There is no RGB split, neon glow, random infinite noise, sound, canvas, or new motion dependency. Reduced-motion users receive the resolved frame.

### Data Flow

The section is a client leaf because the existing homepage locale can change without a navigation. When the locale changes, it requests the latest items from the existing `/api/content` endpoint for notices, disclosures, and design documents, merges them by publication date, and keeps the newest three.

- Loading: three square skeleton entries matching the final rail.
- Empty: persistent links to Notices, Disclosures, and Design Guide so the section remains useful before content is published.
- Error: the same destination links plus a short, non-blocking availability message.
- Stale requests are aborted when the locale changes or the component unmounts.

No database schema, admin endpoint, or public document API change is required.

## Content and Locale

All new labels and states live in `lib/content.ts` for Korean and English. Korean copy stays concise and avoids translated marketing phrases. Visible section numbering is not added. The new section uses one functional label, “Latest Signals” or “최근 소식,” without repeating the numbered-eyebrow pattern.

## Accessibility

- The section has a semantic heading and region label.
- Rail controls have localized accessible names and disabled states.
- Document links remain normal anchors and support keyboard navigation.
- Loading state is hidden from the accessibility tree except for one polite status message.
- Motion respects `prefers-reduced-motion`.
- Blue, ink, white, muted text, borders, and focus rings retain WCAG AA contrast.

## Verification

- Add component tests for build-loop motion hooks, latest-item merging, empty and error states, localized copy, document links, and rail controls.
- Run typecheck, lint, focused unit tests, the full unit suite, and a production build.
- Inspect desktop and mobile in one bounded browser pass, including Korean, English, reduced motion, touch-width rail behavior, and the repaired build-loop sequence.
- Run the Impeccable mechanical detector once on changed UI files after implementation.

## Deliberate Limits

- One new homepage section only.
- No stock photography or generated marketing imagery.
- No second marquee and no horizontal scroll hijack.
- No automatic carousel movement.
- No changes to footer structure, document administration, document schemas, or publication behavior.
- No fabricated company proof.
