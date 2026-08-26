import { beforeEach, describe, expect, it, vi } from "vitest"

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }))

vi.mock("@/auth", () => ({ auth: authMock }))

import { authorizeAdminApi } from "@/lib/auth/admin-api"

describe("authorizeAdminApi", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("returns a stable actor for an organization member", async () => {
    authMock.mockResolvedValue({
      user: { name: "Laf Admin", githubId: "4242", orgMember: true },
      expires: "2099-01-01",
    })

    await expect(authorizeAdminApi()).resolves.toEqual({
      ok: true,
      actor: { githubId: "4242", name: "Laf Admin" },
    })
  })

  it("returns 401 for an unauthenticated request", async () => {
    authMock.mockResolvedValue(null)

    const authorization = await authorizeAdminApi()

    expect(authorization.ok).toBe(false)
    if (authorization.ok) throw new Error("expected an unauthorized response")
    expect(authorization.response.status).toBe(401)
    await expect(authorization.response.json()).resolves.toEqual({
      error: "unauthenticated",
    })
  })

  it("returns 403 for a signed-in non-member", async () => {
    authMock.mockResolvedValue({
      user: { name: "Visitor", githubId: "4242", orgMember: false },
      expires: "2099-01-01",
    })

    const authorization = await authorizeAdminApi()

    expect(authorization.ok).toBe(false)
    if (authorization.ok) throw new Error("expected a forbidden response")
    expect(authorization.response.status).toBe(403)
    await expect(authorization.response.json()).resolves.toEqual({
      error: "forbidden",
    })
  })

  it("fails closed when a member has no stable GitHub ID", async () => {
    authMock.mockResolvedValue({
      user: { name: "Legacy Admin", orgMember: true },
      expires: "2099-01-01",
    })

    const authorization = await authorizeAdminApi()

    expect(authorization.ok).toBe(false)
    if (authorization.ok) throw new Error("expected a forbidden response")
    expect(authorization.response.status).toBe(403)
    await expect(authorization.response.json()).resolves.toEqual({
      error: "forbidden",
    })
  })
})
