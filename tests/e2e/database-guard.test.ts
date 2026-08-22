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

  it("allows documented non-routing connection parameters used by Neon", () => {
    const testDatabaseUrl = [
      "postgresql://tester:secret@test-db.example.net/laflabs_e2e",
      "?sslmode=require",
      "&channel_binding=require",
      "&connect_timeout=10",
      "&application_name=laflabs-e2e",
    ].join("")

    expect(validateE2eDatabaseEnvironment({
      testDatabaseUrl,
      databaseUrl: "postgresql://app:secret@production-db.example.net/laflabs?sslmode=require",
      productionSiteUrl: "https://laflabs.co",
    })).toBe(testDatabaseUrl)
  })

  it.each([
    ["host", "production-db.example.net"],
    ["hostaddr", "203.0.113.42"],
    ["port", "6543"],
    ["dbname", "production"],
    ["database", "production"],
    ["service", "production-service"],
    ["servicefile", "/run/secrets/production-pg-service"],
    ["options", "-csearch_path=production"],
    ["endpoint", "production-endpoint"],
  ])("fails closed on the %s connection override without disclosing its value", (
    parameter,
    value,
  ) => {
    const testDatabaseUrl = new URL(
      "postgresql://tester:test-credential@test-db.example.net/laflabs_e2e",
    )
    testDatabaseUrl.searchParams.set("sslmode", "require")
    testDatabaseUrl.searchParams.set(parameter, value)

    try {
      validateE2eDatabaseEnvironment({
        testDatabaseUrl: testDatabaseUrl.toString(),
        databaseUrl: "postgresql://app:database-credential@production-db.example.net/laflabs",
        productionSiteUrl: "https://laflabs.co",
      })
      expect.unreachable("connection routing overrides must be rejected")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      const message = (error as Error).message
      expect(message).toContain("disallowed connection parameter")
      expect(message).not.toContain(value)
      expect(message).not.toContain("test-credential")
      expect(message).not.toContain("database-credential")
      expect(message).not.toContain(testDatabaseUrl.toString())
    }
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
    })).toThrow("same database identity as DATABASE_URL")
  })

  it.each([
    {
      bypass: "scheme alias",
      testDatabaseUrl: "postgres://tester:secret@test-db.example.net/laflabs_e2e",
      databaseUrl: "postgresql://tester:secret@test-db.example.net/laflabs_e2e",
    },
    {
      bypass: "hostname case and different credentials",
      testDatabaseUrl: "postgresql://e2e:different@TEST-DB.EXAMPLE.NET/laflabs_e2e",
      databaseUrl: "postgresql://production:secret@test-db.example.net/laflabs_e2e",
    },
    {
      bypass: "explicit default port",
      testDatabaseUrl: "postgresql://tester:secret@test-db.example.net:5432/laflabs_e2e",
      databaseUrl: "postgresql://tester:secret@test-db.example.net/laflabs_e2e",
    },
    {
      bypass: "decoded database name and reordered query",
      testDatabaseUrl: "postgresql://tester:secret@test-db.example.net/laflabs%5Fe2e?sslmode=require&channel_binding=require",
      databaseUrl: "postgresql://tester:secret@test-db.example.net/laflabs_e2e?channel_binding=require&sslmode=require",
    },
  ])("refuses the same database identity despite $bypass", ({
    testDatabaseUrl,
    databaseUrl,
  }) => {
    expect(() => validateE2eDatabaseEnvironment({
      testDatabaseUrl,
      databaseUrl,
      productionSiteUrl: "https://laflabs.co",
    })).toThrow("same database identity as DATABASE_URL")
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

  it("requires an explicit production database hostname in CI", () => {
    expect(() => validateE2eDatabaseEnvironment({
      testDatabaseUrl: "postgresql://tester:secret@test-db.example.net/laflabs_e2e",
      databaseUrl: undefined,
      productionSiteUrl: "https://laflabs.co",
      productionDatabaseHostname: undefined,
      ci: true,
    })).toThrow("E2E_PRODUCTION_DATABASE_HOSTNAME is required in CI")
  })

  it.each([
    {
      label: "production database hostname",
      productionSiteUrl: "https://laflabs.co",
      productionDatabaseHostname: "https://ep-production.neon.tech/path",
    },
    {
      label: "production site URL",
      productionSiteUrl: "not a valid production URL",
      productionDatabaseHostname: "ep-production.neon.tech",
    },
  ])("fails closed on malformed $label configuration", ({
    productionSiteUrl,
    productionDatabaseHostname,
  }) => {
    expect(() => validateE2eDatabaseEnvironment({
      testDatabaseUrl: "postgresql://tester:secret@test-db.example.net/laflabs_e2e",
      databaseUrl: undefined,
      productionSiteUrl,
      productionDatabaseHostname,
    })).toThrow("configured production")
  })

  it("fails closed on a malformed DATABASE_URL without exposing it", () => {
    const databaseUrl = "postgresql://production:do-not-print@bad host/laflabs"

    try {
      validateE2eDatabaseEnvironment({
        testDatabaseUrl: "postgresql://tester:secret@test-db.example.net/laflabs_e2e",
        databaseUrl,
        productionSiteUrl: "https://laflabs.co",
      })
      expect.unreachable("malformed DATABASE_URL should be rejected")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain("DATABASE_URL must be a valid PostgreSQL URL")
      expect((error as Error).message).not.toContain("do-not-print")
    }
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
