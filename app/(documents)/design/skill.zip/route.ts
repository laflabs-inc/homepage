import { designTextResponse } from "@/lib/design-system/response"
import { designSystemMeta } from "@/lib/design-system/meta"
import { serializeSkillZip } from "@/lib/design-system/serialize"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  return designTextResponse(
    serializeSkillZip(),
    "application/zip",
    `${designSystemMeta.skillName}-${designSystemMeta.version}.zip`,
  )
}
