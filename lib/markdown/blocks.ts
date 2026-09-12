import { unified } from "unified"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"

import { getMarkdownEditorBlocks } from "@/lib/markdown/editor-model"

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
  return getMarkdownEditorBlocks(source).map(({ start, end, source: blockSource }) => ({
    start,
    end,
    source: blockSource,
  }))
}
