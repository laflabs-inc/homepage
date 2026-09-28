import { afterEach, describe, expect, it, vi } from "vitest"

import { getMediaEnv, isMediaConfigured, parseServerEnv } from "@/lib/env"

const baseEnvironment = {
  DATABASE_URL: "postgresql://example.invalid/laflabs",
  ANALYTICS_HASH_SECRET: "a".repeat(32),
  AUTH_SECRET: "b".repeat(32),
  AUTH_GITHUB_ID: "client",
  AUTH_GITHUB_SECRET: "secret",
  ADMIN_GITHUB_ORG: "laflabs-inc",
  CRON_SECRET: "c".repeat(16),
}

afterEach(() => vi.unstubAllEnvs())

describe("media environment", () => {
  it("keeps media configuration lazy", () => {
    vi.stubEnv("PUBLIC_BLOB_STORE_ID", "")
    vi.stubEnv("PRIVATE_BLOB_STORE_ID", "")
    vi.stubEnv("PRIVATE_BLOB_WEBHOOK_PUBLIC_KEY", "")

    expect(() => parseServerEnv(baseEnvironment)).not.toThrow()
    expect(() => getMediaEnv()).toThrow()
    expect(isMediaConfigured()).toBe(false)
  })

  it("returns exactly the linked public and private store metadata", () => {
    vi.stubEnv("PUBLIC_BLOB_STORE_ID", "public-store")
    vi.stubEnv("PRIVATE_BLOB_STORE_ID", "private-store")
    vi.stubEnv("PRIVATE_BLOB_WEBHOOK_PUBLIC_KEY", "private-webhook-key")

    expect(getMediaEnv()).toEqual({
      PUBLIC_BLOB_STORE_ID: "public-store",
      PRIVATE_BLOB_STORE_ID: "private-store",
      PRIVATE_BLOB_WEBHOOK_PUBLIC_KEY: "private-webhook-key",
    })
    expect(isMediaConfigured()).toBe(true)
  })

  it("rejects one store reused for both trust boundaries without exposing its ID", () => {
    const reusedStoreId = "reused-store-id"
    vi.stubEnv("PUBLIC_BLOB_STORE_ID", reusedStoreId)
    vi.stubEnv("PRIVATE_BLOB_STORE_ID", reusedStoreId)
    vi.stubEnv("PRIVATE_BLOB_WEBHOOK_PUBLIC_KEY", "private-webhook-key")

    let error: unknown
    try {
      getMediaEnv()
    } catch (caught) {
      error = caught
    }

    expect(error).toBeInstanceOf(Error)
    expect(String(error)).not.toContain(reusedStoreId)
    expect(isMediaConfigured()).toBe(false)
  })

  it("does not treat legacy long-lived tokens as a complete setup", () => {
    vi.stubEnv("BLOB_PUBLIC_READ_WRITE_TOKEN", "legacy-public-token")
    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "legacy-private-token")
    vi.stubEnv("PUBLIC_BLOB_STORE_ID", "")
    vi.stubEnv("PRIVATE_BLOB_STORE_ID", "")
    vi.stubEnv("PRIVATE_BLOB_WEBHOOK_PUBLIC_KEY", "")

    expect(isMediaConfigured()).toBe(false)
  })
})
