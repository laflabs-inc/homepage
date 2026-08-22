import { cookies } from "next/headers"

import { CONSENT_COOKIE, VISITOR_COOKIE, parseConsentCookie } from "@/lib/analytics/consent"
import { matchVisitorToken } from "@/lib/analytics/identity"
import { collectAnalyticsBatch } from "@/lib/analytics/service"
import { analyticsStore, type AnalyticsStore } from "@/lib/analytics/store"
import { getAnalyticsEnv } from "@/lib/env"
import { isSameOriginRequest, trustedRequestHostnames } from "@/lib/http/same-origin"

const MAX_BODY_BYTES = 16 * 1024

const emptyResponse = (status: number): Response => new Response(null, { status })

export async function handleAnalyticsEvents(
  request: Request,
  store: AnalyticsStore = analyticsStore,
): Promise<Response> {
  if (!isSameOriginRequest(request)) return emptyResponse(403)
  if (request.headers.get("dnt") === "1") return emptyResponse(204)

  let consentCookie: string | null
  let visitorToken: string | null
  try {
    const cookieStore = await cookies()
    consentCookie = cookieStore.get(CONSENT_COOKIE)?.value ?? null
    visitorToken = cookieStore.get(VISITOR_COOKIE)?.value ?? null
  } catch {
    return emptyResponse(503)
  }

  if (parseConsentCookie(consentCookie)?.choice !== "analytics") return emptyResponse(204)
  if (!visitorToken) return emptyResponse(204)

  try {
    const environment = getAnalyticsEnv()
    const identity = matchVisitorToken(
      visitorToken,
      environment.ANALYTICS_HASH_SECRET,
      environment.ANALYTICS_HASH_SECRET_PREVIOUS,
    )
    if (identity.status === "absent" || identity.status === "invalid") {
      return emptyResponse(204)
    }
  } catch {
    return emptyResponse(503)
  }

  const contentLengthHeader = request.headers.get("content-length")
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader)
    if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > MAX_BODY_BYTES) {
      return emptyResponse(400)
    }
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase()
  if (contentType !== "application/json") return emptyResponse(400)

  let body: unknown
  try {
    const raw = await request.text()
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return emptyResponse(400)
    body = JSON.parse(raw)
  } catch {
    return emptyResponse(400)
  }

  const result = await collectAnalyticsBatch(body, {
    consentCookie,
    visitorToken,
    userAgent: request.headers.get("user-agent"),
    siteHostnames: trustedRequestHostnames(request),
    now: new Date(),
  }, store)

  switch (result.status) {
    case "accepted":
    case "ignored":
      return emptyResponse(204)
    case "invalid":
      return emptyResponse(400)
    case "rate_limited":
      return emptyResponse(429)
    case "unavailable":
      return emptyResponse(503)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    return await handleAnalyticsEvents(request)
  } catch {
    return emptyResponse(503)
  }
}
