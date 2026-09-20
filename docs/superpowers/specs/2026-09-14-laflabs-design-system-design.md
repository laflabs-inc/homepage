# LafLabs Living Design System

Status: Approved
Date: 2026-09-14  
Primary surface mode: Read  
Supporting surface mode: Operate

## 1. Purpose

LafLabs needs a durable design reference that serves three audiences from one maintained source:

1. People who need to understand the brand, inspect real components, and copy working usage examples.
2. Developers who need clear component contracts and implementation guidance.
3. AI agents that need deterministic rules, tokens, examples, and a portable Codex Skill package.

The system extends the existing `/design` page into a small documentation area. It does not introduce a separate documentation product or external Storybook deployment.

## 2. Goals

- Make the current LafLabs visual language explicit and browsable.
- Display real, production components rather than illustrative lookalikes.
- Explain when to use a component, when not to use it, and how it behaves across states and screen sizes.
- Provide copyable usage snippets and direct links to implementation source.
- Publish provider-neutral Markdown and JSON for AI use.
- Publish a valid, downloadable `laflabs-web-design` Codex Skill.
- Generate every machine-facing artifact from the same typed catalog used by the website.
- Detect catalog and generated-artifact drift before merge.
- Keep Korean and English human documentation equivalent.

## 3. Non-goals

- Building a general-purpose component playground or visual editor.
- Replacing application tests with snapshot-based design tests.
- Publishing a versioned npm component package in this milestone.
- Cataloging every page-local class as a reusable component.
- Redesigning the homepage, Admin, document renderer, or existing public content.
- Adding a theme switch. The active public brand remains the current light editorial system with deliberate dark contrast surfaces.
- Supporting live code editing or arbitrary code execution in the browser.

## 4. Design direction

The documentation should feel like an authoritative LafLabs reference manual, not a generic component gallery.

- Preserve Paper, Ink, Primary Blue, square geometry, fine rules, Geist, and Pretendard.
- Use one compact page masthead and a stable documentation navigation system.
- Favor flat editorial rows, full-width preview stages, and spacing over card grids and shadows.
- Use motion only to clarify state changes such as navigation, copied feedback, and interactive component examples.
- Do not add decorative section numbering, status dots, pills, gradients, fake screenshots, or ornamental diagrams.
- Keep examples factual. Do not invent customers, metrics, product availability, or company claims.

Design dials:

- `DESIGN_VARIANCE: 4`
- `MOTION_INTENSITY: 3`
- `VISUAL_DENSITY: 6`

## 5. Information architecture

### 5.1 Human-facing routes

| Route | Purpose |
| --- | --- |
| `/design` | Overview, core principles, system version, and navigation to every section |
| `/design/foundations` | Logo, color, typography, spacing, layout, iconography, motion, accessibility, and voice |
| `/design/components` | Searchable or filterable component inventory with real previews and maturity labels |
| `/design/components/[slug]` | Component preview, variants, states, guidance, accessibility, API, usage snippet, and source link |
| `/design/patterns` | Page-level composition rules such as headers, section structures, collection rows, document surfaces, and empty states |
| `/design/assets` | Official logo and approved media assets with usage notes and downloads |
| `/design/ai` | AI consumption guide, stable endpoints, install instructions, package version, and download controls |

The first release does not add separate detail routes for foundations or patterns. Their content is grouped enough to scan on one page. Component details receive individual routes because examples, states, APIs, and code would make a single component index too long.

### 5.2 Machine-facing routes

| Route | Content type | Purpose |
| --- | --- | --- |
| `/design/guide.md` | `text/markdown; charset=utf-8` | Provider-neutral design rules and component summary |
| `/design/tokens.json` | `application/json; charset=utf-8` | Versioned semantic tokens and metadata |
| `/design/skill/SKILL.md` | `text/markdown; charset=utf-8` | Codex Skill entry point |
| `/design/skill/references/foundations.md` | `text/markdown; charset=utf-8` | Detailed visual and content rules |
| `/design/skill/references/components.md` | `text/markdown; charset=utf-8` | Component selection and usage contracts |
| `/design/skill/references/patterns.md` | `text/markdown; charset=utf-8` | Composition and responsive rules |
| `/design/skill/references/tokens.json` | `application/json; charset=utf-8` | Skill-local token reference |
| `/design/skill.zip` | `application/zip` | Installable `laflabs-web-design` skill directory |

