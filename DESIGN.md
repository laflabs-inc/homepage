---
name: LafLabs Homepage
description: A square, signal-routing visual system for LafLabs company and product surfaces.
colors:
  route-blue: "#165dff"
  route-blue-deep: "#0f4bd8"
  route-blue-soft: "#112b5d"
  page-navy: "#0b1328"
  raised-navy: "#101c35"
  subtle-navy: "#0e1931"
  inverse-navy: "#071022"
  off-white: "#f4f7fb"
  blue-grey: "#8ba7d9"
  border-blue: "#263d68"
  border-blue-strong: "#385a91"
  route-line: "#8fb6ff"
  route-endpoint: "#5e8fe8"
  pure-white: "#fff"
  button-ink: "#0a0e18"
  mask-black: "#000"
typography:
  display:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "clamp(44px, 6.6vw, 96px)"
    fontWeight: 780
    lineHeight: 1.02
    letterSpacing: "-0.055em"
  body:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "clamp(15px, 1.15vw, 17px)"
    lineHeight: 1.75
  small-display:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "clamp(34px, 4.6vw, 66px)"
    fontWeight: 780
    lineHeight: 1.06
    letterSpacing: "-0.05em"
  hero:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "clamp(48px, 5.2vw, 78px)"
    fontWeight: 780
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  mobile-hero:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "clamp(42px, 13vw, 62px)"
  statement:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "clamp(30px, 5.4vw, 78px)"
    fontWeight: 720
    lineHeight: 1.16
    letterSpacing: "-0.045em"
  name-display:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "clamp(40px, 8vw, 122px)"
    fontWeight: 780
    lineHeight: 1
    letterSpacing: "-0.06em"
  product-title:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "clamp(28px, 3.4vw, 46px)"
    fontWeight: 760
    lineHeight: 1.06
    letterSpacing: "-0.05em"
  principle-title:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "clamp(24px, 2.9vw, 40px)"
    fontWeight: 760
    lineHeight: 1.08
    letterSpacing: "-0.045em"
  repository-title:
    fontFamily: "Geist Mono, monospace"
    fontSize: "clamp(17px, 1.9vw, 24px)"
    fontWeight: 620
    letterSpacing: "-0.03em"
  marquee:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "clamp(18px, 2.2vw, 30px)"
    fontWeight: 640
    letterSpacing: "-0.035em"
  body-compact:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "14.5px"
    lineHeight: 1.75
  body-small:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "13.5px"
  nav:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "13px"
  note:
    fontFamily: "Geist Sans, Pretendard, sans-serif"
    fontSize: "14px"
  mono-small:
    fontFamily: "Geist Mono, monospace"
    fontSize: "12px"
  mono-route:
    fontFamily: "Geist Mono, monospace"
    fontSize: "clamp(10px, 0.85vw, 13px)"
    letterSpacing: "0.06em"
  mono-detail:
    fontFamily: "Geist Mono, monospace"
    fontSize: "10.5px"
  mono-index:
    fontFamily: "Geist Mono, monospace"
    fontSize: "11px"
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "10px"
    fontWeight: 600
    letterSpacing: "0.2em"
rounded:
  square: "0rem"
components:
  button-primary:
    backgroundColor: "{colors.route-blue}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.square}"
    padding: "0 24px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.off-white}"
    rounded: "{rounded.square}"
    padding: "0 24px"
  button-light:
    backgroundColor: "{colors.off-white}"
    textColor: "{colors.button-ink}"
    rounded: "{rounded.square}"
    padding: "0 24px"
  icon-control:
    backgroundColor: "transparent"
    textColor: "{colors.off-white}"
    rounded: "{rounded.square}"
    height: "38px"
    width: "38px"
---

# Design System: LafLabs Homepage

## Overview

**Creative North Star: "Signal Routing Field"**

LafLabs uses a compact, dark-only technical plane: deep navy surfaces, thin blue-grey rules, one structural blue family, and square geometry. The system should feel like infrastructure made legible rather than a collection of marketing cards.

