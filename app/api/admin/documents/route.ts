import { z } from "zod"

import {
  adminDocumentDependencies,
  authorizeMutation,
  authorizeRead,
  serviceErrorResponse,
  type AdminDocumentDependencies,
} from "@/lib/http/admin-documents"
import { jsonNoStore, readBoundedJson } from "@/lib/http/json-body"
import { documentDraftSchema } from "@/lib/documents/validation"
import { documentKinds, documentLocales, documentStatuses } from "@/lib/documents/types"

const listQuerySchema = z.object({
  kind: z.enum(documentKinds).optional(),
  locale: z.enum(documentLocales).optional(),
  status: z.enum(documentStatuses).optional(),
  seriesId: z.uuid().optional(),
}).strict()

const seriesIdSchema = z.uuid()

export async function handleListDocuments(
  request: Request,
  dependencies: AdminDocumentDependencies = adminDocumentDependencies,
): Promise<Response> {
  const authorization = await authorizeRead(dependencies)
  if (!authorization.ok) return authorization.response

  const url = new URL(request.url)
  const query: Record<string, string> = {}
  for (const [key, value] of url.searchParams) {
    if (key in query) return jsonNoStore({ error: "invalid_request" }, { status: 400 })
    query[key] = value
  }
  const parsed = listQuerySchema.safeParse(query)
  if (!parsed.success) return jsonNoStore({ error: "invalid_request" }, { status: 400 })

  try {
    return jsonNoStore({ revisions: await dependencies.service.listAdmin(parsed.data) })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}

export async function handleCreateDocument(
  request: Request,
  dependencies: AdminDocumentDependencies = adminDocumentDependencies,
): Promise<Response> {
  const authorization = await authorizeMutation(request, dependencies)
  if (!authorization.ok) return authorization.response

  const body = await readBoundedJson(request)
  if (!body.ok) return body.response

  const value = body.value
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  }
  const { seriesId, ...draftValue } = value as Record<string, unknown>
  const parsed = documentDraftSchema.safeParse(draftValue)
  if (!parsed.success) return jsonNoStore({ error: "invalid_request" }, { status: 400 })

  const parsedSeriesId = seriesId === undefined ? null : seriesIdSchema.safeParse(seriesId)
  if (parsedSeriesId && !parsedSeriesId.success) {
    return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  }
  if ((parsed.data.locale === "en") !== Boolean(parsedSeriesId)) {
    return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  }

  try {
    const revision = parsedSeriesId
      ? await dependencies.service.createEnglishDraft(parsedSeriesId.data, parsed.data, authorization.actor)
      : await dependencies.service.createDraft(parsed.data, authorization.actor)
    return jsonNoStore({ revision }, { status: 201 })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}

export function GET(request: Request): Promise<Response> {
  return handleListDocuments(request)
}

export function POST(request: Request): Promise<Response> {
  return handleCreateDocument(request)
}
