import { describe, expect, it } from "vitest"

import { usageBuckets } from "@/lib/ai/buckets"

describe("usageBuckets", () => {
  it("uses the local calendar date and month at a midnight reset", () => {
    expect(usageBuckets(new Date("2026-08-22T15:00:00.000Z"), "Asia/Seoul", 0)).toEqual({
      day: "2026-08-23",
      month: "2026-08",
    })
    expect(usageBuckets(new Date("2026-08-22T23:59:00.000Z"), "UTC", 0)).toEqual({
      day: "2026-08-22",
      month: "2026-08",
    })
  })

  it("moves only the daily bucket across an Asia/Seoul 04:00 reset", () => {
    expect(usageBuckets(new Date("2026-08-22T18:59:00.000Z"), "Asia/Seoul", 240)).toEqual({
      day: "2026-08-22",
      month: "2026-08",
    })
    expect(usageBuckets(new Date("2026-08-22T19:00:00.000Z"), "Asia/Seoul", 240)).toEqual({
      day: "2026-08-23",
      month: "2026-08",
    })
  })

  it("keeps the month on the local calendar when the quota day is the prior month", () => {
    expect(usageBuckets(new Date("2026-07-31T17:00:00.000Z"), "Asia/Seoul", 240)).toEqual({
      day: "2026-07-31",
      month: "2026-08",
    })
  })

  it("handles both sides of New York daylight-saving changes", () => {
    expect(usageBuckets(new Date("2026-03-08T06:30:00.000Z"), "America/New_York", 240).day)
      .toBe("2026-03-07")
    expect(usageBuckets(new Date("2026-03-08T08:30:00.000Z"), "America/New_York", 240).day)
      .toBe("2026-03-08")
    expect(usageBuckets(new Date("2026-11-01T05:30:00.000Z"), "America/New_York", 240).day)
      .toBe("2026-10-31")
    expect(usageBuckets(new Date("2026-11-01T09:30:00.000Z"), "America/New_York", 240).day)
      .toBe("2026-11-01")
  })

  it("uses the first occurrence of a repeated New York 01:30 reset", () => {
    expect(usageBuckets(new Date("2026-11-01T05:29:00.000Z"), "America/New_York", 90).day)
      .toBe("2026-10-31")
    expect(usageBuckets(new Date("2026-11-01T05:30:00.000Z"), "America/New_York", 90).day)
      .toBe("2026-11-01")
    expect(usageBuckets(new Date("2026-11-01T06:15:00.000Z"), "America/New_York", 90).day)
      .toBe("2026-11-01")
    expect(usageBuckets(new Date("2026-11-01T06:30:00.000Z"), "America/New_York", 90).day)
      .toBe("2026-11-01")
  })

  it("advances a nonexistent New York 02:30 reset to the first valid minute", () => {
    expect(usageBuckets(new Date("2026-03-08T06:59:00.000Z"), "America/New_York", 150).day)
      .toBe("2026-03-07")
    expect(usageBuckets(new Date("2026-03-08T07:00:00.000Z"), "America/New_York", 150).day)
      .toBe("2026-03-08")
  })

  it.each([-1, 1_440, 1.5])("rejects an invalid reset minute: %s", (minute) => {
    expect(() => usageBuckets(new Date("2026-08-22T00:00:00.000Z"), "UTC", minute)).toThrow(RangeError)
  })

  it("rejects invalid dates and timezones", () => {
    expect(() => usageBuckets(new Date(Number.NaN), "UTC", 0)).toThrow(RangeError)
    expect(() => usageBuckets(new Date("2026-08-22T00:00:00.000Z"), "Mars/Olympus", 0)).toThrow(RangeError)
  })
})
