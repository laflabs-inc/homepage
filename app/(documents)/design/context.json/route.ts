import { designResourceResponse } from "@/lib/design-system/response"
import { serializeAiContext } from "@/lib/design-system/serialize"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  return designResourceResponse(serializeAiContext, "application/json; charset=utf-8")
}
