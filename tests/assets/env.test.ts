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
    vi.stubEnv("PUBLIC_BLOB_STORE_ID", "store_public-store")
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

  it("fails closed when a generic long-lived token could override valid OIDC stores", () => {
    const legacyToken = "legacy-read-write-secret"
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", legacyToken)
    vi.stubEnv("PUBLIC_BLOB_STORE_ID", "public-store")
    vi.stubEnv("PRIVATE_BLOB_STORE_ID", "private-store")
    vi.stubEnv("PRIVATE_BLOB_WEBHOOK_PUBLIC_KEY", "private-webhook-key")

    expect(() => getMediaEnv()).toThrow()
    expect(isMediaConfigured()).toBe(false)
    try {
      getMediaEnv()
    } catch (error) {
      expect(String(error)).not.toContain(legacyToken)
    }
  })

  it("rejects prefixed and unprefixed aliases of the same store", () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "")
    vi.stubEnv("PUBLIC_BLOB_STORE_ID", "store_shared")
    vi.stubEnv("PRIVATE_BLOB_STORE_ID", "shared")
    vi.stubEnv("PRIVATE_BLOB_WEBHOOK_PUBLIC_KEY", "private-webhook-key")

    expect(isMediaConfigured()).toBe(false)
  })
})
