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

  it("accepts one optional, distinct previous analytics key for rotation", () => {
    const environment = parseServerEnv({
      DATABASE_URL: "postgresql://example.invalid/laflabs",
      ANALYTICS_HASH_SECRET: "a".repeat(32),
      ANALYTICS_HASH_SECRET_PREVIOUS: "p".repeat(32),
      AUTH_SECRET: "b".repeat(32),
      AUTH_GITHUB_ID: "client",
      AUTH_GITHUB_SECRET: "secret",
      ADMIN_GITHUB_ORG: "laflabs-inc",
      CRON_SECRET: "c".repeat(16),
    })

    expect(environment.ANALYTICS_HASH_SECRET_PREVIOUS).toBe("p".repeat(32))
    expect(() => parseServerEnv({
      ...environment,
      ANALYTICS_HASH_SECRET_PREVIOUS: environment.ANALYTICS_HASH_SECRET,
    })).toThrow(/ANALYTICS_HASH_SECRET_PREVIOUS/)
  })
})
