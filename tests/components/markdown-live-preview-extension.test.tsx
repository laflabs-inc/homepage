import { EditorSelection, EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { act, fireEvent, render, waitFor } from "@testing-library/react"
import { useLayoutEffect, useRef } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createMarkdownLivePreview,
  setMarkdownLivePreview,
} from "@/components/admin/markdown-live-preview-extension"

const previewClassName = "markdown-preview-widget"
const mountedViews = new Map<EditorView, HTMLElement>()

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
  mountedViews.set(view, parent)
  return view
}

function previewWidgets(view: EditorView) {
  return Array.from(view.dom.querySelectorAll<HTMLElement>(`.${previewClassName}`))
}

function dispatch(view: EditorView, spec: Parameters<EditorView["dispatch"]>[0]) {
  act(() => view.dispatch(spec))
}

afterEach(async () => {
  for (const [view, parent] of mountedViews) {
    await act(async () => {
      view.destroy()
      await Promise.resolve()
    })
    parent.remove()
  }
  mountedViews.clear()
})

function EditorViewLifecycleHost() {
  const parentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const parent = parentRef.current
    if (!parent) return

    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: "first\n\nsecond",
        selection: EditorSelection.cursor(2),
        extensions: [createMarkdownLivePreview({ className: previewClassName })],
      }),
    })

    return () => view.destroy()
  }, [])

  return <div ref={parentRef} />
}

describe("Markdown live preview extension", () => {
  it("keeps the cursor block as source and previews the inactive block", async () => {
    const view = createView("first\n\nsecond", 2)

    expect(previewWidgets(view)).toHaveLength(1)
    await waitFor(() => expect(previewWidgets(view)[0]).toHaveTextContent("second"))
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
    expect(view.contentDOM.querySelector(".cm-markdown-paragraph-separator")).toBeNull()
    expect(view.state.doc.toString()).toBe(source)
    expect(view.state.selection.main.head).toBe(6)
  })

  it("collapses the structural paragraph separator after Enter", () => {
    const source = "first\n\n"
    const view = createView(source, 7)
    const sourceLines = Array.from(view.contentDOM.querySelectorAll<HTMLElement>(".cm-line"))

    expect(sourceLines).toHaveLength(2)
    expect(sourceLines[0]).toHaveAttribute("aria-hidden", "true")
    expect(sourceLines[0]).toHaveClass("cm-markdown-paragraph-separator")
    expect(sourceLines[1]).not.toHaveAttribute("aria-hidden")
    expect(view.state.doc.toString()).toBe(source)
    expect(view.state.selection.main.head).toBe(7)
  })

  it("keeps additional intentional blank lines visible", () => {
    const source = "first\n\n\n"
    const view = createView(source, 8)
    const sourceLines = Array.from(view.contentDOM.querySelectorAll<HTMLElement>(".cm-line"))

    expect(sourceLines).toHaveLength(3)
    expect(sourceLines[0]).toHaveClass("cm-markdown-paragraph-separator")
    expect(sourceLines[1]).not.toHaveClass("cm-markdown-paragraph-separator")
    expect(sourceLines[2]).not.toHaveClass("cm-markdown-paragraph-separator")
  })

  it("shows structural separators in full source mode", () => {
    const source = "first\n\n"
    const view = createView(source, 7)

    dispatch(view, { effects: setMarkdownLivePreview.of(false) })

    expect(view.contentDOM.querySelector(".cm-markdown-paragraph-separator")).toBeNull()
    expect(view.state.doc.toString()).toBe(source)
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

  it("moves the editor selection to a widget source start on pointer activation", async () => {
    const view = createView("first\n\nsecond", 2)
    const widget = previewWidgets(view)[0]

    fireEvent.pointerDown(widget)

    expect(view.state.selection.main.anchor).toBe(7)
    expect(view.state.selection.main.head).toBe(7)
    expect(previewWidgets(view)).toHaveLength(1)
    await waitFor(() => expect(previewWidgets(view)[0]).toHaveTextContent("first"))
  })

  it("prevents rendered links from navigating the authoring surface", async () => {
    const view = createView("first\n\n[second](https://example.com)", 2)
    await waitFor(() => (
      expect(previewWidgets(view)[0]?.querySelector("a")).not.toBeNull()
    ))
    const link = previewWidgets(view)[0]?.querySelector("a")
    if (!link) throw new Error("Expected the rendered Markdown link")
    const click = new MouseEvent("click", { bubbles: true, cancelable: true })

    expect(link.dispatchEvent(click)).toBe(false)
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

  it("renders multiline replacements as direct block decorations", async () => {
    const view = createView("first\n\n- one\n- two", 2)

    expect(previewWidgets(view)).toHaveLength(1)
    await waitFor(() => (
      expect(previewWidgets(view)[0]?.querySelectorAll("li")).toHaveLength(2)
    ))
  })

  it("unmounts widget React roots when the editor view is destroyed", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const view = createView("first\n\nsecond", 2)
    const parent = mountedViews.get(view)
    const widget = previewWidgets(view)[0]
    let destroyed = false

    try {
      await waitFor(() => expect(widget).toHaveTextContent("second"))
      act(() => view.destroy())
      destroyed = true

      await waitFor(() => expect(widget).toBeEmptyDOMElement())
      expect(consoleError).not.toHaveBeenCalled()
    } finally {
      if (!destroyed) {
        await act(async () => {
          view.destroy()
          await Promise.resolve()
        })
      }
      mountedViews.delete(view)
      consoleError.mockRestore()
      parent?.remove()
    }
  })

  it("avoids nested-root warnings in a containing React lifecycle", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    let rendered: ReturnType<typeof render> | undefined

    try {
      rendered = render(<EditorViewLifecycleHost />)
      const widget = rendered.container.querySelector<HTMLElement>(`.${previewClassName}`)

      expect(widget).not.toBeNull()
      await waitFor(() => expect(widget).toHaveTextContent("second"))
      rendered.unmount()
      await waitFor(() => expect(widget).toBeEmptyDOMElement())

      expect(consoleError).not.toHaveBeenCalled()
      expect(consoleWarn).not.toHaveBeenCalled()
    } finally {
      rendered?.unmount()
      await Promise.resolve()
      consoleError.mockRestore()
      consoleWarn.mockRestore()
    }
  })
})
