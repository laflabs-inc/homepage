import { z } from "zod"

import type { AdminActor } from "@/lib/auth/admin-api"
import { AiQuotaError } from "@/lib/ai/quota"
import { summaryService, SummaryGenerationError } from "@/lib/ai/summary"
import type { DocumentRevision } from "@/lib/documents/types"
import {
  adminDocumentDependencies,
  authorizeMutation,
  invalidRevisionIdResponse,
  revalidatePublicRevision,
  serviceErrorResponse,
  type AdminDocumentDependencies,
} from "@/lib/http/admin-documents"
import { jsonNoStore, readBoundedJson } from "@/lib/http/json-body"

const requestSchema = z.object({}).strict()

type PublishDocumentDependencies = AdminDocumentDependencies & {
  publishWithSummaryPolicy: (revisionId: string, actor: AdminActor) => Promise<DocumentRevision>
}

const publishDocumentDependencies: PublishDocumentDependencies = {
  ...adminDocumentDependencies,
  publishWithSummaryPolicy: summaryService.publishWithSummaryPolicy,
}

function publishErrorResponse(error: unknown): Response {
  if (error instanceof SummaryGenerationError) {
    const status = error.code === "not_found" ? 404 : error.code === "not_draft" ? 409 : 503
    return jsonNoStore({ error: error.code }, { status })
  }
  if (error instanceof AiQuotaError) {
    const status = error.code === "monthly_limit" ? 429 : error.code === "content_too_large" ? 400 : 503
    return jsonNoStore({ error: error.code }, { status })
  }
  return serviceErrorResponse(error)
}

export async function handlePublishDocument(
  request: Request,
  revisionId: string,
  dependencies: PublishDocumentDependencies = publishDocumentDependencies,
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
    const revision = await dependencies.publishWithSummaryPolicy(revisionId, authorization.actor)
    revalidatePublicRevision(revision, dependencies.revalidate)
    return jsonNoStore({ revision })
  } catch (error) {
    return publishErrorResponse(error)
  }
}

type RouteContext = { params: Promise<{ revisionId: string }> }
export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return handlePublishDocument(request, (await context.params).revisionId)
}
