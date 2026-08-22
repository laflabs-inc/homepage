import { afterEach, describe, expect, it, vi } from "vitest"

import { createVisitorToken, hashAnalyticsId } from "@/lib/analytics/identity"
import {
  WithdrawalFailedError,
  applyConsentChoice,
  deleteVisitorEventsByToken,
} from "@/lib/analytics/service"
import type { AnalyticsStore } from "@/lib/analytics/store"
import { isSameOriginRequest } from "@/app/api/consent/route"

const secret = "test-secret-that-is-long-enough-for-hmac"
const previousSecret = "previous-secret-that-is-long-enough-hmac"
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

  it("keeps a current identity without deleting or replacing it", async () => {
    vi.stubEnv("ANALYTICS_HASH_SECRET", secret)
    vi.stubEnv("ANALYTICS_HASH_SECRET_PREVIOUS", previousSecret)
    const fakeStore = new FakeStore()

    await expect(applyConsentChoice({
      requested: "analytics",
      dnt: false,
      visitorToken: createVisitorToken(visitorId, secret),
    }, fakeStore)).resolves.toEqual({
      choice: "analytics",
      dntHonored: false,
      createVisitor: false,
    })
    expect(fakeStore.deletedVisitorHashes).toEqual([])
  })

  it("deletes a previous-key identity with the previous hash before replacing it", async () => {
    vi.stubEnv("ANALYTICS_HASH_SECRET", secret)
    vi.stubEnv("ANALYTICS_HASH_SECRET_PREVIOUS", previousSecret)
    const fakeStore = new FakeStore()

    await expect(applyConsentChoice({
      requested: "analytics",
      dnt: false,
      visitorToken: createVisitorToken(visitorId, previousSecret),
    }, fakeStore)).resolves.toEqual({
      choice: "analytics",
      dntHonored: false,
      createVisitor: true,
    })
    expect(fakeStore.deletedVisitorHashes).toEqual([
      hashAnalyticsId(visitorId, previousSecret),
    ])
  })

  it("preserves a previous-key identity for retry when its deletion fails", async () => {
    vi.stubEnv("ANALYTICS_HASH_SECRET", secret)
    vi.stubEnv("ANALYTICS_HASH_SECRET_PREVIOUS", previousSecret)
    const fakeStore = new FakeStore()
    fakeStore.deletionError = new Error("database unavailable")

    await expect(applyConsentChoice({
      requested: "analytics",
      dnt: false,
      visitorToken: createVisitorToken(visitorId, previousSecret),
    }, fakeStore)).rejects.toBeInstanceOf(WithdrawalFailedError)
  })

  it("clears or replaces an unidentifiable token without an endless withdrawal failure", async () => {
    vi.stubEnv("ANALYTICS_HASH_SECRET", secret)
    vi.stubEnv("ANALYTICS_HASH_SECRET_PREVIOUS", previousSecret)
    const fakeStore = new FakeStore()

    await expect(applyConsentChoice({
      requested: "essential",
      dnt: false,
      visitorToken: "invalid-token",
    }, fakeStore)).resolves.toEqual({
      choice: "essential",
      dntHonored: false,
      createVisitor: false,
    })
    await expect(applyConsentChoice({
      requested: "analytics",
      dnt: false,
      visitorToken: "invalid-token",
    }, fakeStore)).resolves.toEqual({
      choice: "analytics",
      dntHonored: false,
      createVisitor: true,
    })
    expect(fakeStore.deletedVisitorHashes).toEqual([])
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

  it("allows deliberate loopback aliases without trusting the Host header", () => {
    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: {
        Host: "attacker.example",
        Origin: "http://127.0.0.1:3200",
      },
    }))).toBe(true)
  })

  it("accepts the current HTTPS ngrok origin only from controlled AUTH_URL configuration", () => {
    vi.stubEnv("AUTH_URL", "https://freebase-shamrock-magnetic.ngrok-free.dev")

    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: {
        Host: "localhost:3200",
        Origin: "https://freebase-shamrock-magnetic.ngrok-free.dev",
      },
    }))).toBe(true)
  })

  it("accepts exact production and Vercel preview origins from controlled configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://laflabs.co/")
    vi.stubEnv("VERCEL_URL", "homepage-git-main-laflabs.vercel.app")

    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: { Origin: "https://laflabs.co" },
    }))).toBe(true)
    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: { Origin: "https://homepage-git-main-laflabs.vercel.app" },
    }))).toBe(true)
  })

  it("does not grant authority to spoofed forwarded headers", () => {
    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: {
        Host: "localhost:3200",
        Origin: "https://attacker.example",
        "X-Forwarded-Host": "attacker.example",
        "X-Forwarded-Proto": "https",
      },
    }))).toBe(false)
  })

  it("rejects comma-injected forwarded headers even when their first value matches Origin", () => {
    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: {
        Origin: "https://attacker.example",
        "X-Forwarded-Host": "attacker.example, laflabs.co",
        "X-Forwarded-Proto": "https, http",
      },
    }))).toBe(false)
  })

  it("fails closed on malformed controlled origin configuration", () => {
    vi.stubEnv("AUTH_URL", "https://freebase-shamrock-magnetic.ngrok-free.dev/callback")

    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: {
        Origin: "https://freebase-shamrock-magnetic.ngrok-free.dev",
        "X-Forwarded-Host": "freebase-shamrock-magnetic.ngrok-free.dev",
        "X-Forwarded-Proto": "https",
      },
    }))).toBe(false)
  })

  it.each([
    ["AUTH_URL parser-repaired extra slashes", "AUTH_URL", "https:////attacker.example", "https://attacker.example"],
    ["AUTH_URL parser-repaired backslashes", "AUTH_URL", "https:\\\\attacker.example", "https://attacker.example"],
    ["AUTH_URL parser-repaired mixed slashes", "AUTH_URL", "https:/\\/attacker.example", "https://attacker.example"],
    ["AUTH_URL comma hostname", "AUTH_URL", "https://attacker.example,laflabs.co", "https://attacker.example,laflabs.co"],
    ["AUTH_URL surrounding whitespace", "AUTH_URL", " https://attacker.example ", "https://attacker.example"],
    ["AUTH_URL normalized default port", "AUTH_URL", "https://attacker.example:443", "https://attacker.example"],
    ["VERCEL_URL parser-repaired slashes", "VERCEL_URL", "//attacker.example", "https://attacker.example"],
    ["VERCEL_URL parser-repaired backslashes", "VERCEL_URL", "\\\\attacker.example", "https://attacker.example"],
    ["VERCEL_URL comma hostname", "VERCEL_URL", "attacker.example,laflabs.co", "https://attacker.example,laflabs.co"],
  ])("rejects raw controlled-origin bypass: %s", (_label, variable, configured, origin) => {
    vi.stubEnv(variable, configured)

    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: { Origin: origin },
    }))).toBe(false)
  })

  it("accepts an exact configured origin with one optional trailing slash", () => {
    vi.stubEnv("AUTH_URL", "https://freebase-shamrock-magnetic.ngrok-free.dev/")

    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: { Origin: "https://freebase-shamrock-magnetic.ngrok-free.dev" },
    }))).toBe(true)
  })

  it("rejects a configured origin with more than one trailing slash", () => {
    vi.stubEnv("AUTH_URL", "https://freebase-shamrock-magnetic.ngrok-free.dev//")

    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: { Origin: "https://freebase-shamrock-magnetic.ngrok-free.dev" },
    }))).toBe(false)
  })

  it.each([
    ["attacker.example", "https://attacker.example"],
    ["attacker-example.vercel.app/", "https://attacker-example.vercel.app"],
    ["attacker-example.vercel.app?next=laflabs.co", "https://attacker-example.vercel.app"],
    ["ATTACKER-EXAMPLE.VERCEL.APP", "https://attacker-example.vercel.app"],
    ["-attacker.vercel.app", "https://-attacker.vercel.app"],
  ])("rejects non-platform VERCEL_URL form: %s", (configured, origin) => {
    vi.stubEnv("VERCEL_URL", configured)

    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: { Origin: origin },
    }))).toBe(false)
  })

  it.each([
    ["scheme mismatch", "http://freebase-shamrock-magnetic.ngrok-free.dev"],
    ["port mismatch", "https://freebase-shamrock-magnetic.ngrok-free.dev:444"],
    ["subdomain lookalike", "https://evil.laflabs.co"],
    ["suffix lookalike", "https://laflabs.co.attacker.example"],
  ])("rejects a configured-origin %s", (_label, origin) => {
    vi.stubEnv("AUTH_URL", "https://freebase-shamrock-magnetic.ngrok-free.dev")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://laflabs.co")

    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: { Origin: origin },
    }))).toBe(false)
  })

  it("rejects a loopback alias on a different port", () => {
    expect(isSameOriginRequest(new Request("http://localhost:3200/api/consent", {
      headers: { Origin: "http://127.0.0.1:3201" },
    }))).toBe(false)
  })
})
