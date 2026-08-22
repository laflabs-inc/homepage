import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { checkGitHubOrgMembership } from "@/lib/auth/github"

const fetchMock = vi.fn<typeof fetch>()

function githubResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("checkGitHubOrgMembership", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("permits an active organization membership", async () => {
    fetchMock.mockResolvedValue(githubResponse({ state: "active" }, 200))

    await expect(
      checkGitHubOrgMembership("top-secret-token", "laflabs-inc"),
    ).resolves.toBe(true)
  })

  it("denies a pending organization membership", async () => {
    fetchMock.mockResolvedValue(githubResponse({ state: "pending" }, 200))

    await expect(
      checkGitHubOrgMembership("top-secret-token", "laflabs-inc"),
    ).resolves.toBe(false)
  })

  it.each([401, 403, 404])("denies GitHub status %s", async (status) => {
    fetchMock.mockResolvedValue(githubResponse({ message: "denied" }, status))

    await expect(
      checkGitHubOrgMembership("top-secret-token", "laflabs-inc"),
    ).resolves.toBe(false)
  })

  it("denies malformed successful responses", async () => {
    fetchMock.mockResolvedValue(githubResponse({ state: true }, 200))

    await expect(
      checkGitHubOrgMembership("top-secret-token", "laflabs-inc"),
    ).resolves.toBe(false)
  })

  it("denies network failures without logging or throwing token material", async () => {
    const logSpies = [
      vi.spyOn(console, "error").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
      vi.spyOn(console, "log").mockImplementation(() => undefined),
    ]
    fetchMock.mockRejectedValue(new Error("request failed for top-secret-token"))

    await expect(
      checkGitHubOrgMembership("top-secret-token", "laflabs-inc"),
    ).resolves.toBe(false)
    expect(logSpies.every((spy) => spy.mock.calls.length === 0)).toBe(true)
  })

  it("denies a request that exceeds the membership timeout", async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation((_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("aborted", "AbortError")),
          { once: true },
        )
      })
    })

    const result = checkGitHubOrgMembership("top-secret-token", "laflabs-inc")
    await vi.advanceTimersByTimeAsync(5_000)

    await expect(result).resolves.toBe(false)
  })

  it("sends the OAuth token only in the Authorization header", async () => {
    fetchMock.mockResolvedValue(githubResponse({ state: "active" }, 200))

    await checkGitHubOrgMembership("top-secret-token", "laflabs-inc")

    const [request, init] = fetchMock.mock.calls[0] ?? []
    expect(String(request)).toBe(
      "https://api.github.com/user/memberships/orgs/laflabs-inc",
    )
    expect(String(request)).not.toContain("top-secret-token")
    expect(init?.method).toBe("GET")
    expect(init?.body).toBeUndefined()
    expect(new Headers(init?.headers).get("authorization")).toBe(
      "Bearer top-secret-token",
    )
  })
})
