import { getTableConfig } from "drizzle-orm/pg-core"
import { describe, expect, it } from "vitest"

import * as databaseSchema from "@/lib/db/schema"

describe("media asset schema", () => {
  it("declares the complete asset lifecycle and visibility contract", () => {
    const schema = databaseSchema as unknown as Record<string, { enumValues?: string[] }>

    expect(schema.mediaAssetVisibilityEnum?.enumValues).toEqual(["public", "private"])
    expect(schema.mediaAssetStatusEnum?.enumValues).toEqual([
      "pending",
      "processing",
      "ready",
      "failed",
      "archived",
      "deleting",
      "deleted",
    ])
    expect(schema.mediaAssetReferenceOwnerTypeEnum?.enumValues).toEqual(["document_revision"])
  })

  it("stores lifecycle, immutable Blob paths, lineage, ownership, and localized metadata", () => {
    const schema = databaseSchema as unknown as Record<string, unknown>
    expect(schema.mediaAssets).toBeDefined()
    if (!schema.mediaAssets) return

    const config = getTableConfig(schema.mediaAssets as Parameters<typeof getTableConfig>[0])
    expect(config.columns.map(({ name }) => name)).toEqual([
      "id",
      "visibility",
      "status",
      "original_filename",
      "safe_filename",
      "declared_media_type",
      "media_type",
      "byte_size",
      "width",
      "height",
      "checksum_sha256",
      "staging_pathname",
      "staging_url",
      "public_pathname",
      "public_url",
      "alt_ko",
      "alt_en",
      "tags",
      "failure_code",
      "family_id",
      "previous_asset_id",
      "version",
      "created_by",
      "updated_by",
      "created_by_name",
      "updated_by_name",
      "created_at",
      "updated_at",
      "ready_at",
      "archived_at",
      "deleted_at",
      "archived_by",
      "deleted_by",
    ])
    expect(config.indexes.map(({ config: index }) => index.name)).toEqual(expect.arrayContaining([
      "media_assets_status_created_idx",
      "media_assets_checksum_idx",
      "media_assets_family_version_unique",
      "media_public_pathname_unique",
      "media_staging_pathname_unique",
    ]))
  })

  it("stores restricted owner references separately from asset metadata", () => {
    const schema = databaseSchema as unknown as Record<string, unknown>
    expect(schema.mediaAssetReferences).toBeDefined()
    if (!schema.mediaAssetReferences) return

    expect(getTableConfig(
      schema.mediaAssetReferences as Parameters<typeof getTableConfig>[0],
    ).columns.map(({ name }) => name)).toEqual([
      "id",
      "asset_id",
      "owner_type",
      "owner_id",
      "field",
      "revision_id",
      "created_at",
      "updated_at",
    ])
  })
})
