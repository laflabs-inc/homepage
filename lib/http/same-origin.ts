export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (origin === null) return true

  const internalOrigin = new URL(request.url).origin
  if (origin === internalOrigin) return true

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",", 1)[0].trim()
  const host = forwardedHost || request.headers.get("host")
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",", 1)[0].trim()
  const protocol = forwardedProtocol || new URL(request.url).protocol.replace(/:$/, "")
  if (!host || (protocol !== "http" && protocol !== "https")) return false

  try {
    const externalUrl = new URL(`${protocol}://${host}`)
    if (
      externalUrl.username ||
      externalUrl.password ||
      externalUrl.pathname !== "/" ||
      externalUrl.search ||
      externalUrl.hash
    ) return false

    return origin === externalUrl.origin
  } catch {
    return false
  }
}
