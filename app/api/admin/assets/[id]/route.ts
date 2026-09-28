import { z } from "zod"

import {
  adminAssetDependencies,
  assetErrorResponse,
  authorizeAssetMutation,
  authorizeAssetRead,
  invalidAssetIdResponse,
  toAdminAsset,
  type AdminAssetDependencies,
} from "@/lib/http/admin-assets"
import { jsonNoStore } from "@/lib/http/json-body"

const metadataSchema = z.object({
  altKo: z.string().max(500).nullable(),
  altEn: z.string().max(500).nullable(),
  tags: z.array(z.string().min(1).max(40)).max(20),
}).strict()
const deleteSchema = z.object({ confirm: z.literal(true) }).strict()

export async function handleGetAsset(
  _request: Request,
  assetId: string,
  dependencies: AdminAssetDependencies = adminAssetDependencies,
): Promise<Response> {
  const authorization = await authorizeAssetRead(dependencies)
  if (!authorization.ok) return authorization.response
  const invalidId = invalidAssetIdResponse(assetId)
  if (invalidId) return invalidId
  try {
    return jsonNoStore({ asset: toAdminAsset(await dependencies.service.get(assetId)) })
  } catch (error) {
    return assetErrorResponse(error)
  }
}

export async function handleUpdateAsset(
  request: Request,
  assetId: string,
  dependencies: AdminAssetDependencies = adminAssetDependencies,
): Promise<Response> {
  const authorization = await authorizeAssetMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const invalidId = invalidAssetIdResponse(assetId)
  if (invalidId) return invalidId
  const body = await dependencies.readBody(request)
  if (!body.ok) return body.response
  const parsed = metadataSchema.safeParse(body.value)
  if (!parsed.success) return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  try {
    const asset = await dependencies.service.updateMetadata(assetId, parsed.data, authorization.actor)
    return jsonNoStore({ asset: toAdminAsset(asset) })
  } catch (error) {
    return assetErrorResponse(error)
  }
}

export async function handleDeleteAsset(
  request: Request,
  assetId: string,
  dependencies: AdminAssetDependencies = adminAssetDependencies,
): Promise<Response> {
  const authorization = await authorizeAssetMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const invalidId = invalidAssetIdResponse(assetId)
  if (invalidId) return invalidId
  const body = await dependencies.readBody(request)
  if (!body.ok) return body.response
  if (!deleteSchema.safeParse(body.value).success) {
    return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  }
  try {
    const asset = await dependencies.service.delete(assetId, authorization.actor)
    return jsonNoStore({ asset: toAdminAsset(asset) })
  } catch (error) {
    return assetErrorResponse(error)
  }
}

type RouteContext = { params: Promise<{ id: string }> }
export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return handleGetAsset(request, (await context.params).id)
}
export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return handleUpdateAsset(request, (await context.params).id)
}
export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return handleDeleteAsset(request, (await context.params).id)
}
