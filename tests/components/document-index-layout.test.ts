import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const stylesheet = readFileSync(
  path.resolve(process.cwd(), "components/content/content.module.css"),
  "utf8",
)

function mediaBlock(query: string) {
  const start = stylesheet.indexOf(`@media ${query}`)

  if (start === -1) {
    throw new Error(`Missing @media ${query} block`)
  }

  const openingBrace = stylesheet.indexOf("{", start)
  let depth = 0

  for (let index = openingBrace; index < stylesheet.length; index += 1) {
    if (stylesheet[index] === "{") depth += 1
    if (stylesheet[index] === "}") depth -= 1
    if (depth === 0) return stylesheet.slice(openingBrace + 1, index)
  }

  throw new Error(`Unclosed @media ${query} block`)
}

describe("document index layout contract", () => {
  it("aligns indexes to the site shell while preserving the detail reading width", () => {
    expect(stylesheet).toMatch(/\.indexPage\s*\{[^}]*width:\s*var\(--shell\)/s)
    expect(stylesheet).toMatch(/\.page,\s*\n\.detailPage\s*\{[^}]*width:\s*min\(1120px,\s*calc\(100%\s*-\s*64px\)\)/s)
    expect(stylesheet).toMatch(/\.detailPage\s*\{[^}]*width:\s*min\(920px,\s*calc\(100%\s*-\s*64px\)\)/s)
  })

  it("stacks the document header at the tablet breakpoint", () => {
    expect(mediaBlock("(max-width: 900px)")).toMatch(
      /\.pageHeader\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
    )
  })

  it("contains navigation overflow and focus treatment on mobile", () => {
    const mobileStyles = mediaBlock("(max-width: 700px)")

    expect(mobileStyles).toMatch(/\.documentKindNav\s*\{[^}]*overflow-x:\s*auto/s)
    expect(mobileStyles).toMatch(/\.documentKindNav a\s*\{[^}]*flex:\s*0 0 auto/s)
    expect(mobileStyles).toMatch(
      /\.documentKindNav a:focus-visible\s*\{[^}]*outline-offset:\s*-3px/s,
    )
  })
})
