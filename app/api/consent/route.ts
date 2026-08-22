import { randomUUID } from "node:crypto"

import { cookies } from "next/headers"
import { z } from "zod"

import {
  CONSENT_COOKIE,
  VISITOR_COOKIE,
  consentCookieOptions,
  consentCookieValue,
} from "@/lib/analytics/consent"
import { createVisitorToken } from "@/lib/analytics/identity"
import { WithdrawalFailedError, applyConsentChoice } from "@/lib/analytics/service"
import { analyticsStore, type AnalyticsStore } from "@/lib/analytics/store"
import { getAnalyticsEnv } from "@/lib/env"
import { isSameOriginRequest } from "@/lib/http/same-origin"

export { isSameOriginRequest }

const consentRequestSchema = z.object({
  choice: z.enum(["essential", "analytics"]),
}).strict()

export async function handleConsent(
  request: Request,
  store: AnalyticsStore = analyticsStore,
) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 })
  }

  const parsed = consentRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const visitorToken = cookieStore.get(VISITOR_COOKIE)?.value ?? null

  try {
    const applied = await applyConsentChoice({
      requested: parsed.data.choice,
      dnt: request.headers.get("dnt") === "1",
      visitorToken,
    }, store)

    if (applied.choice === "essential") {
      if (visitorToken) cookieStore.delete(VISITOR_COOKIE)
    } else if (applied.createVisitor) {
      const visitorId = randomUUID()
      const token = createVisitorToken(visitorId, getAnalyticsEnv().ANALYTICS_HASH_SECRET)
      cookieStore.set(VISITOR_COOKIE, token, consentCookieOptions())
    }

    cookieStore.set(
      CONSENT_COOKIE,
      consentCookieValue(applied.choice),
      consentCookieOptions(),
    )

    return Response.json({
      choice: applied.choice,
      dntHonored: applied.dntHonored,
    })
  } catch (error) {
    if (error instanceof WithdrawalFailedError) {
      return Response.json({ error: "withdrawal_failed" }, { status: 503 })
    }
    throw error
  }
}

export async function POST(request: Request) {
  return handleConsent(request)
}
