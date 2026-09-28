import type { MediaAsset, MediaAssetStatus, MediaAssetVisibility, MediaType } from "@/lib/assets/types"

export type AdminAssetSummary = {
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
  altKo: string | null
  altEn: string | null
  tags: string[]
  familyId: string
  previousAssetId: string | null
  version: number
  createdAt: string
  updatedAt: string
  readyAt: string | null
  archivedAt: string | null
  deletedAt: string | null
  src: string | null
}

export function toAdminAsset(asset: MediaAsset): AdminAssetSummary {
  const deliverable = (asset.status === "ready" || asset.status === "archived") && asset.safeFilename
  return {
    id: asset.id,
    visibility: asset.visibility,
    status: asset.status,
    originalFilename: asset.originalFilename,
    safeFilename: asset.safeFilename,
    declaredMediaType: asset.declaredMediaType,
    mediaType: asset.mediaType,
    byteSize: asset.byteSize,
    width: asset.width,
    height: asset.height,
    checksumSha256: asset.checksumSha256,
    altKo: asset.altKo,
    altEn: asset.altEn,
    tags: asset.tags,
    familyId: asset.familyId,
    previousAssetId: asset.previousAssetId,
    version: asset.version,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
    readyAt: asset.readyAt?.toISOString() ?? null,
    archivedAt: asset.archivedAt?.toISOString() ?? null,
    deletedAt: asset.deletedAt?.toISOString() ?? null,
    src: deliverable ? `/media/${asset.id}/${asset.safeFilename}` : null,
  }
}
