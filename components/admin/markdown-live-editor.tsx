"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"

import styles from "@/app/admin/admin.module.css"
import { MarkdownBody } from "@/components/content/markdown-document"
import contentStyles from "@/components/content/content.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"
import {
  markdownBlockSupportsInternalNewlines,
  splitMarkdownBlocks,
  type MarkdownBlock,
} from "@/lib/markdown/blocks"

type MarkdownLiveEditorProps = {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

type ActiveRange = {
  start: number
  end: number
  multiline: boolean
  cursor?: number
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

function contentEnd(source: string) {
  return source.replace(/\s+$/, "").length
}

export function MarkdownLiveEditor({ value, onChange, maxLength = 200_000 }: MarkdownLiveEditorProps) {
  const locale = useLocale()
  const t = adminCopy[locale].documents.editor
  const [sourceMode, setSourceMode] = useState(false)
  const [active, setActive] = useState<ActiveRange | null>(() => (
    value.length === 0 ? { start: 0, end: 0, multiline: false, cursor: 0 } : null
  ))
  const activeTextareaRef = useRef<HTMLTextAreaElement>(null)
  const blocks = useMemo(() => displayBlocks(value, active), [active, value])

  useLayoutEffect(() => {
    const textarea = activeTextareaRef.current
    if (!textarea) return
    textarea.focus()
    if (active?.cursor !== undefined) textarea.setSelectionRange(active.cursor, active.cursor)
  }, [active?.cursor, active?.start])

  useEffect(() => {
    if (!active) return

    function finishFromOutsidePointer(event: PointerEvent) {
      if (value.length === 0) return
      if (activeTextareaRef.current?.contains(event.target as Node)) return
      setActive(null)
    }

    document.addEventListener("pointerdown", finishFromOutsidePointer, true)
    return () => document.removeEventListener("pointerdown", finishFromOutsidePointer, true)
  }, [active, value.length])

  function selectLiveMode() {
    setSourceMode(false)
  }

  function selectSourceMode() {
    setActive(null)
    setSourceMode(true)
  }

  function beginEditing(block: MarkdownBlock, cursor = contentEnd(block.source)) {
    setActive({
      start: block.start,
      end: block.end,
      multiline: markdownBlockSupportsInternalNewlines(block.source),
      cursor,
    })
  }

  function updateActiveBlock(nextSource: string) {
    if (!active) return
    const nextEnd = active.start + nextSource.length
    onChange(`${value.slice(0, active.start)}${nextSource}${value.slice(active.end)}`)
    setActive({ start: active.start, end: nextEnd, multiline: active.multiline })
  }

  function finishEditing() {
    setActive(null)
  }

  function moveToAdjacentBlock(direction: "previous" | "next") {
    if (!active) return
    const documentBlocks = splitMarkdownBlocks(value).filter((block) => block.source.trim().length > 0)
    const target = direction === "previous"
      ? documentBlocks.findLast((block) => block.end <= active.start)
      : documentBlocks.find((block) => block.start >= active.end)
    if (!target) return
    beginEditing(target, direction === "previous" ? contentEnd(target.source) : 0)
  }

  function splitProseBlock(textarea: HTMLTextAreaElement) {
    if (!active) return
    const source = value.slice(active.start, active.end)
    const left = source.slice(0, textarea.selectionStart).replace(/\n+$/, "")
    const right = source.slice(textarea.selectionEnd).replace(/^\n+/, "")
    const replacement = `${left}\n\n${right}`
    const nextValue = `${value.slice(0, active.start)}${replacement}${value.slice(active.end)}`
    if (nextValue.length > maxLength) return

    const nextStart = active.start + left.length + 2
    onChange(nextValue)
    setActive({
      start: nextStart,
      end: nextStart + right.length,
      multiline: false,
      cursor: 0,
    })
  }

  function returnFromEmptyBlock(textarea: HTMLTextAreaElement) {
    if (!active || textarea.selectionStart !== 0 || textarea.selectionEnd !== 0) return false
    if (value.slice(active.start, active.end).trim().length > 0 || active.start === 0) return false

    const before = value.slice(0, active.start).replace(/\n+$/, "")
    const previous = splitMarkdownBlocks(before).findLast((block) => block.source.trim().length > 0)
    if (!previous) return false

    const after = value.slice(active.end).replace(/^\n+/, "")
    const nextValue = after.length > 0 ? `${before}\n\n${after}` : before
    onChange(nextValue)
    setActive({
      start: previous.start,
      end: before.length,
      multiline: markdownBlockSupportsInternalNewlines(previous.source),
      cursor: contentEnd(previous.source),
    })
    return true
  }

  function handleActiveKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape" || (event.key === "Enter" && (event.metaKey || event.ctrlKey))) {
      event.preventDefault()
      finishEditing()
      return
    }
    if (!active) return

    if (event.key === "Enter" && !event.shiftKey && !active.multiline) {
      event.preventDefault()
      splitProseBlock(event.currentTarget)
      return
    }
    if (event.key === "Backspace" && returnFromEmptyBlock(event.currentTarget)) {
      event.preventDefault()
      return
    }
    if (event.key === "ArrowUp" && event.currentTarget.selectionStart === 0) {
      event.preventDefault()
      moveToAdjacentBlock("previous")
      return
    }
    if (event.key === "ArrowDown" && event.currentTarget.selectionEnd >= contentEnd(event.currentTarget.value)) {
      event.preventDefault()
      moveToAdjacentBlock("next")
    }
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
            <div className={styles.markdownActiveBlock} key={`editing-${block.start}`}>
              <textarea
                ref={activeTextareaRef}
                id="document-markdown-body"
                aria-label={value.length === 0 ? t.markdownBody : t.editingBlock(index + 1)}
                required
                maxLength={maxLength}
                rows={Math.max(1, block.source.replace(/\n$/, "").split("\n").length)}
                value={block.source}
                onChange={(event) => updateActiveBlock(event.target.value)}
                onKeyDown={handleActiveKeyDown}
              />
            </div>
          ) : (
            <div
              className={styles.markdownBlock}
              key={`${block.start}-${block.end}`}
              tabIndex={0}
              aria-label={t.editBlock(index + 1)}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a, button, input, textarea, select")) return
                beginEditing(block)
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return
                event.preventDefault()
                beginEditing(block)
              }}
            >
              <MarkdownBody source={block.source} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
