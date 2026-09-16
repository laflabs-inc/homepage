import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { serializeRootDesign } from "../lib/design-system/serialize"

type WriteDesignArtifactsOptions = Readonly<{
  check: boolean
}>

const recoveryDirection = "Run npm run design:generate"

export async function writeDesignArtifacts({ check }: WriteDesignArtifactsOptions): Promise<void> {
  const designPath = resolve(process.cwd(), "DESIGN.md")
  const expected = Buffer.from(serializeRootDesign(), "utf8")

  if (check) {
    let current: Buffer | undefined

    try {
      current = await readFile(designPath)
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error
    }

    if (!current?.equals(expected)) {
      throw new Error(`DESIGN.md is stale. ${recoveryDirection}`)
    }

    return
  }

  await writeFile(designPath, expected)
}

function parseCheckFlag(arguments_: readonly string[]): boolean {
  if (arguments_.length === 0) return false
  if (arguments_.length === 1 && arguments_[0] === "--check") return true

  throw new Error("Usage: npm run design:generate -- [--check]")
}

async function run(): Promise<void> {
  try {
    await writeDesignArtifacts({ check: parseCheckFlag(process.argv.slice(2)) })
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

const entryPoint = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined

if (entryPoint === import.meta.url) void run()
