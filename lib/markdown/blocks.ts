import { getMarkdownEditorBlocks } from "@/lib/markdown/editor-model"

export type MarkdownBlock = {
  start: number
  end: number
  source: string
}

export function splitMarkdownBlocks(source: string): MarkdownBlock[] {
  if (source.length === 0) return [{ start: 0, end: 0, source: "" }]
  return getMarkdownEditorBlocks(source).map(({ start, end, source: blockSource }) => ({
    start,
    end,
    source: blockSource,
  }))
}
