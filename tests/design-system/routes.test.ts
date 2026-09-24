import { existsSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

import { strFromU8, unzipSync } from "fflate"
import { afterEach, describe, expect, it, vi } from "vitest"

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

afterEach(() => {
  vi.doUnmock("@/lib/design-system/serialize")
  vi.resetModules()
})

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

async function expectSha256Etag(response: Response): Promise<void> {
  const bytes = await response.clone().arrayBuffer()
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes)
  const expected = `"${[...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}"`

  expect(response.headers.get("etag")).toBe(expected)
}

async function expectUnavailable(response: Response, code: string, secret: string): Promise<void> {
  expect(response.status).toBe(503)
  expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8")
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(response.headers.get("x-content-type-options")).toBe("nosniff")
  const body = await response.text()
  expect(body).toBe(`${code}\n`)
  expect(body).not.toContain(secret)
}

describe("public design machine routes", () => {
  it("serves a single JSON context that AI web readers can ingest", async () => {
    const routePath = join(
      process.cwd(),
      "app/(documents)/design/context.json/route.ts",
    )
    expect(existsSync(routePath)).toBe(true)
    if (!existsSync(routePath)) return

    const route = await import(pathToFileURL(routePath).href) as {
      GET: () => Promise<Response>
    }
    const response = await route.GET()

    expectPublicTextHeaders(response, "application/json; charset=utf-8")
    await expectSha256Etag(response)
    const context = await response.json() as { canonicalUrl: string; guide: string }
    expect(context.canonicalUrl).toBe("https://www.laflabs.co/design/context.json")
    expect(context.guide).toContain("# LafLabs Web Design")
  })

  it("serves the exact generated guide with public UTF-8 response protections", async () => {
    const response = await getGuide()

    expectPublicTextHeaders(response, "text/plain; charset=utf-8")
    await expectSha256Etag(response)
    await expect(responseText(response)).resolves.toBe(serializeDesignGuide())
  })

  it("serves the exact generated token document with public UTF-8 response protections", async () => {
    const response = await getTokens()

    expectPublicTextHeaders(response, "application/json; charset=utf-8")
    await expectSha256Etag(response)
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
        : "text/plain; charset=utf-8"

      expectPublicTextHeaders(response, contentType)
      await expectSha256Etag(response)
      await expect(responseText(response)).resolves.toBe(files.get(path))
    }
  })

  it("serves the exact five-file non-executable Skill archive with a fixed safe download name", async () => {
    const response = await getSkillZip()
    await expectSha256Etag(response)
    const bytes = new Uint8Array(await response.arrayBuffer())
    const entries = unzipSync(bytes)

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("application/zip")
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="laflabs-web-design-2026.9.4.zip"',
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

describe("public design machine-route failures", () => {
  it("normalizes a guide serializer failure without leaking its detail", async () => {
    const secret = "postgres://design-secret"
    vi.doMock("@/lib/design-system/serialize", async () => {
      const actual = await vi.importActual<typeof import("@/lib/design-system/serialize")>(
        "@/lib/design-system/serialize",
      )
      return {
        ...actual,
        serializeDesignGuide: () => { throw new Error(secret) },
      }
    })
    const { GET } = await import("@/app/(documents)/design/guide.md/route")

    await expectUnavailable(await GET(), "design_resource_unavailable", secret)
  })

  it("normalizes a Skill archive serialization failure without leaking its detail", async () => {
    const secret = "archive-key=design-secret"
    vi.doMock("@/lib/design-system/serialize", async () => {
      const actual = await vi.importActual<typeof import("@/lib/design-system/serialize")>(
        "@/lib/design-system/serialize",
      )
      return {
        ...actual,
        serializeSkillZip: () => { throw new Error(secret) },
      }
    })
    const { GET } = await import("@/app/(documents)/design/skill.zip/route")

    await expectUnavailable(await GET(), "design_resource_unavailable", secret)
  })

  it("normalizes a missing generated Skill file without leaking its path", async () => {
    const secret = "laflabs-web-design/references/foundations.md"
    vi.doMock("@/lib/design-system/serialize", async () => {
      const actual = await vi.importActual<typeof import("@/lib/design-system/serialize")>(
        "@/lib/design-system/serialize",
      )
      return {
        ...actual,
        serializeSkillFiles: () => new Map(),
      }
    })
    const { GET } = await import("@/app/(documents)/design/skill/references/foundations.md/route")

    await expectUnavailable(await GET(), "design_skill_file_unavailable", secret)
  })
})
