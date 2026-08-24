import { authorizeAdminApi, type AdminActor, type AdminApiAuthorization } from "@/lib/auth/admin-api"
import { agentService, AgentServiceError } from "@/lib/agent/service"
import type { AgentConfiguration, AgentSettingsUpdate } from "@/lib/agent/types"
import { agentSettingsUpdateSchema } from "@/lib/agent/validation"
import { jsonNoStore, readBoundedJson, withNoStore } from "@/lib/http/json-body"
import { isSameOriginRequest } from "@/lib/http/same-origin"

export const AGENT_BODY_LIMIT = 16 * 1024

export type AdminAgentService = {
  getConfiguration(): Promise<AgentConfiguration>
  updateSettings(input: AgentSettingsUpdate, actor: AdminActor): Promise<AgentConfiguration>
  replaceCredential(apiKey: string, actor: AdminActor): Promise<AgentConfiguration>
  deleteCredential(actor: AdminActor): Promise<AgentConfiguration>
  testCredential(actor: AdminActor): Promise<AgentConfiguration>
}

export type AdminAgentDependencies = {
  authorize: () => Promise<AdminApiAuthorization>
  sameOrigin: (request: Request) => boolean
  service: AdminAgentService
}

export const adminAgentDependencies: AdminAgentDependencies = {
  authorize: authorizeAdminApi,
  sameOrigin: isSameOriginRequest,
  service: agentService,
}

export async function authorizeAgentRead(
  dependencies: AdminAgentDependencies,
): Promise<{ ok: true; actor: AdminActor } | { ok: false; response: Response }> {
  const authorization = await dependencies.authorize()
  if (!authorization.ok) return { ok: false, response: withNoStore(authorization.response) }
  return authorization
}

export async function authorizeAgentMutation(
  request: Request,
  dependencies: AdminAgentDependencies,
): Promise<{ ok: true; actor: AdminActor } | { ok: false; response: Response }> {
  const authorization = await authorizeAgentRead(dependencies)
  if (!authorization.ok) return authorization
  if (!dependencies.sameOrigin(request)) {
    return { ok: false, response: jsonNoStore({ error: "forbidden" }, { status: 403 }) }
  }
  return authorization
}

export function agentErrorResponse(error: unknown): Response {
  if (!(error instanceof AgentServiceError)) {
    return jsonNoStore({ error: "unavailable" }, { status: 503 })
  }

  const status = error.code === "invalid_settings"
    ? 422
    : error.code === "version_conflict"
      || error.code === "credential_unavailable"
      || error.code === "model_unverified"
      ? 409
      : error.code === "credential_invalid" || error.code === "provider_unavailable"
        ? 502
        : 503
  return jsonNoStore({ error: error.code }, { status })
}

export async function handleGetAgent(
  _request: Request,
  dependencies: AdminAgentDependencies = adminAgentDependencies,
): Promise<Response> {
  const authorization = await authorizeAgentRead(dependencies)
  if (!authorization.ok) return authorization.response

  try {
    return jsonNoStore({ configuration: await dependencies.service.getConfiguration() })
  } catch (error) {
    return agentErrorResponse(error)
  }
}

export async function handleUpdateAgent(
  request: Request,
  dependencies: AdminAgentDependencies = adminAgentDependencies,
): Promise<Response> {
  const authorization = await authorizeAgentMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const body = await readBoundedJson(request, AGENT_BODY_LIMIT)
  if (!body.ok) return body.response
  const parsed = agentSettingsUpdateSchema.safeParse(body.value)
  if (!parsed.success) return jsonNoStore({ error: "invalid_settings" }, { status: 422 })

  try {
    const configuration = await dependencies.service.updateSettings(parsed.data, authorization.actor)
    return jsonNoStore({ configuration })
  } catch (error) {
    return agentErrorResponse(error)
  }
}

export function GET(request: Request): Promise<Response> {
  return handleGetAgent(request)
}

export function PATCH(request: Request): Promise<Response> {
  return handleUpdateAgent(request)
}
