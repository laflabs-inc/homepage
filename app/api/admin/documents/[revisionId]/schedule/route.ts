import {
  adminDocumentDependencies,
  authorizeMutation,
  invalidRevisionIdResponse,
  serviceErrorResponse,
  type AdminDocumentDependencies,
} from "@/lib/http/admin-documents"
import { jsonNoStore, readBoundedJson } from "@/lib/http/json-body"
import { scheduleDocumentSchema } from "@/lib/documents/validation"

export async function handleScheduleDocument(
  request: Request,
  revisionId: string,
  dependencies: AdminDocumentDependencies = adminDocumentDependencies,
): Promise<Response> {
  const authorization = await authorizeMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const body = await readBoundedJson(request)
  if (!body.ok) return body.response
  const parsed = scheduleDocumentSchema.safeParse(body.value)
  if (!parsed.success) return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  const invalidRevisionId = invalidRevisionIdResponse(revisionId)
  if (invalidRevisionId) return invalidRevisionId

  try {
    const revision = await dependencies.service.schedule(
      revisionId,
      parsed.data.scheduledAt,
      authorization.actor,
    )
    return jsonNoStore({ revision })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}

type RouteContext = { params: Promise<{ revisionId: string }> }
export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return handleScheduleDocument(request, (await context.params).revisionId)
}
