import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const stylesheet = readFileSync(
  path.resolve(process.cwd(), "components/content/content.module.css"),
  "utf8",
)

describe("document index layout contract", () => {
  it("aligns indexes to the site shell while preserving the detail reading width", () => {
    expect(stylesheet).toMatch(/\.indexPage\s*\{[^}]*width:\s*var\(--shell\)/s)
    expect(stylesheet).toMatch(/\.page,\s*\n\.detailPage\s*\{[^}]*width:\s*min\(1120px,\s*calc\(100%\s*-\s*64px\)\)/s)
    expect(stylesheet).toMatch(/\.detailPage\s*\{[^}]*width:\s*min\(920px,\s*calc\(100%\s*-\s*64px\)\)/s)
  })

  it("does not retain styling for the removed document switcher", () => {
    expect(stylesheet).not.toContain(".documentKindNav")
  })
})
