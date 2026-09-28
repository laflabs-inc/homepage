import { describe, expect, it } from "vitest"

import { decodeAssetCursor, encodeAssetCursor } from "@/lib/assets/cursor"

const cursor = {
  createdAt: new Date("2026-09-27T03:00:00.000Z"),
  id: "00000000-0000-4000-8000-000000000001",
}

describe("asset cursor", () => {
  it("round-trips an opaque creation cursor", () => {
    const encoded = encodeAssetCursor(cursor)

    expect(encoded).not.toContain(cursor.id)
    expect(decodeAssetCursor(encoded)).toEqual(cursor)
  })

  it.each(["", "not-base64", Buffer.from("{}").toString("base64url")])(
    "rejects an invalid cursor",
    (value) => expect(decodeAssetCursor(value)).toBeNull(),
  )
})
