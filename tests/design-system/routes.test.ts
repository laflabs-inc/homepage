import { strFromU8, unzipSync } from "fflate"
import { describe, expect, it } from "vitest"

import { GET as getGuide } from "@/app/(documents)/design/guide.md/route"
import { GET as getSkillEntry } from "@/app/(documents)/design/skill/SKILL.md/route"
import { GET as getSkillZip } from "@/app/(documents)/design/skill.zip/route"
import { GET as getSkillComponents } from "@/app/(documents)/design/skill/references/components.md/route"
import { GET as getSkillFoundations } from "@/app/(documents)/design/skill/references/foundations.md/route"
import { GET as getSkillPatterns } from "@/app/(documents)/design/skill/references/patterns.md/route"
import { GET as getSkillTokens } from "@/app/(documents)/design/skill/references/tokens.json/route"
import { GET as getTokens } from "@/app/(documents)/design/tokens.json/route"
import {
  serializeDesignGuide,
  serializeSkillFiles,
  serializeSkillZip,
  serializeTokens,
} from "@/lib/design-system/serialize"

const cacheControl = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"

async function responseText(response: Response): Promise<string> {
  return response.text()
}

function expectPublicTextHeaders(response: Response, contentType: string): void {
  expect(response.status).toBe(200)
  expect(response.headers.get("content-type")).toBe(contentType)
  expect(response.headers.get("cache-control")).toBe(cacheControl)
  expect(response.headers.get("x-content-type-options")).toBe("nosniff")
  expect(response.headers.get("etag")).toMatch(/^"[a-f0-9]{64}"$/)
  expect(response.headers.get("content-disposition")).toBeNull()
}

describe("public design machine routes", () => {
  it("serves the exact generated guide with public UTF-8 response protections", async () => {
    const response = await getGuide()

    expectPublicTextHeaders(response, "text/markdown; charset=utf-8")
    await expect(responseText(response)).resolves.toBe(serializeDesignGuide())
  })

  it("serves the exact generated token document with public UTF-8 response protections", async () => {
    const response = await getTokens()

    expectPublicTextHeaders(response, "application/json; charset=utf-8")
    await expect(responseText(response)).resolves.toBe(serializeTokens())
  })

  it("serves each exact Skill source file with public UTF-8 response protections", async () => {
    const files = serializeSkillFiles()
    const responses = [
      [getSkillEntry, "laflabs-web-design/SKILL.md"],
      [getSkillFoundations, "laflabs-web-design/references/foundations.md"],
      [getSkillComponents, "laflabs-web-design/references/components.md"],
      [getSkillPatterns, "laflabs-web-design/references/patterns.md"],
      [getSkillTokens, "laflabs-web-design/references/tokens.json"],
    ] as const

    for (const [get, path] of responses) {
      const response = await get()
      const contentType = path.endsWith(".json")
        ? "application/json; charset=utf-8"
        : "text/markdown; charset=utf-8"

      expectPublicTextHeaders(response, contentType)
      await expect(responseText(response)).resolves.toBe(files.get(path))
    }
  })

  it("serves the exact five-file non-executable Skill archive with a fixed safe download name", async () => {
    const response = await getSkillZip()
    const bytes = new Uint8Array(await response.arrayBuffer())
    const entries = unzipSync(bytes)

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("application/zip")
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="laflabs-web-design-2026.9.0.zip"',
    )
    expect(response.headers.get("cache-control")).toBe(cacheControl)
    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
    expect(response.headers.get("etag")).toMatch(/^"[a-f0-9]{64}"$/)
    expect(bytes).toEqual(serializeSkillZip())

    const files = serializeSkillFiles()
    expect(Object.keys(entries)).toEqual([...files.keys()])
    for (const [path, fileBytes] of Object.entries(entries)) {
      expect(strFromU8(fileBytes)).toBe(files.get(path))
    }
  })
})
