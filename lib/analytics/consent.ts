import type { ConsentChoice, ConsentState } from "@/lib/analytics/types"
import { matchVisitorToken } from "@/lib/analytics/identity"

export const CONSENT_POLICY_VERSION = "1"
export const CONSENT_COOKIE = "laf_consent"
export const VISITOR_COOKIE = "laf_visitor"
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180

export type ParsedConsentCookie = {
  version: typeof CONSENT_POLICY_VERSION
  choice: ConsentChoice
}

const isConsentChoice = (value: string): value is ConsentChoice => (
  value === "essential" || value === "analytics"
)

export const parseConsentCookie = (value: string | null | undefined): ParsedConsentCookie | null => {
  if (!value) return null

  const parts = value.split(":")
  if (parts.length !== 2) return null

  const [version, choice] = parts
  if (version !== CONSENT_POLICY_VERSION || !isConsentChoice(choice)) return null

  return { version, choice }
}

export const consentCookieValue = (choice: ConsentChoice): string => (
  `${CONSENT_POLICY_VERSION}:${choice}`
)

export const consentCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: CONSENT_MAX_AGE,
})

export function resolveInitialConsentState({
  consentCookie,
  visitorToken,
  dnt,
  currentSecret,
  previousSecret,
}: {
  consentCookie: string | null | undefined
  visitorToken: string | null | undefined
  dnt: boolean
  currentSecret: string
  previousSecret?: string
}): ConsentState {
  const savedChoice = parseConsentCookie(consentCookie)?.choice
  if (savedChoice !== "analytics") return savedChoice ?? "unknown"
  if (dnt) return "essential"

  const identity = matchVisitorToken(visitorToken, currentSecret, previousSecret)
  return identity.status === "current" || identity.status === "previous"
    ? "analytics"
    : "unknown"
}
