import { PgDialect } from "drizzle-orm/pg-core"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createAiRetentionStore,
  handleAiRetention,
} from "@/app/api/cron/ai-retention/route"

const now = new Date("2026-08-24T12:00:00.000Z")
const secret = "cron-secret-that-is-long-enough"

class RetentionStore {
  calls: Array<{ now: Date; dailyCutoff: Date; monthlyCutoff: Date }> = []
  private hasExpiredData = true

  async deleteExpired(input: { now: Date; dailyCutoff: Date; monthlyCutoff: Date }) {
    this.calls.push(input)
    if (!this.hasExpiredData) return { reservations: 0, daily: 0, monthly: 0 }
    this.hasExpiredData = false
    return { reservations: 3, daily: 4, monthly: 2 }
  }
}

function request(token = secret) {
  return new Request("https://laflabs.co/api/cron/ai-retention", {
    headers: { authorization: `Bearer ${token}` },
  })
}

afterEach(() => vi.unstubAllEnvs())

describe("AI usage retention", () => {
  it("rejects an invalid timing-safe bearer with a no-store response", async () => {
    vi.stubEnv("CRON_SECRET", secret)
    const store = new RetentionStore()

    const response = await handleAiRetention(request("wrong-secret"), store, now)

    expect(response.status).toBe(401)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" })
    expect(store.calls).toEqual([])
  })

  it("deletes only expired aggregate data and returns counts", async () => {
    vi.stubEnv("CRON_SECRET", secret)
    const store = new RetentionStore()

    const first = await handleAiRetention(request(), store, now)
    const second = await handleAiRetention(request(), store, now)

    expect(store.calls).toEqual([
      {
        now,
        dailyCutoff: new Date("2026-07-23T12:00:00.000Z"),
        monthlyCutoff: new Date("2025-07-01T00:00:00.000Z"),
      },
      {
        now,
        dailyCutoff: new Date("2026-07-23T12:00:00.000Z"),
        monthlyCutoff: new Date("2025-07-01T00:00:00.000Z"),
      },
    ])
    expect(first.headers.get("cache-control")).toBe("no-store")
    await expect(first.json()).resolves.toEqual({ reservations: 3, daily: 4, monthly: 2 })
    await expect(second.json()).resolves.toEqual({ reservations: 0, daily: 0, monthly: 0 })
  })

  it("uses one counted query without returning identifiers or content", async () => {
    const execute = vi.fn().mockResolvedValue({ rows: [{ reservations: "3", daily: 4, monthly: 2 }] })
    const store = createAiRetentionStore({ execute })

    await expect(store.deleteExpired({
      now,
      dailyCutoff: new Date("2026-07-23T12:00:00.000Z"),
      monthlyCutoff: new Date("2025-07-01T00:00:00.000Z"),
    })).resolves.toEqual({ reservations: 3, daily: 4, monthly: 2 })

    expect(execute).toHaveBeenCalledTimes(1)
    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalized = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(compiled.params).toEqual(expect.arrayContaining([
      now,
      new Date("2026-07-23T12:00:00.000Z"),
      new Date("2025-07-01T00:00:00.000Z"),
    ]))
    expect(normalized).toContain("with deleted_reservations as")
    expect(normalized).toContain("deleted_daily as")
    expect(normalized).toContain("deleted_monthly as")
    expect(normalized).toContain('"expires_at" <=')
    expect(normalized).toContain('"date_bucket" <')
    expect(normalized).toContain('"month_bucket" <')
    expect(normalized).toContain("returning 1")
    expect(normalized).toContain("count(*)::integer")
    expect(normalized).not.toContain('returning "id"')
    expect(normalized).not.toContain('returning "visitor_hash"')
  })

  it("returns a safe no-store 503 when retention storage is unavailable", async () => {
    vi.stubEnv("CRON_SECRET", secret)
    const store = { deleteExpired: vi.fn().mockRejectedValue(new Error("database unavailable")) }

    const response = await handleAiRetention(request(), store, now)

    expect(response.status).toBe(503)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({ error: "unavailable" })
  })
})