All machine routes are public, deterministic, cacheable, and require neither authentication nor analytics consent.

## 6. Source of truth

### 6.1 Catalog modules

The maintained source lives under `lib/design-system/`:

```text
lib/design-system/
  schema.ts
  meta.ts
  tokens.ts
  foundations.ts
  components.ts
  patterns.ts
  assets.ts
  serialize.ts
```

- `schema.ts` defines narrow TypeScript types and validation helpers.
- `meta.ts` stores system name, semantic version, update date, supported locales, and canonical URLs.
- `tokens.ts` stores semantic tokens and their documented purpose.
- `foundations.ts` stores bilingual foundation guidance.
- `components.ts` stores component metadata, demo keys, source paths, maturity, APIs, states, and copyable usage snippets.
- `patterns.ts` stores composition rules and applicable real components.
- `assets.ts` stores asset identity, path, dimensions or format, usage notes, and download eligibility.
- `serialize.ts` converts the catalog into Markdown, JSON, Skill files, and the zip file map.

The catalog stores serializable data only. React nodes are not stored in it.

### 6.2 Demo registry

Real previews live in a separate render registry:

```text
components/design-system/
  design-shell.tsx
  component-demo.tsx
  component-demo-registry.tsx
  code-copy-button.tsx
  design-system.module.css
```

Each component catalog entry references a typed `demoKey`. `component-demo-registry.tsx` maps that key to a preview using the actual exported production component. A missing or duplicate key fails tests.

This boundary keeps AI serialization independent from React while preventing the documentation page from recreating fake versions of components.

### 6.3 Generated repository reference

Root `DESIGN.md` remains the repository entry point for coding agents. It becomes a deterministic generated artifact with a short human-readable introduction and the complete core rules serialized from the catalog.

The generation workflow is:

```text
npm run design:generate
  catalog -> DESIGN.md
  catalog -> public design machine artifacts when static output is required
  catalog -> laflabs-web-design skill package archive

npm run design:check
  regenerate in memory -> compare with committed artifacts -> fail on drift
```

`design:check` must be read-only and becomes part of `npm test`.

## 7. Initial catalog scope

### 7.1 Foundations

- Brand identity and official logo handling
- Semantic color roles and accessible combinations
- Type families, scale, weight, measure, and Korean line-breaking rules
- Shell widths, gutters, spacing scale, and responsive breakpoints
- Square geometry, border weights, and surface hierarchy
- Icon family and sizing
- Motion duration, easing or spring rules, and reduced-motion behavior
- Interaction, focus, keyboard, empty, loading, and error-state requirements
- Korean and English copy voice
- Verifiable-claims policy

Legacy dark-route tokens may remain documented as legacy references but are explicitly excluded from new default surfaces. The current light editorial token set is the default.

### 7.2 Components

The initial catalog includes components that are already reusable or can be extracted without changing product behavior:

- Logo
- Primary, secondary, and inverse actions
- Segmented Toggle
- Icon Control
- Text Link
- Code Block
- Markdown document elements that have stable public contracts

The catalog gives each component one maturity value:

- `stable`: shared production component with a supported import path
- `candidate`: repeated production pattern being extracted in this milestone
- `pattern-only`: composition guidance without a public component API

Only `stable` entries show a supported import statement. Candidate entries may show CSS or markup usage but must state that their API can change. Pattern-only entries belong in `/design/patterns`, not the component index.

### 7.3 Patterns

- Global site header and footer composition
- Editorial section header
- Full-width collection row
- Image-led selected-work module
- Public document index and reading surface
- Empty, loading, and error states
- Responsive one-column collapse
- Dark contrast band within the light public theme

Patterns describe relationships among real components. They do not pretend to be copy-paste page templates.

## 8. Human documentation experience

### 8.1 Global design navigation

All design routes share a local documentation shell below the existing Site Header. Desktop uses a compact left rail within the normal LafLabs shell. Mobile uses an accessible disclosure navigation at the top of the document. The global Site Header and Footer remain unchanged.

The local navigation identifies the current page, supports keyboard use, and does not become a second full website navbar.

### 8.2 Overview

The overview uses:

