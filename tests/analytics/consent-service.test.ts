import { afterEach, describe, expect, it, vi } from "vitest"

import { createVisitorToken } from "@/lib/analytics/identity"
import {
  WithdrawalFailedError,
  applyConsentChoice,
  deleteVisitorEventsByToken,
} from "@/lib/analytics/service"
import type { AnalyticsStore } from "@/lib/analytics/store"
import { isSameOriginRequest } from "@/app/api/consent/route"

const secret = "test-secret-that-is-long-enough-for-hmac"
const visitorId = "8f5c5c8b-54cf-4de1-9a16-4be9b8c0e3d7"

class FakeStore implements AnalyticsStore {
  deletedVisitorHashes: string[] = []
  deletionError: Error | null = null
  waitForDeletion: Promise<void> | null = null
  guardUpserted = false
  eventsDeleted = false
  rateWindowsDeleted = false

  async collectEvents() {
    return { status: "accepted" as const, accepted: 0 }
  }

  async withdrawVisitorAnalytics(visitorHash: string) {
    this.deletedVisitorHashes.push(visitorHash)
    if (this.deletionError) throw this.deletionError
    await this.waitForDeletion
    this.guardUpserted = true
    this.eventsDeleted = true
    this.rateWindowsDeleted = true
  }

  async deleteVisitorEvents(visitorHash: string) {
    this.deletedVisitorHashes.push(visitorHash)
    if (this.deletionError) throw this.deletionError
    await this.waitForDeletion
  }

  async deleteBefore() {
    return { events: 0, windows: 0 }
  }
}

afterEach(() => vi.unstubAllEnvs())

describe("applyConsentChoice", () => {
  it("honors DNT instead of creating an analytics visitor", async () => {
    const fakeStore = new FakeStore()

    await expect(applyConsentChoice({
      requested: "analytics",
      dnt: true,
      visitorToken: null,
    }, fakeStore)).resolves.toEqual({
      choice: "essential",
      dntHonored: true,
      createVisitor: false,
    })
    expect(fakeStore.deletedVisitorHashes).toHaveLength(0)
  })

  it("deletes the signed visitor's events before resolving a withdrawal", async () => {
    vi.stubEnv("ANALYTICS_HASH_SECRET", secret)
    const fakeStore = new FakeStore()
    let finishDeletion: (() => void) | undefined
    fakeStore.waitForDeletion = new Promise((resolve) => {
      finishDeletion = resolve
    })
    let resolved = false

    const withdrawal = applyConsentChoice({
      requested: "essential",
      dnt: false,
      visitorToken: createVisitorToken(visitorId, secret),
    }, fakeStore).then((result) => {
      resolved = true
      return result
    })

    await Promise.resolve()
    expect(fakeStore.deletedVisitorHashes).toHaveLength(1)
    expect(fakeStore.deletedVisitorHashes[0]).not.toContain(visitorId)
    expect(resolved).toBe(false)

    finishDeletion?.()
    await expect(withdrawal).resolves.toEqual({
      choice: "essential",
      dntHonored: false,
      createVisitor: false,
    })
    expect(fakeStore.guardUpserted).toBe(true)
    expect(fakeStore.eventsDeleted).toBe(true)
    expect(fakeStore.rateWindowsDeleted).toBe(true)
  })

  it("rejects with WithdrawalFailedError when deletion fails", async () => {
    vi.stubEnv("ANALYTICS_HASH_SECRET", secret)
    const fakeStore = new FakeStore()
    fakeStore.deletionError = new Error("database unavailable")

    await expect(applyConsentChoice({
      requested: "essential",
      dnt: false,
      visitorToken: createVisitorToken(visitorId, secret),
    }, fakeStore)).rejects.toBeInstanceOf(WithdrawalFailedError)
  })

  it("rejects an unverifiable visitor token instead of claiming deletion", async () => {
    vi.stubEnv("ANALYTICS_HASH_SECRET", secret)
    const fakeStore = new FakeStore()

    await expect(deleteVisitorEventsByToken("invalid-token", fakeStore)).resolves.toBe(false)
    expect(fakeStore.deletedVisitorHashes).toHaveLength(0)
  })

  it("requests a visitor only for a new analytics choice", async () => {
    const fakeStore = new FakeStore()

    await expect(applyConsentChoice({
      requested: "analytics",
      dnt: false,
      visitorToken: null,
    }, fakeStore)).resolves.toEqual({
      choice: "analytics",
      dntHonored: false,
      createVisitor: true,
    })
  })
})

describe("consent request origin", () => {
  it("accepts missing or same-origin Origin headers", () => {
    expect(isSameOriginRequest(new Request("https://laflabs.co/api/consent"))).toBe(true)
    expect(isSameOriginRequest(new Request("https://laflabs.co/api/consent", {
      headers: { Origin: "https://laflabs.co" },
    }))).toBe(true)
  })

  it("rejects a cross-origin Origin header", () => {
    expect(isSameOriginRequest(new Request("https://laflabs.co/api/consent", {
      headers: { Origin: "https://attacker.example" },
    }))).toBe(false)
  })
})
