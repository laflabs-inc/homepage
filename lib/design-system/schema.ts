import { designSystemMeta } from "./meta"
import {
  componentCategories,
  componentDemoKeys,
  type ComponentCategory,
  type DemoKey,
} from "./component-options"

export type { ComponentCategory, DemoKey } from "./component-options"

export type LocaleText = Readonly<{ ko: string; en: string }>

export type TokenGroup = "color" | "typography" | "spacing" | "layout" | "shape" | "motion"
export type ComponentMaturity = "stable" | "candidate"

export type TypographySpecimen = Readonly<{
  fontFamily: "sans" | "mono"
  fontSize: string
  fontWeight: number
  lineHeight: number
  letterSpacing: string
}>

export type DesignSystemMeta = Readonly<{
  name: string
  skillName: string
  version: string
  updatedAt: string
  canonicalPath: string
  publicOrigin: string
  locales: readonly ["ko", "en"]
}>

export type DesignToken = Readonly<{
  id: string
  group: TokenGroup
  value: string
  cssVariable?: string
  purpose: LocaleText
  contrast?: LocaleText
  legacy?: boolean
  specimen?: TypographySpecimen
}>

export type FoundationEntry = Readonly<{
  id: string
  title: LocaleText
  summary: LocaleText
  guidance: readonly LocaleText[]
}>

export type ComponentEntry = Readonly<{
  id: string
  name: string
  category: ComponentCategory
  maturity: ComponentMaturity
  summary: LocaleText
  whenToUse: LocaleText
  whenNotToUse: LocaleText
  accessibility: LocaleText
  sourcePath: string
  demoKey: DemoKey
  importExample?: string
  usageExample: string
  relatedComponents: readonly string[]
  dependencies: readonly string[]
  states: readonly Readonly<{
    id: string
    guidance: LocaleText
  }>[]
  props: readonly {
    name: string
    type: string
    required: boolean
    description: LocaleText
  }[]
}>

export type PatternEntry = Readonly<{
  id: string
  title: LocaleText
  summary: LocaleText
  guidance: readonly LocaleText[]
  relatedComponents: readonly string[]
}>

export type AssetEntry = Readonly<{
  id: string
  name: string
  path: string
  format: string
  dimensions?: string
  usage: LocaleText
  downloadable: boolean
}>

export type DesignCatalog = Readonly<{
  meta: DesignSystemMeta
  tokens: readonly DesignToken[]
  foundations: readonly FoundationEntry[]
  components: readonly ComponentEntry[]
  patterns: readonly PatternEntry[]
  assets: readonly AssetEntry[]
}>

const componentIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const dependencyNamePattern = /^(?:@[a-z0-9-]+\/)?[a-z0-9-]+$/
const tokenGroups = new Set<TokenGroup>(["color", "typography", "spacing", "layout", "shape", "motion"])
const supportedComponentCategories = new Set<ComponentCategory>(componentCategories)
const componentMaturities = new Set<ComponentMaturity>(["stable", "candidate"])
const demoKeys = new Set<DemoKey>(componentDemoKeys)

function fail(collection: string, id: string, reason: string): never {
  throw new Error(`${collection} ${id}: ${reason}`)
}

function displayId(value: unknown): string {
  return typeof value === "string" && value.length > 0 ? value : "<missing>"
}

function assertUniqueIds(
  entries: readonly Readonly<{ id: string }>[],
  collection: string,
): void {
  const ids = new Set<string>()

  for (const entry of entries) {
    const id = displayId(entry.id)
    if (id === "<missing>") fail(collection, id, "missing id")
    if (ids.has(id)) fail(collection, id, `duplicate ${collection.slice(0, -1)} id`)
    ids.add(id)
  }
}

function assertLocaleText(value: LocaleText | undefined, collection: string, id: string): void {
  if (
    !value
    || typeof value.ko !== "string"
    || typeof value.en !== "string"
    || !value.ko.trim()
    || !value.en.trim()
  ) {
    fail(collection, id, "missing localized copy")
  }
}

function assertTypographySpecimen(
  value: TypographySpecimen | undefined,
  collection: string,
  id: string,
): void {
  if (!value) fail(collection, id, "missing typography specimen metrics")
  if (value.fontFamily !== "sans" && value.fontFamily !== "mono") {
    fail(collection, id, "invalid typography specimen family")
  }
  if (!value.fontSize.trim() || !value.letterSpacing.trim()) {
    fail(collection, id, "invalid typography specimen metrics")
  }
  if (!Number.isFinite(value.fontWeight) || !Number.isFinite(value.lineHeight)) {
    fail(collection, id, "invalid typography specimen metrics")
  }
}

function isSafePublicAssetPath(path: unknown): path is string {
  return typeof path === "string"
    && path.startsWith("/")
    && !path.startsWith("//")
    && !path.includes("\\")
    && !path.includes("?")
    && !path.includes("#")
    && !path.split("/").some((segment) => segment === "." || segment === "..")
}

function isSafeSourcePath(path: unknown): path is string {
  return typeof path === "string"
    && path.length > 0
    && !path.startsWith("/")
    && !path.includes("\\")
    && !path.split("/").some((segment) => segment === "." || segment === ".." || segment === "")
}

