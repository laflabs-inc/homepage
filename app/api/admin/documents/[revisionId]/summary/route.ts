import { z } from "zod"

import { authorizeAdminApi, type AdminActor, type AdminApiAuthorization } from "@/lib/auth/admin-api"
import { AiQuotaError } from "@/lib/ai/quota"
import { summaryService, SummaryGenerationError } from "@/lib/ai/summary"
import { DocumentServiceError } from "@/lib/documents/service"
import { revisionIdSchema } from "@/lib/documents/validation"
import { jsonNoStore, readBoundedJson, withNoStore } from "@/lib/http/json-body"
import { isSameOriginRequest } from "@/lib/http/same-origin"

const requestSchema = z.object({}).strict()

type SummaryRouteDependencies = {
  authorize: () => Promise<AdminApiAuthorization>
  sameOrigin: (request: Request) => boolean
  generate: (revisionId: string, actor: AdminActor) => Promise<{
    summary: string
    remainingMonthlyBudget: {
      month: string
      limitMicrousd: number
      actualCostMicrousd: number
      reservedCostMicrousd: number
      remainingMicrousd: number
      exhausted: boolean
    }
  }>
}

const defaultDependencies: SummaryRouteDependencies = {
  authorize: authorizeAdminApi,
  sameOrigin: isSameOriginRequest,
  generate: summaryService.generateDraftSummary,
}

function errorResponse(error: unknown): Response {
  if (error instanceof SummaryGenerationError) {
    const status = error.code === "not_found" ? 404 : error.code === "not_draft" ? 409 : 503
    return jsonNoStore({ error: error.code }, { status })
  }
  if (error instanceof AiQuotaError) {
    const status = error.code === "monthly_limit" ? 429 : error.code === "content_too_large" ? 400 : 503
    return jsonNoStore({ error: error.code }, { status })
  }
  if (error instanceof DocumentServiceError) {
    const status = error.code === "not_found" ? 404 : error.code === "unavailable" ? 503 : 409
    return jsonNoStore({ error: error.code }, { status })
  }
  return jsonNoStore({ error: "unavailable" }, { status: 503 })
}

export async function handleGenerateDocumentSummary(
  request: Request,
  revisionId: string,
  dependencies: SummaryRouteDependencies = defaultDependencies,
): Promise<Response> {
  const authorization = await dependencies.authorize()
  if (!authorization.ok) return withNoStore(authorization.response)
  if (!dependencies.sameOrigin(request)) {
    return jsonNoStore({ error: "forbidden" }, { status: 403 })
  }

  const body = await readBoundedJson(request)
  if (!body.ok) return body.response
  if (!requestSchema.safeParse(body.value).success || !revisionIdSchema.safeParse(revisionId).success) {
    return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  }

  try {
    const result = await dependencies.generate(revisionId, authorization.actor)
    return jsonNoStore({
      summary: result.summary,
      remainingMonthlyBudget: {
        month: result.remainingMonthlyBudget.month,
        remainingMicrousd: result.remainingMonthlyBudget.remainingMicrousd,
        exhausted: result.remainingMonthlyBudget.exhausted,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

type RouteContext = { params: Promise<{ revisionId: string }> }

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return handleGenerateDocumentSummary(request, (await context.params).revisionId)
}
