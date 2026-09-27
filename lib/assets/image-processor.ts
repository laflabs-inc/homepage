import { createHash } from "node:crypto"
import sharp, { type Metadata } from "sharp"

import { AssetError } from "@/lib/assets/errors"
import { safeFilename } from "@/lib/assets/filename"
import {
  MAX_ASSET_BYTES,
  MAX_ASSET_DIMENSION,
  MAX_ASSET_PIXELS,
} from "@/lib/assets/policy"
import { sanitizeSvg } from "@/lib/assets/svg-sanitizer"
import type { MediaType } from "@/lib/assets/types"

export type ProcessedAsset = {
  bytes: Uint8Array
  mediaType: MediaType
  byteSize: number
  width: number | null
  height: number | null
  checksumSha256: string
  safeFilename: string
}

const rasterTypes: Partial<Record<Metadata["format"] & string, MediaType>> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heif: "image/avif",
}

function looksLikeSvg(bytes: Uint8Array): boolean {
  try {
    const prefix = new TextDecoder("utf-8", { fatal: true }).decode(bytes.slice(0, 1024))
      .replace(/^\uFEFF/, "")
      .trimStart()
    return /^(?:<\?xml[\s\S]*?\?>\s*)?<svg(?:\s|>)/.test(prefix)
  } catch {
    return false
  }
}

function hasSupportedRasterSignature(bytes: Uint8Array): boolean {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return true
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) return true
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp") {
    const brand = String.fromCharCode(...bytes.slice(8, 12))
    return brand === "avif" || brand === "avis"
  }
  return false
}

function assertDimensions(width: number | null, height: number | null): void {
  if (width === null || height === null) return
  if (width > MAX_ASSET_DIMENSION || height > MAX_ASSET_DIMENSION) {
    throw new AssetError("dimension_limit_exceeded")
  }
  if (width * height > MAX_ASSET_PIXELS) throw new AssetError("pixel_limit_exceeded")
}

function finalize(
  bytes: Uint8Array,
  mediaType: MediaType,
  width: number | null,
  height: number | null,
  originalFilename: string,
): ProcessedAsset {
  return {
    bytes,
    mediaType,
    byteSize: bytes.byteLength,
    width,
    height,
    checksumSha256: createHash("sha256").update(bytes).digest("hex"),
    safeFilename: safeFilename(originalFilename, mediaType),
  }
}

async function processRaster(input: Uint8Array, originalFilename: string): Promise<ProcessedAsset> {
  if (!hasSupportedRasterSignature(input)) throw new AssetError("unsupported_type")

  let metadata: Metadata
  try {
    metadata = await sharp(input, {
      animated: true,
      failOn: "warning",
      limitInputPixels: MAX_ASSET_PIXELS,
    }).metadata()
  } catch (error) {
    if (error instanceof Error && /pixel limit/i.test(error.message)) {
      throw new AssetError("pixel_limit_exceeded")
    }
    throw new AssetError("invalid_image")
  }

  if ((metadata.pages ?? 1) > 1) throw new AssetError("animated_image")
  const mediaType = metadata.format ? rasterTypes[metadata.format] : undefined
  if (!mediaType || (mediaType === "image/avif" && metadata.compression !== "av1")) {
    throw new AssetError("unsupported_type")
  }

  const width = metadata.autoOrient?.width ?? metadata.width ?? null
  const height = metadata.autoOrient?.height ?? metadata.height ?? null
  assertDimensions(width, height)

  try {
    let pipeline = sharp(input, {
      failOn: "warning",
      limitInputPixels: MAX_ASSET_PIXELS,
    }).rotate()
    if (mediaType === "image/jpeg") pipeline = pipeline.jpeg()
    if (mediaType === "image/png") pipeline = pipeline.png()
    if (mediaType === "image/webp") pipeline = pipeline.webp()
    if (mediaType === "image/avif") pipeline = pipeline.avif()
    const output = await pipeline.toBuffer()
    return finalize(output, mediaType, width, height, originalFilename)
  } catch {
    throw new AssetError("invalid_image")
  }
}

export async function processAsset(
  input: Uint8Array,
  originalFilename: string,
): Promise<ProcessedAsset> {
  if (input.byteLength === 0) throw new AssetError("invalid_image")
  if (input.byteLength > MAX_ASSET_BYTES) throw new AssetError("file_too_large")

  if (looksLikeSvg(input)) {
    const sanitized = sanitizeSvg(input)
    assertDimensions(sanitized.width, sanitized.height)
    return finalize(
      sanitized.bytes,
      "image/svg+xml",
      sanitized.width,
      sanitized.height,
      originalFilename,
    )
  }

  return processRaster(input, originalFilename)
}
