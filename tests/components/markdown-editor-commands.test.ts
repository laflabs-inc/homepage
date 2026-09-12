import { history, undo } from "@codemirror/commands"
import { insertNewlineContinueMarkup, markdown } from "@codemirror/lang-markdown"
import {
  EditorState,
  type Extension,
  type StateCommand,
  type Transaction,
} from "@codemirror/state"
import { describe, expect, it } from "vitest"

import {
  exitComplexMarkdownBlock,
  markdownEditorKeymap,
  markdownMaxLength,
  runMarkdownEnter,
  runMarkdownHardBreak,
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
  it("dispatches one paragraph transaction", () => {
    const { state, dispatch, transactions, dispatched } = commandHarness("first", 5)

    expect(runMarkdownEnter({ state, dispatch })).toBe(true)
    expect(transactions).toHaveLength(1)
    expect(dispatched()?.state.doc.toString()).toBe("first\n\n")
    expect(dispatched()?.state.selection.main.head).toBe(7)
    expect(dispatched()?.scrollIntoView).toBe(true)
  })

  it("undoes paragraph Enter separately from preceding typing", () => {
    let state = createState("", history())
    const dispatch = (transaction: Transaction) => {
      state = transaction.state
    }
    state = state.update({
      changes: { from: 0, insert: "a" },
      selection: { anchor: 1 },
      userEvent: "input.type",
    }).state

    expect(runMarkdownEnter({ state, dispatch })).toBe(true)
    expect(state.doc.toString()).toBe("a\n\n")
    expect(undo({ state, dispatch })).toBe(true)
    expect(state.doc.toString()).toBe("a")
  })

  it("starts a paragraph after a heading", () => {
    const { target, dispatched } = commandHarness("# First", 7)

    expect(runMarkdownEnter(target)).toBe(true)
    expect(dispatched()?.state.doc.toString()).toBe("# First\n\n")
    expect(dispatched()?.state.selection.main.head).toBe(9)
  })

  it("does not claim Enter inside fenced code", () => {
    const { target, transactions } = commandHarness("```ts\nvalue\n```", 8)

    expect(runMarkdownEnter(target)).toBe(false)
    expect(transactions).toHaveLength(0)
  })

  it("dispatches one Markdown hard-break transaction", () => {
    const { target, transactions, dispatched } = commandHarness("first", 5)

    expect(runMarkdownHardBreak(target)).toBe(true)
    expect(transactions).toHaveLength(1)
    expect(dispatched()?.state.doc.toString()).toBe("first  \n")
    expect(dispatched()?.state.selection.main.head).toBe(8)
    expect(dispatched()?.scrollIntoView).toBe(true)
  })

  it("exits a complete complex block in one transaction", () => {
    const { target, transactions, dispatched } = commandHarness("```ts\nvalue\n```", 8)

    expect(exitComplexMarkdownBlock(target)).toBe(true)
    expect(transactions).toHaveLength(1)
    expect(dispatched()?.state.doc.toString()).toBe("```ts\nvalue\n```\n\n")
    expect(dispatched()?.state.selection.main.head).toBe(17)
    expect(dispatched()?.scrollIntoView).toBe(true)
  })

  it("does not exit an incomplete complex block", () => {
    const { target, transactions } = commandHarness("```ts\nvalue", 8)

    expect(exitComplexMarkdownBlock(target)).toBe(false)
    expect(transactions).toHaveLength(0)
  })

  it("exports specialized bindings in precedence order", () => {
    expect(markdownEditorKeymap).toEqual([
      { key: "Shift-Enter", run: runMarkdownHardBreak },
      { key: "Mod-Enter", run: exitComplexMarkdownBlock },
      { key: "Enter", run: insertNewlineContinueMarkup },
      { key: "Enter", run: runMarkdownEnter },
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

  it("lets prose Enter fall through to the paragraph command", () => {
    const { target, transactions, dispatched } = commandHarness("first", 5)

    expect(runKey("Enter", target)).toBe(true)
    expect(transactions).toHaveLength(1)
    expect(dispatched()?.state.doc.toString()).toBe("first\n\n")
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
})
