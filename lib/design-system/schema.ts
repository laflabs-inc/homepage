export type LocaleText = Readonly<{ ko: string; en: string }>

export type TokenGroup = "color" | "typography" | "spacing" | "layout" | "shape" | "motion"
export type ComponentMaturity = "stable" | "candidate"
export type DemoKey = "logo" | "action" | "segmented-toggle" | "icon-control" | "text-link" | "code-block"

export type DesignSystemMeta = Readonly<{
  name: string
  skillName: string
  version: string
  updatedAt: string
  canonicalPath: string
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
  category: "brand" | "action" | "navigation" | "content"
  maturity: ComponentMaturity
  summary: LocaleText
  whenToUse: LocaleText
  whenNotToUse: LocaleText
  accessibility: LocaleText
  sourcePath: string
  demoKey: DemoKey
  importExample?: string
  usageExample: string
  states: readonly string[]
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
const tokenGroups = new Set<TokenGroup>(["color", "typography", "spacing", "layout", "shape", "motion"])
const componentCategories = new Set<ComponentEntry["category"]>(["brand", "action", "navigation", "content"])
const componentMaturities = new Set<ComponentMaturity>(["stable", "candidate"])
const demoKeys = new Set<DemoKey>([
  "logo",
  "action",
  "segmented-toggle",
  "icon-control",
  "text-link",
  "code-block",
])

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

export function assertDesignCatalog(catalog: DesignCatalog): void {
  assertUniqueIds(catalog.tokens, "tokens")
  assertUniqueIds(catalog.foundations, "foundations")
  assertUniqueIds(catalog.components, "components")
  assertUniqueIds(catalog.patterns, "patterns")
  assertUniqueIds(catalog.assets, "assets")

  for (const token of catalog.tokens) {
    if (!tokenGroups.has(token.group)) fail("tokens", token.id, "invalid token group")
    assertLocaleText(token.purpose, "tokens", token.id)
    if (token.contrast) assertLocaleText(token.contrast, "tokens", token.id)
  }

  for (const foundation of catalog.foundations) {
    assertLocaleText(foundation.title, "foundations", foundation.id)
    assertLocaleText(foundation.summary, "foundations", foundation.id)
    foundation.guidance.forEach((guidance) => assertLocaleText(guidance, "foundations", foundation.id))
  }

  const registeredDemoKeys = new Set<DemoKey>()
  for (const component of catalog.components) {
    if (!componentIdPattern.test(component.id)) fail("components", component.id, "invalid component id")
    if (!componentCategories.has(component.category)) fail("components", component.id, "invalid component category")
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
    component.props.forEach((prop) => assertLocaleText(prop.description, "components", component.id))
  }

  for (const pattern of catalog.patterns) {
    assertLocaleText(pattern.title, "patterns", pattern.id)
    assertLocaleText(pattern.summary, "patterns", pattern.id)
    pattern.guidance.forEach((guidance) => assertLocaleText(guidance, "patterns", pattern.id))
  }

  for (const asset of catalog.assets) {
    if (!isSafePublicAssetPath(asset.path)) fail("assets", asset.id, "unsafe asset path")
    assertLocaleText(asset.usage, "assets", asset.id)
  }
}
