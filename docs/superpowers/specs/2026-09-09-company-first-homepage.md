# Company-first homepage redesign spec

## Goal

Move the homepage emphasis from unreleased products to LafLabs itself: what the company builds, how it works, and which public artifacts prove its engineering practice.

## Information architecture

1. Hero: identify LafLabs as a software company and lead to the company section.
2. Company: explain the scope from visible product work through operating infrastructure.
3. How we work: reuse the square three-column `ID / PAY / DOCK` composition for `Problem / Build / Operate`.
4. Selected work: a data-driven, manually controlled showcase for products, open source, internal systems, and future client work.
5. Engineering proof: show real public code and explain the result it produces.
6. Open source: keep the public repository list.
7. News: keep the existing notice/disclosure feed and restrained SIGNAL treatment.
8. Contact: keep the direct email action.

## Content rules

- Korean copy is short, direct, and written in Korean sentence order.
- Do not invent customers, testimonials, metrics, investment information, product availability, or performance claims.
- Product names first appear after the company and work-method sections.
- Status labels make preview and in-progress work explicit.
- Real code, public repositories, and working site systems are preferred to abstract imagery.
- No generated UI that could be mistaken for a shipped product.

## Visual and interaction rules

- Preserve the official logo, route blue, ink/paper palette, thin rules, and square geometry.
- Hero: 64–80px desktop, 40–52px mobile. Section headings: 40–56px desktop, 30–38px mobile. Body: 15–18px.
- Remove long virtual scroll stages, wheel-to-horizontal conversion, and large parallax travel.
- Selected work changes only through explicit previous/next controls, keyboard arrows, or touch swipe. It does not autoplay.
- Entrance motion stays within 8–16px and 300–450ms. Reduced motion reveals final states immediately.
- Support 320px through 1440px without document-level horizontal overflow.
- Preserve locale switching, site search, consent, analytics, documents, admin, GitHub links, and keyboard focus.

## Selected work contract

```ts
type WorkItem = {
  slug: string
  title: string
  category: "product" | "open-source" | "internal" | "client"
  status: "released" | "preview" | "in-progress" | "archived"
  summary: Record<"ko" | "en", string>
  tags: readonly string[]
  href?: string
  featured: boolean
  order: number
  visual: {
    kind: "code" | "document" | "system"
    label: Record<"ko" | "en", string>
    lines: readonly string[]
  }
}
```

The initial entries use only public, verifiable LafLabs work. The visual is authored from real code or a real system structure rather than an invented product screenshot.

## Completion criteria

- Company identity and scope are clear before any product name appears.
- The former product grid communicates `Problem / Build / Operate` without a sticky or horizontal-scroll stage.
- Selected Work is extensible from data and fully operable without a mouse.
- At least one real code sample and its purpose are visible.
- Abstract generated imagery is not used as the main proof.
- Korean and English remain complete.
- Search registry and analytics targets reflect the new sections.
- Unit tests, Playwright behavior checks, typecheck, lint, and production build pass.
