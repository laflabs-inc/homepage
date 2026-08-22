import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CONSENT_COOKIE, VISITOR_COOKIE, consentCookieValue } from "@/lib/analytics/consent"
import { createVisitorToken } from "@/lib/analytics/identity"
import {
  collectAnalyticsBatch,
  deleteExpiredAnalytics,
  deleteVisitorEventsByToken,
} from "@/lib/analytics/service"
import type { AnalyticsStore, StoredAnalyticsEvent } from "@/lib/analytics/store"
import { handleAnalyticsEvents } from "@/app/api/analytics/events/route"

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }))

vi.mock("next/headers", () => ({ cookies: cookiesMock }))

const secret = "test-secret-that-is-long-enough-for-hmac"
const visitorId = "8f5c5c8b-54cf-4de1-9a16-4be9b8c0e3d7"
const visitorToken = createVisitorToken(visitorId, secret)
const now = new Date("2026-08-22T12:00:30.000Z")

const validEvent = {
  eventId: "e734cacc-9d8b-46a4-8705-4f9d5b20aa8f",
  sessionId: "f0254908-6318-4ec8-9c84-5965452e8c3f",
  type: "page_view",
  pathname: "/?email=a@example.com#private",
  targetId: null,
  locale: "en",
  occurredAt: "2026-08-22T12:00:00.000Z",
}

const validBatch = { events: [validEvent] }

const requestContext = {
  consentCookie: consentCookieValue("analytics"),
  visitorToken,
  userAgent: "Mozilla/5.0 (X11; Linux x86_64) private/full/user-agent",
  referrer: "https://github.com/laflabs-inc/lafetch?q=private#fragment",
  now,
}

class FakeStore implements AnalyticsStore {
  events: StoredAnalyticsEvent[] = []
  deletedVisitorHashes: string[] = []
  cutoff: Date | null = null
  rateAllowed = true
  rateError: Error | null = null
  insertError: Error | null = null
  deletionError: Error | null = null
  seenEventIds = new Set<string>()
  rateCalls: { visitorHash: string; minute: Date; amount: number }[] = []

  async consumeRateWindow(visitorHash: string, minute: Date, amount: number) {
    this.rateCalls.push({ visitorHash, minute, amount })
    if (this.rateError) throw this.rateError
    return this.rateAllowed
  }

  async insertEvents(events: StoredAnalyticsEvent[]) {
    if (this.insertError) throw this.insertError
    const inserted = events.filter((event) => {
      if (this.seenEventIds.has(event.eventId)) return false
      this.seenEventIds.add(event.eventId)
      return true
    })
    this.events.push(...inserted)
    return inserted.length
  }

  async deleteVisitorEvents(visitorHash: string) {
    if (this.deletionError) throw this.deletionError
    this.deletedVisitorHashes.push(visitorHash)
  }

  async deleteBefore(cutoff: Date) {
    this.cutoff = cutoff
    return { events: 3, windows: 2 }
  }
}

const cookieValues = new Map<string, string>()

beforeEach(() => {
  vi.stubEnv("ANALYTICS_HASH_SECRET", secret)
  cookieValues.clear()
  cookiesMock.mockReset()
  cookiesMock.mockResolvedValue({
    get: (name: string) => {
      const value = cookieValues.get(name)
      return value === undefined ? undefined : { value }
    },
  })
})

afterEach(() => vi.unstubAllEnvs())

