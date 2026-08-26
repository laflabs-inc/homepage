import { z } from "zod"

import {
  adminDocumentDependencies,
  authorizeMutation,
  invalidRevisionIdResponse,
  serviceErrorResponse,
  type AdminDocumentDependencies,
} from "@/lib/http/admin-documents"
import { jsonNoStore, readBoundedJson } from "@/lib/http/json-body"

const requestSchema = z.object({}).strict()

export async function handleUnscheduleDocument(
  request: Request,
  revisionId: string,
  dependencies: AdminDocumentDependencies = adminDocumentDependencies,
): Promise<Response> {
  const authorization = await authorizeMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const body = await readBoundedJson(request)
  if (!body.ok) return body.response
  if (!requestSchema.safeParse(body.value).success) {
    return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  }
  const invalidRevisionId = invalidRevisionIdResponse(revisionId)
  if (invalidRevisionId) return invalidRevisionId

  try {
    const revision = await dependencies.service.returnScheduledToDraft(revisionId, authorization.actor)
    return jsonNoStore({ revision })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}

type RouteContext = { params: Promise<{ revisionId: string }> }
export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return handleUnscheduleDocument(request, (await context.params).revisionId)
}
