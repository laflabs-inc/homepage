import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { handleConsent } from "@/app/api/consent/route"
import {
  CONSENT_COOKIE,
  CONSENT_POLICY_VERSION,
  VISITOR_COOKIE,
  consentCookieValue,
} from "@/lib/analytics/consent"
import {
  createVisitorToken,
  hashAnalyticsId,
  verifyVisitorToken,
} from "@/lib/analytics/identity"
import type { AnalyticsStore } from "@/lib/analytics/store"

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }))

vi.mock("next/headers", () => ({ cookies: cookiesMock }))

const secret = "test-secret-that-is-long-enough-for-hmac"
const previousSecret = "previous-secret-that-is-long-enough-hmac"
const visitorId = "8f5c5c8b-54cf-4de1-9a16-4be9b8c0e3d7"
const visitorToken = createVisitorToken(visitorId, secret)

class FailingWithdrawalStore implements AnalyticsStore {
  withdrawalCalls = 0

  async collectEvents() {
    return { status: "accepted" as const, accepted: 0 }
  }

  async withdrawVisitorAnalytics() {
    this.withdrawalCalls += 1
    throw new Error("database unavailable")
  }

  async deleteBefore() {
    return { events: 0, windows: 0 }
  }
}

class RecordingStore implements AnalyticsStore {
  withdrawnHashes: string[] = []

  async collectEvents() {
    return { status: "accepted" as const, accepted: 0 }
  }

  async withdrawVisitorAnalytics(visitorHash: string) {
    this.withdrawnHashes.push(visitorHash)
  }

  async deleteBefore() {
    return { events: 0, windows: 0 }
  }
}

describe("consent route", () => {
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
      body: JSON.stringify({ choice: "essential", policyVersion: CONSENT_POLICY_VERSION }),
    }), new FailingWithdrawalStore())

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: "withdrawal_failed" })
    expect(cookieValues.get(VISITOR_COOKIE)).toBe(visitorToken)
    expect(cookieValues.get(CONSENT_COOKIE)).toBe(consentCookieValue("analytics"))
    expect(deleteCookie).not.toHaveBeenCalled()
    expect(setCookie).not.toHaveBeenCalled()
  })

  it("rejects spoofed forwarded origins before reading cookies", async () => {
    const response = await handleConsent(new Request("http://localhost:3200/api/consent", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://attacker.example",
        "x-forwarded-host": "attacker.example",
        "x-forwarded-proto": "https",
      },
      body: JSON.stringify({ choice: "essential", policyVersion: CONSENT_POLICY_VERSION }),
    }), new FailingWithdrawalStore())

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "forbidden" })
    expect(cookiesMock).not.toHaveBeenCalled()
    expect(deleteCookie).not.toHaveBeenCalled()
    expect(setCookie).not.toHaveBeenCalled()
  })

  it("rejects a stale policy version before reading cookies or mutating data", async () => {
    const store = new FailingWithdrawalStore()

    const response = await handleConsent(new Request("https://laflabs.co/api/consent", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://laflabs.co",
      },
      body: JSON.stringify({ choice: "essential", policyVersion: "0" }),
    }), store)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: "policy_version_mismatch" })
    expect(cookiesMock).not.toHaveBeenCalled()
    expect(store.withdrawalCalls).toBe(0)
    expect(deleteCookie).not.toHaveBeenCalled()
    expect(setCookie).not.toHaveBeenCalled()
  })

  it("accepts the exact current policy version", async () => {
    cookieValues.delete(VISITOR_COOKIE)
    cookieValues.delete(CONSENT_COOKIE)

    const response = await handleConsent(new Request("https://laflabs.co/api/consent", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://laflabs.co",
      },
      body: JSON.stringify({
        choice: "essential",
        policyVersion: CONSENT_POLICY_VERSION,
      }),
    }), new FailingWithdrawalStore())

    expect(response.status).toBe(200)
    expect(setCookie).toHaveBeenCalledWith(
      CONSENT_COOKIE,
      consentCookieValue("essential"),
      expect.any(Object),
    )
  })

  it("keeps a current-key identity without deleting or replacing it", async () => {
    const store = new RecordingStore()

    const response = await handleConsent(new Request("https://laflabs.co/api/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        choice: "analytics",
        policyVersion: CONSENT_POLICY_VERSION,
      }),
    }), store)

    expect(response.status).toBe(200)
    expect(store.withdrawnHashes).toEqual([])
    expect(setCookie.mock.calls.some(([name]) => name === VISITOR_COOKIE)).toBe(false)
    expect(cookieValues.get(VISITOR_COOKIE)).toBe(visitorToken)
  })

  it("deletes a previous-key identity before issuing a current-key replacement", async () => {
    vi.stubEnv("ANALYTICS_HASH_SECRET_PREVIOUS", previousSecret)
    const previousToken = createVisitorToken(visitorId, previousSecret)
    cookieValues.set(VISITOR_COOKIE, previousToken)
    const store = new RecordingStore()

    const response = await handleConsent(new Request("https://laflabs.co/api/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        choice: "analytics",
        policyVersion: CONSENT_POLICY_VERSION,
      }),
    }), store)

    expect(response.status).toBe(200)
    expect(store.withdrawnHashes).toEqual([hashAnalyticsId(visitorId, previousSecret)])
    const replacement = cookieValues.get(VISITOR_COOKIE)
    expect(replacement).not.toBe(previousToken)
    expect(verifyVisitorToken(replacement, secret)).not.toBeNull()
    expect(verifyVisitorToken(replacement, previousSecret)).toBeNull()
  })

  it("clears an invalid token on essential consent without attempting inaccessible deletion", async () => {
    cookieValues.set(VISITOR_COOKIE, "invalid-token")
    const store = new RecordingStore()

    const response = await handleConsent(new Request("https://laflabs.co/api/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        choice: "essential",
        policyVersion: CONSENT_POLICY_VERSION,
      }),
    }), store)

    expect(response.status).toBe(200)
    expect(store.withdrawnHashes).toEqual([])
    expect(deleteCookie).toHaveBeenCalledWith(VISITOR_COOKIE)
    expect(cookieValues.has(VISITOR_COOKIE)).toBe(false)
  })

  it("replaces an invalid token on renewed analytics consent", async () => {
    cookieValues.set(VISITOR_COOKIE, "invalid-token")
    const store = new RecordingStore()

    const response = await handleConsent(new Request("https://laflabs.co/api/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        choice: "analytics",
        policyVersion: CONSENT_POLICY_VERSION,
      }),
    }), store)

    expect(response.status).toBe(200)
    expect(store.withdrawnHashes).toEqual([])
    expect(verifyVisitorToken(cookieValues.get(VISITOR_COOKIE), secret)).not.toBeNull()
  })
})
