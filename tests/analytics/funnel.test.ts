import { describe, expect, it } from "vitest"

import { summarizeOrderedFunnel } from "@/lib/analytics/funnel"

const cutoff = new Date("2026-08-01T00:00:00.000Z")
const now = new Date("2026-08-22T00:00:00.000Z")

type FunnelEvent = Parameters<typeof summarizeOrderedFunnel>[0][number]

function event(
  visitorHash: string,
  eventType: FunnelEvent["eventType"],
  occurredAt: string,
  receivedAt = occurredAt,
  eventId = crypto.randomUUID(),
): FunnelEvent {
  return {
    visitorHash,
    eventType,
    eventId,
    occurredAt: new Date(occurredAt),
    receivedAt: new Date(receivedAt),
  }
}

describe("ordered analytics funnel", () => {
  it("excludes contact-only visitors and product events before the first page view", () => {
    const summary = summarizeOrderedFunnel([
      event("contact-only", "contact_click", "2026-08-10T09:00:00.000Z"),
      event("out-of-order", "product_click", "2026-08-10T10:00:00.000Z"),
      event("out-of-order", "page_view", "2026-08-10T11:00:00.000Z"),
      event("out-of-order", "contact_click", "2026-08-10T12:00:00.000Z"),
    ], cutoff, now)

    expect(summary).toEqual({
      pageVisitors: 1,
      productVisitors: 0,
      contactVisitors: 0,
    })
  })

  it("excludes contact before product and counts repeated ordered stages once per visitor", () => {
    const summary = summarizeOrderedFunnel([
      event("ordered", "page_view", "2026-08-10T09:00:00.000Z"),
      event("ordered", "page_view", "2026-08-10T09:01:00.000Z"),
      event("ordered", "contact_click", "2026-08-10T09:02:00.000Z"),
      event("ordered", "product_click", "2026-08-10T09:03:00.000Z"),
      event("ordered", "product_click", "2026-08-10T09:04:00.000Z"),
      event("ordered", "contact_click", "2026-08-10T09:05:00.000Z"),
      event("ordered", "contact_click", "2026-08-10T09:06:00.000Z"),
    ], cutoff, now)

    expect(summary).toEqual({
      pageVisitors: 1,
      productVisitors: 1,
      contactVisitors: 1,
    })
  })

  it("uses an inclusive equal-timestamp policy for consecutive stages", () => {
    const timestamp = "2026-08-10T09:00:00.000Z"

    expect(summarizeOrderedFunnel([
      event("equal", "contact_click", timestamp, timestamp, "00000000-0000-4000-8000-000000000001"),
      event("equal", "product_click", timestamp, timestamp, "00000000-0000-4000-8000-000000000002"),
      event("equal", "page_view", timestamp, timestamp, "00000000-0000-4000-8000-000000000003"),
    ], cutoff, now)).toEqual({
      pageVisitors: 1,
      productVisitors: 1,
      contactVisitors: 1,
    })
  })

  it("includes both selected-range boundaries and excludes events outside them", () => {
    const summary = summarizeOrderedFunnel([
      event("before", "page_view", "2026-08-01T00:00:00.000Z", "2026-07-31T23:59:59.999Z"),
      event("inside", "page_view", "2026-07-01T00:00:00.000Z", cutoff.toISOString()),
      event("inside", "product_click", "2026-07-01T00:00:00.000Z", now.toISOString()),
      event("inside", "contact_click", "2026-07-01T00:00:00.000Z", now.toISOString()),
      event("after", "page_view", "2026-08-22T00:00:00.001Z", "2026-08-22T00:00:00.001Z"),
    ], cutoff, now)

    expect(summary).toEqual({
      pageVisitors: 1,
      productVisitors: 1,
      contactVisitors: 1,
    })
  })
})
