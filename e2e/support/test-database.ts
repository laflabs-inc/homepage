const REFUSAL_PREFIX = "Playwright E2E refused"

export const E2E_ANALYTICS_HASH_SECRET =
  process.env.ANALYTICS_HASH_SECRET ?? "laflabs-e2e-only-analytics-hash-secret"

type E2eDatabaseEnvironment = {
  testDatabaseUrl: string | undefined
  databaseUrl: string | undefined
  productionSiteUrl: string | undefined
  productionDatabaseHostname?: string | undefined
  ci?: boolean
}

type DatabaseIdentity = {
  hostname: string
  port: string
  databaseName: string
}

function normalizeHostname(value: string): string {
  return value.toLowerCase().replace(/\.$/, "")
}

function invalidDatabaseUrl(name: "TEST_DATABASE_URL" | "DATABASE_URL"): never {
  throw new Error(`${REFUSAL_PREFIX}: ${name} must be a valid PostgreSQL URL.`)
}

function parsePostgresIdentity(
  value: string,
  name: "TEST_DATABASE_URL" | "DATABASE_URL",
): DatabaseIdentity {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return invalidDatabaseUrl(name)
  }

  if (
    (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") ||
    !parsed.hostname
  ) return invalidDatabaseUrl(name)

  const port = parsed.port || "5432"
  const portNumber = Number(port)
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65_535) {
    return invalidDatabaseUrl(name)
  }

  let databaseName: string
  try {
    databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""))
  } catch {
    return invalidDatabaseUrl(name)
  }
  if (!databaseName) return invalidDatabaseUrl(name)

  return {
    hostname: normalizeHostname(parsed.hostname),
    port: String(portNumber),
    databaseName,
  }
}

function parseProductionSiteHostname(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`${REFUSAL_PREFIX}: configured production site URL is missing.`)
  }

  try {
    const parsed = new URL(value)
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      (parsed.pathname && parsed.pathname !== "/")
    ) throw new Error("invalid production site URL")

    return normalizeHostname(parsed.hostname)
  } catch {
    throw new Error(`${REFUSAL_PREFIX}: configured production site URL is invalid.`)
  }
}

function parseProductionDatabaseHostname(value: string | undefined): string | null {
  const candidate = value?.trim()
  if (!candidate) return null

  try {
    const parsed = new URL(`https://${candidate}`)
    if (
      !parsed.hostname ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) throw new Error("invalid production database hostname")

    return normalizeHostname(parsed.hostname)
  } catch {
    throw new Error(`${REFUSAL_PREFIX}: configured production database hostname is invalid.`)
  }
}

function isSameDatabase(left: DatabaseIdentity, right: DatabaseIdentity): boolean {
  return left.hostname === right.hostname &&
    left.port === right.port &&
    left.databaseName === right.databaseName
}

function isSameOrSubdomain(hostname: string, protectedHostname: string): boolean {
  return hostname === protectedHostname || hostname.endsWith(`.${protectedHostname}`)
}

export function validateE2eDatabaseEnvironment({
  testDatabaseUrl,
  databaseUrl,
  productionSiteUrl,
  productionDatabaseHostname,
  ci = false,
}: E2eDatabaseEnvironment): string {
  const candidate = testDatabaseUrl?.trim()
  if (!candidate) {
    throw new Error(`${REFUSAL_PREFIX}: TEST_DATABASE_URL is required; use a migrated, isolated test database.`)
  }

  const testIdentity = parsePostgresIdentity(candidate, "TEST_DATABASE_URL")

  const configuredDatabase = databaseUrl?.trim()
  if (configuredDatabase) {
    const databaseIdentity = parsePostgresIdentity(configuredDatabase, "DATABASE_URL")
    if (isSameDatabase(testIdentity, databaseIdentity)) {
      throw new Error(`${REFUSAL_PREFIX}: TEST_DATABASE_URL has the same database identity as DATABASE_URL.`)
    }
  }

  const productionDatabaseHost = parseProductionDatabaseHostname(productionDatabaseHostname)
  if (ci && !productionDatabaseHost) {
    throw new Error(`${REFUSAL_PREFIX}: E2E_PRODUCTION_DATABASE_HOSTNAME is required in CI.`)
  }

  const protectedHostnames = [
    parseProductionSiteHostname(productionSiteUrl),
    productionDatabaseHost,
  ].filter((hostname): hostname is string => Boolean(hostname))

  if (protectedHostnames.some((hostname) => isSameOrSubdomain(testIdentity.hostname, hostname))) {
    throw new Error(`${REFUSAL_PREFIX}: TEST_DATABASE_URL matches a configured production hostname.`)
  }

  return candidate
}
