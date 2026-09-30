import { unified } from "unified"
import remarkParse from "remark-parse"
import { visit } from "unist-util-visit"

export type MarkdownMediaReference = {
  assetId: string
  src: string
  alt: string
}

export class UnsupportedLafMediaMarkupError extends Error {
  constructor() {
    super("Unsupported LafLabs media markup")
    this.name = "UnsupportedLafMediaMarkupError"
  }
}

const parser = unified().use(remarkParse)
const stablePath = /^\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/([^/?#]+)$/iu

function parseStablePath(src: string): { assetId: string; src: string } | null {
  const match = stablePath.exec(src)
  return match ? { assetId: match[1].toLowerCase(), src } : null
}

function requireTrackable(src: string): { assetId: string; src: string } | null {
  const parsed = parseStablePath(src)
  if (!parsed && src.startsWith("/media/")) throw new UnsupportedLafMediaMarkupError()
  return parsed
}

export function extractLafMediaReferences(source: string): MarkdownMediaReference[] {
  const tree = parser.parse(source)
  const definitions = new Map<string, string>()
  const references: MarkdownMediaReference[] = []
  const seen = new Set<string>()

  visit(tree, "html", (node: { value?: string }) => {
    if (node.value?.includes("/media/")) throw new UnsupportedLafMediaMarkupError()
  })
  visit(tree, "definition", (node: { identifier?: string; url?: string }) => {
    if (node.identifier && node.url) definitions.set(node.identifier.toLowerCase(), node.url)
  })
  visit(tree, (node: { type?: string; url?: string; identifier?: string; alt?: string | null }) => {
    if (node.type !== "image" && node.type !== "imageReference") return
    const src = node.type === "image" ? node.url : definitions.get(node.identifier?.toLowerCase() ?? "")
    if (!src) return
    const parsed = requireTrackable(src)
    if (!parsed || seen.has(parsed.assetId)) return
    seen.add(parsed.assetId)
    references.push({ ...parsed, alt: node.alt ?? "" })
  })

  return references
}

export function buildMarkdownImage(reference: { src: string; alt: string }): string {
  if (!parseStablePath(reference.src)) throw new UnsupportedLafMediaMarkupError()
  const alt = reference.alt.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]")
  return `![${alt}](${reference.src})`
}
