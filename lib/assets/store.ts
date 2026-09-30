import "server-only"

import { sql, type SQL } from "drizzle-orm"

import type { AdminActor } from "@/lib/auth/admin-api"
import {
  adminAuditLog,
  documentRevisions,
  documentSeries,
  mediaAssetReferences,
  mediaAssets,
} from "@/lib/db/schema"
import { getDb } from "@/lib/db"
import type {
  MediaAsset,
  MediaAssetListFilter,
  MediaAssetPage,
  MediaAssetReference,
  MediaAssetUsage,
  MediaType,
} from "@/lib/assets/types"
import type { ProcessedAsset } from "@/lib/assets/image-processor"

type SqlExecutor = {
  execute(query: SQL): Promise<{ rows: unknown[] }>
}

export type AssetStoreErrorCode = "not_found" | "invalid_state" | "asset_referenced" | "conflict"

export class AssetStoreError extends Error {
  constructor(public readonly code: AssetStoreErrorCode) {
    super(code)
    this.name = "AssetStoreError"
  }
}

export type PendingAssetInput = {
  id: string
  familyId: string
  previousAssetId?: string
  originalFilename: string
  declaredMediaType: string
  stagingPathname: string
}

export type AssetMetadataInput = {
  altKo: string | null
  altEn: string | null
  tags: string[]
}

export type ReadyAssetInput = Pick<
  ProcessedAsset,
  "safeFilename" | "mediaType" | "byteSize" | "width" | "height" | "checksumSha256"
> & {
  publicPathname: string
  publicUrl: string
  readyAt: Date
}

export type AssetReferenceInput = Omit<MediaAssetReference, "id" | "createdAt" | "updatedAt">

export type ProcessingAcquisition =
  | { status: "acquired"; asset: MediaAsset }
  | { status: "current"; asset: MediaAsset }
  | { status: "missing" }

export type DeletionAcquisition =
  | { status: "acquired"; asset: MediaAsset }
  | { status: "current"; asset: MediaAsset }
  | { status: "blocked"; reason: "asset_referenced" | "invalid_state"; asset: MediaAsset }
  | { status: "missing" }

export interface MediaAssetRepository {
  createPending(input: PendingAssetInput, actor: AdminActor): Promise<MediaAsset>
  get(id: string): Promise<MediaAsset | null>
  recordUploadCompleted(
    id: string,
    pathname: string,
    url: string,
    actor: AdminActor,
  ): Promise<MediaAsset>
  acquireProcessing(id: string, actor: AdminActor): Promise<ProcessingAcquisition>
  recordProcessed(id: string, processed: ProcessedAsset, actor: AdminActor): Promise<MediaAsset>
  findDuplicate(checksumSha256: string, excludeId: string): Promise<MediaAsset | null>
  markReady(id: string, input: ReadyAssetInput, actor: AdminActor): Promise<MediaAsset>
  markFailed(id: string, code: string, actor: AdminActor): Promise<MediaAsset>
  releaseProcessing(id: string, code: string, actor: AdminActor): Promise<MediaAsset>
  clearStaging(id: string, actor: AdminActor): Promise<MediaAsset>
  list(filter: MediaAssetListFilter): Promise<MediaAssetPage>
  updateMetadata(id: string, input: AssetMetadataInput, actor: AdminActor): Promise<MediaAsset>
  archive(id: string, actor: AdminActor): Promise<MediaAsset>
  restore(id: string, actor: AdminActor): Promise<MediaAsset>
  acquireDeletion(id: string, actor: AdminActor): Promise<DeletionAcquisition>
  markDeleted(id: string, actor: AdminActor): Promise<MediaAsset>
  addReference(input: AssetReferenceInput, actor: AdminActor): Promise<MediaAssetReference>
  listUsage(assetId: string): Promise<MediaAssetUsage[]>
  listStaleProcessing(before: Date, limit?: number): Promise<MediaAsset[]>
  markProcessingTimedOut(id: string, before: Date): Promise<MediaAsset | null>
  listExpiredStaging(before: Date, limit?: number): Promise<MediaAsset[]>
  expirePending(id: string, before: Date): Promise<MediaAsset>
  listDeleting(limit?: number): Promise<MediaAsset[]>
}

const cleanupActor: AdminActor = { githubId: "system:cron", name: "Asset cleanup" }

