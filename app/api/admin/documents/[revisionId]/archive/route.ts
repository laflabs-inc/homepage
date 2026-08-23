import { z } from "zod"

import {
  adminDocumentDependencies,
  authorizeMutation,
  revalidatePublicRevision,
  serviceErrorResponse,
  type AdminDocumentDependencies,
} from "@/lib/http/admin-documents"
import { jsonNoStore, readBoundedJson } from "@/lib/http/json-body"

const requestSchema = z.object({}).strict()

export async function handleArchiveDocument(
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

  try {
    const revision = await dependencies.service.archive(revisionId, authorization.actor)
    revalidatePublicRevision(revision, dependencies.revalidate)
    return jsonNoStore({ revision })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}

type RouteContext = { params: Promise<{ revisionId: string }> }
export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return handleArchiveDocument(request, (await context.params).revisionId)
}
