import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import { handleAssetCleanup } from "@/app/api/cron/assets/cleanup/route"

afterEach(() => vi.unstubAllEnvs())

describe("asset cleanup cron route", () => {
  it("rejects requests without the configured bearer", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-long-enough")
    const cleanup = vi.fn()

    const response = await handleAssetCleanup(new Request("https://laflabs.co/api/cron/assets/cleanup"), cleanup)

    expect(response.status).toBe(401)
    expect(cleanup).not.toHaveBeenCalled()
  })

  it("returns only bounded counts", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-long-enough")
    const cleanup = vi.fn(async () => ({
      processingTimedOut: 1,
      stagingDeleted: 2,
      deletionsCompleted: 1,
      failures: 0,
    }))
    const request = new Request("https://laflabs.co/api/cron/assets/cleanup", {
      headers: { authorization: "Bearer cron-secret-long-enough" },
    })

    const response = await handleAssetCleanup(request, cleanup)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      processingTimedOut: 1,
      stagingDeleted: 2,
      deletionsCompleted: 1,
      failures: 0,
    })
    expect(JSON.stringify(body)).not.toMatch(/token|url|pathname|provider/i)
  })
})
