import type { MediaType } from "@/lib/assets/types"

export type MediaTelemetryName =
  | "media.intent_created"
  | "media.upload_completed"
  | "media.finalized"
  | "media.finalize_failed"
  | "media.duplicate_detected"
  | "media.deleted"
  | "media.cleanup_completed"

export type MediaTelemetryFields = Partial<{
  assetId: string
  duplicateAssetId: string
  code: string
  mediaType: MediaType
  count: number
  byteSize: number
  processingTimedOut: number
  stagingDeleted: number
  deletionsCompleted: number
  failures: number
}>

export interface MediaTelemetry {
  record(name: MediaTelemetryName, fields: MediaTelemetryFields): void
}

const allowedFields = new Set([
  "assetId",
  "duplicateAssetId",
  "code",
  "mediaType",
  "count",
  "byteSize",
  "processingTimedOut",
  "stagingDeleted",
  "deletionsCompleted",
  "failures",
])

export function createMediaTelemetry(
  emit: (name: MediaTelemetryName, fields: MediaTelemetryFields) => void = () => undefined,
): MediaTelemetry {
  return {
    record(name, fields) {
      if (Object.keys(fields).some((field) => !allowedFields.has(field))) {
        throw new Error("unsafe_media_telemetry")
      }
      emit(name, { ...fields })
    },
  }
}

export const mediaTelemetry = createMediaTelemetry()
