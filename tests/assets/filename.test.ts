import { describe, expect, it } from "vitest"

import { safeFilename } from "@/lib/assets/filename"

describe("safe media filename", () => {
  it("uses the verified type and removes path and control syntax", () => {
    expect(safeFilename("../../회사 로고 FINAL.exe", "image/png")).toBe("회사-로고-final.png")
  })

  it("uses a stable fallback for a name without safe characters", () => {
    expect(safeFilename("...💥.jpg", "image/jpeg")).toBe("asset.jpg")
  })

  it("limits the total name to 160 Unicode code points including its extension", () => {
    const filename = safeFilename(`${"가".repeat(200)}.svg`, "image/svg+xml")
    expect(Array.from(filename)).toHaveLength(160)
    expect(filename.endsWith(".svg")).toBe(true)
  })
})
