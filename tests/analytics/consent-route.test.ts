import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { handleConsent } from "@/app/api/consent/route"
import {
  CONSENT_COOKIE,
  VISITOR_COOKIE,
  consentCookieValue,
} from "@/lib/analytics/consent"
import { createVisitorToken } from "@/lib/analytics/identity"
import type { AnalyticsStore } from "@/lib/analytics/store"

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }))

vi.mock("next/headers", () => ({ cookies: cookiesMock }))

const secret = "test-secret-that-is-long-enough-for-hmac"
const visitorId = "8f5c5c8b-54cf-4de1-9a16-4be9b8c0e3d7"
const visitorToken = createVisitorToken(visitorId, secret)

class FailingWithdrawalStore implements AnalyticsStore {
  async collectEvents() {
    return { status: "accepted" as const, accepted: 0 }
  }

  async withdrawVisitorAnalytics() {
    throw new Error("database unavailable")
  }

  async deleteBefore() {
    return { events: 0, windows: 0 }
  }
}

describe("consent route withdrawal failure", () => {
  const cookieValues = new Map<string, string>()
  const setCookie = vi.fn((name: string, value: string) => cookieValues.set(name, value))
  const deleteCookie = vi.fn((name: string) => cookieValues.delete(name))

  beforeEach(() => {
    vi.stubEnv("ANALYTICS_HASH_SECRET", secret)
    cookieValues.clear()
    cookieValues.set(CONSENT_COOKIE, consentCookieValue("analytics"))
    cookieValues.set(VISITOR_COOKIE, visitorToken)
    setCookie.mockClear()
    deleteCookie.mockClear()
    cookiesMock.mockResolvedValue({
      get: (name: string) => {
        const value = cookieValues.get(name)
        return value ? { name, value } : undefined
      },
      set: setCookie,
      delete: deleteCookie,
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it("returns 503 and preserves both cookies when withdrawal deletion fails", async () => {
    const response = await handleConsent(new Request("https://laflabs.co/api/consent", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://laflabs.co",
      },
      body: JSON.stringify({ choice: "essential" }),
    }), new FailingWithdrawalStore())

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: "withdrawal_failed" })
    expect(cookieValues.get(VISITOR_COOKIE)).toBe(visitorToken)
    expect(cookieValues.get(CONSENT_COOKIE)).toBe(consentCookieValue("analytics"))
    expect(deleteCookie).not.toHaveBeenCalled()
    expect(setCookie).not.toHaveBeenCalled()
  })
})
