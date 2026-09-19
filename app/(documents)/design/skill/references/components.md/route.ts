import { designTextResponse } from "@/lib/design-system/response"
import { serializeSkillFiles } from "@/lib/design-system/serialize"

const path = "laflabs-web-design/references/components.md"

export const dynamic = "force-static"

export async function GET(): Promise<Response> {
  const source = serializeSkillFiles().get(path)
  if (!source) throw new Error(`Missing generated Skill file: ${path}`)
  return designTextResponse(source, "text/markdown; charset=utf-8")
}
