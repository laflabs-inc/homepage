import { designResourceResponse } from "@/lib/design-system/response"
import { serializeTokens } from "@/lib/design-system/serialize"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  return designResourceResponse(serializeTokens, "application/json; charset=utf-8")
}
