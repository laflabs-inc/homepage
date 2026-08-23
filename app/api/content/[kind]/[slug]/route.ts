import { z } from "zod"

import { getPublishedDocument, type PublishedDocumentReader } from "@/lib/documents/cache"
import { documentStore } from "@/lib/documents/store"
import { documentKinds, documentLocales, type PublishedDocument } from "@/lib/documents/types"
import { publicContentCacheControl, responseWithEtag } from "@/app/api/content/route"

const paramsSchema = z.object({
  kind: z.enum(documentKinds),
  slug: z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
}).strict()

function detailDocument(document: PublishedDocument) {
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
    bodyMarkdown: document.bodyMarkdown,
    effectiveAt: document.effectiveAt?.toISOString() ?? null,
    publishedAt: document.publishedAt.toISOString(),
  }
}

export async function handleContentDetail(
  request: Request,
  rawParams: { kind: string; slug: string },
  repository: PublishedDocumentReader = documentStore,
): Promise<Response> {
  const url = new URL(request.url)
  const params = paramsSchema.safeParse(rawParams)
  const locale = z.enum(documentLocales).safeParse(url.searchParams.get("locale"))
  if (!params.success || !locale.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 })
  }

  try {
    const lookup = await getPublishedDocument(
      params.data.kind,
      params.data.slug,
      locale.data,
      repository,
    )
    if (!lookup.document) {
      return Response.json(
        { error: "not_found" },
        { status: 404, headers: { "Cache-Control": publicContentCacheControl } },
      )
    }

    return responseWithEtag(request, {
      document: detailDocument(lookup.document),
      availableLocales: lookup.availableLocales,
    })
  } catch {
    return Response.json(
      { error: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string; slug: string }> },
): Promise<Response> {
  return handleContentDetail(request, await params)
}
