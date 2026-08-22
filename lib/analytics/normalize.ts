import { z } from "zod"

import { products, repositories } from "@/lib/content"

export const eventTypes = [
  "page_view",
  "product_click",
  "github_click",
  "contact_click",
  "locale_change",
  "consent_update",
] as const

export type AnalyticsEventType = (typeof eventTypes)[number]
export type AnalyticsLocale = "ko" | "en"
export type DeviceCategory = "desktop" | "mobile" | "tablet" | "unknown"

const productIds = new Set<string>(products.map(({ id }) => id))
const githubTargets = new Set<string>([
  "laflabs-inc",
  ...repositories.map(({ name }) => name),
])
const publicPaths = new Set(["/"])

const hasValidTarget = (type: AnalyticsEventType, targetId: string | null): boolean => {
  switch (type) {
    case "page_view":
      return targetId === null
    case "product_click":
      return targetId !== null && productIds.has(targetId)
    case "github_click":
      return targetId !== null && githubTargets.has(targetId)
    case "contact_click":
      return targetId === "email"
    case "locale_change":
      return targetId === "ko" || targetId === "en"
    case "consent_update":
      return targetId === "analytics"
  }
}

export const AnalyticsEventInputSchema = z.object({
  eventId: z.string().uuid(),
  sessionId: z.string().uuid(),
  type: z.enum(eventTypes),
  pathname: z.string().max(256),
  targetId: z.string().max(80).nullable(),
  locale: z.enum(["ko", "en"]),
  occurredAt: z.string().datetime(),
}).strict().superRefine((event, context) => {
  if (!hasValidTarget(event.type, event.targetId)) {
    context.addIssue({
      code: "custom",
      path: ["targetId"],
      message: "Target is not valid for this event type",
    })
  }
})

export const AnalyticsBatchSchema = z.object({
  events: z.array(AnalyticsEventInputSchema).min(1).max(20),
}).strict()

export type AnalyticsEventInput = z.infer<typeof AnalyticsEventInputSchema>

export function normalizePath(value: string): string {
  try {
    const pathname = new URL(value, "https://analytics.invalid").pathname
    return publicPaths.has(pathname) ? pathname : "/"
  } catch {
    return "/"
  }
}

export function normalizeReferrer(value: string | null | undefined): string | null {
  if (!value) return null

  try {
    const hostname = new URL(value).hostname.toLowerCase()
    const ipCandidate = hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ipCandidate) || ipCandidate.includes(":")) {
      return null
    }
    return hostname || null
  } catch {
    return null
  }
}

export function normalizeLocale(value: string | null | undefined): AnalyticsLocale {
  return value === "ko" ? "ko" : "en"
}

export function normalizeDeviceCategory(userAgent: string | null | undefined): DeviceCategory {
  if (!userAgent) return "unknown"

  if (/ipad|tablet|kindle|silk|(android(?!.*mobile))/i.test(userAgent)) return "tablet"
  if (/mobile|iphone|ipod|android|windows phone/i.test(userAgent)) return "mobile"
  if (/windows nt|macintosh|x11|linux|cros/i.test(userAgent)) return "desktop"
  return "unknown"
}
