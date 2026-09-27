import sharp from "sharp"
import { describe, expect, it } from "vitest"

import { MAX_ASSET_BYTES } from "@/lib/assets/policy"
import { processAsset } from "@/lib/assets/image-processor"

const encode = (value: string) => new TextEncoder().encode(value)

async function animatedWebp(): Promise<Buffer> {
  const raw = Buffer.alloc(2 * 4 * 4)
  raw.fill(255, 0, 2 * 2 * 4)
  raw.fill(64, 2 * 2 * 4)
  return sharp(raw, { raw: { width: 2, height: 4, pageHeight: 2, channels: 4 } })
    .webp({ loop: 0, delay: [100, 100] })
    .toBuffer()
}

describe("media image processor", () => {
  it.each([
    [new Uint8Array(MAX_ASSET_BYTES + 1), "too-large.png", "file_too_large"],
    [encode("plain text"), "renamed.png", "unsupported_type"],
    [encode(`<svg xmlns="http://www.w3.org/2000/svg" width="7000" height="6000" />`), "huge.svg", "pixel_limit_exceeded"],
    [encode(`<svg xmlns="http://www.w3.org/2000/svg" width="17000" height="1" />`), "wide.svg", "dimension_limit_exceeded"],
  ])("rejects unsafe bytes before publication", async (bytes, name, code) => {
    await expect(processAsset(bytes, name)).rejects.toMatchObject({ code })
  })

  it("rejects an animated supported raster", async () => {
    await expect(processAsset(await animatedWebp(), "motion.webp")).rejects.toMatchObject({
      code: "animated_image",
    })
  })

  it("preserves verified JPEG format while removing source metadata", async () => {
    const source = await sharp({
      create: { width: 8, height: 5, channels: 3, background: "#2563eb" },
    }).jpeg().withMetadata({ orientation: 6, exif: { IFD0: { Copyright: "private" } } }).toBuffer()

    const result = await processAsset(source, "Company Hero.EXE")
    const metadata = await sharp(result.bytes).metadata()

    expect(result).toMatchObject({
      mediaType: "image/jpeg",
      width: 5,
      height: 8,
      safeFilename: "company-hero.jpg",
      byteSize: result.bytes.byteLength,
    })
    expect(result.checksumSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(metadata.format).toBe("jpeg")
    expect(metadata.orientation).toBeUndefined()
    expect(metadata.exif).toBeUndefined()
  })

  it("sanitizes and preserves a safe SVG", async () => {
    const result = await processAsset(encode(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <rect width="48" height="48" fill="#2563eb" />
      </svg>
    `), "Laf Symbol.svg")
    const output = new TextDecoder().decode(result.bytes)

    expect(result).toMatchObject({
      mediaType: "image/svg+xml",
      width: 48,
      height: 48,
      safeFilename: "laf-symbol.svg",
    })
    expect(output).not.toMatch(/<script|(?:href|src)="(?:https?:|data:)/i)
    expect(output).toContain(`xmlns="http://www.w3.org/2000/svg"`)
  })
})
