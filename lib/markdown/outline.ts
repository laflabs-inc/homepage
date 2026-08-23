import GithubSlugger from "github-slugger"
import { toString } from "mdast-util-to-string"
import remarkParse from "remark-parse"
import { unified } from "unified"
import { visit } from "unist-util-visit"

export type DocumentOutlineItem = {
  depth: 2 | 3
  id: string
  text: string
}

export function buildDocumentOutline(source: string): DocumentOutlineItem[] {
  const tree = unified().use(remarkParse).parse(source)
  const slugger = new GithubSlugger()
  const outline: DocumentOutlineItem[] = []

  visit(tree, "heading", (node) => {
    if (node.depth !== 2 && node.depth !== 3) return

    const text = toString(node)
    outline.push({
      depth: node.depth,
      id: slugger.slug(text),
      text,
    })
  })

  return outline
}
