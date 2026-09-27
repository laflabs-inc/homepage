import { AssetError } from "@/lib/assets/errors"
import { mediaTypes, type UploadIntentInput } from "@/lib/assets/types"

export const MAX_ASSET_BYTES = 10 * 1024 * 1024
export const MAX_SVG_BYTES = 2 * 1024 * 1024
export const MAX_ASSET_PIXELS = 40_000_000
export const MAX_ASSET_DIMENSION = 16_384
export const MAX_FILENAME_CODEPOINTS = 160

const supportedTypes = new Set<string>(mediaTypes)

export function parseUploadIntent(value: unknown): UploadIntentInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AssetError("invalid_input")
  }

  const input = value as Record<string, unknown>
  const originalFilename = typeof input.originalFilename === "string"
    ? input.originalFilename.trim()
    : ""
  const declaredMediaType = typeof input.declaredMediaType === "string"
    ? input.declaredMediaType.trim().toLowerCase()
    : ""
  const byteSize = input.byteSize

  if (
    !originalFilename ||
    Array.from(originalFilename).length > MAX_FILENAME_CODEPOINTS ||
    /[\u0000-\u001f\u007f]/.test(originalFilename) ||
    !Number.isSafeInteger(byteSize) ||
    (byteSize as number) <= 0
  ) {
    throw new AssetError("invalid_input")
  }
  if (!supportedTypes.has(declaredMediaType)) throw new AssetError("unsupported_type")
  if ((byteSize as number) > MAX_ASSET_BYTES) throw new AssetError("file_too_large")

  return { originalFilename, declaredMediaType, byteSize: byteSize as number }
}
