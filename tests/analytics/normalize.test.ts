import { describe, expect, it } from "vitest"

import {
  AnalyticsBatchSchema,
  AnalyticsEventInputSchema,
  normalizeDeviceCategory,
  normalizeLocale,
  normalizePath,
  normalizeReferrer,
  normalizeReferrerHost,
} from "@/lib/analytics/normalize"

const baseEvent = {
  eventId: "e734cacc-9d8b-46a4-8705-4f9d5b20aa8f",
  sessionId: "f0254908-6318-4ec8-9c84-5965452e8c3f",
  pathname: "/",
  locale: "en" as const,
  occurredAt: "2026-08-22T12:00:00.000Z",
}

describe("analytics normalization", () => {
  it("removes query strings and fragments from stored paths", () => {
    expect(normalizePath("/?email=a@example.com#x")).toBe("/")
  })

  it("keeps only the hostname from a referrer", () => {
    expect(normalizeReferrer("https://github.com/laflabs-inc/lafetch?q=x")).toBe("github.com")
    expect(normalizeReferrer("not a URL")).toBeNull()
    expect(normalizeReferrer("ftp://github.com/private")).toBeNull()
  })

  it("rejects IPv4 and IPv6 referrer hosts", () => {
    expect(normalizeReferrer("https://192.0.2.10/private?q=x")).toBeNull()
    expect(normalizeReferrer("https://[2001:db8::1]/private?q=x")).toBeNull()
  })

  it("validates an already-minimized external referrer hostname", () => {
    expect(normalizeReferrerHost("github.com", ["laflabs.co"])).toBe("github.com")
    expect(normalizeReferrerHost("LAFLaBs.co", ["laflabs.co"])).toBeNull()
    expect(normalizeReferrerHost("laflabs.co", ["laflabs.co"])).toBeNull()
    expect(normalizeReferrerHost("https://github.com/private?q=x", ["laflabs.co"])).toBeNull()
    expect(normalizeReferrerHost("192.0.2.10", ["laflabs.co"])).toBeNull()
    expect(normalizeReferrerHost("[2001:db8::1]", ["laflabs.co"])).toBeNull()
  })

  it("falls back to English for unsupported locales", () => {
    expect(normalizeLocale("ko")).toBe("ko")
    expect(normalizeLocale("fr")).toBe("en")
  })

  it("derives only a coarse device category", () => {
    expect(normalizeDeviceCategory("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tablet")
    expect(normalizeDeviceCategory("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile")).toBe("mobile")
    expect(normalizeDeviceCategory("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36")).toBe("desktop")
    expect(normalizeDeviceCategory(null)).toBe("unknown")
  })
})

describe("analytics event schema", () => {
  it.each([
    ["page_view", null],
    ["product_click", "laf-id"],
    ["github_click", "laflabs-inc"],
    ["github_click", "lafetch"],
    ["contact_click", "email"],
    ["locale_change", "ko"],
    ["consent_update", "analytics"],
  ])("accepts the allowlisted %s target %s", (type, targetId) => {
    expect(AnalyticsEventInputSchema.safeParse({ ...baseEvent, type, targetId }).success).toBe(true)
  })

  it("rejects an unknown event type", () => {
    expect(AnalyticsEventInputSchema.safeParse({
      ...baseEvent,
      type: "form_submit",
      targetId: null,
    }).success).toBe(false)
  })

  it("rejects targets that do not belong to their event type", () => {
    expect(AnalyticsEventInputSchema.safeParse({
      ...baseEvent,
      type: "contact_click",
      targetId: "lafetch",
    }).success).toBe(false)
    expect(AnalyticsEventInputSchema.safeParse({
      ...baseEvent,
      type: "page_view",
      targetId: "email",
    }).success).toBe(false)
  })

  it("allows a minimized referrer hostname only on page views", () => {
    expect(AnalyticsEventInputSchema.safeParse({
      ...baseEvent,
      type: "page_view",
      targetId: null,
      referrerHost: "github.com",
    }).success).toBe(true)
    expect(AnalyticsEventInputSchema.safeParse({
      ...baseEvent,
      type: "github_click",
      targetId: "lafetch",
      referrerHost: "github.com",
    }).success).toBe(false)
    expect(AnalyticsEventInputSchema.safeParse({
      ...baseEvent,
      type: "page_view",
      targetId: null,
      referrerHost: "https://github.com/private?q=x",
    }).success).toBe(false)
  })

  it("rejects extra event fields and batches above twenty events", () => {
    expect(AnalyticsEventInputSchema.safeParse({
      ...baseEvent,
      type: "page_view",
      targetId: null,
      pointerX: 42,
    }).success).toBe(false)

    const event = { ...baseEvent, type: "page_view", targetId: null }
    expect(AnalyticsBatchSchema.safeParse({ events: Array.from({ length: 21 }, () => event) }).success).toBe(false)
  })
})
