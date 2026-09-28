import {
  adminAssetDependencies,
  assetErrorResponse,
  authorizeAssetMutation,
  invalidAssetIdResponse,
  toAdminAsset,
  type AdminAssetDependencies,
} from "@/lib/http/admin-assets"
import { jsonNoStore } from "@/lib/http/json-body"

export async function handleRestoreAsset(
  request: Request,
  assetId: string,
  dependencies: AdminAssetDependencies = adminAssetDependencies,
): Promise<Response> {
  const authorization = await authorizeAssetMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const invalidId = invalidAssetIdResponse(assetId)
  if (invalidId) return invalidId
  try {
    return jsonNoStore({
      asset: toAdminAsset(await dependencies.service.restore(assetId, authorization.actor)),
    })
  } catch (error) {
    return assetErrorResponse(error)
  }
}

type RouteContext = { params: Promise<{ id: string }> }
export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return handleRestoreAsset(request, (await context.params).id)
}