- a compact masthead stating what the system is for
- a version and last-updated line carrying real metadata
- one large brand specimen
- a plain navigation index organized by Foundations, Components, Patterns, Assets, and AI
- a short "Start here" path for designers, developers, and AI users

### 8.3 Component index

The component index uses editorial rows rather than equal cards. Each row contains:

- component name and maturity
- one-sentence purpose
- actual compact preview
- link to the detail page

Filtering is limited to maturity and category only if the initial catalog exceeds eight entries. A search box is not added until the list is large enough to justify it.

### 8.4 Component detail

Every detail page follows this order:

1. Name, purpose, maturity, and source path
2. Real interactive preview on supported surfaces
3. When to use and when not to use
4. Variants and complete states
5. Accessibility and keyboard behavior
6. Props or stable API
7. Copyable usage snippet
8. Related components and patterns

Preview controls use the shared Segmented Toggle where two surfaces or variants need switching. Code examples use the existing Code Block visual language and a dedicated copy action.

### 8.5 Copy behavior

Copy controls are explicit buttons with an accessible label. Success feedback changes the label briefly and is announced through a polite live region. Clipboard failure leaves the source visible, shows a concise inline message, and never blocks manual selection.

Copy events use the existing consent-aware analytics system:

```text
design_code_copy
target: component slug
```

No code is executed in the browser.

## 9. AI guide and Skill package

### 9.1 Provider-neutral guide

`guide.md` contains:

- system identity and version
- intended use and scope boundary
- non-negotiable brand rules
- token summary
- component selection rules
- composition and responsive rules
- accessibility and motion requirements
- copy and factual-claim rules
- links to detailed public references and source repository

It is concise enough to attach to a prompt without including full component implementations.

### 9.2 Codex Skill

The generated skill directory is named `laflabs-web-design`:

```text
laflabs-web-design/
  SKILL.md
  references/
    foundations.md
    components.md
    patterns.md
    tokens.json
```

`SKILL.md` includes only routing, essential constraints, and instructions that alter an agent's decisions. Detailed catalogs live in references and are loaded only when relevant.

The skill description activates for creating or modifying LafLabs public websites and branded web surfaces. It does not activate for backend-only work, generic third-party products, or dense Admin workflows unless the user asks to apply LafLabs public branding.

The Skill instructs an agent to:

1. Inspect the target repository and factual product content.
2. Read the relevant foundation, component, or pattern reference.
3. Reuse installed LafLabs components when available.
4. Preserve official assets, square geometry, the single blue accent, accessibility, and bilingual behavior.
5. Avoid invented claims and document any unavailable real assets.
6. Verify desktop and mobile behavior, keyboard access, reduced motion, and visible copy before completion.

### 9.3 Distribution

The AI page provides:

- direct links to every machine-readable resource
- a copyable URL instruction for web-capable AI tools
- a copyable shell installation command for Codex
- a `Download Skill` action for `skill.zip`
- package version and generated date

The zip is generated deterministically from the same serialized file map served by the individual Skill routes. It must not contain secrets, repository internals, node modules, or executable scripts.

## 10. Serialization and caching

- Markdown output is UTF-8 and ends with one newline.
- JSON keys have stable ordering and two-space indentation.
- Skill zip entry paths are stable and contain normalized forward slashes.
- Each response includes an `ETag` derived from the serialized bytes.
- Public machine routes use cache headers suitable for revalidation while preserving version accuracy.
- Download responses include safe `Content-Disposition` filenames.
- Serialization never reads request-controlled file paths.

The zip implementation may use one small, maintained compression dependency. No server process shells out to `zip`, `tar`, or other system binaries.

## 11. Localization and copy

- Human pages support Korean and English through the existing locale provider and query behavior.
- Both locales use the same catalog structure. Missing localized required fields fail validation.
- Component names, token names, code, and API identifiers remain in English.
- Explanations, usage guidance, errors, accessibility labels, and navigation are localized.
- Machine-readable rules are written in concise English and include a focused Korean copy reference.
- Visible Korean copy is reviewed for natural word order, short sentences, and `word-break: keep-all` behavior.

## 12. Accessibility and responsive behavior

