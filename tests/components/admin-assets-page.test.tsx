import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getAdminLocale: vi.fn(),
  isMediaConfigured: vi.fn(),
  list: vi.fn(),
}))

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock("@/lib/admin/locale", () => ({ getAdminLocale: mocks.getAdminLocale }))
vi.mock("@/lib/env", () => ({ isMediaConfigured: mocks.isMediaConfigured }))
vi.mock("@/lib/assets/service", () => ({ assetService: { list: mocks.list } }))
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => { throw new Error("not found") }),
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}))
vi.mock("@/components/admin/asset-library.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/app/admin/admin.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import AssetsPage from "@/app/admin/(protected)/assets/page"
import { LocaleProvider } from "@/components/i18n/locale-provider"

beforeEach(() => {
  mocks.requireAdmin.mockReset().mockResolvedValue({ user: { orgMember: true } })
  mocks.getAdminLocale.mockReset().mockResolvedValue("en")
  mocks.isMediaConfigured.mockReset().mockReturnValue(true)
  mocks.list.mockReset().mockResolvedValue({ items: [], nextCursor: null })
})

describe("Admin assets page", () => {
  it("authorizes before loading the initial filtered page", async () => {
    render(
      <LocaleProvider initialLocale="en">
        {await AssetsPage({ searchParams: Promise.resolve({ status: "ready", tag: "brand" }) })}
      </LocaleProvider>,
    )

    expect(mocks.requireAdmin).toHaveBeenCalledOnce()
    expect(mocks.list).toHaveBeenCalledWith({ limit: 30, status: "ready", tag: "brand" })
    expect(mocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(mocks.list.mock.invocationCallOrder[0])
    expect(screen.getByRole("heading", { name: "Asset library" })).toBeInTheDocument()
  })

  it("renders a localized unavailable state without querying storage", async () => {
    mocks.getAdminLocale.mockResolvedValue("ko")
    mocks.isMediaConfigured.mockReturnValue(false)

    render(
      <LocaleProvider initialLocale="ko">
        {await AssetsPage({ searchParams: Promise.resolve({}) })}
      </LocaleProvider>,
    )

    expect(screen.getByRole("heading", { name: "미디어 저장소를 설정해 주세요" })).toBeInTheDocument()
    expect(mocks.list).not.toHaveBeenCalled()
  })
})
