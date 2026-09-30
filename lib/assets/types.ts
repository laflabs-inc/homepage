export const mediaAssetVisibilities = ["public", "private"] as const
export type MediaAssetVisibility = (typeof mediaAssetVisibilities)[number]

export const mediaAssetStatuses = [
  "pending",
  "processing",
  "ready",
  "failed",
  "archived",
  "deleting",
  "deleted",
] as const
export type MediaAssetStatus = (typeof mediaAssetStatuses)[number]

export const mediaTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
] as const
export type MediaType = (typeof mediaTypes)[number]

export type MediaAsset = {
  id: string
  visibility: MediaAssetVisibility
  status: MediaAssetStatus
  originalFilename: string
  safeFilename: string | null
  declaredMediaType: string
  mediaType: MediaType | null
  byteSize: number | null
  width: number | null
  height: number | null
  checksumSha256: string | null
  stagingPathname: string | null
  stagingUrl: string | null
  publicPathname: string | null
  publicUrl: string | null
  altKo: string | null
  altEn: string | null
  tags: string[]
  failureCode: string | null
  familyId: string
  previousAssetId: string | null
  version: number
  createdBy: string
  updatedBy: string
  createdByName: string
  updatedByName: string
  createdAt: Date
  updatedAt: Date
  readyAt: Date | null
  archivedAt: Date | null
  deletedAt: Date | null
  archivedBy: string | null
  deletedBy: string | null
}

export type MediaAssetReference = {
  id: string
  assetId: string
  ownerType: "document_revision"
  ownerId: string
  field: string
  revisionId: string | null
  createdAt: Date
  updatedAt: Date
}

export type MediaAssetUsage = {
  revisionId: string
  kind: DocumentKind
  locale: Locale
  title: string
  status: DocumentStatus
  field: string
  updatedAt: Date
}

export type MediaAssetListFilter = {
  search?: string
  mediaType?: MediaType
  status?: MediaAssetStatus
  tag?: string
  limit?: number
  before?: { createdAt: Date; id: string }
}

export type MediaAssetPage = {
  items: MediaAsset[]
  nextCursor: MediaAssetListFilter["before"] | null
}

export type UploadIntentInput = {
  originalFilename: string
  declaredMediaType: string
  byteSize: number
  replaceAssetId?: string
}

export type UploadIntent = {
  assetId: string
  pathname: string
  acceptedTypes: readonly MediaType[]
  maxBytes: number
}
import type { DocumentKind, DocumentStatus, Locale } from "@/lib/documents/types"
