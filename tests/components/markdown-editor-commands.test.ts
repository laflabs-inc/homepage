import { insertNewlineContinueMarkup, markdown } from "@codemirror/lang-markdown"
import {
  EditorState,
  type Extension,
  type StateCommand,
  type Transaction,
} from "@codemirror/state"
import { describe, expect, it } from "vitest"

import {
  markdownEditorKeymap,
  markdownMaxLength,
} from "@/components/admin/markdown-editor-commands"

function createState(
  doc: string,
  extensions: Extension | readonly Extension[] = [],
  anchor = doc.length,
  head?: number,
) {
  return EditorState.create({
    doc,
    selection: { anchor, head },
    extensions: [markdown(), extensions],
  })
}

function commandHarness(doc: string, anchor: number, head?: number) {
  const state = createState(doc, [], anchor, head)
  const transactions: Transaction[] = []
  const target = {
    state,
    dispatch(transaction: Transaction) {
      transactions.push(transaction)
    },
  }

  return {
    state,
    dispatch: target.dispatch,
    target,
    transactions,
    dispatched: () => transactions.at(-1),
  }
}

function runKey(key: string, target: Parameters<StateCommand>[0]) {
  for (const binding of markdownEditorKeymap) {
    if (binding.key !== key || !binding.run) continue
    if ((binding.run as StateCommand)(target)) return true
  }
  return false
}

function applyInsert(state: EditorState, from: number, insert: string) {
  return state.update({ changes: { from, insert } }).state
}

describe("Markdown editor commands", () => {
  it("only intercepts Enter when Markdown markup needs to continue", () => {
    expect(markdownEditorKeymap).toEqual([
      { key: "Enter", run: insertNewlineContinueMarkup },
    ])
  })

  it.each([
    ["list", "- item", "- item\n- "],
    ["blockquote", "> quote", "> quote\n> "],
  ])("lets Markdown continuation own Enter in a %s", (_label, source, expected) => {
    const { target, transactions, dispatched } = commandHarness(source, source.length)

    expect(runKey("Enter", target)).toBe(true)
    expect(transactions).toHaveLength(1)
    expect(dispatched()?.state.doc.toString()).toBe(expected)
  })

  it("leaves ordinary prose Enter to CodeMirror's default one-line newline", () => {
    const { target, transactions } = commandHarness("first", 5)

    expect(runKey("Enter", target)).toBe(false)
    expect(transactions).toHaveLength(0)
  })

  it("leaves ordinary Enter in complex blocks unclaimed", () => {
    const { target, transactions } = commandHarness("```ts\nvalue\n```", 8)

    expect(runKey("Enter", target)).toBe(false)
    expect(transactions).toHaveLength(0)
  })
})

describe("Markdown maximum length", () => {
  it("rejects content above max length", () => {
    const state = createState("12345", markdownMaxLength(5))

    expect(applyInsert(state, 5, "6").doc.toString()).toBe("12345")
  })

  it("allows content exactly at max length", () => {
    const state = createState("1234", markdownMaxLength(5))

    expect(applyInsert(state, 4, "5").doc.toString()).toBe("12345")
  })

  it("preserves content and selection when rejecting a transaction", () => {
    const state = createState("12345", markdownMaxLength(5), 2)

    const rejected = state.update({
      changes: { from: 5, insert: "6" },
      selection: { anchor: 6 },
    }).state

    expect(rejected.doc.toString()).toBe("12345")
    expect(rejected.selection.main.anchor).toBe(2)
    expect(rejected.selection.main.head).toBe(2)
  })

  it("allows edits that reduce the document length", () => {
    const state = createState("12345", markdownMaxLength(5))

    const shortened = state.update({ changes: { from: 3, to: 5 } }).state

    expect(shortened.doc.toString()).toBe("123")
  })

  it("allows selection changes while the document is over the limit", () => {
    const state = createState("12345", markdownMaxLength(3), 1)

    const selected = state.update({ selection: { anchor: 4 } }).state

    expect(selected.doc.toString()).toBe("12345")
    expect(selected.selection.main.anchor).toBe(4)
    expect(selected.selection.main.head).toBe(4)
  })

  it("allows incremental deletion while the document remains over the limit", () => {
    let state = createState("12345", markdownMaxLength(3))

    state = state.update({ changes: { from: 4, to: 5 } }).state
    expect(state.doc.toString()).toBe("1234")

    state = state.update({ changes: { from: 3, to: 4 } }).state
    expect(state.doc.toString()).toBe("123")
  })

  it("rejects further insertion while the document is over the limit", () => {
    const state = createState("12345", markdownMaxLength(3))

    expect(applyInsert(state, 5, "6").doc.toString()).toBe("12345")
  })
})
