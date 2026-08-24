import { z } from "zod"

import {
  AGENT_BODY_LIMIT,
  adminAgentDependencies,
  agentErrorResponse,
  authorizeAgentMutation,
  type AdminAgentDependencies,
} from "@/app/api/admin/agent/route"
import { jsonNoStore, readBoundedJson } from "@/lib/http/json-body"

const emptyBodySchema = z.object({}).strict()

export async function handleTestCredential(
  request: Request,
  dependencies: AdminAgentDependencies = adminAgentDependencies,
): Promise<Response> {
  const authorization = await authorizeAgentMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const body = await readBoundedJson(request, AGENT_BODY_LIMIT)
  if (!body.ok) return body.response
  if (!emptyBodySchema.safeParse(body.value).success) {
    return jsonNoStore({ error: "invalid_settings" }, { status: 422 })
  }

  try {
    const configuration = await dependencies.service.testCredential(authorization.actor)
    return jsonNoStore({ configuration })
  } catch (error) {
    return agentErrorResponse(error)
  }
}

export function POST(request: Request): Promise<Response> {
  return handleTestCredential(request)
}
