import { handleFinalizeAsset } from "@/lib/http/admin-assets"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return handleFinalizeAsset(request, (await context.params).id)
}
