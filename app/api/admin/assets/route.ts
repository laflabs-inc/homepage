import { z } from "zod"

import { decodeAssetCursor, encodeAssetCursor } from "@/lib/assets/cursor"
import { mediaAssetStatuses, mediaTypes } from "@/lib/assets/types"
import {
  adminAssetDependencies,
  assetErrorResponse,
  authorizeAssetRead,
  toAdminAsset,
  type AdminAssetDependencies,
} from "@/lib/http/admin-assets"
import { jsonNoStore } from "@/lib/http/json-body"

const querySchema = z.object({
  search: z.string().trim().min(1).max(160).optional(),
  type: z.enum(mediaTypes).optional(),
  status: z.enum(mediaAssetStatuses).optional(),
  tag: z.string().trim().min(1).max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().max(512).optional(),
}).strict()

export async function handleListAssets(
  request: Request,
  dependencies: AdminAssetDependencies = adminAssetDependencies,
): Promise<Response> {
  const authorization = await authorizeAssetRead(dependencies)
  if (!authorization.ok) return authorization.response
  const url = new URL(request.url)
  const raw: Record<string, string> = {}
  for (const [key, value] of url.searchParams) {
    if (key in raw) return jsonNoStore({ error: "invalid_request" }, { status: 400 })
    raw[key] = value
  }
  const parsed = querySchema.safeParse(raw)
  if (!parsed.success) return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  const { cursor, type, ...filter } = parsed.data
  const before = cursor ? decodeAssetCursor(cursor) : undefined
  if (cursor && !before) return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  try {
    const page = await dependencies.service.list({
      ...filter,
      ...(type ? { mediaType: type } : {}),
      ...(before ? { before } : {}),
    })
    return jsonNoStore({
      assets: page.items.map(toAdminAsset),
      nextCursor: page.nextCursor ? encodeAssetCursor(page.nextCursor) : null,
    })
  } catch (error) {
    return assetErrorResponse(error)
  }
}

export function GET(request: Request): Promise<Response> {
  return handleListAssets(request)
}
