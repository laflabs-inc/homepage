import { designResourceResponse } from "@/lib/design-system/response"
import { serializeSkillFiles } from "@/lib/design-system/serialize"

const path = "laflabs-web-design/references/patterns.md"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  return designResourceResponse(
    () => serializeSkillFiles().get(path),
    "text/markdown; charset=utf-8",
    { missingCode: "design_skill_file_unavailable" },
  )
}
