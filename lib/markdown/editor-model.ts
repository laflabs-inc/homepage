import { unified } from "unified"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"

export type MarkdownEditorBlock = {
  start: number
  end: number
  source: string
  type: string
  complete: boolean
}

type MarkdownEdit = {
  from: number
  to: number
  insert: string
  anchor: number
}

type MarkdownSelection = {
  from: number
  to: number
}

type PositionedMarkdownNode = {
  type?: string
  position?: {
    start?: { offset?: number }
    end?: { offset?: number }
  }
}

const markdownEditorParser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)

const voidHtmlElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
])

const proseBlockTypes = new Set(["heading", "paragraph"])
const complexBlockTypes = new Set(["blockquote", "code", "html", "list", "math", "table"])
const rawTextHtmlElements = new Set(["pre", "script", "style", "textarea"])

function hasClosingFence(source: string): boolean {
  const opening = source.match(/^(?: {0,3})(`{3,}|~{3,})[^\n]*(?:\n|$)/)
  if (!opening) return true

  const marker = opening[1][0]
  const minimumLength = opening[1].length
  const closing = new RegExp(`^ {0,3}${marker}{${minimumLength},}[ \\t]*$`)
  return source.split("\n").slice(1).some((line) => closing.test(line))
}

function hasClosingMathFence(source: string): boolean {
  const lines = source.split("\n")
  const opening = lines[0]?.match(/^ {0,3}(\${2,})[^\n]*$/)
  if (!opening) return true

  const minimumLength = opening[1].length
  const closing = new RegExp("^ {0,3}\\$" + `{${minimumLength},}[ \\t]*$`)
  return lines.slice(1).some((line) => closing.test(line))
}

function hasBalancedHtml(source: string): boolean {
  const trimmed = source.trim()
  if (trimmed.startsWith("<!--")) return trimmed.endsWith("-->")
  if (trimmed.startsWith("<?")) return trimmed.endsWith("?>")
  if (trimmed.startsWith("<![CDATA[")) return trimmed.endsWith("]]>")
  if (/^<![A-Z]/i.test(trimmed)) return trimmed.endsWith(">")

  const stack: string[] = []
  let foundTag = false
  let rawTextElement: string | undefined

  const tokens = trimmed.matchAll(
    /<!--[\s\S]*?(?:-->|$)|<(\/?)([A-Za-z][\w:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/g,
  )

  for (const match of tokens) {
    if (match[0].startsWith("<!--")) continue

    foundTag = true
    const [, closing, rawName] = match
    const name = rawName.toLowerCase()
    const selfClosing = /\/\s*>$/.test(match[0])

    if (rawTextElement) {
      if (closing && name === rawTextElement) {
        stack.pop()
        rawTextElement = undefined
      }
      continue
    }

    if (closing) {
      if (stack.at(-1) !== name) return false
      stack.pop()
    } else if (!selfClosing && !voidHtmlElements.has(name)) {
      stack.push(name)
      if (rawTextHtmlElements.has(name)) rawTextElement = name
    }
  }

  return foundTag && stack.length === 0
}

function isCompleteBlock(type: string, source: string): boolean {
  if (type === "code") return hasClosingFence(source)
  if (type === "math") return hasClosingMathFence(source)
  if (type === "html") return hasBalancedHtml(source)
  return true
}

export function getMarkdownEditorBlocks(source: string): MarkdownEditorBlock[] {
  const tree = markdownEditorParser.parse(source) as { children?: PositionedMarkdownNode[] }

  return (tree.children ?? []).flatMap((node) => {
    const start = node.position?.start?.offset
    const end = node.position?.end?.offset
    const type = node.type
    if (typeof start !== "number" || typeof end !== "number" || typeof type !== "string") {
      return []
    }

    const blockSource = source.slice(start, end)
    return [{ start, end, source: blockSource, type, complete: isCompleteBlock(type, blockSource) }]
  })
}

export function getPreviewableMarkdownBlocks(
  source: string,
  selections: readonly MarkdownSelection[],
): MarkdownEditorBlock[] {
  return getMarkdownEditorBlocks(source).filter((block) => {
    if (!block.complete) return false

    return !selections.some((selection) => {
      if (selection.from === selection.to) {
        return block.start <= selection.from && block.end >= selection.from
      }

      return block.start <= selection.to && block.end >= selection.from
    })
  })
}

function getBlockContainingSelection(
  source: string,
  from: number,
  to: number,
): MarkdownEditorBlock | undefined {
  return getMarkdownEditorBlocks(source).find(
    (block) => block.start <= from && block.end >= to,
  )
}

export function getMarkdownEnterEdit(
  source: string,
  from: number,
  to: number,
  shiftKey: boolean,
): MarkdownEdit | null {
  const block = getBlockContainingSelection(source, from, to)

  if (!block) {
    if (from !== to || shiftKey) return null
    return { from, to, insert: "\n", anchor: from + 1 }
  }

  if (!proseBlockTypes.has(block.type)) return null

  const insert = shiftKey ? "  \n" : "\n\n"
  return { from, to, insert, anchor: from + insert.length }
}

export function getComplexBlockExitEdit(
  source: string,
  from: number,
  to: number,
): MarkdownEdit | null {
  const block = getBlockContainingSelection(source, from, to)
  if (!block?.complete || !complexBlockTypes.has(block.type)) return null

  return {
    from: block.end,
    to: block.end,
    insert: "\n\n",
    anchor: block.end + 2,
  }
}
