const REFUSAL_PREFIX = "Playwright E2E refused"

export const E2E_ANALYTICS_HASH_SECRET =
  process.env.ANALYTICS_HASH_SECRET ?? "laflabs-e2e-only-analytics-hash-secret"

type E2eDatabaseEnvironment = {
  testDatabaseUrl: string | undefined
  databaseUrl: string | undefined
  productionSiteUrl: string | undefined
  productionDatabaseHostname?: string | undefined
}

function parsePostgresUrl(value: string): URL | null {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "postgres:" || parsed.protocol === "postgresql:"
      ? parsed
      : null
  } catch {
    return null
  }
}

function parseHostname(value: string | undefined): string | null {
  if (!value?.trim()) return null

  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return value.trim().toLowerCase().replace(/^\.+|\.+$/g, "") || null
  }
}

function isSameOrSubdomain(hostname: string, protectedHostname: string): boolean {
  return hostname === protectedHostname || hostname.endsWith(`.${protectedHostname}`)
}

export function validateE2eDatabaseEnvironment({
  testDatabaseUrl,
  databaseUrl,
  productionSiteUrl,
  productionDatabaseHostname,
}: E2eDatabaseEnvironment): string {
  const candidate = testDatabaseUrl?.trim()
  if (!candidate) {
    throw new Error(`${REFUSAL_PREFIX}: TEST_DATABASE_URL is required; use a migrated, isolated test database.`)
  }

  const parsedTestUrl = parsePostgresUrl(candidate)
  if (!parsedTestUrl) {
    throw new Error(`${REFUSAL_PREFIX}: TEST_DATABASE_URL must be a valid PostgreSQL URL.`)
  }

  const configuredDatabase = databaseUrl?.trim()
  if (configuredDatabase) {
    const parsedDatabaseUrl = parsePostgresUrl(configuredDatabase)
    if (parsedDatabaseUrl?.href === parsedTestUrl.href) {
      throw new Error(`${REFUSAL_PREFIX}: TEST_DATABASE_URL must not equal DATABASE_URL.`)
    }
  }

  const protectedHostnames = [
    parseHostname(productionSiteUrl),
    parseHostname(productionDatabaseHostname),
  ].filter((hostname): hostname is string => Boolean(hostname))

  const testHostname = parsedTestUrl.hostname.toLowerCase()
  if (protectedHostnames.some((hostname) => isSameOrSubdomain(testHostname, hostname))) {
    throw new Error(`${REFUSAL_PREFIX}: TEST_DATABASE_URL matches a configured production hostname.`)
  }

  return candidate
}
