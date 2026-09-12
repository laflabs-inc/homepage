import { unified } from "unified"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"

export type MarkdownBlock = {
  start: number
  end: number
  source: string
}

const markdownBlockParser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)

const multilineBlockTypes = new Set(["blockquote", "code", "html", "list", "math", "table"])

export function markdownBlockSupportsInternalNewlines(source: string): boolean {
  const tree = markdownBlockParser.parse(source) as { children?: Array<{ type?: string }> }
  const type = tree.children?.[0]?.type
  return typeof type === "string" && multilineBlockTypes.has(type)
}

export function splitMarkdownBlocks(source: string): MarkdownBlock[] {
  if (source.length === 0) return [{ start: 0, end: 0, source: "" }]

  const tree = markdownBlockParser.parse(source) as {
    children?: Array<{ position?: { start?: { offset?: number } } }>
  }
  const starts = (tree.children ?? [])
    .map((node) => node.position?.start?.offset)
    .filter((offset): offset is number => typeof offset === "number")

  if (starts.length === 0) return [{ start: 0, end: source.length, source }]

  return starts.map((nodeStart, index) => {
    const start = index === 0 ? 0 : nodeStart
    const end = starts[index + 1] ?? source.length
    return { start, end, source: source.slice(start, end) }
  })
}
