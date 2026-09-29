"use client"

import { uploadPresigned } from "@vercel/blob/client"

const UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"
const UUID = new RegExp(`^${UUID_PATTERN}$`, "i")
const STAGING_PATHNAME = new RegExp(`^staging/(${UUID_PATTERN})/${UUID_PATTERN}$`, "i")

export type UploadProgress = {
  loaded: number
  total: number
  percentage: number
}

export type UploadStagedAssetInput = {
  file: File
  pathname: string
  assetId: string
  onProgress?: (progress: UploadProgress) => void
}

export async function uploadStagedAsset({
  file,
  pathname,
  assetId,
  onProgress,
}: UploadStagedAssetInput): Promise<void> {
  const pathnameMatch = STAGING_PATHNAME.exec(pathname)
  if (!UUID.test(assetId) || !pathnameMatch || pathnameMatch[1].toLowerCase() !== assetId.toLowerCase()) {
    throw new Error("invalid_upload_intent")
  }

  await uploadPresigned(pathname, file, {
    access: "private",
    clientPayload: JSON.stringify({ assetId }),
    contentType: file.type,
    handleUploadUrl: "/api/admin/assets/upload",
    onUploadProgress: onProgress
      ? ({ loaded, total, percentage }) => onProgress({ loaded, total, percentage })
      : undefined,
  })
}
