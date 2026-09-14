import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import {
  designCatalog,
  designPageEntries,
  getComponentEntry,
} from "@/lib/design-system/catalog"
import {
  assertDesignCatalog,
  type DesignCatalog,
  type DesignToken,
} from "@/lib/design-system/schema"
import { designSystemMeta } from "@/lib/design-system/meta"

const copy = { ko: "한국어 안내", en: "English guidance" } as const

const validCatalog = {
  meta: designSystemMeta,
  tokens: [
    {
      id: "color.primary",
      group: "color",
      value: "#2563eb",
      purpose: copy,
    },
  ],
  foundations: [
    {
      id: "identity",
      title: copy,
      summary: copy,
      guidance: [copy],
    },
  ],
  components: [
    {
      id: "logo",
      name: "Logo",
      category: "brand",
      maturity: "stable",
      summary: copy,
      whenToUse: copy,
      whenNotToUse: copy,
      accessibility: copy,
      sourcePath: "components/ui/logo.tsx",
      demoKey: "logo",
      importExample: 'import { Logo } from "@/components/ui/logo"',
      usageExample: "<Logo />",
      states: ["default"],
      props: [
        {
          name: "label",
          type: "string",
          required: false,
          description: copy,
        },
      ],
    },
  ],
  patterns: [
    {
      id: "site-chrome",
      title: copy,
      summary: copy,
      guidance: [copy],
      relatedComponents: ["logo"],
    },
  ],
  assets: [
    {
      id: "logo-mark",
      name: "Logo mark",
      path: "/images/logo-mark.svg",
      format: "svg",
      usage: copy,
      downloadable: true,
    },
  ],
} satisfies DesignCatalog

describe("design catalog schema", () => {
  it("accepts a complete bilingual catalog", () => {
    expect(() => assertDesignCatalog(validCatalog)).not.toThrow()
  })

  it("publishes the fixed system metadata", () => {
    expect(designSystemMeta).toEqual({
      name: "LafLabs Web Design",
      skillName: "laflabs-web-design",
      version: "2026.9.0",
      updatedAt: "2026-09-14",
      canonicalPath: "/design",
      locales: ["ko", "en"],
    })
  })

  it("rejects catalog metadata that differs from the fixed contract", () => {
    const catalog = {
      ...validCatalog,
      meta: { ...designSystemMeta, version: "2026.9.1" },
    } satisfies DesignCatalog

    expect(() => assertDesignCatalog(catalog)).toThrow("metadata version: invalid metadata value")
  })

  it("rejects duplicate component slugs", () => {
    const duplicate = {
      ...validCatalog,
      components: [validCatalog.components[0], validCatalog.components[0]],
    } satisfies DesignCatalog

    expect(() => assertDesignCatalog(duplicate)).toThrow("components logo: duplicate component id")
  })

  it("rejects invalid component slugs", () => {
    const component = { ...validCatalog.components[0], id: "Logo Mark" }

    expect(() => assertDesignCatalog({ ...validCatalog, components: [component] })).toThrow(
      "components Logo Mark: invalid component id",
    )
  })

  it("rejects missing localized copy", () => {
    const foundation = {
      ...validCatalog.foundations[0],
      summary: { ko: "한국어 안내", en: "" },
    }

    expect(() => assertDesignCatalog({ ...validCatalog, foundations: [foundation] })).toThrow(
      "foundations identity: missing localized copy",
    )
  })

  it("reports an omitted locale using the collection and entry id", () => {
    const foundation = {
      ...validCatalog.foundations[0],
      summary: { ko: "한국어 안내" },
    }
    const catalog = {
      ...validCatalog,
      foundations: [foundation],
    } as unknown as DesignCatalog

    expect(() => assertDesignCatalog(catalog)).toThrow("foundations identity: missing localized copy")
  })

  it("rejects unsafe asset paths", () => {
    const asset = { ...validCatalog.assets[0], path: "https://example.com/logo.svg" }

    expect(() => assertDesignCatalog({ ...validCatalog, assets: [asset] })).toThrow(
      "assets logo-mark: unsafe asset path",
    )
  })

  it("reports a missing asset path using the collection and entry id", () => {
    const asset = { ...validCatalog.assets[0], path: undefined as never }

    expect(() => assertDesignCatalog({ ...validCatalog, assets: [asset] })).toThrow(
      "assets logo-mark: unsafe asset path",
    )
  })

  it("rejects a stable component without an import example", () => {
    const component = { ...validCatalog.components[0], importExample: undefined }

    expect(() => assertDesignCatalog({ ...validCatalog, components: [component] })).toThrow(
      "components logo: stable component requires importExample",
    )
  })

  it("rejects a component without a supported demo key", () => {
    const component = { ...validCatalog.components[0], demoKey: "" as never }

    expect(() => assertDesignCatalog({ ...validCatalog, components: [component] })).toThrow(
      "components logo: missing component demoKey",
    )
  })
})

