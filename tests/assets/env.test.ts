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
    vi.stubEnv("BLOB_PUBLIC_READ_WRITE_TOKEN", "")
    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "")

    expect(() => parseServerEnv(baseEnvironment)).not.toThrow()
    expect(() => getMediaEnv()).toThrow()
    expect(isMediaConfigured()).toBe(false)
  })

  it("returns exactly the two distinct media credentials", () => {
    vi.stubEnv("BLOB_PUBLIC_READ_WRITE_TOKEN", "public-token")
    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "private-token")

    expect(getMediaEnv()).toEqual({
      BLOB_PUBLIC_READ_WRITE_TOKEN: "public-token",
      BLOB_PRIVATE_READ_WRITE_TOKEN: "private-token",
    })
    expect(isMediaConfigured()).toBe(true)
  })

  it("rejects reused credentials without exposing their value", () => {
    const reusedToken = "reused-secret-token"
    vi.stubEnv("BLOB_PUBLIC_READ_WRITE_TOKEN", reusedToken)
    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", reusedToken)

    let error: unknown
    try {
      getMediaEnv()
    } catch (caught) {
      error = caught
    }

    expect(error).toBeInstanceOf(Error)
    expect(String(error)).not.toContain(reusedToken)
    expect(isMediaConfigured()).toBe(false)
  })
})
