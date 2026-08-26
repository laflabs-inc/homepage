import { createHash } from "node:crypto"

import { z } from "zod"

import { listPublishedDocuments, type PublishedDocumentReader } from "@/lib/documents/cache"
import { documentStore } from "@/lib/documents/store"
import { documentKinds, documentLocales, type PublishedDocument } from "@/lib/documents/types"
import { categoriesByKind } from "@/lib/documents/validation"
import { decodePublishedCursor, encodePublishedCursor } from "@/lib/http/cursor"

const cacheControl = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"

const listQuerySchema = z.object({
  kind: z.enum(documentKinds),
  locale: z.enum(documentLocales),
  category: z.string().min(1).max(40).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(512).optional(),
}).strict().superRefine(({ kind, category }, context) => {
  if (category && !(categoriesByKind[kind] as readonly string[]).includes(category)) {
    context.addIssue({ code: "custom", path: ["category"], message: "Category is not allowed for this kind" })
  }
})

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

function responseWithEtag(request: Request, body: unknown): Response {
  const json = JSON.stringify(body)
  const etag = `"${createHash("sha256").update(json).digest("hex")}"`
  const headers = { "Cache-Control": cacheControl, ETag: etag }
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
): Promise<Response> {
  const url = new URL(request.url)
  const parsed = listQuerySchema.safeParse({
    kind: url.searchParams.get("kind") ?? undefined,
    locale: url.searchParams.get("locale") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
  })
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 })

  let before
  if (parsed.data.cursor) {
    const decoded = decodePublishedCursor(parsed.data.cursor)
    if (!decoded) return Response.json({ error: "invalid_request" }, { status: 400 })
    before = decoded
  }

  try {
    const baseFilter = {
      kind: parsed.data.kind,
      locale: parsed.data.locale,
      ...(parsed.data.category ? { category: parsed.data.category } : {}),
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
    })
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
