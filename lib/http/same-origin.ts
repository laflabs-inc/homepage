type OriginEnvironment = {
  NEXT_PUBLIC_SITE_URL?: string | undefined
  AUTH_URL?: string | undefined
  VERCEL_URL?: string | undefined
}

const LOOPBACK_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"] as const

function parseExactOrigin(value: string): string | null {
  try {
    const parsed = new URL(value.trim())
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) return null

    return parsed.origin
  } catch {
    return null
  }
}

function parseVercelOrigin(value: string): string | null {
  const candidate = value.trim()
  if (!candidate || candidate.includes(":")) return null

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
    ) return null

    return parsed.origin
  } catch {
    return null
  }
}

function controlledOrigins(environment: OriginEnvironment): Set<string> | null {
  const origins = new Set<string>()

  for (const value of [environment.NEXT_PUBLIC_SITE_URL, environment.AUTH_URL]) {
    if (value === undefined || value.trim() === "") continue
    const origin = parseExactOrigin(value)
    if (!origin) return null
    origins.add(origin)
  }

  const vercelUrl = environment.VERCEL_URL
  if (vercelUrl !== undefined && vercelUrl.trim() !== "") {
    const origin = parseVercelOrigin(vercelUrl)
    if (!origin) return null
    origins.add(origin)
  }

  return origins
}

function addLoopbackAliases(origins: Set<string>, requestUrl: URL): void {
  if (!LOOPBACK_HOSTNAMES.includes(requestUrl.hostname as typeof LOOPBACK_HOSTNAMES[number])) {
    return
  }

  const port = requestUrl.port ? `:${requestUrl.port}` : ""
  for (const hostname of LOOPBACK_HOSTNAMES) {
    origins.add(`${requestUrl.protocol}//${hostname}${port}`)
  }
}

export function isSameOriginRequest(
  request: Request,
  environment: OriginEnvironment = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    AUTH_URL: process.env.AUTH_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  },
): boolean {
  const origins = controlledOrigins(environment)
  if (!origins) return false

  let requestUrl: URL
  try {
    requestUrl = new URL(request.url)
  } catch {
    return false
  }
  if (requestUrl.protocol !== "http:" && requestUrl.protocol !== "https:") return false

  origins.add(requestUrl.origin)
  addLoopbackAliases(origins, requestUrl)

  const originHeader = request.headers.get("origin")
  if (originHeader === null) return true

  const origin = parseExactOrigin(originHeader)
  return origin !== null && origins.has(origin)
}
