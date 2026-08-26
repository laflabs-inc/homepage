import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

export type CredentialEnvelope = {
  ciphertext: string
  iv: string
  authTag: string
}

export class CredentialDecryptionError extends Error {
  constructor() {
    super("Unable to decrypt credential")
    this.name = "CredentialDecryptionError"
  }
}

export const encryptCredential = (plaintext: string, key: Buffer): CredentialEnvelope => {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 })

  return {
    ciphertext: Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]).toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  }
}

export const decryptCredential = (envelope: CredentialEnvelope, key: Buffer) => {
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64"), {
      authTagLength: 16,
    })
    decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"))

    return Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    throw new CredentialDecryptionError()
  }
}

export const credentialFingerprint = (plaintext: string) =>
  createHash("sha256").update(plaintext, "utf8").digest("hex").slice(0, 12)
