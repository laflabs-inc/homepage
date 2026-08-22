import "server-only"

import type { ConsentChoice } from "@/lib/analytics/types"
import { parseConsentCookie } from "@/lib/analytics/consent"
import { hashAnalyticsId, verifyVisitorToken } from "@/lib/analytics/identity"
import {
  AnalyticsBatchSchema,
  normalizeDeviceCategory,
  normalizePath,
  normalizeReferrer,
} from "@/lib/analytics/normalize"
import { analyticsStore, type AnalyticsStore } from "@/lib/analytics/store"
import { getAnalyticsEnv } from "@/lib/env"

const FIVE_MINUTES_MS = 5 * 60 * 1000
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

export type AnalyticsRequestContext = {
  consentCookie: string | null
  visitorToken: string | null
  userAgent: string | null
  referrer: string | null
  now: Date
}

export type AnalyticsCollectionResult = {
  status: "accepted" | "ignored" | "invalid" | "rate_limited" | "unavailable"
  accepted: number
}

type ApplyConsentInput = {
  requested: ConsentChoice
  dnt: boolean
  visitorToken: string | null
}

type AppliedConsent = {
  choice: ConsentChoice
  dntHonored: boolean
  createVisitor: boolean
}

export class WithdrawalFailedError extends Error {
  constructor(options?: ErrorOptions) {
    super("Analytics withdrawal could not be completed", options)
    this.name = "WithdrawalFailedError"
  }
}

export async function deleteVisitorEventsByToken(
  visitorToken: string,
  store: AnalyticsStore = analyticsStore,
): Promise<boolean> {
  try {
    const secret = getAnalyticsEnv().ANALYTICS_HASH_SECRET
    const visitorId = verifyVisitorToken(visitorToken, secret)
    if (!visitorId) return false

    await store.deleteVisitorEvents(hashAnalyticsId(visitorId, secret))
    return true
  } catch {
    return false
  }
}

export async function collectAnalyticsBatch(
  input: unknown,
  context: AnalyticsRequestContext,
  store: AnalyticsStore = analyticsStore,
): Promise<AnalyticsCollectionResult> {
  const consent = parseConsentCookie(context.consentCookie)
  if (consent?.choice !== "analytics") return { status: "ignored", accepted: 0 }

  let secret: string
  try {
    secret = getAnalyticsEnv().ANALYTICS_HASH_SECRET
  } catch {
    return { status: "unavailable", accepted: 0 }
  }

  const visitorId = verifyVisitorToken(context.visitorToken, secret)
  if (!visitorId) return { status: "ignored", accepted: 0 }

  const batch = AnalyticsBatchSchema.safeParse(input)
  if (!batch.success) return { status: "invalid", accepted: 0 }

  const now = new Date(context.now)
  const visitorHash = hashAnalyticsId(visitorId, secret)
  const deviceCategory = normalizeDeviceCategory(context.userAgent)
  const referrerHost = normalizeReferrer(context.referrer)
  const events = batch.data.events.map((event) => {
    const clientTime = new Date(event.occurredAt)
    const occurredAt = Math.abs(clientTime.getTime() - now.getTime()) > FIVE_MINUTES_MS
      ? now
      : clientTime

    return {
      eventId: event.eventId,
      visitorHash,
      sessionHash: hashAnalyticsId(`session:${event.sessionId}`, secret),
      eventType: event.type,
      pathname: normalizePath(event.pathname),
      targetId: event.targetId,
      locale: event.locale,
      deviceCategory,
      referrerHost,
      occurredAt,
      receivedAt: now,
    }
  })
  const minute = new Date(Math.floor(now.getTime() / 60_000) * 60_000)

  try {
    const allowed = await store.consumeRateWindow(visitorHash, minute, events.length)
    if (!allowed) return { status: "rate_limited", accepted: 0 }

    const accepted = await store.insertEvents(events)
    return { status: "accepted", accepted }
  } catch {
    return { status: "unavailable", accepted: 0 }
  }
}

export async function deleteExpiredAnalytics(
  now: Date,
  store: AnalyticsStore = analyticsStore,
): Promise<{ events: number; windows: number }> {
  return store.deleteBefore(new Date(now.getTime() - NINETY_DAYS_MS))
}

export async function applyConsentChoice(
  { requested, dnt, visitorToken }: ApplyConsentInput,
  store: AnalyticsStore = analyticsStore,
): Promise<AppliedConsent> {
  const dntHonored = dnt && requested === "analytics"
  const choice: ConsentChoice = dntHonored ? "essential" : requested

  if (choice === "essential" && visitorToken) {
    try {
      const deleted = await deleteVisitorEventsByToken(visitorToken, store)
      if (!deleted) throw new Error("Invalid visitor token")
    } catch (cause) {
      throw new WithdrawalFailedError({ cause })
    }
  }

  return {
    choice,
    dntHonored,
    createVisitor: choice === "analytics" && !visitorToken,
  }
}
