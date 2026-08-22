import type { Session } from "next-auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
}))

vi.mock("@/auth", () => ({ auth: authMock }))
vi.mock("next/navigation", () => ({ redirect: redirectMock }))

import { requireAdmin } from "@/lib/auth/require-admin"

const redirectError = new Error("NEXT_REDIRECT")

function session(orgMember: boolean): Session {
  return {
    user: { name: "Admin", orgMember },
    expires: "2026-08-22T14:00:00.000Z",
  }
}

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    redirectMock.mockImplementation(() => {
      throw redirectError
    })
  })

  it("redirects an unauthenticated request", async () => {
    authMock.mockResolvedValue(null)

    await expect(requireAdmin()).rejects.toBe(redirectError)
    expect(redirectMock).toHaveBeenCalledWith("/admin/sign-in")
  })

  it("redirects a signed-in non-member", async () => {
    authMock.mockResolvedValue(session(false))

    await expect(requireAdmin()).rejects.toBe(redirectError)
    expect(redirectMock).toHaveBeenCalledWith("/admin/sign-in")
  })

  it("returns a verified organization-member session", async () => {
    const verified = session(true)
    authMock.mockResolvedValue(verified)

    await expect(requireAdmin()).resolves.toBe(verified)
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