- Documentation navigation exposes current location with `aria-current="page"`.
- Interactive previews remain keyboard operable and do not trap focus.
- Copy feedback is available without relying on color.
- Color examples include role and contrast guidance rather than color alone.
- Motion examples honor `prefers-reduced-motion` and render a complete static state.
- Desktop component previews and code samples never force the page shell wider than the Navbar.
- Tables and code blocks scroll within their own labeled region on narrow screens.
- The local design navigation collapses before it competes with content width.
- Minimum interactive target sizes follow the actual context, while the visual square can remain smaller inside a larger hit area.

## 13. Integration

- Keep the existing `/design` canonical URL and replace its current monolithic content with the overview.
- Keep Design Guide access in the Footer.
- Register all human-facing subpages in Sitemap and site search.
- Site search returns the most relevant design subpage rather than only the overview.
- Machine-facing routes are excluded from user-facing search results and Sitemap unless a discovery reason emerges.
- Existing public analytics continue to require consent. Machine downloads work without consent.

## 14. Error handling

- An unknown component slug uses the existing not-found surface.
- An invalid catalog fails during type checking or tests, not at request time.
- Missing demo mappings fail tests and render no placeholder in production.
- Clipboard errors are inline and recoverable.
- Serializer or zip failures return a plain non-secret error response with a stable internal code.
- Missing optional assets are omitted from downloads and reported by catalog validation.

## 15. Security and privacy

- All design and AI resources are intentionally public and read-only.
- Usage snippets contain no credentials, internal hostnames, or private configuration.
- Code blocks are text only and are never evaluated.
- Asset paths come from the trusted catalog, not request input.
- The Skill package contains no executable installer and requests no permissions.
- Analytics remains consent-aware and records only the component slug for copy or download events.

## 16. Testing strategy

### 16.1 Catalog tests

- unique foundation, component, pattern, asset, and demo identifiers
- valid slugs and source paths
- complete Korean and English required copy
- supported maturity values
- every stable component has a supported import and source path
- every demo key resolves exactly once
- every downloadable asset exists

### 16.2 Serializer tests

- deterministic Markdown, JSON, and Skill outputs
- valid Skill frontmatter, name, and description
- expected progressive-disclosure reference links
- zip contains the complete file set and no unexpected files
- content types, filenames, ETags, and caching headers
- committed `DESIGN.md` matches current catalog output

### 16.3 Component and route tests

- design overview and every subsection render in both locales
- component index links to valid detail routes
- unknown component slug returns not found
- real previews render actual production components
- source and preview controls retain accessible names and states
- copy success and clipboard failure behavior
- AI download links resolve to their intended route
- Footer, Sitemap, and site search include the new human routes

### 16.4 Visual verification

One bounded browser review covers:

- desktop Korean and English
- mobile Korean and English
- long code samples and tables
- keyboard focus order
- reduced motion
- each supported component state

The user performs the final subjective UI review from the Vercel preview. Automated checks focus on behavior, layout invariants, and regressions.

## 17. Delivery boundaries

Implementation should be split into reviewable phases on one feature branch:

1. Catalog schema, current token normalization, serializers, and drift checks.
2. Documentation shell, overview, foundations, assets, and AI pages.
3. Component inventory, real demo registry, detail routes, and copy controls.
4. Patterns, search, Sitemap, Footer integration, generated Skill archive, and final responsive verification.

Each phase must leave the application buildable. Existing public routes and Admin behavior must remain unchanged outside the explicit design-system integration points.

## 18. Existing baseline issue

A clean `npm install` on `origin/main` currently leaves CodeMirror imports unresolved because these packages are used in source but absent from `package.json`:

- `@codemirror/commands`
- `@codemirror/lang-markdown`
- `@codemirror/state`
- `@codemirror/view`

The implementation plan must add the exact existing-compatible dependencies before using the full test suite as a release gate. This is a dependency declaration repair, not a design-system feature expansion.

## 19. Acceptance criteria

The milestone is complete when:

- a visitor can navigate the design system without encountering one overloaded page
- a developer can inspect a real component, understand its contract, and copy a working usage snippet
- an AI agent can consume a stable Markdown guide and JSON token endpoint
- a Codex user can download a valid `laflabs-web-design` Skill package
- human and machine outputs share one catalog and drift checks pass
- Korean and English documentation are structurally equivalent
- all machine resources remain public and usable without consent or authentication
- the full project verification suite and production build pass from a clean install
- the Vercel preview is ready for final human UI review
