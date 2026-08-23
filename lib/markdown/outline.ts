import GithubSlugger from "github-slugger"
import { toString } from "hast-util-to-string"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"
import { visit } from "unist-util-visit"

export type DocumentOutlineItem = {
  depth: 2 | 3
  id: string
  text: string
}

export function buildDocumentOutline(source: string): DocumentOutlineItem[] {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype)
  const tree = processor.runSync(processor.parse(source))
  const slugger = new GithubSlugger()
  const outline: DocumentOutlineItem[] = []

  visit(tree, "element", (node) => {
    const depth = /^h([1-6])$/.exec(node.tagName)?.[1]
    if (!depth) return

    const text = toString(node)
    const id = slugger.slug(text)
    if (depth !== "2" && depth !== "3") return

    outline.push({
      depth: Number(depth) as 2 | 3,
      id,
      text,
    })
  })

  return outline
}
