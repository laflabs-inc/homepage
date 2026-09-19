import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { track } = vi.hoisted(() => ({ track: vi.fn() }))

vi.mock("@/components/analytics/consent-provider", () => ({
  useAnalytics: () => ({ track }),
}))

import { ComponentCode } from "@/components/design-system/component-code"
import { designCatalog } from "@/lib/design-system/catalog"

const actionEntry = designCatalog.components.find((component) => component.id === "action")

if (!actionEntry) throw new Error("Action component fixture is missing")

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
    expect(track).toHaveBeenCalledWith("design_code_copy", "action")
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
})
