import { z } from "zod"

import { documentDraftSchema } from "@/lib/documents/validation"
import {
  adminDocumentDependencies,
  authorizeMutation,
  authorizeRead,
  invalidRevisionIdResponse,
  serviceErrorResponse,
  type AdminDocumentDependencies,
} from "@/lib/http/admin-documents"
import { jsonNoStore, readBoundedJson } from "@/lib/http/json-body"

const deleteSchema = z.union([
  z.object({}).strict(),
  z.object({
    permanent: z.literal(true),
    confirmation: z.string().min(1).max(160),
  }).strict(),
])

export async function handleGetDocument(
  _request: Request,
  revisionId: string,
  dependencies: AdminDocumentDependencies = adminDocumentDependencies,
): Promise<Response> {
  const authorization = await authorizeRead(dependencies)
  if (!authorization.ok) return authorization.response
  const invalidRevisionId = invalidRevisionIdResponse(revisionId)
  if (invalidRevisionId) return invalidRevisionId

  try {
    const revision = await dependencies.service.getRevision(revisionId)
    return revision
      ? jsonNoStore({ revision })
      : jsonNoStore({ error: "not_found" }, { status: 404 })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}

export async function handleUpdateDocument(
  request: Request,
  revisionId: string,
  dependencies: AdminDocumentDependencies = adminDocumentDependencies,
): Promise<Response> {
  const authorization = await authorizeMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const body = await readBoundedJson(request)
  if (!body.ok) return body.response
  const parsed = documentDraftSchema.safeParse(body.value)
  if (!parsed.success) return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  const invalidRevisionId = invalidRevisionIdResponse(revisionId)
  if (invalidRevisionId) return invalidRevisionId

  try {
    const revision = await dependencies.service.updateDraft(revisionId, parsed.data, authorization.actor)
    return jsonNoStore({ revision })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}

export async function handleDeleteDocument(
  request: Request,
  revisionId: string,
  dependencies: AdminDocumentDependencies = adminDocumentDependencies,
): Promise<Response> {
  const authorization = await authorizeMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const body = await readBoundedJson(request)
  if (!body.ok) return body.response
  const parsed = deleteSchema.safeParse(body.value)
  if (!parsed.success) {
    return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  }
  const invalidRevisionId = invalidRevisionIdResponse(revisionId)
  if (invalidRevisionId) return invalidRevisionId

  try {
    if ("permanent" in parsed.data) {
      await dependencies.service.deleteArchived(revisionId, parsed.data.confirmation, authorization.actor)
    } else {
      await dependencies.service.deleteDraft(revisionId, authorization.actor)
    }
    return jsonNoStore({ ok: true })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}

type RouteContext = { params: Promise<{ revisionId: string }> }

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return handleGetDocument(request, (await context.params).revisionId)
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return handleUpdateDocument(request, (await context.params).revisionId)
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return handleDeleteDocument(request, (await context.params).revisionId)
}
