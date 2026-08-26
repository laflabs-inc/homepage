import { timingSafeEqual } from "node:crypto"

import { getCronEnv } from "@/lib/env"

export function hasValidCronBearer(authorization: string | null, secret: string): boolean {
  if (!authorization) return false

  const expected = Buffer.from(`Bearer ${secret}`, "utf8")
  const received = Buffer.from(authorization, "utf8")
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export function authorizeCronRequest(request: Request): boolean {
  try {
    return hasValidCronBearer(
      request.headers.get("authorization"),
      getCronEnv().CRON_SECRET,
    )
  } catch {
    return false
  }
}
