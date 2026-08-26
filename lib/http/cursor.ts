import { z } from "zod"

import type { AdminDocumentSummaryFilter, PublishedDocumentFilter } from "@/lib/documents/types"

const publishedCursorSchema = z.object({
  pinned: z.boolean(),
  publishedAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
}).strict()

const adminCursorSchema = z.object({
  updatedAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
}).strict()

export type PublishedCursor = NonNullable<PublishedDocumentFilter["before"]>
export type AdminDocumentCursor = NonNullable<AdminDocumentSummaryFilter["before"]>

export function encodeAdminDocumentCursor(cursor: AdminDocumentCursor): string {
  return Buffer.from(JSON.stringify({
    updatedAt: cursor.updatedAt.toISOString(),
    id: cursor.id,
  }), "utf8").toString("base64url")
}

export function decodeAdminDocumentCursor(value: string): AdminDocumentCursor | null {
  if (!value || value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) return null

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8")
    if (Buffer.from(decoded, "utf8").toString("base64url") !== value) return null
    const parsed = adminCursorSchema.safeParse(JSON.parse(decoded))
    if (!parsed.success) return null
    return { updatedAt: new Date(parsed.data.updatedAt), id: parsed.data.id }
  } catch {
    return null
  }
}

export function encodePublishedCursor(cursor: PublishedCursor): string {
  return Buffer.from(JSON.stringify({
    pinned: cursor.pinned,
    publishedAt: cursor.publishedAt.toISOString(),
    id: cursor.id,
  }), "utf8").toString("base64url")
}

export function decodePublishedCursor(value: string): PublishedCursor | null {
  if (!value || value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) return null

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8")
    if (Buffer.from(decoded, "utf8").toString("base64url") !== value) return null
    const parsed = publishedCursorSchema.safeParse(JSON.parse(decoded))
    if (!parsed.success) return null

    return {
      pinned: parsed.data.pinned,
      publishedAt: new Date(parsed.data.publishedAt),
      id: parsed.data.id,
    }
  } catch {
    return null
  }
}
