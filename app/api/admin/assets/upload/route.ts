import { handleAssetUpload } from "@/lib/http/admin-assets"

export const runtime = "nodejs"

export function POST(request: Request): Promise<Response> {
  return handleAssetUpload(request)
}
