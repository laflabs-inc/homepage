import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { membershipMock } = vi.hoisted(() => ({ membershipMock: vi.fn() }))

vi.mock("@/lib/auth/github", () => ({
  checkGitHubOrgMembership: membershipMock,
}))

import { createAuthConfig } from "@/lib/auth/config"

const now = Date.parse("2026-08-22T06:00:00.000Z")

describe("createAuthConfig", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    vi.stubEnv("AUTH_SECRET", "a".repeat(32))
    vi.stubEnv("AUTH_GITHUB_ID", "github-client")
    vi.stubEnv("AUTH_GITHUB_SECRET", "github-secret")
    vi.stubEnv("ADMIN_GITHUB_ORG", "laflabs-inc")
    membershipMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it("configures GitHub with the approved scope and short JWT session", () => {
    const config = createAuthConfig()

    expect(config.providers).toHaveLength(1)
    expect(config.providers[0]).toMatchObject({
      id: "github",
      options: {
        authorization: { params: { scope: "read:user read:org" } },
      },
    })
    expect(config.session).toEqual({ strategy: "jwt", maxAge: 8 * 60 * 60 })
    expect(config.pages).toMatchObject({ signIn: "/admin/sign-in" })
  })

  it("wires sign-in and JWT callbacks through active membership checks", async () => {
    membershipMock.mockResolvedValue(true)
    const callbacks = createAuthConfig().callbacks
    expect(callbacks?.signIn).toBeTypeOf("function")
    expect(callbacks?.jwt).toBeTypeOf("function")
    expect(callbacks?.session).toBeTypeOf("function")

    const signInResult = await callbacks?.signIn?.({
      account: { access_token: "signin-oauth-token" },
    } as never)
    const jwtResult = await callbacks?.jwt?.({
      token: { sub: "github-user" },
      account: { access_token: "jwt-oauth-token" },
    } as never)

    expect(signInResult).toBe(true)
    expect(jwtResult).toMatchObject({
      githubAccessToken: "jwt-oauth-token",
      membershipCheckedAt: now,
      orgMember: true,
    })
    expect(membershipMock).toHaveBeenNthCalledWith(
      1,
      "signin-oauth-token",
      "laflabs-inc",
    )
    expect(membershipMock).toHaveBeenNthCalledWith(
      2,
      "jwt-oauth-token",
      "laflabs-inc",
    )
  })

  it("exposes membership but never the OAuth token in the session", async () => {
    const sessionCallback = createAuthConfig().callbacks?.session

    const exposed = await sessionCallback?.({
      session: {
        user: { name: "Admin", email: "admin@example.com" },
        expires: "2026-08-22T14:00:00.000Z",
      },
      token: {
        githubAccessToken: "must-stay-server-side",
        orgMember: true,
      },
    } as never)

    expect(exposed).toEqual({
      user: {
        name: "Admin",
        email: "admin@example.com",
        orgMember: true,
      },
      expires: "2026-08-22T14:00:00.000Z",
    })
    expect(JSON.stringify(exposed)).not.toContain("must-stay-server-side")
    expect(exposed).not.toHaveProperty("githubAccessToken")
    expect(exposed?.user).not.toHaveProperty("githubAccessToken")
  })
})
