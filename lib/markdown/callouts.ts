import type { Blockquote, Root, Text } from "mdast"
import type { Plugin } from "unified"
import { visit } from "unist-util-visit"

const CALLOUT_TYPES = new Set([
  "note",
  "info",
  "tip",
  "success",
  "warning",
  "danger",
])

const calloutMarker = /^\[!([A-Z]+)\](?:[ \t]+([^\n]*))?(?:\n|$)/

function firstParagraphText(node: Blockquote): Text | null {
  const paragraph = node.children[0]
  if (!paragraph || paragraph.type !== "paragraph") return null

  const text = paragraph.children[0]
  return text?.type === "text" ? text : null
}

export const remarkLafCallouts: Plugin<[], Root> = () => (tree) => {
  visit(tree, "blockquote", (node) => {
    const text = firstParagraphText(node)
    if (!text) return

    const match = calloutMarker.exec(text.value)
    if (!match) return

    const type = match[1].toLowerCase()
    if (!CALLOUT_TYPES.has(type)) return

    const title = match[2]?.trim() || type
    node.data = {
      ...node.data,
      hProperties: {
        ...node.data?.hProperties,
        "data-callout": type,
        "data-callout-title": title,
      },
    }
    text.value = text.value.slice(match[0].length)
  })
}
