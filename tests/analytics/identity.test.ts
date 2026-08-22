import { createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  createVisitorToken,
  hashAnalyticsId,
  matchVisitorToken,
  verifyVisitorToken,
} from "@/lib/analytics/identity"

const secret = "test-secret-that-is-long-enough-for-hmac"
const previousSecret = "previous-secret-that-is-long-enough-hmac"
const visitorId = "8f5c5c8b-54cf-4de1-9a16-4be9b8c0e3d7"

const encodeBase64Url = (value: string | Buffer): string => Buffer.from(value).toString("base64url")

const signedPayload = (value: string): string => {
  const payload = encodeBase64Url(value)
  const signature = createHmac("sha256", secret).update(payload).digest()
  return `${payload}.${encodeBase64Url(signature)}`
}

describe("signed visitor identity", () => {
  it("round-trips a signed visitor identifier", () => {
    const token = createVisitorToken(visitorId, secret)

    expect(verifyVisitorToken(token, secret)).toBe(visitorId)
  })

  it("rejects a token whose signature is changed", () => {
    const token = createVisitorToken(visitorId, secret)

    expect(verifyVisitorToken(`${token}x`, secret)).toBeNull()
  })

  it("rejects malformed visitor tokens", () => {
    expect(verifyVisitorToken("missing-separator", secret)).toBeNull()
    expect(verifyVisitorToken("%%%.__", secret)).toBeNull()
  })

  it("distinguishes absent, current, previous, and invalid visitor tokens", () => {
    expect(matchVisitorToken(null, secret, previousSecret)).toEqual({ status: "absent" })
    expect(matchVisitorToken(createVisitorToken(visitorId, secret), secret, previousSecret)).toEqual({
      status: "current",
      visitorId,
    })
    expect(matchVisitorToken(createVisitorToken(visitorId, previousSecret), secret, previousSecret)).toEqual({
      status: "previous",
      visitorId,
    })
    expect(matchVisitorToken("invalid-token", secret, previousSecret)).toEqual({ status: "invalid" })
  })

  it("does not treat a previous-key token as valid when no previous key is configured", () => {
    const token = createVisitorToken(visitorId, previousSecret)

    expect(matchVisitorToken(token, secret)).toEqual({ status: "invalid" })
  })

  it("rejects a correctly signed non-UUID payload", () => {
    expect(verifyVisitorToken(signedPayload("visitor-id"), secret)).toBeNull()
    expect(() => createVisitorToken("visitor-id", secret)).toThrow(/UUID/)
  })

  it("hashes an analytics identifier with a stable one-way digest", () => {
    expect(hashAnalyticsId("visitor-id", secret)).not.toContain("visitor-id")
    expect(hashAnalyticsId("visitor-id", secret)).toBe(hashAnalyticsId("visitor-id", secret))
  })
})
