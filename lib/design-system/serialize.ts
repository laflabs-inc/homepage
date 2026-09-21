import { strToU8, zipSync } from "fflate"

import { designCatalog } from "./catalog"
import type { DesignToken } from "./schema"

const publicOrigin = designCatalog.meta.publicOrigin
const sourceRepository = "https://github.com/laflabs-inc/homepage"

function compareIds(left: Readonly<{ id: string }>, right: Readonly<{ id: string }>): number {
  if (left.id < right.id) return -1
  if (left.id > right.id) return 1
  return 0
}

function escapeTableCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", "<br>")
}

function finishText(lines: readonly string[]): string {
  return `${lines.join("\n").trimEnd()}\n`
}

function tokenValue(id: string): string {
  const token = designCatalog.tokens.find((entry) => entry.id === id)
  if (!token) throw new Error(`Missing design token: ${id}`)
  return token.value
}

function serializeCorePrinciples(): string[] {
  return [...designCatalog.foundations].sort(compareIds).flatMap((foundation) => [
    `### ${foundation.title.en}`,
    "",
    foundation.summary.en,
    "",
    ...foundation.guidance.map(({ en }) => `- ${en}`),
    "",
  ])
}

function serializeTokenSummary(): string[] {
  const catalogTokens: readonly DesignToken[] = designCatalog.tokens
  const tokens = [...catalogTokens].sort(compareIds)

  return [
    "| Token | Group | Value | Status | Purpose |",
    "| --- | --- | --- | --- | --- |",
    ...tokens.map((token) => [
      `\`${escapeTableCell(token.id)}\``,
      escapeTableCell(token.group),
      `\`${escapeTableCell(token.value)}\``,
      token.legacy ? "Legacy reference" : "Current",
      escapeTableCell(token.purpose.en),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |")),
  ]
}

function serializeComponentSummary(): string[] {
  return [...designCatalog.components].sort(compareIds).flatMap((component) => [
    `### ${component.name} (\`${component.id}\`)`,
    "",
    `Maturity: **${component.maturity}** · Category: **${component.category}**`,
    "",
    component.summary.en,
    "",
    `- Use: ${component.whenToUse.en}`,
    `- Avoid: ${component.whenNotToUse.en}`,
    `- Accessibility: ${component.accessibility.en}`,
    `- States: ${component.states.map(({ id }) => `\`${id}\``).join(", ")}`,
    ...(component.relatedComponents.length > 0
      ? [`- Related components: ${component.relatedComponents.map((id) => `\`${id}\``).join(", ")}`]
      : []),
    ...(component.dependencies.length > 0
      ? [`- Dependencies: ${component.dependencies.map((dependency) => `\`${dependency}\``).join(", ")}`]
      : []),
    "",
  ])
}

function serializePatternSummary(): string[] {
  return [...designCatalog.patterns].sort(compareIds).flatMap((pattern) => [
    `### ${pattern.title.en} (\`${pattern.id}\`)`,
    "",
    pattern.summary.en,
    "",
    ...pattern.guidance.map(({ en }) => `- ${en}`),
    `- Related components: ${pattern.relatedComponents.map((id) => `\`${id}\``).join(", ")}`,
    "",
  ])
}

function serializeMachineResources(): string[] {
  const path = designCatalog.meta.canonicalPath

  return [
    `- Provider-neutral guide: ${publicOrigin}${path}/guide.md`,
    `- Versioned tokens: ${publicOrigin}${path}/tokens.json`,
    `- Skill entry point: ${publicOrigin}${path}/skill/SKILL.md`,
    `- Skill foundations: ${publicOrigin}${path}/skill/references/foundations.md`,
    `- Skill components: ${publicOrigin}${path}/skill/references/components.md`,
    `- Skill patterns: ${publicOrigin}${path}/skill/references/patterns.md`,
    `- Skill tokens: ${publicOrigin}${path}/skill/references/tokens.json`,
    `- Skill archive: ${publicOrigin}${path}/skill.zip`,
    `- Source repository: ${sourceRepository}`,
  ]
}

export function serializeTokens(): string {
  const catalogTokens: readonly DesignToken[] = designCatalog.tokens
  const tokens = [...catalogTokens].sort(compareIds).map((token) => ({
    id: token.id,
    group: token.group,
    value: token.value,
    cssVariable: token.cssVariable ?? null,
    purpose: { ko: token.purpose.ko, en: token.purpose.en },
    contrast: token.contrast
      ? { ko: token.contrast.ko, en: token.contrast.en }
      : null,
    legacy: token.legacy ?? false,
    specimen: token.specimen
      ? {
        fontFamily: token.specimen.fontFamily,
        fontSize: token.specimen.fontSize,
        fontWeight: token.specimen.fontWeight,
        lineHeight: token.specimen.lineHeight,
        letterSpacing: token.specimen.letterSpacing,
      }
      : null,
  }))
  const document = {
    name: designCatalog.meta.name,
    version: designCatalog.meta.version,
    updatedAt: designCatalog.meta.updatedAt,
    canonicalPath: designCatalog.meta.canonicalPath,
    locales: [...designCatalog.meta.locales],
    tokens,
  }

  return `${JSON.stringify(document, null, 2)}\n`
}

export function serializeDesignGuide(): string {
  return finishText([
    `# ${designCatalog.meta.name}`,
    "",
    `System version: ${designCatalog.meta.version} · Updated: ${designCatalog.meta.updatedAt}`,
    "",
    "Use this provider-neutral guide for LafLabs public websites and branded web surfaces. It does not redefine dense Admin workflows or unrelated third-party products.",
    "",
    "The active system uses Paper and Ink surfaces, Primary Blue as its sole accent, square geometry, restrained motion, and equivalent Korean and English content. Preserve factual product content and official assets; never invent claims or substitute fake product imagery.",
    "",
    "## Core principles",
    "",
    ...serializeCorePrinciples(),
    "## Design tokens",
    "",
    `The production shell is \`${tokenValue("layout.shell")}\`. Treat tokens marked legacy as reference values, not defaults for new surfaces.`,
    "",
    ...serializeTokenSummary(),
    "",
    "## Components",
    "",
    ...serializeComponentSummary(),
    "## Composition and responsive patterns",
    "",
    ...serializePatternSummary(),
    "## Public machine resources",
    "",
    ...serializeMachineResources(),
  ])
}

