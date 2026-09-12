import { insertNewlineContinueMarkup } from "@codemirror/lang-markdown"
import { EditorState, type Extension, type StateCommand } from "@codemirror/state"
import type { KeyBinding } from "@codemirror/view"

import {
  getComplexBlockExitEdit,
  getMarkdownEnterEdit,
} from "@/lib/markdown/editor-model"

type MarkdownEdit = {
  from: number
  to: number
  insert: string
  anchor: number
}

function dispatchMarkdownEdit(
  { state, dispatch }: Parameters<StateCommand>[0],
  edit: MarkdownEdit | null,
): boolean {
  if (!edit) return false

  dispatch(state.update({
    changes: { from: edit.from, to: edit.to, insert: edit.insert },
    selection: { anchor: edit.anchor },
    scrollIntoView: true,
  }))
  return true
}

export const runMarkdownEnter: StateCommand = (target) => {
  const { from, to } = target.state.selection.main
  return dispatchMarkdownEdit(
    target,
    getMarkdownEnterEdit(target.state.doc.toString(), from, to, false),
  )
}

export const runMarkdownHardBreak: StateCommand = (target) => {
  const { from, to } = target.state.selection.main
  return dispatchMarkdownEdit(
    target,
    getMarkdownEnterEdit(target.state.doc.toString(), from, to, true),
  )
}

export const exitComplexMarkdownBlock: StateCommand = (target) => {
  const { from, to } = target.state.selection.main
  return dispatchMarkdownEdit(
    target,
    getComplexBlockExitEdit(target.state.doc.toString(), from, to),
  )
}

export const markdownEditorKeymap: readonly KeyBinding[] = [
  { key: "Shift-Enter", run: runMarkdownHardBreak },
  { key: "Mod-Enter", run: exitComplexMarkdownBlock },
  { key: "Enter", run: insertNewlineContinueMarkup },
  { key: "Enter", run: runMarkdownEnter },
]

export function markdownMaxLength(maxLength: number): Extension {
  return EditorState.transactionFilter.of((transaction) => (
    transaction.newDoc.length > maxLength ? [] : transaction
  ))
}
