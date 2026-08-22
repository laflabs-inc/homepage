import { createHmac, timingSafeEqual } from "node:crypto"

const BASE64URL_SEGMENT = /^[A-Za-z0-9_-]+$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const encodeBase64Url = (value: string | Buffer): string => Buffer.from(value).toString("base64url")

const decodeBase64Url = (value: string): Buffer | null => {
  if (!value || !BASE64URL_SEGMENT.test(value)) return null

  const decoded = Buffer.from(value, "base64url")
  if (!decoded.length || decoded.toString("base64url") !== value) return null

  return decoded
}

export const createVisitorToken = (visitorId: string, secret: string): string => {
  if (!UUID.test(visitorId)) throw new TypeError("visitorId must be a UUID")

  const payload = encodeBase64Url(visitorId)
  const signature = createHmac("sha256", secret).update(payload).digest()
  return `${payload}.${encodeBase64Url(signature)}`
}

export const verifyVisitorToken = (token: string | null | undefined, secret: string): string | null => {
  if (!token) return null

  const segments = token.split(".")
  if (segments.length !== 2) return null

  const [payloadSegment, signatureSegment] = segments
  const payload = decodeBase64Url(payloadSegment)
  const signature = decodeBase64Url(signatureSegment)
  if (!payload || !signature) return null

  const expectedSignature = createHmac("sha256", secret).update(payloadSegment).digest()
  if (signature.length !== expectedSignature.length) return null
  if (!timingSafeEqual(signature, expectedSignature)) return null

  const visitorId = payload.toString("utf8")
  if (!visitorId || !Buffer.from(visitorId, "utf8").equals(payload)) return null
  if (!UUID.test(visitorId)) return null

  return visitorId
}

export const hashAnalyticsId = (value: string, secret: string): string => (
  createHmac("sha256", secret).update(`analytics-id:${value}`).digest("hex")
)
