import type { MediaType } from "@/lib/assets/types"
import { MAX_FILENAME_CODEPOINTS } from "@/lib/assets/policy"

const extensions: Record<MediaType, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
}

export function safeFilename(originalFilename: string, mediaType: MediaType): string {
  const basename = originalFilename.split(/[\\/]/).at(-1) ?? ""
  const extensionAt = basename.lastIndexOf(".")
  const sourceStem = extensionAt > 0 ? basename.slice(0, extensionAt) : basename
  const normalized = sourceStem
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[\s_]+/gu, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  const extension = extensions[mediaType]
  const maximumStemLength = MAX_FILENAME_CODEPOINTS - Array.from(extension).length
  const truncated = Array.from(normalized || "asset").slice(0, maximumStemLength).join("")
    .replace(/-+$/g, "")

  return `${truncated || "asset"}${extension}`
}
