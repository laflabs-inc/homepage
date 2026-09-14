import { describe, expect, it } from "vitest"

import { assertDesignCatalog, type DesignCatalog } from "@/lib/design-system/schema"
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
