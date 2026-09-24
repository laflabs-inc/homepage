import { existsSync, readFileSync } from "node:fs"
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
import { designComponentSlugs } from "@/lib/design-system/component-slugs"

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
      relatedComponents: [],
      dependencies: [],
      states: [
        {
          id: "default",
          guidance: copy,
        },
      ],
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
      version: "2026.9.5",
      updatedAt: "2026-09-24",
      canonicalPath: "/design",
      publicOrigin: "https://www.laflabs.co",
      locales: ["ko", "en"],
    })
  })

  it("rejects catalog metadata that differs from the fixed contract", () => {
    const catalog = {
      ...validCatalog,
      meta: { ...designSystemMeta, version: "2026.9.6" },
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

  it("rejects a component state without complete localized inspection guidance", () => {
    const component = {
      ...validCatalog.components[0],
      states: [{ id: "default", guidance: { ko: "상태 확인", en: "" } }],
    }

    expect(() => assertDesignCatalog({ ...validCatalog, components: [component] })).toThrow(
      "components logo state default: missing localized copy",
    )
  })

  it("rejects patterns that reference an unknown component", () => {
    const pattern = {
      ...validCatalog.patterns[0],
      relatedComponents: ["missing-component"],
    }

    expect(() => assertDesignCatalog({ ...validCatalog, patterns: [pattern] })).toThrow(
      "patterns site-chrome: unknown related component missing-component",
    )
  })

  it("rejects components that reference an unknown related component", () => {
    const component = {
      ...validCatalog.components[0],
      relatedComponents: ["missing-component"],
    }

    expect(() => assertDesignCatalog({ ...validCatalog, components: [component] })).toThrow(
      "components logo: unknown related component missing-component",
    )
  })

  it("rejects unsafe package dependency names", () => {
    const component = {
      ...validCatalog.components[0],
      dependencies: ["https://example.com/package"],
    }

    expect(() => assertDesignCatalog({ ...validCatalog, components: [component] })).toThrow(
      "components logo: invalid dependency https://example.com/package",
    )
  })

  it("rejects duplicate component demo keys", () => {
    const component = {
      ...validCatalog.components[0],
      id: "wordmark",
      relatedComponents: ["logo"],
    }

    expect(() => assertDesignCatalog({
      ...validCatalog,
      components: [validCatalog.components[0], component],
    })).toThrow("components wordmark: duplicate component demoKey")
  })

  it("rejects empty localized component usage guidance", () => {
    const component = {
      ...validCatalog.components[0],
      whenToUse: { ko: "사용 안내", en: "" },
    }

    expect(() => assertDesignCatalog({ ...validCatalog, components: [component] })).toThrow(
      "components logo: missing localized copy",
    )
  })
})

describe("production design catalog", () => {
  it("keeps the composite demo collection server-readable for Next component pages", () => {
    const source = readFileSync(
      join(process.cwd(), "components/design-system/component-demo-composites.tsx"),
      "utf8",
    )

    expect(source).not.toMatch(/^\s*["']use client["']/)
  })

  it("keeps the lightweight analytics slug allowlist aligned with the catalog", () => {
    expect(designComponentSlugs).toEqual(designCatalog.components.map(({ id }) => id))
  })

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
      "button",
      "button-group",
      "field",
      "label",
      "input",
      "textarea",
      "native-select",
      "select",
      "checkbox",
      "radio-group",
      "switch",
      "segmented-toggle",
      "icon-control",
      "text-link",
      "dropdown-menu",
      "tabs",
      "accordion",
      "dialog",
      "tooltip",
      "alert-dialog",
      "popover",
      "side-panel",
      "combobox",
      "input-group",
      "breadcrumb",
      "table",
      "data-table",
      "pagination",
      "item",
      "spinner",
      "progress",
      "notice-toast",
      "alert",
      "skeleton",
      "empty-state",
      "separator",
      "panel",
      "status-label",
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

  it("provides localized inspection guidance for every documented component state", () => {
    for (const component of designCatalog.components) {
      expect(component.states.length).toBeGreaterThan(0)
      for (const state of component.states) {
        expect(state.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        expect(state.guidance.ko.trim()).not.toBe("")
        expect(state.guidance.en.trim()).not.toBe("")
      }
    }
  })

  it("publishes component relationships and install dependencies as explicit arrays", () => {
    for (const component of designCatalog.components) {
      expect(component.relatedComponents).toEqual(expect.any(Array))
      expect(component.dependencies).toEqual(expect.any(Array))
    }
  })

  it("publishes semantic status colors for reusable feedback components", () => {
    expect(
      designCatalog.tokens
        .filter(({ id }) => id.startsWith("color."))
        .map(({ id }) => id),
    ).toEqual(expect.arrayContaining([
      "color.info",
      "color.success",
      "color.warning",
      "color.error",
    ]))
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

  it("publishes the Mono label scale for compact system metadata", () => {
    expect(designCatalog.tokens.find(({ id }) => id === "typography.mono-label")).toMatchObject({
      id: "typography.mono-label",
      group: "typography",
      value: "10–11px",
      purpose: {
        ko: "인덱스, 메타데이터, 상태, 짧은 내비게이션 label에 씁니다.",
        en: "Indices, metadata, states, and compact navigation labels.",
      },
    })
  })

  it("publishes explicit typography specimen metrics without deriving them from copy", () => {
    expect(designCatalog.tokens.find(({ id }) => id === "typography.method-mark")).toMatchObject({
      specimen: {
        fontFamily: "sans",
        fontSize: "clamp(88px, 10.5vw, 154px)",
        fontWeight: 850,
        lineHeight: 0.75,
        letterSpacing: "-0.04em",
      },
    })
    expect(designCatalog.tokens.find(({ id }) => id === "typography.hero-field-mark")).toMatchObject({
      specimen: {
        fontFamily: "sans",
        fontSize: "clamp(116px, 14vw, 210px)",
        fontWeight: 850,
        lineHeight: 0.75,
        letterSpacing: "-0.04em",
      },
    })
    expect(designCatalog.tokens.find(({ id }) => id === "typography.mono-label")).toMatchObject({
      specimen: {
        fontFamily: "mono",
        fontSize: "clamp(10px, 0.8vw, 11px)",
        fontWeight: 600,
        lineHeight: 1.45,
        letterSpacing: "0em",
      },
    })
  })

  it("rejects typography tokens that omit machine-readable specimen metrics", () => {
    const token = {
      id: "typography.example",
      group: "typography" as const,
      value: "16px",
      purpose: copy,
    }
    const catalog = {
      ...validCatalog,
      tokens: [token],
    } as unknown as DesignCatalog

    expect(() => assertDesignCatalog(catalog)).toThrow(
      "tokens typography.example: missing typography specimen metrics",
    )
  })

  it("documents stable imports for extracted primitives", () => {
    expect(
      designCatalog.components
        .filter(({ maturity }) => maturity === "stable")
        .map(({ id, maturity }) => [id, maturity]),
    ).toEqual([
      ["logo", "stable"],
      ["action", "stable"],
      ["segmented-toggle", "stable"],
      ["icon-control", "stable"],
      ["text-link", "stable"],
      ["code-block", "stable"],
    ])
    expect(getComponentEntry("logo")?.importExample).toBe(
      'import { Logo } from "@/components/ui/logo"',
    )
    expect(getComponentEntry("segmented-toggle")?.importExample).toBe(
      'import { SegmentedToggle } from "@/components/ui/segmented-toggle"',
    )
    expect(getComponentEntry("action")?.importExample).toBe(
      'import { Action } from "@/components/ui/action"',
    )
    expect(getComponentEntry("icon-control")?.importExample).toBe(
      'import { IconControl } from "@/components/ui/icon-control"',
    )
    expect(getComponentEntry("text-link")?.importExample).toBe(
      'import { TextLink } from "@/components/ui/text-link"',
    )
    expect(getComponentEntry("code-block")?.importExample).toBe(
      'import { CodeBlock } from "@/components/content/code-block"',
    )
    expect(getComponentEntry("panel")?.importExample).toBe(
      'import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/ui/panel"',
    )
    expect(getComponentEntry("status-label")?.importExample).toBe(
      'import { StatusLabel } from "@/components/ui/status-label"',
    )
    expect(getComponentEntry("missing")).toBeUndefined()
  })

  it("keeps every component demo key aligned with a real source file", () => {
    for (const component of designCatalog.components) {
      expect(existsSync(join(process.cwd(), component.sourcePath))).toBe(true)
      expect(component.demoKey).toBe(component.id)
    }
  })

  it("declares the external packages imported by component source files", () => {
    expect(Object.fromEntries(
      designCatalog.components
        .filter(({ dependencies }) => dependencies.length > 0)
        .map(({ id, dependencies }) => [id, dependencies]),
    )).toEqual({
      logo: ["next"],
      "segmented-toggle": ["motion"],
      "text-link": ["@phosphor-icons/react"],
      "native-select": ["@phosphor-icons/react"],
      select: ["@phosphor-icons/react", "radix-ui"],
      "dropdown-menu": ["@phosphor-icons/react", "radix-ui"],
      tabs: ["radix-ui"],
      accordion: ["@phosphor-icons/react", "radix-ui"],
      dialog: ["@phosphor-icons/react", "radix-ui"],
      tooltip: ["radix-ui"],
      "alert-dialog": ["radix-ui"],
      popover: ["radix-ui"],
      "side-panel": ["@phosphor-icons/react", "radix-ui"],
      combobox: ["@phosphor-icons/react", "radix-ui"],
      breadcrumb: ["@phosphor-icons/react"],
      "data-table": ["@phosphor-icons/react"],
      pagination: ["@phosphor-icons/react"],
      spinner: ["@phosphor-icons/react"],
      "notice-toast": ["@phosphor-icons/react"],
      alert: ["@phosphor-icons/react"],
    })
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
