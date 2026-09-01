import { createHash } from "node:crypto"

import { z } from "zod"

import { documentCategoryStore } from "@/lib/document-categories/store"
import {
  listPublishedDocumentCategories,
  listPublishedDocuments,
  type PublishedCategoryReader,
  type PublishedDocumentReader,
} from "@/lib/documents/cache"
import { documentStore } from "@/lib/documents/store"
import { documentKinds, documentLocales, type PublishedDocument } from "@/lib/documents/types"
import { decodePublishedCursor, encodePublishedCursor } from "@/lib/http/cursor"

const cacheControl = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"

const listQuerySchema = z.object({
  kind: z.enum(documentKinds),
  locale: z.enum(documentLocales),
  category: z.string().min(1).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  sort: z.enum(["latest", "oldest"]).default("latest"),
  q: z.string()
    .transform((value) => value.trim())
    .refine((value) => Array.from(value).length <= 100)
    .transform((value) => value || undefined)
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(512).optional(),
}).strict()

function listItem(document: PublishedDocument) {
  return {
    id: document.id,
    kind: document.kind,
    locale: document.locale,
    slug: document.slug,
    category: document.category,
    pinned: document.pinned,
    revision: document.revision,
    title: document.title,
    summary: document.summary,
    effectiveAt: document.effectiveAt?.toISOString() ?? null,
    publishedAt: document.publishedAt.toISOString(),
  }
}

function responseWithEtag(request: Request, body: unknown, responseCacheControl = cacheControl): Response {
  const json = JSON.stringify(body)
  const etag = `"${createHash("sha256").update(json).digest("hex")}"`
  const headers = { "Cache-Control": responseCacheControl, ETag: etag }
  const validators = request.headers.get("if-none-match")
  const matches = validators?.trim() === "*" || validators?.split(",").some((validator) => (
    validator.trim().replace(/^W\//, "") === etag
  ))
  if (matches) return new Response(null, { status: 304, headers })
  return new Response(json, { status: 200, headers: { ...headers, "Content-Type": "application/json" } })
}

export async function handleContentList(
  request: Request,
  repository: PublishedDocumentReader = documentStore,
  categoryRepository: PublishedCategoryReader = documentCategoryStore,
): Promise<Response> {
  const url = new URL(request.url)
  const query: Record<string, string> = {}
  for (const [key, value] of url.searchParams) {
    if (key in query) return Response.json({ error: "invalid_request" }, { status: 400 })
    query[key] = value
  }
  const parsed = listQuerySchema.safeParse(query)
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 })

  let before
  if (parsed.data.cursor) {
    const decoded = decodePublishedCursor(parsed.data.cursor)
    if (!decoded) return Response.json({ error: "invalid_request" }, { status: 400 })
    before = decoded
  }

  try {
    if (parsed.data.category) {
      const categories = await listPublishedDocumentCategories(parsed.data.kind, categoryRepository)
      if (!categories.some((category) => category.slug === parsed.data.category)) {
        return Response.json({ error: "invalid_category" }, { status: 400 })
      }
    }
    const baseFilter = {
      kind: parsed.data.kind,
      locale: parsed.data.locale,
      sort: parsed.data.sort,
      ...(parsed.data.category ? { category: parsed.data.category } : {}),
      ...(parsed.data.q ? { search: parsed.data.q } : {}),
    }
    const fetchLimit = Math.min(50, parsed.data.limit + 1)
    const documents = await listPublishedDocuments({
      ...baseFilter,
      limit: fetchLimit,
      before,
    }, repository)
    const items = documents.slice(0, parsed.data.limit)
    const last = items.at(-1)
    let hasNext = documents.length > parsed.data.limit

    if (!hasNext && parsed.data.limit === 50 && documents.length === 50 && last) {
      const successor = await listPublishedDocuments({
        ...baseFilter,
        limit: 1,
        before: { pinned: last.pinned, publishedAt: last.publishedAt, id: last.id },
      }, repository)
      hasNext = successor.length > 0
    }

    return responseWithEtag(request, {
      items: items.map(listItem),
      nextCursor: hasNext && last
        ? encodePublishedCursor({ pinned: last.pinned, publishedAt: last.publishedAt, id: last.id })
        : null,
    }, parsed.data.q ? "no-store" : cacheControl)
  } catch {
    return Response.json(
      { error: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}

export async function GET(request: Request): Promise<Response> {
  return handleContentList(request)
}

export { cacheControl as publicContentCacheControl, responseWithEtag }
