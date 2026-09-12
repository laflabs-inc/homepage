"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import styles from "@/app/admin/admin.module.css"
import { MarkdownBody } from "@/components/content/markdown-document"
import contentStyles from "@/components/content/content.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"
import { splitMarkdownBlocks, type MarkdownBlock } from "@/lib/markdown/blocks"

type MarkdownLiveEditorProps = {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

type ActiveRange = {
  start: number
  end: number
}

type DisplayBlock = MarkdownBlock & {
  editing: boolean
}

function offsetBlocks(source: string, offset: number): MarkdownBlock[] {
  if (source.length === 0) return []
  return splitMarkdownBlocks(source).map((block) => ({
    start: block.start + offset,
    end: block.end + offset,
    source: block.source,
  }))
}

function displayBlocks(value: string, active: ActiveRange | null): DisplayBlock[] {
  if (!active) return splitMarkdownBlocks(value).map((block) => ({ ...block, editing: false }))

  return [
    ...offsetBlocks(value.slice(0, active.start), 0).map((block) => ({ ...block, editing: false })),
    {
      start: active.start,
      end: active.end,
      source: value.slice(active.start, active.end),
      editing: true,
    },
    ...offsetBlocks(value.slice(active.end), active.end).map((block) => ({ ...block, editing: false })),
  ]
}

export function MarkdownLiveEditor({ value, onChange, maxLength = 200_000 }: MarkdownLiveEditorProps) {
  const locale = useLocale()
  const t = adminCopy[locale].documents.editor
  const [sourceMode, setSourceMode] = useState(false)
  const [active, setActive] = useState<ActiveRange | null>(() => (
    value.length === 0 ? { start: 0, end: 0 } : null
  ))
  const activeTextareaRef = useRef<HTMLTextAreaElement>(null)
  const blocks = useMemo(() => displayBlocks(value, active), [active, value])

  useEffect(() => {
    activeTextareaRef.current?.focus()
  }, [active?.start])

  function selectLiveMode() {
    setSourceMode(false)
  }

  function selectSourceMode() {
    setActive(null)
    setSourceMode(true)
  }

  function beginEditing(block: MarkdownBlock) {
    setActive({ start: block.start, end: block.end })
  }

  function updateActiveBlock(nextSource: string) {
    if (!active) return
    const nextEnd = active.start + nextSource.length
    onChange(`${value.slice(0, active.start)}${nextSource}${value.slice(active.end)}`)
    setActive({ start: active.start, end: nextEnd })
  }

  function finishEditing() {
    setActive(null)
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

      {sourceMode ? (
        <textarea
          id="document-markdown-body"
          className={styles.markdownSourceEditor}
          aria-label={t.markdownBody}
          required
          maxLength={maxLength}
          rows={28}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div className={`${contentStyles.document} ${styles.markdownLiveDocument}`}>
          {blocks.map((block, index) => block.editing ? (
            <div className={styles.markdownBlockEditor} key={`editing-${block.start}`}>
              <div className={styles.markdownBlockEditorMeta}>
                <span>{t.editingBlock(index + 1)}</span>
                <button type="button" onClick={finishEditing}>{t.finishEditing}</button>
              </div>
              <textarea
                ref={activeTextareaRef}
                id="document-markdown-body"
                aria-label={value.length === 0 ? t.markdownBody : t.editingBlock(index + 1)}
                required
                maxLength={maxLength}
                rows={Math.max(3, block.source.split("\n").length + 1)}
                value={block.source}
                onChange={(event) => updateActiveBlock(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" || (event.key === "Enter" && (event.metaKey || event.ctrlKey))) {
                    event.preventDefault()
                    finishEditing()
                  }
                }}
              />
            </div>
          ) : (
            <div
              className={styles.markdownBlock}
              key={`${block.start}-${block.end}`}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a, button, input, textarea, select")) return
                beginEditing(block)
              }}
            >
              <button
                className={styles.markdownBlockEditButton}
                type="button"
                aria-label={t.editBlock(index + 1)}
                onClick={() => beginEditing(block)}
              >{t.editBlockShort}</button>
              <MarkdownBody source={block.source} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
