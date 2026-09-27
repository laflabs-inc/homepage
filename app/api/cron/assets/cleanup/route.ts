import { assetService, type AssetCleanupResult } from "@/lib/assets/service"
import { authorizeCronRequest } from "@/lib/http/cron-auth"
import { jsonNoStore } from "@/lib/http/json-body"

type Cleanup = (now: Date) => Promise<AssetCleanupResult>

export async function handleAssetCleanup(
  request: Request,
  cleanup: Cleanup = (now) => assetService.cleanup(now),
  now: Date = new Date(),
): Promise<Response> {
  if (!authorizeCronRequest(request)) {
    return jsonNoStore({ error: "unauthorized" }, { status: 401 })
  }
  try {
    return jsonNoStore(await cleanup(now))
  } catch {
    return jsonNoStore({ error: "unavailable" }, { status: 503 })
  }
}

export function GET(request: Request): Promise<Response> {
  return handleAssetCleanup(request)
}
