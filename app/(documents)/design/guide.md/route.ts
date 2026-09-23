import { designResourceResponse } from "@/lib/design-system/response"
import { serializeDesignGuide } from "@/lib/design-system/serialize"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  return designResourceResponse(serializeDesignGuide, "text/plain; charset=utf-8")
}