function assertMetadata(meta: DesignSystemMeta): void {
  if (meta.name !== designSystemMeta.name) fail("metadata", "name", "invalid metadata value")
  if (meta.skillName !== designSystemMeta.skillName) fail("metadata", "skillName", "invalid metadata value")
  if (meta.version !== designSystemMeta.version) fail("metadata", "version", "invalid metadata value")
  if (meta.updatedAt !== designSystemMeta.updatedAt) fail("metadata", "updatedAt", "invalid metadata value")
  if (meta.canonicalPath !== designSystemMeta.canonicalPath) {
    fail("metadata", "canonicalPath", "invalid metadata value")
  }
  if (meta.publicOrigin !== designSystemMeta.publicOrigin) {
    fail("metadata", "publicOrigin", "invalid metadata value")
  }
  if (
    !Array.isArray(meta.locales)
    || meta.locales.length !== designSystemMeta.locales.length
    || meta.locales.some((locale, index) => locale !== designSystemMeta.locales[index])
  ) {
    fail("metadata", "locales", "invalid metadata value")
  }
}

export function assertDesignCatalog(catalog: DesignCatalog): void {
  assertMetadata(catalog.meta)
  assertUniqueIds(catalog.tokens, "tokens")
  assertUniqueIds(catalog.foundations, "foundations")
  assertUniqueIds(catalog.components, "components")
  assertUniqueIds(catalog.patterns, "patterns")
  assertUniqueIds(catalog.assets, "assets")

  for (const token of catalog.tokens) {
    if (!tokenGroups.has(token.group)) fail("tokens", token.id, "invalid token group")
    assertLocaleText(token.purpose, "tokens", token.id)
    if (token.contrast) assertLocaleText(token.contrast, "tokens", token.id)
    if (token.group === "typography") {
      assertTypographySpecimen(token.specimen, "tokens", token.id)
    }
  }

  for (const foundation of catalog.foundations) {
    assertLocaleText(foundation.title, "foundations", foundation.id)
    assertLocaleText(foundation.summary, "foundations", foundation.id)
    foundation.guidance.forEach((guidance) => assertLocaleText(guidance, "foundations", foundation.id))
  }

  const registeredDemoKeys = new Set<DemoKey>()
  for (const component of catalog.components) {
    if (!componentIdPattern.test(component.id)) fail("components", component.id, "invalid component id")
    if (!supportedComponentCategories.has(component.category)) fail("components", component.id, "invalid component category")
    if (!componentMaturities.has(component.maturity)) fail("components", component.id, "invalid component maturity")
    if (!demoKeys.has(component.demoKey)) fail("components", component.id, "missing component demoKey")
    if (registeredDemoKeys.has(component.demoKey)) fail("components", component.id, "duplicate component demoKey")
    registeredDemoKeys.add(component.demoKey)
    if (!isSafeSourcePath(component.sourcePath)) fail("components", component.id, "invalid source path")
    if (component.maturity === "stable" && !component.importExample?.trim()) {
      fail("components", component.id, "stable component requires importExample")
    }

    assertLocaleText(component.summary, "components", component.id)
    assertLocaleText(component.whenToUse, "components", component.id)
    assertLocaleText(component.whenNotToUse, "components", component.id)
    assertLocaleText(component.accessibility, "components", component.id)
    if (component.states.length === 0) fail("components", component.id, "requires at least one state")
    const stateIds = new Set<string>()
    for (const state of component.states) {
      if (!componentIdPattern.test(state.id)) {
        fail("components", `${component.id} state ${displayId(state.id)}`, "invalid state id")
      }
      if (stateIds.has(state.id)) {
        fail("components", `${component.id} state ${state.id}`, "duplicate state id")
      }
      stateIds.add(state.id)
      assertLocaleText(state.guidance, "components", `${component.id} state ${state.id}`)
    }
    component.props.forEach((prop) => assertLocaleText(prop.description, "components", component.id))
    for (const dependency of component.dependencies) {
      if (!dependencyNamePattern.test(dependency)) {
        fail("components", component.id, `invalid dependency ${dependency}`)
      }
    }
  }

  const componentIds = new Set(catalog.components.map(({ id }) => id))
  for (const component of catalog.components) {
    for (const componentId of component.relatedComponents) {
      if (!componentIds.has(componentId)) {
        fail("components", component.id, `unknown related component ${componentId}`)
      }
    }
  }
  for (const pattern of catalog.patterns) {
    assertLocaleText(pattern.title, "patterns", pattern.id)
    assertLocaleText(pattern.summary, "patterns", pattern.id)
    pattern.guidance.forEach((guidance) => assertLocaleText(guidance, "patterns", pattern.id))
    for (const componentId of pattern.relatedComponents) {
      if (!componentIds.has(componentId)) {
        fail("patterns", pattern.id, `unknown related component ${componentId}`)
      }
    }
  }

  for (const asset of catalog.assets) {
    if (!isSafePublicAssetPath(asset.path)) fail("assets", asset.id, "unsafe asset path")
    assertLocaleText(asset.usage, "assets", asset.id)
  }
}
