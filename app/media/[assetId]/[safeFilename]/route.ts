import { z } from "zod"

import { assetService, AssetServiceError } from "@/lib/assets/service"
import type { MediaAsset } from "@/lib/assets/types"
import { jsonNoStore } from "@/lib/http/json-body"

const assetIdSchema = z.uuid()

export type MediaDeliveryDependencies = {
  getAsset: (id: string) => Promise<MediaAsset>
}

const mediaDeliveryDependencies: MediaDeliveryDependencies = {
  getAsset: (id) => assetService.get(id),
}

function notFound(): Response {
  return jsonNoStore({ error: "not_found" }, { status: 404 })
}

export async function handleMediaDelivery(
  assetId: string,
  safeFilename: string,
  dependencies: MediaDeliveryDependencies = mediaDeliveryDependencies,
): Promise<Response> {
  if (
    !assetIdSchema.safeParse(assetId).success ||
    !safeFilename ||
    safeFilename.length > 255 ||
    safeFilename.includes("/") ||
    safeFilename.includes("\\")
  ) return notFound()

  try {
    const asset = await dependencies.getAsset(assetId)
    if (
      asset.visibility !== "public" ||
      (asset.status !== "ready" && asset.status !== "archived") ||
      asset.safeFilename !== safeFilename ||
      !asset.publicUrl
    ) return notFound()
    return new Response(null, {
      status: 308,
      headers: {
        Location: asset.publicUrl,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    if (error instanceof AssetServiceError) return notFound()
    return notFound()
  }
}

type RouteContext = { params: Promise<{ assetId: string; safeFilename: string }> }
export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { assetId, safeFilename } = await context.params
  return handleMediaDelivery(assetId, safeFilename)
}
