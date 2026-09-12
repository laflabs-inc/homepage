import { EditorSelection, EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { act, fireEvent } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createMarkdownLivePreview,
  setMarkdownLivePreview,
} from "@/components/admin/markdown-live-preview-extension"

const previewClassName = "markdown-preview-widget"
const mountedViews = new Set<EditorView>()

function createView(doc: string, anchor = 0, head = anchor) {
  const parent = document.createElement("div")
  document.body.append(parent)

  const state = EditorState.create({
    doc,
    selection: EditorSelection.single(anchor, head),
    extensions: [createMarkdownLivePreview({ className: previewClassName })],
  })

  let view!: EditorView
  act(() => {
    view = new EditorView({ state, parent })
  })
  mountedViews.add(view)
  return view
}

function previewWidgets(view: EditorView) {
  return Array.from(view.dom.querySelectorAll<HTMLElement>(`.${previewClassName}`))
}

function dispatch(view: EditorView, spec: Parameters<EditorView["dispatch"]>[0]) {
  act(() => view.dispatch(spec))
}

afterEach(() => {
  for (const view of mountedViews) {
    act(() => view.destroy())
    view.dom.parentElement?.remove()
  }
  mountedViews.clear()
})

describe("Markdown live preview extension", () => {
  it("keeps the cursor block as source and previews the inactive block", () => {
    const view = createView("first\n\nsecond", 2)

    expect(previewWidgets(view)).toHaveLength(1)
    expect(previewWidgets(view)[0]).toHaveTextContent("second")
    expect(view.contentDOM.querySelector(".cm-line")).toHaveTextContent("first")
  })

  it("keeps every block intersecting a selection as source", () => {
    const view = createView("first\n\nsecond", 2, 10)

    expect(previewWidgets(view)).toHaveLength(0)
    expect(view.contentDOM).toHaveTextContent("first")
    expect(view.contentDOM).toHaveTextContent("second")
  })

  it("leaves a blank separator line visible when it holds the cursor", () => {
    const source = "first\n\nsecond"
    const view = createView(source, 6)
    const sourceLines = Array.from(view.contentDOM.querySelectorAll<HTMLElement>(".cm-line"))

    expect(previewWidgets(view)).toHaveLength(2)
    expect(sourceLines.some((line) => line.textContent === "")).toBe(true)
    expect(view.state.doc.toString()).toBe(source)
    expect(view.state.selection.main.head).toBe(6)
  })

  it("removes widgets through the mode effect without changing document or selection", () => {
    const source = "first\n\nsecond"
    const view = createView(source, 2)

    expect(previewWidgets(view)).toHaveLength(1)
    dispatch(view, { effects: setMarkdownLivePreview.of(false) })

    expect(previewWidgets(view)).toHaveLength(0)
    expect(view.state.doc.toString()).toBe(source)
    expect(view.state.selection.main.anchor).toBe(2)
    expect(view.state.selection.main.head).toBe(2)
  })

  it("moves the editor selection to a widget source start on pointer activation", () => {
    const view = createView("first\n\nsecond", 2)
    const widget = previewWidgets(view)[0]

    fireEvent.pointerDown(widget)

    expect(view.state.selection.main.anchor).toBe(7)
    expect(view.state.selection.main.head).toBe(7)
    expect(previewWidgets(view)).toHaveLength(1)
    expect(previewWidgets(view)[0]).toHaveTextContent("first")
  })

  it("prevents rendered links from navigating the authoring surface", () => {
    const view = createView("first\n\n[second](https://example.com)", 2)
    const link = previewWidgets(view)[0]?.querySelector("a")
    const click = new MouseEvent("click", { bubbles: true, cancelable: true })

    expect(link).not.toBeNull()
    expect(link?.dispatchEvent(click)).toBe(false)
    expect(click.defaultPrevented).toBe(true)
    expect(view.state.selection.main.head).toBe(7)
  })

  it("rebuilds after document changes and leaves incomplete Markdown as source", () => {
    const view = createView("first\n\nsecond", 2)

    expect(previewWidgets(view)).toHaveLength(1)
    dispatch(view, { changes: { from: 7, to: 13, insert: "```ts\nvalue" } })

    expect(previewWidgets(view)).toHaveLength(0)
    expect(view.state.doc.toString()).toBe("first\n\n```ts\nvalue")
    expect(view.contentDOM).toHaveTextContent("```ts")
  })

  it("renders multiline replacements as direct block decorations", () => {
    const view = createView("first\n\n- one\n- two", 2)

    expect(previewWidgets(view)).toHaveLength(1)
    expect(previewWidgets(view)[0]?.querySelectorAll("li")).toHaveLength(2)
  })

  it("unmounts widget React roots when the editor view is destroyed", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const view = createView("first\n\nsecond", 2)
    const widget = previewWidgets(view)[0]
    let destroyed = false

    try {
      expect(widget).toHaveTextContent("second")
      act(() => view.destroy())
      destroyed = true

      expect(widget).toBeEmptyDOMElement()
      expect(consoleError).not.toHaveBeenCalled()
    } finally {
      if (!destroyed) act(() => view.destroy())
      mountedViews.delete(view)
      consoleError.mockRestore()
      view.dom.parentElement?.remove()
    }
  })
})
