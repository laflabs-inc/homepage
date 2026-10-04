import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ToastProvider, useToast } from "@/components/ui/toast"

function ToastControls({ action = vi.fn() }: { action?: () => void }) {
  const toast = useToast()
  return (
    <>
      <button type="button" onClick={() => toast.success("저장 완료", { id: "save" })}>성공</button>
      <button type="button" onClick={() => toast.error("업로드 실패", { id: "error" })}>오류</button>
      <button type="button" onClick={() => toast.show({ id: "stable", title: "첫 제목" })}>첫 표시</button>
      <button type="button" onClick={() => toast.show({ id: "stable", title: "바뀐 제목" })}>중복 갱신</button>
      <button type="button" onClick={() => [1, 2, 3, 4].forEach((index) => toast.info(`알림 ${index}`, { id: `queue-${index}`, duration: 0 }))}>네 개 표시</button>
      <button type="button" onClick={() => toast.warning("되돌릴 수 있음", { action: { label: "되돌리기", onClick: action }, duration: 0 })}>액션 표시</button>
      <button type="button" onClick={() => toast.dismiss("save")}>성공 닫기</button>
      <button type="button" onClick={() => toast.dismiss()}>모두 닫기</button>
    </>
  )
}

function TestProvider({ children }: { children: React.ReactNode }) {
  return <ToastProvider closeLabel="알림 닫기" viewportLabel="알림 목록">{children}</ToastProvider>
}

describe("Toast C3C", () => {
  afterEach(() => vi.useRealTimers())

  it("throws a clear error when useToast is called outside ToastProvider", () => {
    function Outside() {
      useToast()
      return null
    }

    expect(() => render(<Outside />)).toThrowError("useToast must be used within ToastProvider")
  })

  it("shows semantic helper toasts and dismisses one or all", async () => {
    const user = userEvent.setup()
    render(<TestProvider><ToastControls /></TestProvider>)

    await user.click(screen.getByRole("button", { name: "성공" }))
    await user.click(screen.getByRole("button", { name: "오류" }))
    expect(screen.getByText("저장 완료").closest("[data-tone]")).toHaveAttribute("role", "status")
    expect(screen.getByText("업로드 실패").closest("[data-tone]")).toHaveAttribute("role", "alert")

    await user.click(screen.getByRole("button", { name: "성공 닫기" }))
    expect(screen.queryByText("저장 완료")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "모두 닫기" }))
    expect(screen.queryByText("업로드 실패")).not.toBeInTheDocument()
  })

  it("updates a duplicate stable ID instead of rendering another toast", async () => {
    const user = userEvent.setup()
    render(<TestProvider><ToastControls /></TestProvider>)

    await user.click(screen.getByRole("button", { name: "첫 표시" }))
    await user.click(screen.getByRole("button", { name: "중복 갱신" }))
    expect(screen.queryByText("첫 제목")).not.toBeInTheDocument()
    expect(document.querySelectorAll("[data-tone]")).toHaveLength(1)
    expect(screen.getByText("바뀐 제목").closest("[data-tone]")).toHaveAttribute("role", "status")
  })

  it("shows at most three toasts and advances queued items after dismissal", async () => {
    const user = userEvent.setup()
    render(<TestProvider><ToastControls /></TestProvider>)

    await user.click(screen.getByRole("button", { name: "네 개 표시" }))
    expect(document.querySelectorAll("[data-tone]")).toHaveLength(3)
    expect(screen.queryByText("알림 4")).not.toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "알림 닫기" })[0])
    expect(document.querySelectorAll("[data-tone]")).toHaveLength(3)
    expect(screen.getByText("알림 4")).toBeInTheDocument()
  })

  it("runs an optional action once and preserves its accessible label", async () => {
    const user = userEvent.setup()
    const action = vi.fn()
    render(<TestProvider><ToastControls action={action} /></TestProvider>)

    await user.click(screen.getByRole("button", { name: "액션 표시" }))
    await user.click(screen.getByRole("button", { name: "되돌리기" }))
    expect(action).toHaveBeenCalledOnce()
  })

  it("uses a longer error duration and supports deliberate persistence", () => {
    vi.useFakeTimers()

    function DurationControls() {
      const toast = useToast()
      return (
        <button
          type="button"
          onClick={() => {
            toast.error("오래 표시")
            toast.success("계속 표시", { duration: 0 })
          }}
        >
          표시
        </button>
      )
    }

    render(<TestProvider><DurationControls /></TestProvider>)
    fireEvent.click(screen.getByRole("button", { name: "표시" }))
    expect(screen.getByText("오래 표시").closest("[data-tone]")).toHaveAttribute("data-duration", "9000")
    expect(screen.getByText("계속 표시").closest("[role='status']")).toHaveAttribute("data-duration", "0")

    act(() => vi.advanceTimersByTime(9000))
    expect(screen.queryByText("오래 표시")).not.toBeInTheDocument()
    expect(screen.getByText("계속 표시")).toBeInTheDocument()
  })

  it("forwards localized viewport and close labels", async () => {
    const user = userEvent.setup()
    render(<TestProvider><ToastControls /></TestProvider>)
    await user.click(screen.getByRole("button", { name: "성공" }))

    const viewport = screen.getByRole("region", { name: "알림 목록" })
    expect(within(viewport).getByRole("button", { name: "알림 닫기" })).toBeInTheDocument()
  })
})