function serializeSkillEntry(): string {
  return finishText([
    "---",
    `name: ${designCatalog.meta.skillName}`,
    "description: Apply LafLabs public web branding when creating or modifying LafLabs websites and branded web surfaces. Do not use for backend-only work, unrelated third-party products, or dense Admin workflows unless the user explicitly requests the public brand.",
    "---",
    "",
    `# ${designCatalog.meta.name}`,
    "",
    "Use the LafLabs public design language without inventing product facts, assets, or component availability.",
    "",
    "## Essential constraints",
    "",
    "- Preserve official assets, Paper and Ink surfaces, Primary Blue as the sole accent, square geometry, and visible one-pixel rules.",
    "- Keep Korean and English content equivalent, with natural line breaks in both locales.",
    "- Reuse installed LafLabs components when their contracts fit; do not imitate them with lookalikes.",
    "- Keep every action keyboard-accessible, visibly focused, and understandable without color alone.",
    "- Honor reduced motion and show a complete static state.",
    "- Publish only verified claims. Omit or mark unavailable anything the target repository cannot support.",
    "",
    "## Workflow",
    "",
    "1. Inspect the target repository, its real components, official assets, and factual product content.",
    "2. Read only the references relevant to the requested work.",
    "3. Reuse supported components and tokens when available; preserve the target repository's established architecture.",
    "4. Verify desktop and mobile layout, visible copy, keyboard access, focus, and reduced motion before completion.",
    "",
    "## References",
    "",
    "- Read [references/foundations.md](references/foundations.md) for identity, color, typography, layout, accessibility, motion, voice, and claims.",
    "- Read [references/components.md](references/components.md) when selecting or using LafLabs interface components.",
    "- Read [references/patterns.md](references/patterns.md) when composing page sections or responsive structures.",
    "- Read [references/tokens.json](references/tokens.json) when exact semantic values are required.",
  ])
}