Product discovery is primary. The signature routing field connects one company origin to three product paths, while downstream sections continue as direct editorial rows separated by spacing and rules.

**Key Characteristics:**

- Dark, single-theme technical surfaces with one blue accent.
- Square endpoints, controls, markers, and corners.
- Large Geist Sans headlines paired with restrained Geist Mono labels.
- Flat section bands and dividers instead of cards or decorative depth.
- Bilingual Korean and English copy with line breaks and measures that survive both locales.

## Colors

The palette uses Route Blue as the only accent and blue-tinted neutrals for every dark-surface role.

### Primary

- **Route Blue (`#165dff`):** Filled primary actions and large structural accents. Off-white text on Route Blue is `4.83:1`.
- **Deep Route Blue (`#0f4bd8`):** Primary-button hover state.
- **Soft Route Blue (`#112b5d`):** Quiet active and hover backgrounds.
- **Route Line / Readable Blue (`#8fb6ff`):** Routes, small blue metadata, live status, and focus outlines. It is `9.05:1` on Page Navy and `6.75:1` on Soft Route Blue.
- **Route Endpoint Blue (`#5e8fe8`):** 1.5px endpoint strokes on Raised Navy; the pair is `5.30:1`.

### Neutral

- **Page Navy (`#0b1328`):** Default page ground and browser theme color.
- **Raised Navy (`#101c35`):** Route endpoint fill and raised dark details.
- **Subtle Navy (`#0e1931`):** Alternating section band.
- **Inverse Navy (`#071022`):** Contact section ground.
- **Off-white (`#f4f7fb`):** Primary text and light controls.
- **Blue-grey (`#8ba7d9`):** Secondary text and unavailable labels.
- **Border Blue (`#263d68`):** Default one-pixel rules.
- **Strong Border Blue (`#385a91`):** Emphasized rules and outline-button borders.
- **Pure White (`#fff`):** Primary-button text, active language text, and high-contrast hover text.
- **Button Ink (`#0a0e18`):** Text on the off-white contact button.
- **Mask Black (`#000`):** Opaque center stops in the technology-strip edge mask; it is not a visible surface color.

**The One Route Rule.** Route Blue is the only accent; do not add competing semantic colors without a product requirement.

## Typography

**Display Font:** Geist Sans with Pretendard and sans-serif fallbacks

**Body Font:** Geist Sans with Pretendard and sans-serif fallbacks

**Label/Mono Font:** Geist Mono with monospace fallback

Geist Sans keeps company copy direct and dense. Geist Mono is reserved for route metadata, statuses, repository languages, and compact navigation labels.

### Hierarchy

- **Display** (780, `clamp(44px, 6.6vw, 96px)`, 1.02): Primary section statements.
- **Small display** (780, `clamp(34px, 4.6vw, 66px)`, 1.06): Supporting section headlines.
- **Hero** (780, `clamp(48px, 5.2vw, 78px)`, 1.08): Two-line company proposition with a 10-character measure.
- **Body** (`clamp(15px, 1.15vw, 17px)`, 1.75): Explanations, normally limited to 58 characters; hero copy uses 43 characters.
- **Route metadata** (`clamp(10px, 0.85vw, 13px)`, 0.06em tracking): Product names and infrastructure layers in the hero routing plane.
- **Editorial label** (600, `10px`, 0.2em tracking, uppercase): The single statement-section label; it is not a required preface for every section.

**The Two Voices Rule.** Sans carries meaning; mono carries compact system metadata.

## Layout

The desktop shell is `min(1280px, calc(100% - 56px))`. Sections use responsive vertical padding from 80px to 150px and one-pixel dividers to establish rhythm. The hero fills at least the viewport below the 72px header and uses a `45fr / 55fr` copy-to-routing grid.