const assetColumns = sql.raw(`
  "id", "visibility", "status", "original_filename" AS "originalFilename",
  "safe_filename" AS "safeFilename", "declared_media_type" AS "declaredMediaType",
  "media_type" AS "mediaType", "byte_size" AS "byteSize", "width", "height",
  "checksum_sha256" AS "checksumSha256", "staging_pathname" AS "stagingPathname",
  "staging_url" AS "stagingUrl", "public_pathname" AS "publicPathname",
  "public_url" AS "publicUrl", "alt_ko" AS "altKo", "alt_en" AS "altEn", "tags",
  "failure_code" AS "failureCode", "family_id" AS "familyId",
  "previous_asset_id" AS "previousAssetId", "version", "created_by" AS "createdBy",
  "updated_by" AS "updatedBy", "created_by_name" AS "createdByName",
  "updated_by_name" AS "updatedByName", "created_at" AS "createdAt",
  "updated_at" AS "updatedAt", "ready_at" AS "readyAt", "archived_at" AS "archivedAt",
  "deleted_at" AS "deletedAt", "archived_by" AS "archivedBy", "deleted_by" AS "deletedBy"
`)

function date(value: unknown, field: string): Date {
  const parsed = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid ${field}`)
  return parsed
}

function nullableDate(value: unknown, field: string): Date | null {
  return value === null || value === undefined ? null : date(value, field)
}

function mapAsset(value: unknown): MediaAsset {
  const row = value as Record<string, unknown>
  return {
    id: String(row.id),
    visibility: row.visibility as MediaAsset["visibility"],
    status: row.status as MediaAsset["status"],
    originalFilename: String(row.originalFilename),
    safeFilename: row.safeFilename === null ? null : String(row.safeFilename),
    declaredMediaType: String(row.declaredMediaType),
    mediaType: row.mediaType === null ? null : row.mediaType as MediaType,
    byteSize: row.byteSize === null ? null : Number(row.byteSize),
    width: row.width === null ? null : Number(row.width),
    height: row.height === null ? null : Number(row.height),
    checksumSha256: row.checksumSha256 === null ? null : String(row.checksumSha256),
    stagingPathname: row.stagingPathname === null ? null : String(row.stagingPathname),
    stagingUrl: row.stagingUrl === null ? null : String(row.stagingUrl),
    publicPathname: row.publicPathname === null ? null : String(row.publicPathname),
    publicUrl: row.publicUrl === null ? null : String(row.publicUrl),
    altKo: row.altKo === null ? null : String(row.altKo),
    altEn: row.altEn === null ? null : String(row.altEn),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    failureCode: row.failureCode === null ? null : String(row.failureCode),
    familyId: String(row.familyId),
    previousAssetId: row.previousAssetId === null ? null : String(row.previousAssetId),
    version: Number(row.version),
    createdBy: String(row.createdBy),
    updatedBy: String(row.updatedBy),
    createdByName: String(row.createdByName),
    updatedByName: String(row.updatedByName),
    createdAt: date(row.createdAt, "createdAt"),
    updatedAt: date(row.updatedAt, "updatedAt"),
    readyAt: nullableDate(row.readyAt, "readyAt"),
    archivedAt: nullableDate(row.archivedAt, "archivedAt"),
    deletedAt: nullableDate(row.deletedAt, "deletedAt"),
    archivedBy: row.archivedBy === null ? null : String(row.archivedBy),
    deletedBy: row.deletedBy === null ? null : String(row.deletedBy),
  }
}

function requiredAsset(rows: unknown[], code: AssetStoreErrorCode = "invalid_state"): MediaAsset {
  if (!rows[0]) throw new AssetStoreError(code)
  return mapAsset(rows[0])
}

function auditCte(action: string, actor: AdminActor, metadata: SQL = sql`'{}'::jsonb`): SQL {
  return sql`
    INSERT INTO ${adminAuditLog} (
      "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
    )
    SELECT ${action}, 'media_asset', changed."id"::text,
      ${actor.githubId}, ${actor.name}, ${metadata}
    FROM changed
    RETURNING "id"
  `
}

export function createAssetStore(database: SqlExecutor): MediaAssetRepository {
  return {
    async createPending(input, actor) {
      try {
        const result = input.previousAssetId
          ? await database.execute(sql`
            WITH locked_source AS (
              SELECT * FROM ${mediaAssets}
              WHERE "id" = ${input.previousAssetId}::uuid
                AND "status" IN ('ready', 'archived')
              FOR UPDATE
            ), next_version AS (
              SELECT COALESCE(MAX(family."version"), 0) + 1 AS "version"
              FROM ${mediaAssets} family
              INNER JOIN locked_source source ON source."family_id" = family."family_id"
            ), changed AS (
              INSERT INTO ${mediaAssets} (
                "id", "visibility", "status", "original_filename", "declared_media_type",
                "staging_pathname", "family_id", "previous_asset_id", "version",
                "created_by", "updated_by", "created_by_name", "updated_by_name"
              )
              SELECT ${input.id}::uuid, 'public', 'pending', ${input.originalFilename},
                ${input.declaredMediaType}, ${input.stagingPathname}, source."family_id", source."id",
                next_version."version", ${actor.githubId}, ${actor.githubId}, ${actor.name}, ${actor.name}
              FROM locked_source source CROSS JOIN next_version
              RETURNING *
            ), audit_entry AS (${auditCte("media.intent_created", actor, sql`jsonb_build_object('previousAssetId', ${input.previousAssetId}::text)`)})
            SELECT ${assetColumns} FROM changed
            WHERE (SELECT count(*) FROM audit_entry) >= 0
          `)
          : await database.execute(sql`
          WITH changed AS (
          INSERT INTO ${mediaAssets} (
            "id", "visibility", "status", "original_filename", "declared_media_type",
            "staging_pathname", "family_id", "created_by", "updated_by",
            "created_by_name", "updated_by_name"
          ) VALUES (
            ${input.id}::uuid, 'public', 'pending', ${input.originalFilename},
            ${input.declaredMediaType}, ${input.stagingPathname}, ${input.familyId}::uuid,
            ${actor.githubId}, ${actor.githubId}, ${actor.name}, ${actor.name}
          ) RETURNING *
        ), audit_entry AS (${auditCte("media.intent_created", actor)})
        SELECT ${assetColumns} FROM changed
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
        return requiredAsset(result.rows, "conflict")
      } catch (error) {
        if (error instanceof AssetStoreError) throw error
        if (typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "23505") {
          throw new AssetStoreError("conflict")
        }
        throw error
      }
    },

    async get(id) {
      const result = await database.execute(sql`
        SELECT ${assetColumns} FROM ${mediaAssets} WHERE "id" = ${id}::uuid LIMIT 1
      `)
      return result.rows[0] ? mapAsset(result.rows[0]) : null
    },

    async recordUploadCompleted(id, pathname, url, actor) {
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "staging_url" = ${url}, "updated_by" = ${actor.githubId},
            "updated_by_name" = ${actor.name}, "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" = 'pending'
            AND "staging_pathname" = ${pathname}
            AND "staging_url" IS NULL
          RETURNING *
        ), audit_entry AS (${auditCte("media.upload_completed", actor)}), current_asset AS (
          SELECT * FROM ${mediaAssets}
          WHERE "id" = ${id}::uuid AND "status" = 'pending'
            AND "staging_pathname" = ${pathname} AND "staging_url" = ${url}
            AND NOT EXISTS (SELECT 1 FROM changed)
        )
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
        UNION ALL SELECT ${assetColumns} FROM current_asset
      `)
      return requiredAsset(result.rows)
    },

    async acquireProcessing(id, actor) {
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "status" = 'processing', "failure_code" = NULL,
            "updated_by" = ${actor.githubId}, "updated_by_name" = ${actor.name},
            "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" = 'pending'
          RETURNING *
        ), audit_entry AS (${auditCte("media.processing_acquired", actor)}), current_asset AS (
          SELECT * FROM ${mediaAssets}
          WHERE "id" = ${id}::uuid AND NOT EXISTS (SELECT 1 FROM changed)
        )
        SELECT 'acquired' AS "acquisition", ${assetColumns} FROM changed
        WHERE (SELECT count(*) FROM audit_entry) >= 0
        UNION ALL
        SELECT 'current' AS "acquisition", ${assetColumns} FROM current_asset
      `)
      const row = result.rows[0] as ({ acquisition: "acquired" | "current" } & Record<string, unknown>) | undefined
      if (!row) return { status: "missing" }
      return { status: row.acquisition, asset: mapAsset(row) }
    },

    async recordProcessed(id, processed, actor) {
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "safe_filename" = ${processed.safeFilename}, "media_type" = ${processed.mediaType},
            "byte_size" = ${processed.byteSize}, "width" = ${processed.width},
            "height" = ${processed.height}, "checksum_sha256" = ${processed.checksumSha256},
            "updated_by" = ${actor.githubId}, "updated_by_name" = ${actor.name},
            "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" = 'processing'
          RETURNING *
        ), audit_entry AS (${auditCte("media.processed", actor)})
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredAsset(result.rows)
    },

    async findDuplicate(checksumSha256, excludeId) {
      const result = await database.execute(sql`
        SELECT ${assetColumns} FROM ${mediaAssets}
        WHERE "checksum_sha256" = ${checksumSha256} AND "id" <> ${excludeId}::uuid
          AND "status" IN ('ready', 'archived')
        ORDER BY "created_at" ASC, "id" ASC LIMIT 1
      `)
      return result.rows[0] ? mapAsset(result.rows[0]) : null
    },

    async markReady(id, input, actor) {
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "status" = 'ready', "safe_filename" = ${input.safeFilename},
            "media_type" = ${input.mediaType}, "byte_size" = ${input.byteSize},
            "width" = ${input.width}, "height" = ${input.height},
            "checksum_sha256" = ${input.checksumSha256},
            "public_pathname" = ${input.publicPathname}, "public_url" = ${input.publicUrl},
            "failure_code" = NULL, "ready_at" = ${input.readyAt},
            "updated_by" = ${actor.githubId}, "updated_by_name" = ${actor.name},
            "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" = 'processing'
          RETURNING *
        ), audit_entry AS (${auditCte("media.finalized", actor)})
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredAsset(result.rows)
    },

    async markFailed(id, code, actor) {
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "status" = 'failed', "failure_code" = ${code},
            "updated_by" = ${actor.githubId}, "updated_by_name" = ${actor.name},
            "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" IN ('pending', 'processing')
          RETURNING *
        ), audit_entry AS (${auditCte("media.finalize_failed", actor, sql`jsonb_build_object('code', ${code}::text)`)})
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredAsset(result.rows)
    },

    async releaseProcessing(id, code, actor) {
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "status" = 'pending', "failure_code" = ${code},
            "updated_by" = ${actor.githubId}, "updated_by_name" = ${actor.name},
            "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" = 'processing'
          RETURNING *
        ), audit_entry AS (${auditCte("media.finalize_retryable", actor, sql`jsonb_build_object('code', ${code}::text)`)})
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredAsset(result.rows)
    },

    async clearStaging(id, actor) {
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "staging_pathname" = NULL, "staging_url" = NULL,
            "updated_by" = ${actor.githubId}, "updated_by_name" = ${actor.name},
            "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND ("staging_pathname" IS NOT NULL OR "staging_url" IS NOT NULL)
          RETURNING *
        ), audit_entry AS (${auditCte("media.staging_cleared", actor)}), current_asset AS (
          SELECT * FROM ${mediaAssets}
          WHERE "id" = ${id}::uuid AND "staging_pathname" IS NULL AND "staging_url" IS NULL
            AND NOT EXISTS (SELECT 1 FROM changed)
        )
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
        UNION ALL SELECT ${assetColumns} FROM current_asset
      `)
      return requiredAsset(result.rows, "not_found")
    },

    async list(filter) {
      const conditions: SQL[] = []
      if (filter.search) {
        const query = `%${filter.search}%`
        conditions.push(sql`(
          "original_filename" ILIKE ${query} OR COALESCE("safe_filename", '') ILIKE ${query}
        )`)
      }
      if (filter.mediaType) conditions.push(sql`"media_type" = ${filter.mediaType}`)
      if (filter.status) conditions.push(sql`"status" = ${filter.status}`)
      if (filter.tag) conditions.push(sql`${filter.tag} = ANY("tags")`)
      if (filter.before) {
        conditions.push(sql`("created_at", "id") < (${filter.before.createdAt}, ${filter.before.id}::uuid)`)
      }
      const limit = Math.min(Math.max(filter.limit ?? 30, 1), 100)
      const where = conditions.length ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``
      const result = await database.execute(sql`
        SELECT ${assetColumns} FROM ${mediaAssets} ${where}
        ORDER BY "created_at" DESC, "id" DESC LIMIT ${limit + 1}
      `)
      const assets = result.rows.map(mapAsset)
      const hasMore = assets.length > limit
      const items = assets.slice(0, limit)
      const last = items.at(-1)
      return {
        items,
        nextCursor: hasMore && last ? { createdAt: last.createdAt, id: last.id } : null,
      }
    },

    async updateMetadata(id, input, actor) {
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "alt_ko" = ${input.altKo}, "alt_en" = ${input.altEn},
            "tags" = ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(input.tags)}::jsonb)),
            "updated_by" = ${actor.githubId}, "updated_by_name" = ${actor.name},
            "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" NOT IN ('deleting', 'deleted')
          RETURNING *
        ), audit_entry AS (${auditCte("media.metadata_updated", actor)})
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredAsset(result.rows)
    },

    async archive(id, actor) {
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "status" = 'archived', "archived_at" = statement_timestamp(),
            "archived_by" = ${actor.githubId}, "updated_by" = ${actor.githubId},
            "updated_by_name" = ${actor.name}, "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" = 'ready'
          RETURNING *
        ), audit_entry AS (${auditCte("media.archived", actor)})
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredAsset(result.rows)
    },

    async restore(id, actor) {
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "status" = 'ready', "archived_at" = NULL, "archived_by" = NULL,
            "updated_by" = ${actor.githubId}, "updated_by_name" = ${actor.name},
            "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" = 'archived'
          RETURNING *
        ), audit_entry AS (${auditCte("media.restored", actor)})
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredAsset(result.rows)
    },

    async acquireDeletion(id, actor) {
      const result = await database.execute(sql`
        WITH locked AS (
          SELECT *, (SELECT count(*)::integer FROM ${mediaAssetReferences} r
            WHERE r."asset_id" = a."id") AS "reference_count"
          FROM ${mediaAssets} a WHERE a."id" = ${id}::uuid FOR UPDATE
        ), changed AS (
          UPDATE ${mediaAssets} a
          SET "status" = 'deleting', "deleted_by" = ${actor.githubId},
            "updated_by" = ${actor.githubId}, "updated_by_name" = ${actor.name},
            "updated_at" = statement_timestamp()
          FROM locked l WHERE a."id" = l."id" AND l."reference_count" = 0
            AND l."status" IN ('archived', 'failed')
          RETURNING a.*
        ), audit_entry AS (${auditCte("media.delete_acquired", actor)}), current_asset AS (
          SELECT locked.*, locked."reference_count" AS "referenceCount"
          FROM locked WHERE NOT EXISTS (SELECT 1 FROM changed)
        )
        SELECT 'acquired' AS "acquisition", 0 AS "referenceCount", ${assetColumns} FROM changed
        WHERE (SELECT count(*) FROM audit_entry) >= 0
        UNION ALL
        SELECT 'current' AS "acquisition", "referenceCount", ${assetColumns} FROM current_asset
      `)
      const row = result.rows[0] as ({ acquisition: string; referenceCount: number } & Record<string, unknown>) | undefined
      if (!row) return { status: "missing" }
      const asset = mapAsset(row)
      if (row.acquisition === "acquired") return { status: "acquired", asset }
      if (asset.status === "deleting" || asset.status === "deleted") return { status: "current", asset }
      return {
        status: "blocked",
        reason: Number(row.referenceCount) > 0 ? "asset_referenced" : "invalid_state",
        asset,
      }
    },

    async markDeleted(id, actor) {
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "status" = 'deleted', "deleted_at" = statement_timestamp(),
            "staging_pathname" = NULL, "staging_url" = NULL,
            "public_pathname" = NULL, "public_url" = NULL,
            "updated_by" = ${actor.githubId}, "updated_by_name" = ${actor.name},
            "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" = 'deleting'
          RETURNING *
        ), audit_entry AS (${auditCte("media.deleted", actor)})
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredAsset(result.rows)
    },

    async addReference(input, actor) {
      const result = await database.execute(sql`
        WITH locked AS (
          SELECT "id", "status" FROM ${mediaAssets}
          WHERE "id" = ${input.assetId}::uuid FOR UPDATE
        ), inserted AS (
          INSERT INTO ${mediaAssetReferences} (
            "asset_id", "owner_type", "owner_id", "field", "revision_id"
          )
          SELECT "id", ${input.ownerType}::media_asset_reference_owner_type,
            ${input.ownerId}, ${input.field}, ${input.revisionId}::uuid
          FROM locked WHERE "status" IN ('ready', 'archived')
          ON CONFLICT DO NOTHING
          RETURNING "id", "asset_id" AS "assetId", "owner_type" AS "ownerType",
            "owner_id" AS "ownerId", "field", "revision_id" AS "revisionId",
            "created_at" AS "createdAt", "updated_at" AS "updatedAt"
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          ) SELECT 'media.reference_added', 'media_asset', "assetId"::text,
              ${actor.githubId}, ${actor.name}, jsonb_build_object('ownerType', "ownerType", 'field', "field")
            FROM inserted RETURNING "id"
        )
        SELECT * FROM inserted WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      const row = result.rows[0] as Record<string, unknown> | undefined
      if (!row) throw new AssetStoreError("invalid_state")
      return {
        id: String(row.id),
        assetId: String(row.assetId),
        ownerType: row.ownerType as MediaAssetReference["ownerType"],
        ownerId: String(row.ownerId),
        field: String(row.field),
        revisionId: row.revisionId === null ? null : String(row.revisionId),
        createdAt: date(row.createdAt, "createdAt"),
        updatedAt: date(row.updatedAt, "updatedAt"),
      }
    },

    async listUsage(assetId) {
      const result = await database.execute(sql`
        SELECT ref."revision_id" AS "revisionId", series."kind", revision."locale",
          revision."title", revision."status", ref."field",
          revision."updated_at" AS "updatedAt"
        FROM ${mediaAssetReferences} ref
        INNER JOIN ${documentRevisions} revision ON revision."id" = ref."revision_id"
        INNER JOIN ${documentSeries} series ON series."id" = revision."series_id"
        WHERE ref."asset_id" = ${assetId}::uuid
          AND ref."owner_type" = 'document_revision'
        ORDER BY revision."updated_at" DESC, revision."id" DESC
        LIMIT 100
      `)
      return result.rows.map((value) => {
        const row = value as Record<string, unknown>
        return {
          revisionId: String(row.revisionId),
          kind: row.kind as MediaAssetUsage["kind"],
          locale: row.locale as MediaAssetUsage["locale"],
          title: String(row.title),
          status: row.status as MediaAssetUsage["status"],
          field: String(row.field),
          updatedAt: date(row.updatedAt, "updatedAt"),
        }
      })
    },

    async listStaleProcessing(before, limit = 50) {
      const result = await database.execute(sql`
        SELECT ${assetColumns} FROM ${mediaAssets}
        WHERE "status" = 'processing' AND "updated_at" < ${before}
        ORDER BY "updated_at" ASC, "id" ASC LIMIT ${Math.min(Math.max(limit, 1), 100)}
      `)
      return result.rows.map(mapAsset)
    },

    async markProcessingTimedOut(id, before) {
      const code = "processing_timeout"
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "status" = 'failed', "failure_code" = ${code},
            "updated_by" = ${cleanupActor.githubId}, "updated_by_name" = ${cleanupActor.name},
            "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" = 'processing' AND "updated_at" < ${before}
          RETURNING *
        ), audit_entry AS (${auditCte("media.finalize_failed", cleanupActor, sql`jsonb_build_object('code', ${code}::text)`)})
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return result.rows[0] ? mapAsset(result.rows[0]) : null
    },

    async listExpiredStaging(before, limit = 50) {
      const result = await database.execute(sql`
        SELECT ${assetColumns} FROM ${mediaAssets}
        WHERE "status" IN ('pending', 'failed') AND "staging_pathname" IS NOT NULL
          AND "created_at" < ${before}
        ORDER BY "created_at" ASC, "id" ASC LIMIT ${Math.min(Math.max(limit, 1), 100)}
      `)
      return result.rows.map(mapAsset)
    },

    async expirePending(id, before) {
      const code = "upload_expired"
      const result = await database.execute(sql`
        WITH changed AS (
          UPDATE ${mediaAssets}
          SET "status" = 'failed', "failure_code" = ${code},
            "updated_by" = ${cleanupActor.githubId}, "updated_by_name" = ${cleanupActor.name},
            "updated_at" = statement_timestamp()
          WHERE "id" = ${id}::uuid AND "status" = 'pending' AND "created_at" < ${before}
          RETURNING *
        ), audit_entry AS (${auditCte("media.finalize_failed", cleanupActor, sql`jsonb_build_object('code', ${code}::text)`)})
        SELECT ${assetColumns} FROM changed WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredAsset(result.rows)
    },

    async listDeleting(limit = 50) {
      const result = await database.execute(sql`
        SELECT ${assetColumns} FROM ${mediaAssets}
        WHERE "status" = 'deleting'
        ORDER BY "updated_at" ASC, "id" ASC LIMIT ${Math.min(Math.max(limit, 1), 100)}
      `)
      return result.rows.map(mapAsset)
    },
  }
}

export const assetStore = createAssetStore({
  execute(query) {
    return getDb().execute(query)
  },
})
