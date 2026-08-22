type OriginEnvironment = {
  NEXT_PUBLIC_SITE_URL?: string | undefined
  AUTH_URL?: string | undefined
  VERCEL_URL?: string | undefined
}

const LOOPBACK_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"] as const
const EXACT_ORIGIN_PATTERN = /^https?:\/\/[^/?#]+\/?$/
const FORBIDDEN_ORIGIN_CHARACTERS = /[,@\\\s]/
const VERCEL_HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+vercel\.app$/

function parseExactOrigin(value: string): string | null {
  if (
    value !== value.trim() ||
    !EXACT_ORIGIN_PATTERN.test(value) ||
    FORBIDDEN_ORIGIN_CHARACTERS.test(value)
  ) return null

  const rawOrigin = value.endsWith("/") ? value.slice(0, -1) : value

  try {
    const parsed = new URL(value)
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash ||
      parsed.origin !== rawOrigin
    ) return null

    return parsed.origin
  } catch {
    return null
  }
}

function parseVercelOrigin(value: string): string | null {
  if (!VERCEL_HOSTNAME_PATTERN.test(value)) return null
  const rawOrigin = `https://${value}`

  try {
    const parsed = new URL(rawOrigin)
    if (
      !parsed.hostname ||
      parsed.hostname !== value ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash ||
      parsed.origin !== rawOrigin
    ) return null

    return parsed.origin
  } catch {
    return null
  }
}

function controlledOrigins(environment: OriginEnvironment): Set<string> | null {
  const origins = new Set<string>()

  for (const value of [environment.NEXT_PUBLIC_SITE_URL, environment.AUTH_URL]) {
    if (value === undefined || value === "") continue
    const origin = parseExactOrigin(value)
    if (!origin) return null
    origins.add(origin)
  }

  const vercelUrl = environment.VERCEL_URL
  if (vercelUrl !== undefined && vercelUrl !== "") {
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

function requestOrigins(
  request: Request,
  environment: OriginEnvironment,
): Set<string> | null {
  const origins = controlledOrigins(environment)
  if (!origins) return null

  let requestUrl: URL
  try {
    requestUrl = new URL(request.url)
  } catch {
    return null
  }
  if (requestUrl.protocol !== "http:" && requestUrl.protocol !== "https:") return null

  origins.add(requestUrl.origin)
  addLoopbackAliases(origins, requestUrl)
  return origins
}

const runtimeOriginEnvironment = (): OriginEnvironment => ({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  AUTH_URL: process.env.AUTH_URL,
  VERCEL_URL: process.env.VERCEL_URL,
})

export function isSameOriginRequest(
  request: Request,
  environment: OriginEnvironment = runtimeOriginEnvironment(),
): boolean {
  const origins = requestOrigins(request, environment)
  if (!origins) return false

  const originHeader = request.headers.get("origin")
  if (originHeader === null) return true

  const origin = parseExactOrigin(originHeader)
  return origin !== null && origins.has(origin)
}

export function trustedRequestHostnames(
  request: Request,
  environment: OriginEnvironment = runtimeOriginEnvironment(),
): string[] {
  const origins = requestOrigins(request, environment)
  if (!origins) return []

  return [...new Set([...origins].map((origin) => new URL(origin).hostname.toLowerCase()))]
}
