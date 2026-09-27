import { z } from "zod"

const payloadSchema = z.object({
  v: z.literal(1),
  createdAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
}).strict()

export type AssetCursor = { createdAt: Date; id: string }

export function encodeAssetCursor(cursor: AssetCursor): string {
  return Buffer.from(JSON.stringify({
    v: 1,
    createdAt: cursor.createdAt.toISOString(),
    id: cursor.id,
  })).toString("base64url")
}

export function decodeAssetCursor(value: string): AssetCursor | null {
  if (!value || value.length > 512) return null
  try {
    const parsed = payloadSchema.parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")))
    const createdAt = new Date(parsed.createdAt)
    if (Number.isNaN(createdAt.getTime())) return null
    return { createdAt, id: parsed.id }
  } catch {
    return null
  }
}
