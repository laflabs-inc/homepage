import { randomBytes } from "node:crypto"
import { describe, expect, it } from "vitest"

import {
  CredentialDecryptionError,
  credentialFingerprint,
  decryptCredential,
  encryptCredential,
} from "@/lib/agent/crypto"

describe("credential encryption", () => {
  const key = randomBytes(32)

  it("round-trips a credential through AES-256-GCM", () => {
    expect(decryptCredential(encryptCredential("sk-test-value", key), key)).toBe("sk-test-value")
  })

  it("uses a fresh 96-bit IV for every encryption", () => {
    expect(encryptCredential("same", key).iv).not.toBe(encryptCredential("same", key).iv)
  })

  it("normalizes authentication failures without crypto details", () => {
    const encrypted = encryptCredential("sk-test-value", key)

    expect(() => decryptCredential(encrypted, randomBytes(32))).toThrow(CredentialDecryptionError)
    expect(() => decryptCredential(encrypted, randomBytes(32))).toThrow(/decrypt/i)
  })

  it("returns a stable, non-secret fingerprint", () => {
    expect(credentialFingerprint("sk-one")).toMatch(/^[a-f0-9]{12}$/)
    expect(credentialFingerprint("sk-one")).toBe(credentialFingerprint("sk-one"))
  })
})
