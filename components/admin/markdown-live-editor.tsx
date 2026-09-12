"use client"

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { markdown } from "@codemirror/lang-markdown"
import { Annotation, Compartment, EditorState, Prec } from "@codemirror/state"
import { EditorView, keymap } from "@codemirror/view"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import styles from "@/app/admin/admin.module.css"
import { markdownEditorKeymap, markdownMaxLength } from "@/components/admin/markdown-editor-commands"
import {
  createMarkdownLivePreview,
  setMarkdownLivePreview,
} from "@/components/admin/markdown-live-preview-extension"
import contentStyles from "@/components/content/content.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"

type MarkdownLiveEditorProps = {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

const externalValueSync = Annotation.define<boolean>()

export function MarkdownLiveEditor({ value, onChange, maxLength = 200_000 }: MarkdownLiveEditorProps) {
  const locale = useLocale()
  const t = adminCopy[locale].documents.editor
  const [sourceMode, setSourceMode] = useState(false)
  const [contentAttributes] = useState(() => new Compartment())
  const editorHostRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView>(null)
  const onChangeRef = useRef(onChange)
  const initialConfigurationRef = useRef({
    value,
    maxLength,
    markdownBodyLabel: t.markdownBody,
  })

  useLayoutEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useLayoutEffect(() => {
    const parent = editorHostRef.current
    if (!parent) return
    const initial = initialConfigurationRef.current

    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: initial.value,
        extensions: [
          markdown(),
          history(),
          Prec.highest(keymap.of(markdownEditorKeymap)),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.lineWrapping,
          markdownMaxLength(initial.maxLength),
          createMarkdownLivePreview({ className: styles.markdownBlock }),
          contentAttributes.of(EditorView.contentAttributes.of({
            "aria-label": initial.markdownBodyLabel,
          })),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return
            const externallySynchronized = update.transactions.some((transaction) => (
              transaction.annotation(externalValueSync) === true
            ))
            if (!externallySynchronized) onChangeRef.current(update.state.doc.toString())
          }),
        ],
      }),
    })
    editorViewRef.current = view

    return () => {
      editorViewRef.current = null
      view.destroy()
    }
  }, [contentAttributes])

  useLayoutEffect(() => {
    editorViewRef.current?.dispatch({
      effects: contentAttributes.reconfigure(EditorView.contentAttributes.of({
        "aria-label": t.markdownBody,
      })),
    })
  }, [contentAttributes, t.markdownBody])

  useEffect(() => {
    const view = editorViewRef.current
    if (!view || view.state.doc.toString() === value) return

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      annotations: externalValueSync.of(true),
    })
  }, [value])

  function selectLiveMode() {
    setSourceMode(false)
    editorViewRef.current?.dispatch({ effects: setMarkdownLivePreview.of(true) })
  }

  function selectSourceMode() {
    setSourceMode(true)
    editorViewRef.current?.dispatch({ effects: setMarkdownLivePreview.of(false) })
  }

  return (
    <div className={styles.markdownLiveEditor}>
      <div className={styles.markdownModeToolbar}>
        <div role="group" aria-label={t.markdownView}>
          <button type="button" aria-pressed={!sourceMode} onClick={selectLiveMode}>
            {t.livePreview}
          </button>
          <button type="button" aria-pressed={sourceMode} onClick={selectSourceMode}>
            {t.fullSource}
          </button>
        </div>
        <span>{sourceMode ? t.sourceModeHint : t.livePreviewHint}</span>
      </div>

      <div
        ref={editorHostRef}
        className={sourceMode
          ? styles.markdownSourceEditor
          : `${contentStyles.document} ${styles.markdownLiveDocument}`}
      />
    </div>
  )
}
