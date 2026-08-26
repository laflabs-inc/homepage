import { z } from "zod"

import {
  AGENT_BODY_LIMIT,
  adminAgentDependencies,
  agentErrorResponse,
  authorizeAgentMutation,
  type AdminAgentDependencies,
} from "@/app/api/admin/agent/route"
import { credentialInputSchema } from "@/lib/agent/validation"
import { jsonNoStore, readBoundedJson } from "@/lib/http/json-body"

const emptyBodySchema = z.object({}).strict()

export async function handlePutCredential(
  request: Request,
  dependencies: AdminAgentDependencies = adminAgentDependencies,
): Promise<Response> {
  const authorization = await authorizeAgentMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const body = await readBoundedJson(request, AGENT_BODY_LIMIT)
  if (!body.ok) return body.response
  const parsed = credentialInputSchema.safeParse(body.value)
  if (!parsed.success) return jsonNoStore({ error: "credential_invalid" }, { status: 422 })

  try {
    const configuration = await dependencies.service.replaceCredential(parsed.data.apiKey, authorization.actor)
    return jsonNoStore({ configuration })
  } catch (error) {
    return agentErrorResponse(error)
  }
}

export async function handleDeleteCredential(
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
    const configuration = await dependencies.service.deleteCredential(authorization.actor)
    return jsonNoStore({ configuration })
  } catch (error) {
    return agentErrorResponse(error)
  }
}

export function PUT(request: Request): Promise<Response> {
  return handlePutCredential(request)
}

export function DELETE(request: Request): Promise<Response> {
  return handleDeleteCredential(request)
}
