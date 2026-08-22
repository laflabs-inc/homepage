import { describe, expect, it } from "vitest"
import { createVisitorToken, hashAnalyticsId, verifyVisitorToken } from "@/lib/analytics/identity"

const secret = "test-secret-that-is-long-enough-for-hmac"

describe("signed visitor identity", () => {
  it("round-trips a signed visitor identifier", () => {
    const token = createVisitorToken("visitor-id", secret)

    expect(verifyVisitorToken(token, secret)).toBe("visitor-id")
  })

  it("rejects a token whose signature is changed", () => {
    const token = createVisitorToken("visitor-id", secret)

    expect(verifyVisitorToken(`${token}x`, secret)).toBeNull()
  })

  it("rejects malformed and non-UUID visitor payloads", () => {
    expect(verifyVisitorToken("missing-separator", secret)).toBeNull()
    expect(verifyVisitorToken("%%%.__", secret)).toBeNull()
  })

  it("hashes an analytics identifier with a stable one-way digest", () => {
    expect(hashAnalyticsId("visitor-id", secret)).not.toContain("visitor-id")
    expect(hashAnalyticsId("visitor-id", secret)).toBe(hashAnalyticsId("visitor-id", secret))
  })
})
