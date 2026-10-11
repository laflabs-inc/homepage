import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const stylesheet = readFileSync(join(process.cwd(), "app/admin/admin.module.css"), "utf8")

describe("document admin layout contract", () => {
  it("gives Item content the flexible document-row track", () => {
    expect(stylesheet).toMatch(
      /\.documentListItem\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s,
    )
  })

  it("uses explicit mobile publishing columns without an implicit separator track", () => {
    expect(stylesheet).toMatch(
      /\.editorPublishingActions\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)\s*1px\s*44px;/s,
    )
    expect(stylesheet).toMatch(
      /\.editorPublishingActions\s*>\s*:nth-child\(3\)\s*\{[^}]*grid-column:\s*1\s*\/\s*5;[^}]*grid-row:\s*2;/s,
    )
  })
})