describe("production design catalog", () => {
  it("publishes the complete foundation, component, and pattern inventories", () => {
    expect(designCatalog.foundations.map(({ id }) => id)).toEqual([
      "identity",
      "color",
      "typography",
      "spacing-layout",
      "shape",
      "iconography",
      "motion",
      "accessibility",
      "voice",
      "claims",
    ])
    expect(designCatalog.components.map(({ id }) => id)).toEqual([
      "logo",
      "action",
      "segmented-toggle",
      "icon-control",
      "text-link",
      "code-block",
    ])
    expect(designCatalog.patterns.map(({ id }) => id)).toEqual([
      "site-chrome",
      "editorial-heading",
      "collection-row",
      "selected-work",
      "document-surface",
      "system-states",
      "responsive-collapse",
      "contrast-band",
    ])
  })

  it("keeps active color defaults separate from legacy route-era colors", () => {
    const tokens: readonly DesignToken[] = designCatalog.tokens

    expect(tokens.slice(0, 6).map(({ id, group, value, cssVariable }) => ({
      id,
      group,
      value,
      cssVariable,
    }))).toEqual([
      { id: "color.primary", group: "color", value: "#2563eb", cssVariable: "--blue" },
      { id: "color.primary-deep", group: "color", value: "#1e40af", cssVariable: "--deep" },
      { id: "color.paper", group: "color", value: "#f8fafc", cssVariable: "--paper" },
      { id: "color.ink", group: "color", value: "#0f172a", cssVariable: "--ink" },
      { id: "color.muted", group: "color", value: "#64748b", cssVariable: "--muted" },
      { id: "color.line", group: "color", value: "#cbd5e1", cssVariable: "--line" },
    ])
    expect(tokens.find(({ id }) => id === "color.primary")?.legacy).not.toBe(true)
    expect(tokens.find(({ id }) => id === "color.route-blue")?.legacy).toBe(true)
    expect(tokens.find(({ id }) => id === "color.page-navy")?.legacy).toBe(true)
  })

  it("publishes the active layout, shape, control, motion, and type values", () => {
    const values = Object.fromEntries(designCatalog.tokens.map(({ id, value }) => [id, value]))

    expect(values).toMatchObject({
      "typography.homepage-hero": "clamp(64px, 6.2vw, 80px)",
      "typography.company-statement": "clamp(52px, 5.6vw, 72px)",
      "typography.section-heading": "clamp(44px, 4.5vw, 60px)",
      "typography.method-mark": "clamp(88px, 10.5vw, 154px)",
      "typography.hero-field-mark": "clamp(116px, 14vw, 210px)",
      "typography.mobile-homepage-hero": "clamp(40px, 11.6vw, 48px)",
      "layout.shell": "min(1280px, calc(100% - 64px))",
      "layout.gutter": "max(32px, calc((100vw - 1280px) / 2))",
      "layout.breakpoint-stack": "1080px",
      "layout.breakpoint-mobile": "720px",
      "shape.radius": "0px",
      "shape.rule": "1px",
      "layout.compact-control": "34px",
      "motion.segmented-toggle": "spring(stiffness: 520, damping: 38)",
    })
  })

  it("documents stable imports and keeps extraction candidates explicit", () => {
    expect(designCatalog.components.map(({ id, maturity }) => [id, maturity])).toEqual([
      ["logo", "stable"],
      ["action", "candidate"],
      ["segmented-toggle", "stable"],
      ["icon-control", "candidate"],
      ["text-link", "candidate"],
      ["code-block", "stable"],
    ])
    expect(getComponentEntry("logo")?.importExample).toBe(
      'import { Logo } from "@/components/ui/logo"',
    )
    expect(getComponentEntry("segmented-toggle")?.importExample).toBe(
      'import { SegmentedToggle } from "@/components/ui/segmented-toggle"',
    )
    expect(getComponentEntry("code-block")?.importExample).toBe(
      'import { CodeBlock } from "@/components/content/code-block"',
    )
    expect(getComponentEntry("missing")).toBeUndefined()
  })

  it("lists only trusted assets that exist under public", () => {
    expect(designCatalog.assets.map(({ path }) => path)).toEqual([
      "/laflabs-logo.png",
      "/laf-system-loop-poster.png",
      "/laf-system-loop.webm",
      "/laf-system-loop.mp4",
    ])

    for (const asset of designCatalog.assets) {
      expect(existsSync(join(process.cwd(), "public", asset.path))).toBe(true)
    }
  })

  it("provides one catalog-derived entry for each human design section", () => {
    expect(designPageEntries.map(({ href }) => href)).toEqual([
      "/design",
      "/design/foundations",
      "/design/components",
      "/design/patterns",
      "/design/assets",
      "/design/ai",
    ])
  })
})
