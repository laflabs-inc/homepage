import { describe, expect, it } from "vitest"

import { getLatestSignalHref, mergeLatestSignals } from "@/lib/latest-signals"

describe("Latest Signals data", () => {
  it("merges supported document kinds by publication time and limits the result", () => {
    const items = mergeLatestSignals([
      {
        items: [{
          id: "notice-1",
          kind: "notice",
          locale: "ko",
          slug: "launch",
          category: "company",
          title: "공지",
          summary: "공지 요약",
          publishedAt: "2026-08-26T00:00:00.000Z",
        }],
      },
      {
        items: [{
          id: "disclosure-1",
          kind: "disclosure",
          locale: "ko",
          slug: "report",
          category: "ir",
          title: "공시",
          summary: "공시 요약",
          publishedAt: "2026-08-28T00:00:00.000Z",
        }],
      },
    ], 2)

    expect(items.map(({ id }) => id)).toEqual(["disclosure-1", "notice-1"])
  })

  it("builds the existing localized detail route", () => {
    expect(getLatestSignalHref({ kind: "notice", slug: "launch" }, "en"))
      .toBe("/notices/launch?locale=en")
  })
})
