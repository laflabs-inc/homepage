import { describe, expect, it } from "vitest"

import { validateE2eDatabaseEnvironment } from "../../e2e/support/test-database"

describe("validateE2eDatabaseEnvironment", () => {
  it("returns an isolated PostgreSQL test URL", () => {
    expect(validateE2eDatabaseEnvironment({
      testDatabaseUrl: "postgresql://tester:secret@test-db.example.net/laflabs_e2e",
      databaseUrl: "postgresql://app:secret@production-db.example.net/laflabs",
      productionSiteUrl: "https://laflabs.co",
    })).toBe("postgresql://tester:secret@test-db.example.net/laflabs_e2e")
  })

  it("refuses a missing test database URL without printing credentials", () => {
    expect(() => validateE2eDatabaseEnvironment({
      testDatabaseUrl: undefined,
      databaseUrl: "postgresql://app:super-secret@production-db.example.net/laflabs",
      productionSiteUrl: "https://laflabs.co",
    })).toThrow("TEST_DATABASE_URL is required")
  })

  it("refuses the application database when both URLs are identical", () => {
    expect(() => validateE2eDatabaseEnvironment({
      testDatabaseUrl: "postgresql://app:secret@production-db.example.net/laflabs",
      databaseUrl: "postgresql://app:secret@production-db.example.net/laflabs",
      productionSiteUrl: "https://laflabs.co",
    })).toThrow("must not equal DATABASE_URL")
  })

  it("refuses a database hosted on the configured production domain", () => {
    expect(() => validateE2eDatabaseEnvironment({
      testDatabaseUrl: "postgresql://tester:secret@db.laflabs.co/laflabs_e2e",
      databaseUrl: undefined,
      productionSiteUrl: "https://laflabs.co",
    })).toThrow("matches a configured production hostname")
  })

  it("refuses an explicitly configured production database hostname", () => {
    expect(() => validateE2eDatabaseEnvironment({
      testDatabaseUrl: "postgresql://tester:secret@ep-production.neon.tech/laflabs_e2e",
      databaseUrl: undefined,
      productionSiteUrl: "https://laflabs.co",
      productionDatabaseHostname: "ep-production.neon.tech",
    })).toThrow("matches a configured production hostname")
  })

  it.each([
    "not-a-url",
    "https://test-db.example.net/laflabs_e2e",
  ])("refuses a non-PostgreSQL test database URL: %s", (testDatabaseUrl) => {
    expect(() => validateE2eDatabaseEnvironment({
      testDatabaseUrl,
      databaseUrl: undefined,
      productionSiteUrl: "https://laflabs.co",
    })).toThrow("must be a valid PostgreSQL URL")
  })
})
