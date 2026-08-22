import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CONSENT_COOKIE, VISITOR_COOKIE, consentCookieValue } from "@/lib/analytics/consent"
import { createVisitorToken, hashAnalyticsId } from "@/lib/analytics/identity"
import {
  collectAnalyticsBatch,
  deleteExpiredAnalytics,
  deleteVisitorEventsByToken,
} from "@/lib/analytics/service"
import type {
  AnalyticsStore,
  AnalyticsStoreCollectionResult,
  StoredAnalyticsEvent,
} from "@/lib/analytics/store"
import { handleAnalyticsEvents } from "@/app/api/analytics/events/route"

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }))

vi.mock("next/headers", () => ({ cookies: cookiesMock }))

const secret = "test-secret-that-is-long-enough-for-hmac"
const previousSecret = "previous-secret-that-is-long-enough-hmac"
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
  referrerHost: "github.com",
}

const validBatch = { events: [validEvent] }

const requestContext = {
  consentCookie: consentCookieValue("analytics"),
  visitorToken,
  userAgent: "Mozilla/5.0 (X11; Linux x86_64) private/full/user-agent",
  siteHostnames: ["laflabs.co"],
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
  guardActive = false
  expiredGuardsBefore: Date | null = null
  waitBeforeInsert: Promise<void> | null = null
  onInsertStarted: (() => void) | null = null
  private operationTail: Promise<void> = Promise.resolve()

  private async exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.operationTail
    let release: (() => void) | undefined
    this.operationTail = new Promise((resolve) => {
      release = resolve
    })
    await previous
    try {
      return await operation()
    } finally {
      release?.()
    }
  }

  private async addEvents(events: StoredAnalyticsEvent[]) {
    this.onInsertStarted?.()
    await this.waitBeforeInsert
    if (this.insertError) throw this.insertError
    const inserted = events.filter((event) => {
      if (this.seenEventIds.has(event.eventId)) return false
      this.seenEventIds.add(event.eventId)
      return true
    })
    this.events.push(...inserted)
    return inserted.length
  }

  async collectEvents(
    visitorHash: string,
    minute: Date,
    events: StoredAnalyticsEvent[],
  ): Promise<AnalyticsStoreCollectionResult> {
    return this.exclusive(async () => {
      if (this.guardActive) return { status: "guarded" as const, accepted: 0 }
      this.rateCalls.push({ visitorHash, minute, amount: events.length })
      if (this.rateError) throw this.rateError
      if (!this.rateAllowed) return { status: "rate_limited" as const, accepted: 0 }
      return { status: "accepted" as const, accepted: await this.addEvents(events) }
    })
  }

  // Legacy split methods preserve the pre-fix race for the RED run.
  async consumeRateWindow(visitorHash: string, minute: Date, amount: number) {
    this.rateCalls.push({ visitorHash, minute, amount })
    if (this.rateError) throw this.rateError
    return this.rateAllowed
  }

  async insertEvents(events: StoredAnalyticsEvent[]) {
    return this.addEvents(events)
  }

  async withdrawVisitorAnalytics(visitorHash: string) {
    await this.exclusive(async () => {
      if (this.deletionError) throw this.deletionError
      this.deletedVisitorHashes.push(visitorHash)
      this.guardActive = true
      this.events = []
      this.seenEventIds.clear()
      this.rateCalls = []
    })
  }

  async deleteVisitorEvents(visitorHash: string) {
    await this.withdrawVisitorAnalytics(visitorHash)
  }

  async deleteBefore(cutoff: Date, expiredGuardsBefore?: Date) {
    this.cutoff = cutoff
    this.expiredGuardsBefore = expiredGuardsBefore ?? null
    return { events: 3, windows: 2 }
  }
}

const cookieValues = new Map<string, string>()

