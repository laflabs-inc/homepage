import { describe, expect, it } from "vitest"
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  CONSENT_POLICY_VERSION,
  VISITOR_COOKIE,
  consentCookieOptions,
  consentCookieValue,
  parseConsentCookie,
} from "@/lib/analytics/consent"

describe("consent cookies", () => {
  it("parses the current version and an allowlisted choice", () => {
    expect(parseConsentCookie("1:analytics")).toEqual({ version: "1", choice: "analytics" })
  })

  it("treats wrong versions and malformed values as unknown", () => {
    expect(parseConsentCookie("0:analytics")).toBeNull()
    expect(parseConsentCookie("1:unknown")).toBeNull()
    expect(parseConsentCookie("garbage")).toBeNull()
  })

  it("serializes choices with the current policy version", () => {
    expect(consentCookieValue("essential")).toBe("1:essential")
    expect(consentCookieValue("analytics")).toBe("1:analytics")
  })

  it("exports the required cookie names and secure options", () => {
    expect(CONSENT_POLICY_VERSION).toBe("1")
    expect(CONSENT_COOKIE).toBe("laf_consent")
    expect(VISITOR_COOKIE).toBe("laf_visitor")
    expect(CONSENT_MAX_AGE).toBe(60 * 60 * 24 * 180)
    expect(consentCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CONSENT_MAX_AGE,
    })
  })
})
