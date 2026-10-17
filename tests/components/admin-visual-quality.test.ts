import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const readStylesheet = (path: string) => readFileSync(join(process.cwd(), path), "utf8")

const pageStyles = readStylesheet("components/admin/admin-page.module.css")
const workspaceStyles = readStylesheet("components/admin/admin-workspace.module.css")
const routeStateStyles = readStylesheet("components/admin/admin-route-state.module.css")
const adminStyles = readStylesheet("app/admin/admin.module.css")
const assetStyles = readStylesheet("components/admin/asset-library.module.css")

describe("Admin visual quality contract", () => {
  it("uses fixed product-ui heading sizes", () => {
    expect(pageStyles).toMatch(
      /\.headerCopy h1\s*\{[^}]*font-size:\s*40px;[^}]*line-height:\s*44px;/s,
    )
    expect(pageStyles).toMatch(
      /@media \(max-width:\s*720px\)[\s\S]*\.headerCopy h1\s*\{[^}]*font-size:\s*32px;[^}]*line-height:\s*36px;/,
    )
    expect(pageStyles).toMatch(
      /\.sectionCopy h2\s*\{[^}]*font-size:\s*22px;[^}]*line-height:\s*28px;/s,
    )
  })

  it("uses authored workspace gutters at all three breakpoints", () => {
    expect(workspaceStyles).toMatch(
      /\.main\s*\{[^}]*padding:\s*48px 48px 64px;/s,
    )
    expect(workspaceStyles).toMatch(
      /@media \(max-width:\s*1099px\)[\s\S]*\.main\s*\{[^}]*padding-inline:\s*32px;/,
    )
    expect(workspaceStyles).toMatch(
      /@media \(max-width:\s*720px\)[\s\S]*\.main\s*\{[^}]*padding-inline:\s*16px;/,
    )
  })

  it("keeps compact route states", () => {
    expect(routeStateStyles).toMatch(
      /\.loadingHeader\s*\{[^}]*min-height:\s*156px;[^}]*padding-bottom:\s*24px;/s,
    )
    expect(routeStateStyles).toMatch(
      /\.loadingTitle\s*\{[^}]*height:\s*44px;/s,
    )
    expect(routeStateStyles).toMatch(
      /\.loadingContent\s*\{[^}]*min-height:\s*220px;[^}]*padding-top:\s*24px;/s,
    )
  })

  it("removes marketing-scale heading clamps", () => {
    expect(pageStyles).not.toMatch(/\.headerCopy h1\s*\{[^}]*clamp\(/s)
    expect(pageStyles).not.toMatch(/\.sectionCopy h2\s*\{[^}]*clamp\(/s)
    expect(routeStateStyles).not.toMatch(/\.loadingTitle\s*\{[^}]*clamp\(/s)
  })

  it("connects document filters and results with row separators", () => {
    expect(adminStyles).toMatch(
      /\.documentListWorkspace\s*\{[^}]*gap:\s*0;[^}]*background:\s*#fff;/s,
    )
    expect(adminStyles).toMatch(
      /\.documentFilters\s*\{[^}]*border-bottom:\s*0;/s,
    )
    expect(adminStyles).toMatch(
      /\.documentListItem \+ \.documentListItem\s*\{[^}]*border-top:\s*1px solid var\(--line\);/s,
    )
  })

  it("keeps the document editor bounded and publishing controls inside mobile", () => {
    expect(adminStyles).toMatch(
      /\.editorSource\s*\{[^}]*background:\s*white;[^}]*border:\s*1px solid var\(--line\);/s,
    )
    expect(adminStyles).toMatch(
      /\.editorProperties\s*\{[^}]*padding:\s*16px 32px;/s,
    )
    expect(adminStyles).toMatch(
      /@media \(max-width:\s*640px\)[\s\S]*\.editorPublishingActions\s*\{[^}]*max-width:\s*100%;[^}]*overflow:\s*hidden;/,
    )
  })

  it("keeps media upload and asset states dimensionally stable", () => {
    expect(assetStyles).toMatch(
      /\.uploadLead\s*\{[^}]*min-height:\s*88px;[^}]*padding:\s*16px 20px;/s,
    )
    expect(assetStyles).toMatch(
      /\.uploadQueue li\s*\{[^}]*min-height:\s*72px;/s,
    )
    expect(assetStyles).toMatch(
      /\.assetCard\s*\{[^}]*min-height:\s*420px;/s,
    )
    expect(assetStyles).toMatch(/\.preview\s*\{[^}]*aspect-ratio:\s*4 \/ 3;/s)
  })

  it("uses an authored single-column media layout at the Admin mobile breakpoint", () => {
    expect(assetStyles).toMatch(
      /@media \(max-width:\s*720px\)[\s\S]*\.library\s*\{[^}]*overflow-x:\s*clip;/,
    )
    expect(assetStyles).toMatch(
      /@media \(max-width:\s*720px\)[\s\S]*\.assetGrid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    )
  })
})
