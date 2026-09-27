import { describe, expect, it } from "vitest"

import { MAX_ASSET_BYTES, parseUploadIntent } from "@/lib/assets/policy"

describe("media upload policy", () => {
  it("accepts one bounded supported image declaration", () => {
    expect(parseUploadIntent({
      originalFilename: "company-mark.png",
      declaredMediaType: "image/png",
      byteSize: 4_096,
    })).toEqual({
      originalFilename: "company-mark.png",
      declaredMediaType: "image/png",
      byteSize: 4_096,
    })
  })

  it.each([
    [{ originalFilename: "", declaredMediaType: "image/png", byteSize: 100 }, "invalid_input"],
    [{ originalFilename: "mark.gif", declaredMediaType: "image/gif", byteSize: 100 }, "unsupported_type"],
    [{ originalFilename: "mark.png", declaredMediaType: "image/png", byteSize: 0 }, "invalid_input"],
    [{ originalFilename: "mark.png", declaredMediaType: "image/png", byteSize: MAX_ASSET_BYTES + 1 }, "file_too_large"],
  ])("rejects an invalid upload declaration with a safe code", (input, code) => {
    expect(() => parseUploadIntent(input)).toThrow(expect.objectContaining({ code }))
  })
})
