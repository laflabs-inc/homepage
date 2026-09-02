import { z } from "zod"

import { searchSite } from "@/lib/search/site-search"
import { documentStore } from "@/lib/documents/store"
import { locales, type Locale } from "@/lib/i18n"
import type { PublishedDocumentReader } from "@/lib/documents/cache"

import type { SiteSearchResponse } from "@/lib/search/types"

const searchQuerySchema = z.object({
  q: z.string()
    .transform((value) => value.trim())
    .refine((value) => Array.from(value).length >= 2)
    .refine((value) => Array.from(value).length <= 100),
  locale: z.enum(locales),
}).strict()

function errorResponse(error: "invalid_request" | "unavailable", status: number): Response {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  )
}

export async function handleSiteSearch(
  request: Request,
  repository: PublishedDocumentReader = documentStore,
): Promise<Response> {
  const parameters = new Map<string, string>()
  const url = new URL(request.url)
  for (const [key, value] of url.searchParams) {
    if (parameters.has(key)) return errorResponse("invalid_request", 400)
    parameters.set(key, value)
  }

  const parsed = searchQuerySchema.safeParse(Object.fromEntries(parameters))
  if (!parsed.success) return errorResponse("invalid_request", 400)

  try {
    const payload: SiteSearchResponse = await searchSite(
      parsed.data.q,
      parsed.data.locale as Locale,
      repository,
    )
    return Response.json(payload, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return errorResponse("unavailable", 503)
  }
}

export async function GET(request: Request): Promise<Response> {
  return handleSiteSearch(request)
}
