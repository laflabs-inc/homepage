import "server-only"

import type { ConsentChoice } from "@/lib/analytics/types"
import { hashAnalyticsId, verifyVisitorToken } from "@/lib/analytics/identity"
import { analyticsStore, type AnalyticsStore } from "@/lib/analytics/store"
import { getAnalyticsEnv } from "@/lib/env"

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
  const secret = getAnalyticsEnv().ANALYTICS_HASH_SECRET
  const visitorId = verifyVisitorToken(visitorToken, secret)
  if (!visitorId) return false

  await store.deleteVisitorEvents(hashAnalyticsId(visitorId, secret))
  return true
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
