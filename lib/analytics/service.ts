import "server-only"

import type { ConsentChoice } from "@/lib/analytics/types"
import { parseConsentCookie } from "@/lib/analytics/consent"
import {
  hashAnalyticsId,
  matchVisitorToken,
  type VisitorTokenMatch,
} from "@/lib/analytics/identity"
import {
  AnalyticsBatchSchema,
  normalizeDeviceCategory,
  normalizePath,
  normalizeReferrerHost,
} from "@/lib/analytics/normalize"
import { analyticsStore, type AnalyticsStore } from "@/lib/analytics/store"
import { getAnalyticsEnv } from "@/lib/env"

const FIVE_MINUTES_MS = 5 * 60 * 1000
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

export type AnalyticsRequestContext = {
  consentCookie: string | null
  visitorToken: string | null
  userAgent: string | null
  siteHostnames: readonly string[]
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

type MatchedVisitorIdentity = Extract<VisitorTokenMatch, { visitorId: string }>

function isMatchedVisitor(identity: VisitorTokenMatch): identity is MatchedVisitorIdentity {
  return "visitorId" in identity
}

function matchedSecret(
  identity: MatchedVisitorIdentity,
  currentSecret: string,
  previousSecret?: string,
): string {
  if (identity.status === "current") return currentSecret
  if (!previousSecret) throw new Error("Previous analytics secret is unavailable")
  return previousSecret
}

async function withdrawMatchedVisitor(
  identity: MatchedVisitorIdentity,
  currentSecret: string,
  previousSecret: string | undefined,
  store: AnalyticsStore,
): Promise<void> {
  const secret = matchedSecret(identity, currentSecret, previousSecret)
  await store.withdrawVisitorAnalytics(hashAnalyticsId(identity.visitorId, secret))
}

export async function deleteVisitorEventsByToken(
  visitorToken: string,
  store: AnalyticsStore = analyticsStore,
): Promise<boolean> {
  try {
    const environment = getAnalyticsEnv()
    const identity = matchVisitorToken(
      visitorToken,
      environment.ANALYTICS_HASH_SECRET,
      environment.ANALYTICS_HASH_SECRET_PREVIOUS,
    )
    if (!isMatchedVisitor(identity)) return false

    await withdrawMatchedVisitor(
      identity,
      environment.ANALYTICS_HASH_SECRET,
      environment.ANALYTICS_HASH_SECRET_PREVIOUS,
      store,
    )
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
  if (!context.visitorToken) return { status: "ignored", accepted: 0 }

  let environment: ReturnType<typeof getAnalyticsEnv>
  try {
    environment = getAnalyticsEnv()
  } catch {
    return { status: "unavailable", accepted: 0 }
  }

  const identity = matchVisitorToken(
    context.visitorToken,
    environment.ANALYTICS_HASH_SECRET,
    environment.ANALYTICS_HASH_SECRET_PREVIOUS,
  )
  if (!isMatchedVisitor(identity)) {
    return { status: "ignored", accepted: 0 }
  }
  const secret = matchedSecret(
    identity,
    environment.ANALYTICS_HASH_SECRET,
    environment.ANALYTICS_HASH_SECRET_PREVIOUS,
  )

  const batch = AnalyticsBatchSchema.safeParse(input)
  if (!batch.success) return { status: "invalid", accepted: 0 }

  const now = new Date(context.now)
  const visitorHash = hashAnalyticsId(identity.visitorId, secret)
  const deviceCategory = normalizeDeviceCategory(context.userAgent)
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
      referrerHost: event.type === "page_view"
        ? normalizeReferrerHost(event.referrerHost, context.siteHostnames)
        : null,
      occurredAt,
      receivedAt: now,
    }
  })
  const minute = new Date(Math.floor(now.getTime() / 60_000) * 60_000)

  try {
    const stored = await store.collectEvents(visitorHash, minute, events)
    if (stored.status === "guarded") return { status: "ignored", accepted: 0 }
    if (stored.status === "rate_limited") return { status: "rate_limited", accepted: 0 }
    return { status: "accepted", accepted: stored.accepted }
  } catch {
    return { status: "unavailable", accepted: 0 }
  }
}

export async function deleteExpiredAnalytics(
  now: Date,
  store: AnalyticsStore = analyticsStore,
): Promise<{ events: number; windows: number }> {
  return store.deleteBefore(new Date(now.getTime() - NINETY_DAYS_MS), now)
}

export async function applyConsentChoice(
  { requested, dnt, visitorToken }: ApplyConsentInput,
  store: AnalyticsStore = analyticsStore,
): Promise<AppliedConsent> {
  const dntHonored = dnt && requested === "analytics"
  const choice: ConsentChoice = dntHonored ? "essential" : requested

  if (!visitorToken) {
    return {
      choice,
      dntHonored,
      createVisitor: choice === "analytics",
    }
  }

  let environment: ReturnType<typeof getAnalyticsEnv>
  let identity: VisitorTokenMatch
  try {
    environment = getAnalyticsEnv()
    identity = matchVisitorToken(
      visitorToken,
      environment.ANALYTICS_HASH_SECRET,
      environment.ANALYTICS_HASH_SECRET_PREVIOUS,
    )
  } catch (cause) {
    throw new WithdrawalFailedError({ cause })
  }

  const mustDelete = isMatchedVisitor(identity) && (
    choice === "essential" || identity.status === "previous"
  )
  if (mustDelete && isMatchedVisitor(identity)) {
    try {
      await withdrawMatchedVisitor(
        identity,
        environment.ANALYTICS_HASH_SECRET,
        environment.ANALYTICS_HASH_SECRET_PREVIOUS,
        store,
      )
    } catch (cause) {
      throw new WithdrawalFailedError({ cause })
    }
  }

  return {
    choice,
    dntHonored,
    createVisitor: choice === "analytics" && identity.status !== "current",
  }
}
