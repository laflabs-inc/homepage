import { describe, expect, it } from "vitest"

import {
  getComplexBlockExitEdit,
  getMarkdownEnterEdit,
  getMarkdownEditorBlocks,
  getPreviewableMarkdownBlocks,
} from "@/lib/markdown/editor-model"

describe("Markdown editor model", () => {
  it("excludes separators from top-level block ranges", () => {
    expect(getMarkdownEditorBlocks("first\n\nsecond")).toMatchObject([
      { start: 0, end: 5, source: "first", type: "paragraph", complete: true },
      { start: 7, end: 13, source: "second", type: "paragraph", complete: true },
    ])
  })

  it("keeps every selected block as source", () => {
    expect(
      getPreviewableMarkdownBlocks("first\n\nsecond", [{ from: 2, to: 10 }]),
    ).toEqual([])
  })

  it("keeps a block active at its exact end", () => {
    expect(
      getPreviewableMarkdownBlocks("first\n\nsecond", [{ from: 5, to: 5 }]),
    ).toMatchObject([{ source: "second" }])
  })

  it("activates no block for a cursor in separator whitespace", () => {
    expect(
      getPreviewableMarkdownBlocks("first\n\nsecond", [{ from: 6, to: 6 }]),
    ).toMatchObject([{ source: "first" }, { source: "second" }])
  })

  it("keeps an incomplete fence as source", () => {
    expect(
      getPreviewableMarkdownBlocks("```ts\nconst value = 1", [{ from: 0, to: 0 }]),
    ).toEqual([])
  })

  it.each([
    ["fenced code", "```ts\nconst value = 1"],
    ["display math", "$$\nE = mc^2"],
    ["raw HTML", "<div>\ncontent"],
  ])("marks unmatched %s incomplete", (_label, source) => {
    expect(getMarkdownEditorBlocks(source)).toMatchObject([{ complete: false }])
    expect(getPreviewableMarkdownBlocks(source, [])).toEqual([])
  })

  it.each([
    ["fenced code with CRLF separators", "```ts\r\nconst value = 1\r\n```"],
    ["display math", "$$\nE = mc^2\n$$"],
    ["raw HTML", "<div>\ncontent\n</div>"],
    ["raw HTML containing a less-than operator", "<script>\nif (a < b) {}\n</script>"],
  ])("marks matched %s complete", (_label, source) => {
    expect(getMarkdownEditorBlocks(source)).toMatchObject([{ complete: true }])
  })

  it("ignores closing tags inside comments when checking raw HTML completeness", () => {
    const source = "<div>\n<!-- </div> -->"

    expect(getMarkdownEditorBlocks(source)).toMatchObject([{ complete: false }])
    expect(getPreviewableMarkdownBlocks(source, [])).toEqual([])
  })

  it("ignores tag-like strings inside raw-text elements", () => {
    const source = '<script>\nconst html = "</div>"\n</script>'

    expect(getPreviewableMarkdownBlocks(source, [])).toMatchObject([
      { source, type: "html", complete: true },
    ])
  })

  it("starts a new paragraph from prose", () => {
    expect(getMarkdownEnterEdit("first", 5, 5, false)).toEqual({
      from: 5,
      to: 5,
      insert: "\n\n",
      anchor: 7,
    })
  })

  it("starts a new paragraph from a heading", () => {
    expect(getMarkdownEnterEdit("# First", 7, 7, false)).toEqual({
      from: 7,
      to: 7,
      insert: "\n\n",
      anchor: 9,
    })
  })

  it("does not swallow Enter on a blank separator", () => {
    expect(getMarkdownEnterEdit("first\n\nsecond", 6, 6, false)).toEqual({
      from: 6,
      to: 6,
      insert: "\n",
      anchor: 7,
    })
  })

  it("inserts a Markdown hard break for Shift Enter", () => {
    expect(getMarkdownEnterEdit("first", 5, 5, true)).toEqual({
      from: 5,
      to: 5,
      insert: "  \n",
      anchor: 8,
    })
  })

  it("leaves fenced code Enter to CodeMirror", () => {
    expect(getMarkdownEnterEdit("```ts\nvalue\n```", 8, 8, false)).toBeNull()
  })

  it("creates a paragraph after a complex block", () => {
    expect(getComplexBlockExitEdit("```ts\nvalue\n```", 8, 8)).toEqual({
      from: 15,
      to: 15,
      insert: "\n\n",
      anchor: 17,
    })
  })
})