function serializeFoundationsReference(): string {
  const foundations = [...designCatalog.foundations].sort(compareIds)
  const assets = [...designCatalog.assets].sort(compareIds)

  return finishText([
    "# Foundations",
    "",
    `LafLabs Web Design ${designCatalog.meta.version}. English rules are paired with focused Korean copy guidance.`,
    "",
    ...foundations.flatMap((foundation) => [
      `## ${foundation.title.en} (\`${foundation.id}\`)`,
      "",
      `${foundation.summary.en} / ${foundation.summary.ko}`,
      "",
      ...foundation.guidance.map(({ en, ko }) => `- ${en} / ${ko}`),
      "",
    ]),
    "## Official public assets",
    "",
    ...assets.flatMap((asset) => [
      `### ${asset.name} (\`${asset.id}\`)`,
      "",
      `- URL: ${publicOrigin}${asset.path}`,
      `- Format: ${asset.format}${asset.dimensions ? ` · ${asset.dimensions}` : ""}`,
      `- Use: ${asset.usage.en} / ${asset.usage.ko}`,
      "",
    ]),
    "If an official asset is unavailable in the target project, report that limitation instead of recreating it.",
  ])
}

function serializeComponentsReference(): string {
  return finishText([
    "# Components",
    "",
    `LafLabs Web Design ${designCatalog.meta.version}. A stable component has a supported public contract; a candidate API can change.`,
    "",
    ...[...designCatalog.components].sort(compareIds).flatMap((component) => [
      `## ${component.name} (\`${component.id}\`)`,
      "",
      `- Maturity: **${component.maturity}**`,
      `- Category: **${component.category}**`,
      `- Purpose: ${component.summary.en} / ${component.summary.ko}`,
      `- Use: ${component.whenToUse.en} / ${component.whenToUse.ko}`,
      `- Avoid: ${component.whenNotToUse.en} / ${component.whenNotToUse.ko}`,
      `- Accessibility: ${component.accessibility.en} / ${component.accessibility.ko}`,
      ...(component.relatedComponents.length > 0
        ? [`- Related components: ${component.relatedComponents.map((id) => `\`${id}\``).join(", ")}`]
        : []),
      ...(component.dependencies.length > 0
        ? [`- Dependencies: ${component.dependencies.map((dependency) => `\`${dependency}\``).join(", ")}`]
        : []),
      "- States and inspection:",
      ...component.states.map(({ id, guidance }) => `  - \`${id}\`: ${guidance.en} / ${guidance.ko}`),
      "",
      "### Props",
      "",
      "| Name | Type | Required | Description |",
      "| --- | --- | --- | --- |",
      ...component.props.map((prop) => `| \`${escapeTableCell(prop.name)}\` | \`${escapeTableCell(prop.type)}\` | ${prop.required ? "Yes" : "No"} | ${escapeTableCell(prop.description.en)} / ${escapeTableCell(prop.description.ko)} |`),
      "",
      "### Usage shape",
      "",
      "```tsx",
      component.usageExample,
      "```",
      "",
    ]),
  ])
}

function serializePatternsReference(): string {
  return finishText([
    "# Patterns",
    "",
    `Composition and responsive rules for LafLabs Web Design ${designCatalog.meta.version}.`,
    "",
    ...[...designCatalog.patterns].sort(compareIds).flatMap((pattern) => [
      `## ${pattern.title.en} (\`${pattern.id}\`)`,
      "",
      `${pattern.summary.en} / ${pattern.summary.ko}`,
      "",
      ...pattern.guidance.map(({ en, ko }) => `- ${en} / ${ko}`),
      `- Related components: ${pattern.relatedComponents.map((id) => `\`${id}\``).join(", ")}`,
      "",
    ]),
  ])
}

export function serializeRootDesign(): string {
  return finishText([
    "<!-- This file is generated by npm run design:generate. Edit the design catalog and regenerate it instead of editing this file. -->",
    "",
    serializeDesignGuide().trimEnd(),
  ])
}

export function serializeSkillFiles(): ReadonlyMap<string, string> {
  const skillName = designCatalog.meta.skillName

  return new Map([
    [`${skillName}/SKILL.md`, serializeSkillEntry()],
    [`${skillName}/references/foundations.md`, serializeFoundationsReference()],
    [`${skillName}/references/components.md`, serializeComponentsReference()],
    [`${skillName}/references/patterns.md`, serializePatternsReference()],
    [`${skillName}/references/tokens.json`, serializeTokens()],
  ])
}

export function serializeSkillZip(): Uint8Array {
  const files = Object.fromEntries(
    [...serializeSkillFiles()].map(([path, source]) => [path, strToU8(source)]),
  )

  return zipSync(files, {
    level: 9,
    mtime: new Date(1980, 0, 1, 0, 0, 0),
    os: 3,
    attrs: 0o100644 << 16,
  })
}

export async function strongEtag(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array(bytes))
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

  return `"${hex}"`
}
