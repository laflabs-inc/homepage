import { designTextResponse } from "@/lib/design-system/response"
import { serializeDesignGuide } from "@/lib/design-system/serialize"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  return designTextResponse(serializeDesignGuide(), "text/markdown; charset=utf-8")
}
