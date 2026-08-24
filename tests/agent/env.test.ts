import { afterEach, describe, expect, it, vi } from "vitest"

import { getAiSecurityEnv } from "@/lib/env"

const validEncryptionKey = Buffer.alloc(32, 7).toString("base64")
const validCookieSecret = "cookie-secret-that-is-long-enough-for-production"

afterEach(() => vi.unstubAllEnvs())

describe("getAiSecurityEnv", () => {
  it("parses AI secrets only when the AI boundary is called", () => {
    vi.stubEnv("AI_CREDENTIAL_ENCRYPTION_KEY", validEncryptionKey)
    vi.stubEnv("AI_COOKIE_SECRET", validCookieSecret)

    expect(getAiSecurityEnv()).toEqual({
      AI_CREDENTIAL_ENCRYPTION_KEY: validEncryptionKey,
      AI_COOKIE_SECRET: validCookieSecret,
    })
  })

  it.each([
    ["not-base64!", validCookieSecret],
    [Buffer.alloc(31, 7).toString("base64"), validCookieSecret],
    [validEncryptionKey, "too-short"],
    [validEncryptionKey, validEncryptionKey],
  ])("rejects insecure AI secret configuration without echoing it", (encryptionKey, cookieSecret) => {
    vi.stubEnv("AI_CREDENTIAL_ENCRYPTION_KEY", encryptionKey)
    vi.stubEnv("AI_COOKIE_SECRET", cookieSecret)

    let error: unknown
    try {
      getAiSecurityEnv()
    } catch (caught) {
      error = caught
    }

    expect(error).toBeInstanceOf(Error)
    expect(String(error)).not.toContain(encryptionKey)
    expect(String(error)).not.toContain(cookieSecret)
  })
})