describe("collectAnalyticsBatch", () => {
  it("stores only normalized, pseudonymous analytics fields", async () => {
    const fakeStore = new FakeStore()

    const result = await collectAnalyticsBatch(validBatch, requestContext, fakeStore)

    expect(result).toEqual({ status: "accepted", accepted: 1 })
    expect(fakeStore.events).toHaveLength(1)
    expect(fakeStore.events[0]).toMatchObject({
      eventType: "page_view",
      pathname: "/",
      targetId: null,
      locale: "en",
      deviceCategory: "desktop",
      referrerHost: "github.com",
      occurredAt: new Date("2026-08-22T12:00:00.000Z"),
      receivedAt: now,
    })
    expect(fakeStore.events[0].visitorHash).not.toContain(visitorId)
    expect(fakeStore.events[0].sessionHash).not.toContain(validEvent.sessionId)
    expect(fakeStore.events[0]).not.toHaveProperty("ip")
    expect(fakeStore.events[0]).not.toHaveProperty("userAgent")
    expect(fakeStore.events[0]).not.toHaveProperty("referrer")
  })

  it("rejects unknown events, invalid targets, and batches above twenty", async () => {
    const fakeStore = new FakeStore()
    const invalidInputs = [
      { events: [{ ...validEvent, type: "unknown" }] },
      { events: [{ ...validEvent, type: "page_view", targetId: "email" }] },
      { events: Array.from({ length: 21 }, (_, index) => ({ ...validEvent, eventId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}` })) },
    ]

    for (const batch of invalidInputs) {
      await expect(collectAnalyticsBatch(batch, requestContext, fakeStore)).resolves.toEqual({
        status: "invalid",
        accepted: 0,
      })
    }
    expect(fakeStore.rateCalls).toHaveLength(0)
    expect(fakeStore.events).toHaveLength(0)
  })

  it("clamps timestamps outside five minutes to server time", async () => {
    const fakeStore = new FakeStore()

    await collectAnalyticsBatch({
      events: [{ ...validEvent, occurredAt: "2026-08-01T00:00:00.000Z" }],
    }, requestContext, fakeStore)

    expect(fakeStore.events[0].occurredAt).toEqual(now)
  })

  it("ignores duplicate event IDs", async () => {
    const fakeStore = new FakeStore()
    fakeStore.seenEventIds.add(validEvent.eventId)

    await expect(collectAnalyticsBatch(validBatch, requestContext, fakeStore)).resolves.toEqual({
      status: "accepted",
      accepted: 0,
    })
    expect(fakeStore.events).toHaveLength(0)
  })

  it("returns a rate-limit result without inserting", async () => {
    const fakeStore = new FakeStore()
    fakeStore.rateAllowed = false

    await expect(collectAnalyticsBatch(validBatch, requestContext, fakeStore)).resolves.toEqual({
      status: "rate_limited",
      accepted: 0,
    })
    expect(fakeStore.events).toHaveLength(0)
  })

  it("does not touch storage without analytics consent", async () => {
    const fakeStore = new FakeStore()

    await expect(collectAnalyticsBatch(validBatch, {
      ...requestContext,
      consentCookie: consentCookieValue("essential"),
    }, fakeStore)).resolves.toEqual({ status: "ignored", accepted: 0 })
    expect(fakeStore.rateCalls).toHaveLength(0)
  })

  it("does not touch storage with an invalid visitor signature", async () => {
    const fakeStore = new FakeStore()

    await expect(collectAnalyticsBatch(validBatch, {
      ...requestContext,
      visitorToken: `${visitorToken}tampered`,
    }, fakeStore)).resolves.toEqual({ status: "ignored", accepted: 0 })
    expect(fakeStore.rateCalls).toHaveLength(0)
  })

  it("contains store failures as an unavailable result", async () => {
    const rateStore = new FakeStore()
    rateStore.rateError = new Error("raw rate database failure")
    await expect(collectAnalyticsBatch(validBatch, requestContext, rateStore)).resolves.toEqual({
      status: "unavailable",
      accepted: 0,
    })

    const insertStore = new FakeStore()
    insertStore.insertError = new Error("raw insert database failure")
    await expect(collectAnalyticsBatch(validBatch, requestContext, insertStore)).resolves.toEqual({
      status: "unavailable",
      accepted: 0,
    })
  })

  it("uses a UTC minute bucket and the submitted batch size for the rate window", async () => {
    const fakeStore = new FakeStore()

    await collectAnalyticsBatch(validBatch, requestContext, fakeStore)

    expect(fakeStore.rateCalls).toEqual([{
      visitorHash: fakeStore.events[0].visitorHash,
      minute: new Date("2026-08-22T12:00:00.000Z"),
      amount: 1,
    }])
  })
})

describe("withdrawal and retention", () => {
  it("returns false without leaking a database deletion failure", async () => {
    const fakeStore = new FakeStore()
    fakeStore.deletionError = new Error("contains raw database details")

    await expect(deleteVisitorEventsByToken(visitorToken, fakeStore)).resolves.toBe(false)
  })

  it("deletes analytics before the exact ninety-day boundary", async () => {
    const fakeStore = new FakeStore()

    await expect(deleteExpiredAnalytics(new Date("2026-08-22T00:00:00.000Z"), fakeStore)).resolves.toEqual({
      events: 3,
      windows: 2,
    })
    expect(fakeStore.cutoff).toEqual(new Date("2026-05-24T00:00:00.000Z"))
  })
})

describe("analytics event route", () => {
  it("rejects cross-origin requests before reading their bodies", async () => {
    const fakeStore = new FakeStore()
    const request = new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
      body: JSON.stringify(validBatch),
    })
    const text = vi.spyOn(request, "text")

    const response = await handleAnalyticsEvents(request, fakeStore)

    expect(response.status).toBe(403)
    expect(text).not.toHaveBeenCalled()
  })

  it("returns a no-op before reading a body when consent is absent", async () => {
    const fakeStore = new FakeStore()
    const request = new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      body: "malformed",
    })
    const text = vi.spyOn(request, "text")

    const response = await handleAnalyticsEvents(request, fakeStore)

    expect(response.status).toBe(204)
    expect(text).not.toHaveBeenCalled()
    expect(fakeStore.rateCalls).toHaveLength(0)
  })

  it("returns a no-op before reading a body when the visitor token is invalid", async () => {
    cookieValues.set(CONSENT_COOKIE, consentCookieValue("analytics"))
    cookieValues.set(VISITOR_COOKIE, "invalid-token")
    const fakeStore = new FakeStore()
    const request = new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      body: "malformed",
    })
    const text = vi.spyOn(request, "text")

    const response = await handleAnalyticsEvents(request, fakeStore)

    expect(response.status).toBe(204)
    expect(text).not.toHaveBeenCalled()
  })

  it("rejects oversized content-length before reading the body", async () => {
    cookieValues.set(CONSENT_COOKIE, consentCookieValue("analytics"))
    cookieValues.set(VISITOR_COOKIE, visitorToken)
    const request = new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      headers: { "content-length": "16385", "content-type": "application/json" },
      body: JSON.stringify(validBatch),
    })
    const text = vi.spyOn(request, "text")

    const response = await handleAnalyticsEvents(request, new FakeStore())

    expect(response.status).toBe(400)
    expect(text).not.toHaveBeenCalled()
  })

  it("rejects malformed consented payloads", async () => {
    cookieValues.set(CONSENT_COOKIE, consentCookieValue("analytics"))
    cookieValues.set(VISITOR_COOKIE, visitorToken)

    const response = await handleAnalyticsEvents(new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    }), new FakeStore())

    expect(response.status).toBe(400)
  })

  it.each([
    [false, null, 429],
    [true, new Error("raw database failure"), 503],
  ])("maps rate and store outcomes to bounded public responses", async (rateAllowed, insertError, status) => {
    cookieValues.set(CONSENT_COOKIE, consentCookieValue("analytics"))
    cookieValues.set(VISITOR_COOKIE, visitorToken)
    const fakeStore = new FakeStore()
    fakeStore.rateAllowed = rateAllowed
    fakeStore.insertError = insertError

    const response = await handleAnalyticsEvents(new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBatch),
    }), fakeStore)

    expect(response.status).toBe(status)
  })

  it("returns 204 for accepted and duplicate events", async () => {
    cookieValues.set(CONSENT_COOKIE, consentCookieValue("analytics"))
    cookieValues.set(VISITOR_COOKIE, visitorToken)
    const fakeStore = new FakeStore()

    const first = await handleAnalyticsEvents(new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBatch),
    }), fakeStore)
    const duplicate = await handleAnalyticsEvents(new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBatch),
    }), fakeStore)

    expect(first.status).toBe(204)
    expect(duplicate.status).toBe(204)
    expect(fakeStore.events).toHaveLength(1)
  })
})
