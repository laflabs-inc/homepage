"use client"

import {
  StateEffect,
  StateField,
  type EditorState,
  type Extension,
} from "@codemirror/state"
import {
  Decoration,
  EditorView,
  WidgetType,
  type DecorationSet,
} from "@codemirror/view"
import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"

import { MarkdownBody } from "@/components/content/markdown-document"
import { getPreviewableMarkdownBlocks } from "@/lib/markdown/editor-model"

export const setMarkdownLivePreview = StateEffect.define<boolean>()

const widgetRoots = new WeakMap<HTMLElement, Root>()
const widgetActivations = new WeakMap<HTMLElement, (event: Event) => void>()

class MarkdownPreviewWidget extends WidgetType {
  constructor(
    private readonly source: string,
    private readonly sourceStart: number,
    private readonly className: string,
  ) {
    super()
  }

  eq(other: MarkdownPreviewWidget) {
    return this.source === other.source
      && this.sourceStart === other.sourceStart
      && this.className === other.className
  }

  toDOM(view: EditorView) {
    const dom = document.createElement("div")
    dom.className = this.className
    dom.contentEditable = "false"

    const activate = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      view.dispatch({
        selection: { anchor: this.sourceStart },
        scrollIntoView: true,
      })
      view.focus()
    }

    dom.addEventListener("pointerdown", activate)
    dom.addEventListener("click", activate)
    widgetActivations.set(dom, activate)

    const root = createRoot(dom)
    widgetRoots.set(dom, root)
    queueMicrotask(() => {
      if (widgetRoots.get(dom) !== root) return
      flushSync(() => root.render(<MarkdownBody source={this.source} />))
      view.requestMeasure()
    })

    return dom
  }

  destroy(dom: HTMLElement) {
    const activate = widgetActivations.get(dom)
    if (activate) {
      dom.removeEventListener("pointerdown", activate)
      dom.removeEventListener("click", activate)
      widgetActivations.delete(dom)
    }

    const root = widgetRoots.get(dom)
    if (!root) return
    widgetRoots.delete(dom)
    queueMicrotask(() => root.unmount())
  }
}

function buildPreviewDecorations(state: EditorState, className: string): DecorationSet {
  const source = state.doc.toString()
  const selections = state.selection.ranges.map(({ from, to }) => ({ from, to }))
  const ranges = getPreviewableMarkdownBlocks(source, selections).map((block) => (
    Decoration.replace({
      block: true,
      widget: new MarkdownPreviewWidget(block.source, block.start, className),
    }).range(block.start, block.end)
  ))

  return Decoration.set(ranges)
}

export function createMarkdownLivePreview(options: { className: string }): Extension {
  const livePreviewEnabled = StateField.define<boolean>({
    create: () => true,
    update(enabled, transaction) {
      for (const effect of transaction.effects) {
        if (effect.is(setMarkdownLivePreview)) enabled = effect.value
      }
      return enabled
    },
  })

  const previewDecorations = StateField.define<DecorationSet>({
    create: (state) => buildPreviewDecorations(state, options.className),
    update(decorations, transaction) {
      const modeChanged = transaction.effects.some((effect) => (
        effect.is(setMarkdownLivePreview)
      ))

      if (!transaction.state.field(livePreviewEnabled)) return Decoration.none
      if (transaction.docChanged || transaction.selection || modeChanged) {
        return buildPreviewDecorations(transaction.state, options.className)
      }
      return decorations
    },
    provide: (field) => EditorView.decorations.from(field),
  })

  return [livePreviewEnabled, previewDecorations]
}
