import type { JWT } from "next-auth/jwt"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { membershipMock } = vi.hoisted(() => ({
  membershipMock: vi.fn(),
}))

vi.mock("@/lib/auth/github", () => ({
  checkGitHubOrgMembership: membershipMock,
}))

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}))

vi.mock("next-auth/providers/github", () => ({
  default: vi.fn(() => ({ id: "github", type: "oauth" })),
}))

import { refreshMembershipToken } from "@/auth"

const checkedAt = Date.parse("2026-08-22T06:00:00.000Z")

function memberToken(overrides: Partial<JWT> = {}): JWT {
  return {
    githubAccessToken: "oauth-token",
    membershipCheckedAt: checkedAt,
    orgMember: true,
    ...overrides,
  }
}

describe("refreshMembershipToken", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(checkedAt)
    vi.stubEnv("AUTH_SECRET", "a".repeat(32))
    vi.stubEnv("AUTH_GITHUB_ID", "github-client")
    vi.stubEnv("AUTH_GITHUB_SECRET", "github-secret")
    vi.stubEnv("ADMIN_GITHUB_ORG", "laflabs-inc")
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it("records and verifies a new OAuth token", async () => {
    membershipMock.mockResolvedValue(true)

    await expect(
      refreshMembershipToken({ sub: "github-user" }, "new-oauth-token"),
    ).resolves.toEqual({
      sub: "github-user",
      githubAccessToken: "new-oauth-token",
      membershipCheckedAt: checkedAt,
      orgMember: true,
    })
    expect(membershipMock).toHaveBeenCalledWith(
      "new-oauth-token",
      "laflabs-inc",
    )
  })

  it("reuses a recent membership result", async () => {
    vi.setSystemTime(checkedAt + 29 * 60 * 1_000)

    await expect(refreshMembershipToken(memberToken())).resolves.toEqual(
      memberToken(),
    )
    expect(membershipMock).not.toHaveBeenCalled()
  })

  it("revalidates membership at thirty minutes", async () => {
    vi.setSystemTime(checkedAt + 30 * 60 * 1_000)
    membershipMock.mockResolvedValue(false)

    await expect(refreshMembershipToken(memberToken())).resolves.toEqual({
      githubAccessToken: "oauth-token",
      membershipCheckedAt: checkedAt + 30 * 60 * 1_000,
      orgMember: false,
    })
  })

  it("fails closed when the server token has no OAuth credential", async () => {
    await expect(
      refreshMembershipToken({ orgMember: true, membershipCheckedAt: checkedAt }),
    ).resolves.toEqual({
      orgMember: false,
      membershipCheckedAt: checkedAt,
    })
    expect(membershipMock).not.toHaveBeenCalled()
  })

  it("does not trust a membership timestamp from the future", async () => {
    membershipMock.mockResolvedValue(true)

    await refreshMembershipToken(
      memberToken({ membershipCheckedAt: checkedAt + 1 }),
    )

    expect(membershipMock).toHaveBeenCalledWith("oauth-token", "laflabs-inc")
  })
})
