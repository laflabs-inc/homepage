import { describe, expect, it } from "vitest"
import { parseServerEnv } from "@/lib/env"

describe("parseServerEnv", () => {
  it("requires analytics secrets and database URL", () => {
    expect(() => parseServerEnv({})).toThrow(/DATABASE_URL/)
  })

  it("returns an exact typed environment", () => {
    expect(parseServerEnv({
      DATABASE_URL: "postgresql://example.invalid/laflabs",
      ANALYTICS_HASH_SECRET: "a".repeat(32),
      AUTH_SECRET: "b".repeat(32),
      AUTH_GITHUB_ID: "client",
      AUTH_GITHUB_SECRET: "secret",
      ADMIN_GITHUB_ORG: "laflabs-inc",
      CRON_SECRET: "c".repeat(16),
    }).ADMIN_GITHUB_ORG).toBe("laflabs-inc")
  })
})
