import {
  adminAssetDependencies,
  assetErrorResponse,
  authorizeAssetRead,
  invalidAssetIdResponse,
  type AdminAssetDependencies,
} from "@/lib/http/admin-assets"
import { jsonNoStore } from "@/lib/http/json-body"

export async function handleListAssetReferences(
  _request: Request,
  assetId: string,
  dependencies: AdminAssetDependencies = adminAssetDependencies,
): Promise<Response> {
  const authorization = await authorizeAssetRead(dependencies)
  if (!authorization.ok) return authorization.response
  const invalidId = invalidAssetIdResponse(assetId)
  if (invalidId) return invalidId
  try {
    const references = await dependencies.service.listUsage(assetId)
    return jsonNoStore({
      references: references.map((usage) => ({
        ...usage,
        updatedAt: usage.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    return assetErrorResponse(error)
  }
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return handleListAssetReferences(request, (await context.params).id)
}