beforeEach(() => {
  vi.stubEnv("ANALYTICS_HASH_SECRET", secret)
  vi.stubEnv("ANALYTICS_HASH_SECRET_PREVIOUS", previousSecret)
  cookieValues.clear()
  cookiesMock.mockReset()
  cookiesMock.mockResolvedValue({
    get: (name: string) => {
      const value = cookieValues.get(name)
      return value === undefined ? undefined : { value }
    },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

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

  it("accepts a previous-key visitor under its previous pseudonymous hash", async () => {
    const fakeStore = new FakeStore()
    const previousToken = createVisitorToken(visitorId, previousSecret)

    await expect(collectAnalyticsBatch(validBatch, {
      ...requestContext,
      visitorToken: previousToken,
    }, fakeStore)).resolves.toEqual({ status: "accepted", accepted: 1 })
    expect(fakeStore.events[0]?.visitorHash).toBe(hashAnalyticsId(visitorId, previousSecret))
  })

  it("drops a submitted same-origin referrer hostname at the server boundary", async () => {
    const fakeStore = new FakeStore()

    await collectAnalyticsBatch({
      events: [{ ...validEvent, referrerHost: "laflabs.co" }],
    }, requestContext, fakeStore)

    expect(fakeStore.events[0]?.referrerHost).toBeNull()
  })

  it("does not load environment configuration when the visitor token is absent", async () => {
    vi.stubEnv("ANALYTICS_HASH_SECRET", "")
    const fakeStore = new FakeStore()

    await expect(collectAnalyticsBatch(validBatch, {
      ...requestContext,
      visitorToken: null,
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
    expect(fakeStore.expiredGuardsBefore).toEqual(new Date("2026-08-22T00:00:00.000Z"))
  })

  it("prevents an in-flight collection from surviving withdrawal", async () => {
    const fakeStore = new FakeStore()
    let releaseInsert: (() => void) | undefined
    let signalInsertStarted: (() => void) | undefined
    fakeStore.waitBeforeInsert = new Promise((resolve) => {
      releaseInsert = resolve
    })
    const insertStarted = new Promise<void>((resolve) => {
      signalInsertStarted = resolve
    })
    fakeStore.onInsertStarted = signalInsertStarted ?? null

    const collection = collectAnalyticsBatch(validBatch, requestContext, fakeStore)
    await insertStarted
    const withdrawal = deleteVisitorEventsByToken(visitorToken, fakeStore)
    await Promise.resolve()
    releaseInsert?.()

    await expect(collection).resolves.toEqual({ status: "accepted", accepted: 1 })
    await expect(withdrawal).resolves.toBe(true)
    expect(fakeStore.events).toHaveLength(0)
    expect(fakeStore.rateCalls).toHaveLength(0)
    expect(fakeStore.guardActive).toBe(true)
  })

  it("ignores collection while the withdrawal guard is active", async () => {
    const fakeStore = new FakeStore()

    await expect(deleteVisitorEventsByToken(visitorToken, fakeStore)).resolves.toBe(true)
    await expect(collectAnalyticsBatch(validBatch, requestContext, fakeStore)).resolves.toEqual({
      status: "ignored",
      accepted: 0,
    })
    expect(fakeStore.events).toHaveLength(0)
    expect(fakeStore.rateCalls).toHaveLength(0)
  })
})

describe("analytics event route", () => {
  it("returns before cookies, body, and storage when DNT is enabled", async () => {
    cookieValues.set(CONSENT_COOKIE, consentCookieValue("analytics"))
    cookieValues.set(VISITOR_COOKIE, visitorToken)
    const fakeStore = new FakeStore()
    const request = new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      headers: {
        dnt: "1",
        "content-type": "application/json",
      },
      body: JSON.stringify(validBatch),
    })
    const text = vi.spyOn(request, "text")

    const response = await handleAnalyticsEvents(request, fakeStore)

    expect(response.status).toBe(204)
    expect(cookiesMock).not.toHaveBeenCalled()
    expect(text).not.toHaveBeenCalled()
    expect(fakeStore.rateCalls).toEqual([])
    expect(fakeStore.events).toEqual([])
  })

  it("accepts the external Host origin when Next dev exposes an internal localhost URL", async () => {
    const request = new Request("http://localhost:3200/api/analytics/events", {
      method: "POST",
      headers: {
        Host: "127.0.0.1:3200",
        Origin: "http://127.0.0.1:3200",
      },
      body: "malformed",
    })
    const text = vi.spyOn(request, "text")

    const response = await handleAnalyticsEvents(request, new FakeStore())

    expect(response.status).toBe(204)
    expect(text).not.toHaveBeenCalled()
  })

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

  it("rejects spoofed forwarded origins before reading their bodies", async () => {
    const fakeStore = new FakeStore()
    const request = new Request("http://localhost:3200/api/analytics/events", {
      method: "POST",
      headers: {
        Origin: "https://attacker.example",
        "X-Forwarded-Host": "attacker.example",
        "X-Forwarded-Proto": "https",
      },
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

  it("returns a no-op for a missing visitor before validating environment configuration", async () => {
    vi.stubEnv("ANALYTICS_HASH_SECRET", "")
    cookieValues.set(CONSENT_COOKIE, consentCookieValue("analytics"))
    const request = new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      body: "malformed",
    })
    const text = vi.spyOn(request, "text")

    const response = await handleAnalyticsEvents(request, new FakeStore())

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

  it("enforces the actual UTF-8 byte limit when Content-Length understates it", async () => {
    cookieValues.set(CONSENT_COOKIE, consentCookieValue("analytics"))
    cookieValues.set(VISITOR_COOKIE, visitorToken)
    const raw = JSON.stringify({ padding: "한".repeat(5_500) })
    expect(raw.length).toBeLessThan(16 * 1024)
    expect(Buffer.byteLength(raw, "utf8")).toBeGreaterThan(16 * 1024)
    const parse = vi.spyOn(JSON, "parse")

    const response = await handleAnalyticsEvents(new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      headers: { "content-length": "1", "content-type": "application/json" },
      body: raw,
    }), new FakeStore())

    expect(response.status).toBe(400)
    expect(parse).not.toHaveBeenCalled()
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

  it("ignores the analytics POST Referer header and stores only the minimized page-view field", async () => {
    cookieValues.set(CONSENT_COOKIE, consentCookieValue("analytics"))
    cookieValues.set(VISITOR_COOKIE, visitorToken)
    const fakeStore = new FakeStore()
    const withoutReferrer = {
      events: [{ ...validEvent, referrerHost: undefined }],
    }

    const response = await handleAnalyticsEvents(new Request("https://laflabs.co/api/analytics/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        referer: "https://sensitive.example/private/path?token=secret#fragment",
      },
      body: JSON.stringify(withoutReferrer),
    }), fakeStore)

    expect(response.status).toBe(204)
    expect(fakeStore.events[0]?.referrerHost).toBeNull()
  })
})
