import { insertNewlineContinueMarkup } from "@codemirror/lang-markdown"
import { EditorState, type Extension } from "@codemirror/state"
import { EditorView, type KeyBinding } from "@codemirror/view"

export const markdownEditorKeymap: readonly KeyBinding[] = [
  { key: "Enter", run: insertNewlineContinueMarkup },
]

export function markdownMaxLength(maxLength: number): Extension {
  return EditorState.transactionFilter.of((transaction) => {
    if (!transaction.docChanged) return transaction
    if (transaction.newDoc.length <= maxLength) return transaction
    if (transaction.newDoc.length <= transaction.startState.doc.length) return transaction
    return []
  })
}

export function insertMarkdownBlock(view: EditorView, markdown: string): boolean {
  const selection = view.state.selection.main
  const before = view.state.doc.sliceString(0, selection.from)
  const after = view.state.doc.sliceString(selection.to)
  const prefix = before.length === 0 || before.endsWith("\n\n")
    ? ""
    : before.endsWith("\n") ? "\n" : "\n\n"
  const suffix = after.length === 0 || after.startsWith("\n\n")
    ? ""
    : after.startsWith("\n") ? "\n" : "\n\n"
  const insert = `${prefix}${markdown}${suffix}`
  const cursor = selection.from + insert.length - suffix.length
  const transaction = view.state.update({
    changes: { from: selection.from, to: selection.to, insert },
    selection: { anchor: cursor },
    effects: EditorView.scrollIntoView(cursor),
  })
  if (!transaction.docChanged) return false
  view.dispatch(transaction)
  view.focus()
  return true
}