- At widths above 1080px, the hero is a 45/55 message and routing split. Product rows use three columns for identity, description, and status/action. The footer uses four columns.
- At 1080px and below, the hero and section headings stack. Product rows become two columns, and the footer becomes two columns.
- At 720px and below, the shell becomes `calc(100% - 36px)`, desktop navigation hides, routing becomes three stacked product rows, product rows become one column, actions become full-width, and the footer becomes one column.
- The sticky header is 72px tall. Desktop navigation must stay on one line.

**The Routing Grammar.** One square origin splits into three paths and ends at three square endpoints. Product name, availability, and infrastructure layer align to those routes; unavailable products remain visible but are not links.

## Elevation & Depth

The system is flat by default. Depth comes from tonal surface changes, one-pixel rules, and the routing plane. The sticky header may use a translucent Page Navy surface and 20px backdrop blur only after scrolling; content sections do not use card shadows.

**The Flat Infrastructure Rule.** Use borders and surface bands before shadows or floating containers.

## Shapes

All geometry is square (`0rem` radius). Buttons, language controls, icon controls, route endpoints, status markers, and repository language markers use hard corners. Dividers are one pixel; routes use square line caps and miter joins.

**The Square Signal Rule.** Do not introduce pills or circular decorative dots. A circle is allowed only when its shape carries real meaning supplied by the product.

## Components

### Buttons

- **Shape:** Square, with a minimum 50px height, 24px inline padding, 13.5px type, and a transparent one-pixel border reserved in every variant.
- **Primary:** Route Blue ground with Pure White text; Deep Route Blue on hover.
- **Outline:** Transparent ground and Strong Border Blue at rest; off-white border with Soft Route Blue ground on hover.
- **Inverse:** The contact section uses an off-white button with Button Ink and a transparent ghost button with a 24% off-white border.
- **Focus:** A two-pixel solid Route Line (`#8fb6ff`) outline with a three-pixel offset.

### Navigation

The header uses the official LafLabs logo component, one-line 13px desktop links, square 38px controls, and direct anchors for products, open source, and principles. Contact always resolves to `mailto:contact@laflabs.co`. At 720px and below, section links hide while language and GitHub controls remain. The site is intentionally dark-only; no theme control or initializer is shipped, and browser color scheme/theme metadata use Page Navy.

### Routing Field

The hero's signature component is one bordered `720 / 520` plane with a 32px grid. Three two-pixel SVG paths leave an 18px square origin and terminate at 18px square endpoints. On screens at 720px and below, the SVG and desktop guides disappear and the same three product routes become bordered rows; no miniature desktop diagram is retained.

### Product Rows

Rows are separated by rules, never card containers. Each row preserves infrastructure layer, product name, tagline, description, capability points, status, and either an external link or inactive domain. All three shipped product rows currently use the inactive treatment. The implemented live variant uses Route Line on Soft Route Blue; unavailable status remains Blue-grey on the page ground. Do not add list numbering or oversized ghost wordmarks.

### Motion

Motion clarifies entry, routing, and state only. The hero fades copy and draws the three routes once; shared section reveals run once in view; the technology strip is the only marquee. Avoid layout-moving hover effects. Under `prefers-reduced-motion: reduce`, every Motion component starts at its complete final state, transitions use zero duration, the marquee is stationary, and smooth scrolling and CSS animation are disabled.

## Do's and Don'ts

### Do:

- **Do** use Route Blue for filled actions and Readable Blue for small signal text, routes, focus, and live status.
- **Do** keep Korean and English readable with `word-break: keep-all` where prose needs stable phrases.
- **Do** continue sections with generous spacing and one-pixel dividers.
- **Do** preserve existing anchors and working external links.

### Don't:

- **Don't** add rounded cards, pills, decorative circles, or ornamental shadows.
- **Don't** repeat eyebrow labels or section numbers when the heading already establishes context.
- **Don't** add a second marquee or a hero scroll cue.
- **Don't** animate padding or layout position on row hover.
