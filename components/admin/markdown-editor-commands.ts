import { insertNewlineContinueMarkup } from "@codemirror/lang-markdown"
import { EditorState, type Extension } from "@codemirror/state"
import type { KeyBinding } from "@codemirror/view"

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
