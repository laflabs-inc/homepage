import { describe, expect, it } from "vitest"

import { splitMarkdownBlocks } from "@/lib/markdown/blocks"

describe("splitMarkdownBlocks", () => {
  it("keeps advanced Markdown blocks intact and reconstructs the exact source", () => {
    const source = [
      "## Heading",
      "",
      "Paragraph with **weight**.",
      "",
      "| A | B |",
      "| --- | --- |",
      "| 1 | 2 |",
      "",
      "$$",
      "E = mc^2",
      "$$",
      "",
      "```mermaid",
      "graph LR",
      "A --> B",
      "```",
    ].join("\n")

    const blocks = splitMarkdownBlocks(source)

    expect(blocks.map((block) => block.source.trim())).toEqual([
      "## Heading",
      "Paragraph with **weight**.",
      "| A | B |\n| --- | --- |\n| 1 | 2 |",
      "$$\nE = mc^2\n$$",
      "```mermaid\ngraph LR\nA --> B\n```",
    ])
    expect(blocks.map((block) => block.source).join("")).toBe(source)
  })

  it("returns one editable empty block for a new document", () => {
    expect(splitMarkdownBlocks("")).toEqual([{ start: 0, end: 0, source: "" }])
  })
})
