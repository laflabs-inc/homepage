import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  AdminRouteError,
  AdminRouteLoading,
} from "@/components/admin/admin-route-state"
import { LocaleProvider } from "@/components/i18n/locale-provider"

const stylesheet = readFileSync(
  join(process.cwd(), "components/admin/admin-route-state.module.css"),
  "utf8",
)

describe("Admin route states", () => {
  it("reserves the final page geometry while exposing a loading label", () => {
    const { container } = render(
      <LocaleProvider initialLocale="ko"><AdminRouteLoading /></LocaleProvider>,
    )

    expect(screen.getByRole("status", { name: "관리자 화면을 불러오는 중" })).toBeInTheDocument()
    expect(container.querySelector('[data-route-state="loading"]')).toBeInTheDocument()
    expect(container.querySelector('[data-route-state-header]')).toBeInTheDocument()
    expect(container.querySelector('[data-route-state-content]')).toBeInTheDocument()
  })

  it("shows safe copy and invokes the supplied retry action", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <AdminRouteError
        title="문제가 발생했습니다"
        description="요청한 관리자 화면을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요."
        retryLabel="다시 시도"
        onRetry={onRetry}
      />,
    )

    expect(screen.getByRole("heading", { level: 1, name: "문제가 발생했습니다" })).toBeInTheDocument()
    expect(screen.queryByText(/credential|stack|digest/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "다시 시도" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("allows long Korean and English copy to wrap inside the viewport", () => {
    expect(stylesheet).toMatch(/\.routeState\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%;/s)
    expect(stylesheet).toMatch(/\.copy\s*\{[^}]*min-width:\s*0;[^}]*overflow-wrap:\s*anywhere;/s)
  })
})
