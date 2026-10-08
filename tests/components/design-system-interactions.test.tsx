import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { track } = vi.hoisted(() => ({ track: vi.fn() }))

vi.mock("@/components/analytics/consent-provider", () => ({
  useAnalytics: () => ({ track }),
}))

import { ComponentCode } from "@/components/design-system/component-code"
import { RecipeCode } from "@/components/design-system/recipe-code"
import { designCatalog } from "@/lib/design-system/catalog"

const actionEntry = designCatalog.components.find((component) => component.id === "button")

if (!actionEntry) throw new Error("Button component fixture is missing")
const recipeEntry = designCatalog.recipes.find((recipe) => recipe.id === "document-settings-form")
if (!recipeEntry) throw new Error("Document settings Recipe fixture is missing")

describe("Design system component code", () => {
  beforeEach(() => {
    track.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("copies the usage source, announces success, and tracks only the component slug", async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined)

    render(<ComponentCode component={actionEntry} locale="en" />)
    await user.click(screen.getByRole("button", { name: "Copy usage code" }))

    expect(writeText).toHaveBeenCalledWith(actionEntry.usageExample)
    expect(screen.getByRole("status")).toHaveTextContent("Copied")
    expect(track).toHaveBeenCalledWith("design_code_copy", "button")
  })

  it("announces clipboard failure without tracking and leaves the source selectable", async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("clipboard unavailable"),
    )

    render(<ComponentCode component={actionEntry} locale="en" />)
    await user.click(screen.getByRole("button", { name: "Copy usage code" }))

    expect(screen.getByRole("status")).toHaveTextContent(
      "Copy failed. Select the code manually.",
    )
    expect(screen.getByText(actionEntry.usageExample, { selector: "code" })).toBeVisible()
    expect(track).not.toHaveBeenCalled()
  })

  it("localizes Korean copy feedback", async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined)

    render(<ComponentCode component={actionEntry} locale="ko" />)
    await user.click(screen.getByRole("button", { name: "사용 코드 복사" }))

    expect(screen.getByRole("status")).toHaveTextContent("복사됨")
  })

  it("clears transient feedback after 1800 ms and cancels the timer on unmount", async () => {
    vi.useFakeTimers()
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined)

    const view = render(<ComponentCode component={actionEntry} locale="en" />)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy usage code" }))
    })

    expect(screen.getByRole("status")).toHaveTextContent("Copied")
    expect(vi.getTimerCount()).toBe(1)

    act(() => vi.advanceTimersByTime(1799))
    expect(screen.getByRole("status")).toHaveTextContent("Copied")

    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole("status")).toBeEmptyDOMElement()

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy usage code" }))
    })
    expect(vi.getTimerCount()).toBe(1)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("ignores a pending clipboard result after unmount", async () => {
    userEvent.setup()
    vi.useFakeTimers()
    let resolveCopy!: () => void
    const pendingCopy = new Promise<void>((resolve) => {
      resolveCopy = resolve
    })
    vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(pendingCopy)

    const view = render(<ComponentCode component={actionEntry} locale="en" />)
    fireEvent.click(screen.getByRole("button", { name: "Copy usage code" }))
    view.unmount()

    await act(async () => {
      resolveCopy()
      await pendingCopy
    })

    expect(track).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe("Design system Recipe code", () => {
  beforeEach(() => {
    track.mockReset()
  })

  it("copies the exact Recipe source, reports feedback, and tracks the allowlisted Recipe id", async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined)

    render(<RecipeCode locale="en" recipe={recipeEntry} />)
    await user.click(screen.getByRole("button", { name: "Copy usage code" }))

    expect(writeText).toHaveBeenCalledWith(recipeEntry.usageExample)
    expect(screen.getByRole("status")).toHaveTextContent("Copied")
    expect(track).toHaveBeenCalledWith("design_code_copy", "document-settings-form")
  })
})
