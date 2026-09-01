import "server-only"

import { sql, type SQL } from "drizzle-orm"

import type { AdminActor } from "@/lib/auth/admin-api"
import { getDb } from "@/lib/db"
import { adminAuditLog, documentCategories, documentRevisions, documentSeries } from "@/lib/db/schema"
import { documentLocales } from "@/lib/documents/types"
import type {
  AdminDocumentSummary,
  AdminDocumentSummaryFilter,
  DocumentDraftInput,
  DocumentKind,
  DocumentRepository,
  DocumentRevision,
  DocumentSeriesRevisionState,
  Locale,
  PublishedDocument,
  PublishedDocumentFilter,
  PublishedLookup,
  PublishDueResult,
} from "@/lib/documents/types"

type SqlExecutor = {
  execute(query: SQL): Promise<{ rows: unknown[] }>
}

type StoreErrorCode = "conflict" | "not_found"

export class DocumentStoreError extends Error {
  constructor(public readonly code: StoreErrorCode, message: string) {
    super(message)
    this.name = "DocumentStoreError"
  }
}

type RevisionRow = DocumentRevision
type PublishedRow = PublishedDocument

function requiredDate(value: unknown, field: string): Date {
  const date = value instanceof Date ? value : new Date(value as string | number)
  if (!Number.isFinite(date.getTime())) throw new TypeError(`Invalid ${field} timestamp`)
  return date
}

function nullableDate(value: unknown, field: string): Date | null {
  return value == null ? null : requiredDate(value, field)
}

function mapAvailableLocales(value: unknown): Locale[] {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === "string" && /^\{[^{}]*\}$/.test(value)
      ? value.slice(1, -1).split(",").filter(Boolean)
      : []
  if (!candidates.every((locale) => (
    typeof locale === "string" && (documentLocales as readonly string[]).includes(locale)
  ))) return []
  return candidates as Locale[]
}

function mapRevision(value: unknown): DocumentRevision {
  const row = value as RevisionRow
  return {
    id: row.id,
    seriesId: row.seriesId,
    kind: row.kind,
    locale: row.locale,
    slug: row.slug,
    category: row.category,
    pinned: row.pinned,
    revision: row.revision,
    title: row.title,
    summary: row.summary,
    bodyMarkdown: row.bodyMarkdown,
    status: row.status,
    effectiveAt: nullableDate(row.effectiveAt, "effectiveAt"),
    scheduledAt: nullableDate(row.scheduledAt, "scheduledAt"),
    publishedAt: nullableDate(row.publishedAt, "publishedAt"),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    publishedBy: row.publishedBy,
    createdAt: requiredDate(row.createdAt, "createdAt"),
    updatedAt: requiredDate(row.updatedAt, "updatedAt"),
  }
}

function mapPublished(value: unknown): PublishedDocument {
  const row = value as PublishedRow
  return {
    id: row.id,
    seriesId: row.seriesId,
    kind: row.kind,
    locale: row.locale,
    slug: row.slug,
    category: row.category,
    pinned: row.pinned,
    revision: row.revision,
    title: row.title,
    summary: row.summary,
    bodyMarkdown: row.bodyMarkdown,
    effectiveAt: nullableDate(row.effectiveAt, "effectiveAt"),
    publishedAt: requiredDate(row.publishedAt, "publishedAt"),
  }
}

function requiredRevision(rows: unknown[], message: string): DocumentRevision {
  if (!rows[0]) throw new DocumentStoreError("conflict", message)
  return mapRevision(rows[0])
}

const revisionSelect = sql.raw(`
  r."id" AS "id", r."series_id" AS "seriesId", s."kind" AS "kind",
  r."locale" AS "locale", s."slug" AS "slug", s."category" AS "category",
  s."pinned" AS "pinned", r."revision" AS "revision", r."title" AS "title",
  r."summary" AS "summary", r."body_markdown" AS "bodyMarkdown", r."status" AS "status",
  r."effective_at" AS "effectiveAt", r."scheduled_at" AS "scheduledAt",
  r."published_at" AS "publishedAt", r."created_by" AS "createdBy",
  r."updated_by" AS "updatedBy", r."published_by" AS "publishedBy",
  r."created_at" AS "createdAt", r."updated_at" AS "updatedAt"
`)

const publicSelect = sql.raw(`
  r."id" AS "id", r."series_id" AS "seriesId", s."kind" AS "kind",
  r."locale" AS "locale", s."slug" AS "slug", s."category" AS "category",
  s."pinned" AS "pinned", r."revision" AS "revision", r."title" AS "title",
  r."summary" AS "summary", r."body_markdown" AS "bodyMarkdown",
  r."effective_at" AS "effectiveAt", r."published_at" AS "publishedAt"
`)

const adminSummarySelect = sql.raw(`
  r."id" AS "id", s."kind" AS "kind", r."locale" AS "locale",
  r."revision" AS "revision", r."title" AS "title", r."status" AS "status",
  r."scheduled_at" AS "scheduledAt", r."published_at" AS "publishedAt",
  r."updated_at" AS "updatedAt", r."updated_by" AS "updatedBy",
  r."published_by" AS "publishedBy"
`)

function mapAdminSummary(value: unknown): AdminDocumentSummary {
  const row = value as AdminDocumentSummary
  return {
    id: row.id,
    kind: row.kind,
    locale: row.locale,
    revision: row.revision,
    title: row.title,
    status: row.status,
    scheduledAt: nullableDate(row.scheduledAt, "scheduledAt"),
    publishedAt: nullableDate(row.publishedAt, "publishedAt"),
    updatedAt: requiredDate(row.updatedAt, "updatedAt"),
    updatedBy: row.updatedBy,
    publishedBy: row.publishedBy,
  }
}

function inputValues(input: DocumentDraftInput) {
  return {
    category: input.category ?? null,
    pinned: input.pinned ?? false,
    effectiveAt: input.effectiveAt ?? null,
  }
}

export function createDocumentStore(database: SqlExecutor): DocumentRepository {
  return {
    async createDraft(input, actor) {
      const values = inputValues(input)
      const result = await database.execute(sql`
        WITH created_series AS (
          INSERT INTO ${documentSeries} (
            "kind", "slug", "category", "pinned", "created_by", "updated_at"
          ) VALUES (
            ${input.kind}::document_kind, ${input.slug}, ${values.category}, ${values.pinned},
            ${actor.githubId}, statement_timestamp()
          )
          RETURNING *
        ), created_revision AS (
          INSERT INTO ${documentRevisions} (
            "series_id", "locale", "revision", "title", "summary", "body_markdown",
            "status", "effective_at", "created_by", "updated_by", "updated_at"
          )
          SELECT
            created_series."id", ${input.locale}::document_locale, 1, ${input.title},
            ${input.summary}, ${input.bodyMarkdown}, 'draft', ${values.effectiveAt},
            ${actor.githubId}, ${actor.githubId}, statement_timestamp()
          FROM created_series
          RETURNING *
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document.create', 'document_revision', created_revision."id"::text,
            ${actor.githubId}, ${actor.name},
            jsonb_build_object('seriesId', created_revision."series_id", 'locale', created_revision."locale")
          FROM created_revision
          RETURNING "id"
        )
        SELECT ${revisionSelect}
        FROM created_revision r
        INNER JOIN created_series s ON s."id" = r."series_id"
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredRevision(result.rows, "Draft could not be created")
    },

    async getRevision(revisionId) {
      const result = await database.execute(sql`
        SELECT ${revisionSelect}
        FROM ${documentRevisions} r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        WHERE r."id" = ${revisionId}::uuid
        LIMIT 1
      `)
      return result.rows[0] ? mapRevision(result.rows[0]) : null
    },

    async getSeriesState(seriesId) {
      const result = await database.execute(sql`
        SELECT "id", "metadata_locked" AS "metadataLocked"
        FROM ${documentSeries}
        WHERE "id" = ${seriesId}::uuid
        LIMIT 1
      `)
      const row = result.rows[0] as { id: string; metadataLocked: boolean } | undefined
      return row ? { id: row.id, metadataLocked: row.metadataLocked } : null
    },

    async listSeriesRevisionStates(seriesId) {
      const result = await database.execute(sql`
        SELECT r."id" AS "id", r."series_id" AS "seriesId", s."kind" AS "kind",
          r."locale" AS "locale", s."slug" AS "slug", s."category" AS "category",
          s."pinned" AS "pinned", r."status" AS "status"
        FROM ${documentRevisions} r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        WHERE r."series_id" = ${seriesId}::uuid
      `)
      return result.rows.map((row) => {
        const state = row as DocumentSeriesRevisionState
        return {
          id: state.id,
          seriesId: state.seriesId,
          kind: state.kind,
          locale: state.locale,
          slug: state.slug,
          category: state.category,
          pinned: state.pinned,
          status: state.status,
        }
      })
    },

    async updateDraft(revisionId, input, actor) {
      const values = inputValues(input)
      const result = await database.execute(sql`
        WITH locked_series AS (
          SELECT s.*
          FROM ${documentSeries} s
          WHERE s."id" = (
            SELECT r."series_id" FROM ${documentRevisions} r WHERE r."id" = ${revisionId}::uuid
          )
          FOR UPDATE
        ), locked_revision AS (
          SELECT r."id", r."series_id", r."locale", r."status",
            locked_series."kind" AS "series_kind", locked_series."slug" AS "series_slug",
            locked_series."category" AS "series_category", locked_series."pinned" AS "series_pinned",
            locked_series."metadata_locked"
          FROM ${documentRevisions} r
          INNER JOIN locked_series ON locked_series."id" = r."series_id"
          WHERE r."id" = ${revisionId}::uuid
          FOR UPDATE OF r
        ), eligible AS (
          SELECT locked_revision.*
          FROM locked_revision
          WHERE locked_revision."status" = 'draft'
            AND locked_revision."locale" = ${input.locale}::document_locale
            AND (
              (
                locked_revision."series_kind" = ${input.kind}::document_kind
                AND locked_revision."series_slug" = ${input.slug}
                AND locked_revision."series_category" IS NOT DISTINCT FROM ${values.category}
                AND locked_revision."series_pinned" = ${values.pinned}
              )
              OR (
                locked_revision."locale" = 'ko'
                AND NOT locked_revision."metadata_locked"
              )
            )
        ), updated_series AS (
          UPDATE ${documentSeries} s
          SET "kind" = ${input.kind}::document_kind, "slug" = ${input.slug},
            "category" = ${values.category}, "pinned" = ${values.pinned},
            "updated_at" = statement_timestamp()
          FROM eligible
          WHERE s."id" = eligible."series_id"
          RETURNING s.*
        ), updated_revision AS (
          UPDATE ${documentRevisions} r
          SET "title" = ${input.title}, "summary" = ${input.summary},
            "body_markdown" = ${input.bodyMarkdown}, "effective_at" = ${values.effectiveAt},
            "updated_by" = ${actor.githubId}, "updated_at" = statement_timestamp()
          FROM eligible, updated_series
          WHERE r."id" = eligible."id"
          RETURNING r.*
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document.update', 'document_revision', updated_revision."id"::text,
            ${actor.githubId}, ${actor.name},
            jsonb_build_object('seriesId', updated_revision."series_id", 'locale', updated_revision."locale")
          FROM updated_revision
          RETURNING "id"
        )
        SELECT ${revisionSelect}
        FROM updated_revision r
        INNER JOIN updated_series s ON s."id" = r."series_id"
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredRevision(result.rows, "Draft changed before it could be updated")
    },

    async updateDraftSummary(revisionId, summary, expected, actor, metadata) {
      const result = await database.execute(sql`
        WITH locked_revision AS (
          SELECT *
          FROM ${documentRevisions}
          WHERE "id" = ${revisionId}::uuid
          FOR UPDATE
        ), eligible AS (
          SELECT *
          FROM locked_revision
          WHERE locked_revision."status" = 'draft'
            AND locked_revision."title" = ${expected.title}
            AND locked_revision."body_markdown" = ${expected.bodyMarkdown}
            AND locked_revision."summary" = ${expected.summary}
        ), updated_revision AS (
          UPDATE ${documentRevisions} r
          SET "summary" = ${summary}, "updated_by" = ${actor.githubId},
            "updated_at" = statement_timestamp()
          FROM eligible
          WHERE r."id" = eligible."id"
          RETURNING r.*
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document.summary.generate', 'document_revision', updated_revision."id"::text,
            ${actor.githubId}, ${actor.name}, jsonb_build_object(
              'model', ${metadata.model}::text,
              'generatedAt', ${metadata.generatedAt}::timestamptz
            )
          FROM updated_revision
          RETURNING "id"
        )
        SELECT ${revisionSelect}
        FROM updated_revision r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredRevision(result.rows, "Draft changed before its summary could be updated")
    },

    async deleteDraft(revisionId, actor) {
      const result = await database.execute(sql`
        WITH locked_series AS (
          SELECT s.*
          FROM ${documentSeries} s
          WHERE s."id" = (
            SELECT r."series_id" FROM ${documentRevisions} r WHERE r."id" = ${revisionId}::uuid
          )
          FOR UPDATE
        ), locked_revisions AS (
          SELECT r."id", r."series_id", r."locale", r."status"
          FROM ${documentRevisions} r
          INNER JOIN locked_series ON locked_series."id" = r."series_id"
          FOR UPDATE OF r
        ), locked_revision AS (
          SELECT locked_revisions.*,
            (SELECT count(*) FROM locked_revisions) = 1 AS only_revision
          FROM locked_revisions
          WHERE locked_revisions."id" = ${revisionId}::uuid
        ), deletable_revision AS (
          SELECT locked_revision.*
          FROM locked_revision
          WHERE locked_revision."status" = 'draft'
            AND NOT (
              locked_revision."locale" = 'ko'
              AND NOT EXISTS (
                SELECT 1 FROM locked_revisions other_korean
                WHERE other_korean."locale" = 'ko'
                  AND other_korean."id" <> locked_revision."id"
                  AND other_korean."status" IN ('scheduled', 'published', 'archived')
              )
              AND EXISTS (
                SELECT 1 FROM locked_revisions english
                WHERE english."locale" = 'en'
              )
            )
        ), deleted_revision AS (
          DELETE FROM ${documentRevisions} r
          USING deletable_revision
          WHERE r."id" = deletable_revision."id"
          RETURNING r."id", r."series_id", r."locale"
        ), deleted_series AS (
          DELETE FROM ${documentSeries} s
          USING deletable_revision, deleted_revision
          WHERE s."id" = deleted_revision."series_id"
            AND deletable_revision.only_revision
          RETURNING s."id"
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document.delete', 'document_revision', deleted_revision."id"::text,
            ${actor.githubId}, ${actor.name},
            jsonb_build_object('seriesId', deleted_revision."series_id", 'locale', deleted_revision."locale")
          FROM deleted_revision
          RETURNING "id"
        )
        SELECT deleted_revision."id"
        FROM deleted_revision
        WHERE (SELECT count(*) FROM deleted_series) >= 0
          AND (SELECT count(*) FROM audit_entry) >= 0
      `)
      if (!result.rows[0]) throw new DocumentStoreError("conflict", "Only a current draft may be deleted")
    },

    async deleteArchived(revisionId, actor) {
      const result = await database.execute(sql`
        WITH locked_series AS (
          SELECT s.*
          FROM ${documentSeries} s
          WHERE s."id" = (
            SELECT r."series_id" FROM ${documentRevisions} r WHERE r."id" = ${revisionId}::uuid
          )
          FOR UPDATE
        ), locked_revisions AS (
          SELECT r."id", r."series_id", r."locale", r."revision", r."status"
          FROM ${documentRevisions} r
          INNER JOIN locked_series ON locked_series."id" = r."series_id"
          FOR UPDATE OF r
        ), locked_revision AS (
          SELECT locked_revisions.*,
            (SELECT count(*) FROM locked_revisions) = 1 AS only_revision
          FROM locked_revisions
          WHERE locked_revisions."id" = ${revisionId}::uuid
        ), deletable_revision AS (
          SELECT locked_revision.*
          FROM locked_revision
          WHERE locked_revision."status" = 'archived'
            AND NOT (
              locked_revision."locale" = 'ko'
              AND NOT EXISTS (
                SELECT 1 FROM locked_revisions other_korean
                WHERE other_korean."locale" = 'ko'
                  AND other_korean."id" <> locked_revision."id"
              )
              AND EXISTS (
                SELECT 1 FROM locked_revisions english
                WHERE english."locale" = 'en'
              )
            )
        ), deleted_revision AS (
          DELETE FROM ${documentRevisions} r
          USING deletable_revision
          WHERE r."id" = deletable_revision."id"
          RETURNING r."id", r."series_id", r."locale", r."revision"
        ), deleted_series AS (
          DELETE FROM ${documentSeries} s
          USING deletable_revision, deleted_revision
          WHERE s."id" = deleted_revision."series_id"
            AND deletable_revision.only_revision
          RETURNING s."id"
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document.delete', 'document_revision', deleted_revision."id"::text,
            ${actor.githubId}, ${actor.name}, jsonb_build_object(
              'seriesId', deleted_revision."series_id",
              'locale', deleted_revision."locale",
              'revision', deleted_revision."revision",
              'priorStatus', 'archived'
            )
          FROM deleted_revision
          RETURNING "id"
        )
        SELECT deleted_revision."id"
        FROM deleted_revision
        WHERE (SELECT count(*) FROM deleted_series) >= 0
          AND (SELECT count(*) FROM audit_entry) >= 0
      `)
      if (!result.rows[0]) throw new DocumentStoreError("conflict", "Only an eligible archived revision may be deleted")
    },

    async createNextDraft(seriesId, input, actor) {
      const values = inputValues(input)
      const result = await database.execute(sql`
        WITH locked_series AS (
          SELECT * FROM ${documentSeries}
          WHERE "id" = ${seriesId}::uuid
            AND "kind" = ${input.kind}::document_kind
            AND "slug" = ${input.slug}
            AND "category" IS NOT DISTINCT FROM ${values.category}
            AND "pinned" = ${values.pinned}
          FOR UPDATE
        ), locked_revisions AS (
          SELECT r.*
          FROM ${documentRevisions} r
          INNER JOIN locked_series ON locked_series."id" = r."series_id"
          FOR UPDATE OF r
        ), eligible_series AS (
          SELECT locked_series.*
          FROM locked_series
          WHERE NOT EXISTS (
            SELECT 1 FROM locked_revisions editable
            WHERE editable."locale" = ${input.locale}::document_locale
              AND editable."status" IN ('draft', 'scheduled')
          )
            AND (
              ${input.locale}::document_locale <> 'en'
              OR EXISTS (
                SELECT 1 FROM locked_revisions korean
                WHERE korean."locale" = 'ko'
              )
            )
        ), next_number AS (
          SELECT COALESCE(max(r."revision"), 0) + 1 AS revision
          FROM locked_revisions r, eligible_series
          WHERE r."locale" = ${input.locale}::document_locale
        ), created_revision AS (
          INSERT INTO ${documentRevisions} (
            "series_id", "locale", "revision", "title", "summary", "body_markdown",
            "status", "effective_at", "created_by", "updated_by", "updated_at"
          )
          SELECT eligible_series."id", ${input.locale}::document_locale, next_number.revision,
            ${input.title}, ${input.summary}, ${input.bodyMarkdown}, 'draft', ${values.effectiveAt},
            ${actor.githubId}, ${actor.githubId}, statement_timestamp()
          FROM eligible_series, next_number
          RETURNING *
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document.create_revision', 'document_revision', created_revision."id"::text,
            ${actor.githubId}, ${actor.name},
            jsonb_build_object('seriesId', created_revision."series_id", 'locale', created_revision."locale", 'revision', created_revision."revision")
          FROM created_revision
          RETURNING "id"
        )
        SELECT ${revisionSelect}
        FROM created_revision r
        INNER JOIN eligible_series s ON s."id" = r."series_id"
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredRevision(result.rows, "A new draft could not be created")
    },

    async scheduleRevision(revisionId, scheduledAt, snapshot, actor) {
      const result = await database.execute(sql`
        WITH locked_series AS (
          SELECT s.*
          FROM ${documentSeries} s
          WHERE s."id" = (
            SELECT r."series_id" FROM ${documentRevisions} r WHERE r."id" = ${revisionId}::uuid
          )
          FOR UPDATE
        ), locked_revisions AS (
          SELECT r.*, locked_series."kind", locked_series."slug", locked_series."category",
            locked_series."pinned"
          FROM ${documentRevisions} r
          INNER JOIN locked_series ON locked_series."id" = r."series_id"
          FOR UPDATE OF r
        ), locked_revision AS (
          SELECT * FROM locked_revisions WHERE "id" = ${revisionId}::uuid
        ), eligible AS (
          SELECT locked_revision.*
          FROM locked_revision
          WHERE locked_revision."status" = 'draft'
            AND ${scheduledAt} > statement_timestamp()
            AND char_length(locked_revision."slug") BETWEEN 1 AND 160
            AND locked_revision."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
            AND char_length(locked_revision."title") BETWEEN 1 AND 160
            AND char_length(btrim(locked_revision."summary")) BETWEEN 1 AND 240
            AND locked_revision."summary" !~ E'[\\r\\n]'
            AND char_length(locked_revision."body_markdown") BETWEEN 1 AND 200000
            AND locked_revision."title" = ${snapshot.title}
            AND locked_revision."summary" = ${snapshot.summary}
            AND locked_revision."body_markdown" = ${snapshot.bodyMarkdown}
            AND locked_revision."effective_at" IS NOT DISTINCT FROM ${snapshot.effectiveAt}
            AND locked_revision."kind" = ${snapshot.kind}::document_kind
            AND locked_revision."locale" = ${snapshot.locale}::document_locale
            AND locked_revision."slug" = ${snapshot.slug}
            AND locked_revision."category" IS NOT DISTINCT FROM ${snapshot.category}
            AND locked_revision."pinned" = ${snapshot.pinned}
            AND (
              locked_revision."category" IS NULL
              OR EXISTS (
                SELECT 1
                FROM ${documentCategories} managed_category
                WHERE managed_category."kind" = locked_revision."kind"
                  AND managed_category."slug" = locked_revision."category"
              )
            )
        ), locked_metadata AS (
          UPDATE ${documentSeries} s
          SET "metadata_locked" = true
          FROM eligible
          WHERE s."id" = eligible."series_id"
          RETURNING s."id"
        ), scheduled_revision AS (
          UPDATE ${documentRevisions} r
          SET "status" = 'scheduled', "scheduled_at" = ${scheduledAt},
            "summary" = ${snapshot.normalizedSummary},
            "updated_by" = ${actor.githubId}, "updated_at" = statement_timestamp()
          FROM eligible, locked_metadata
          WHERE r."id" = eligible."id"
          RETURNING r.*
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document.schedule', 'document_revision', scheduled_revision."id"::text,
            ${actor.githubId}, ${actor.name},
            jsonb_build_object('seriesId', scheduled_revision."series_id", 'locale', scheduled_revision."locale", 'scheduledAt', scheduled_revision."scheduled_at")
          FROM scheduled_revision
          RETURNING "id"
        )
        SELECT ${revisionSelect}
        FROM scheduled_revision r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredRevision(result.rows, "Draft could not be scheduled")
    },

    async returnScheduledToDraft(revisionId, actor) {
      const result = await database.execute(sql`
        WITH locked_series AS (
          SELECT s.*
          FROM ${documentSeries} s
          WHERE s."id" = (
            SELECT r."series_id" FROM ${documentRevisions} r WHERE r."id" = ${revisionId}::uuid
          )
          FOR UPDATE
        ), locked_revisions AS (
          SELECT r."id", r."series_id", r."locale", r."status", r."scheduled_at"
          FROM ${documentRevisions} r
          INNER JOIN locked_series ON locked_series."id" = r."series_id"
          FOR UPDATE OF r
        ), locked_revision AS (
          SELECT * FROM locked_revisions WHERE "id" = ${revisionId}::uuid
        ), draft_revision AS (
          UPDATE ${documentRevisions} r
          SET "status" = 'draft', "scheduled_at" = NULL,
            "updated_by" = ${actor.githubId}, "updated_at" = statement_timestamp()
          FROM locked_revision
          WHERE r."id" = locked_revision."id"
            AND locked_revision."status" = 'scheduled'
            AND locked_revision."scheduled_at" > statement_timestamp()
          RETURNING r.*
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document.return_to_draft', 'document_revision', draft_revision."id"::text,
            ${actor.githubId}, ${actor.name},
            jsonb_build_object('seriesId', draft_revision."series_id", 'locale', draft_revision."locale")
          FROM draft_revision
          RETURNING "id"
        )
        SELECT ${revisionSelect}
        FROM draft_revision r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredRevision(result.rows, "Scheduled revision could not return to draft")
    },

    async publishRevision(revisionId, snapshot, actor, now) {
      const result = await database.execute(sql`
        WITH locked_series AS (
          SELECT s.*
          FROM ${documentSeries} s
          WHERE s."id" = (
            SELECT r."series_id" FROM ${documentRevisions} r WHERE r."id" = ${revisionId}::uuid
          )
          FOR UPDATE
        ), locked_revisions AS (
          SELECT r.*, locked_series."kind", locked_series."slug",
            locked_series."category", locked_series."pinned"
          FROM ${documentRevisions} r
          INNER JOIN locked_series ON locked_series."id" = r."series_id"
          FOR UPDATE OF r
        ), locked_revision AS (
          SELECT * FROM locked_revisions WHERE "id" = ${revisionId}::uuid
        ), eligible AS (
          SELECT locked_revision.*
          FROM locked_revision
          WHERE locked_revision."status" IN ('draft', 'scheduled')
            AND char_length(locked_revision."title") BETWEEN 1 AND 160
            AND char_length(btrim(locked_revision."summary")) BETWEEN 1 AND 240
            AND locked_revision."summary" !~ E'[\\r\\n]'
            AND char_length(locked_revision."body_markdown") BETWEEN 1 AND 200000
            AND locked_revision."title" = ${snapshot.title}
            AND locked_revision."summary" = ${snapshot.summary}
            AND locked_revision."body_markdown" = ${snapshot.bodyMarkdown}
            AND locked_revision."effective_at" IS NOT DISTINCT FROM ${snapshot.effectiveAt}
            AND locked_revision."kind" = ${snapshot.kind}::document_kind
            AND locked_revision."locale" = ${snapshot.locale}::document_locale
            AND locked_revision."slug" = ${snapshot.slug}
            AND locked_revision."category" IS NOT DISTINCT FROM ${snapshot.category}
            AND locked_revision."pinned" = ${snapshot.pinned}
            AND (
              locked_revision."category" IS NULL
              OR EXISTS (
                SELECT 1
                FROM ${documentCategories} managed_category
                WHERE managed_category."kind" = locked_revision."kind"
                  AND managed_category."slug" = locked_revision."category"
              )
            )
            AND (
              locked_revision."locale" = 'ko'
              OR EXISTS (
                SELECT 1 FROM locked_revisions korean
                WHERE korean."locale" = 'ko' AND korean."status" = 'published'
              )
            )
        ), locked_metadata AS (
          UPDATE ${documentSeries} s
          SET "metadata_locked" = true
          FROM eligible
          WHERE s."id" = eligible."series_id"
          RETURNING s."id"
        ), archived_previous AS (
          UPDATE ${documentRevisions} previous
          SET "status" = 'archived', "updated_by" = ${actor.githubId}, "updated_at" = ${now}
          FROM eligible, locked_metadata
          WHERE previous."series_id" = eligible."series_id"
            AND previous."locale" = eligible."locale"
            AND previous."status" = 'published'
            AND previous."id" <> eligible."id"
          RETURNING previous."id"
        ), published_revision AS (
          UPDATE ${documentRevisions} r
          SET "status" = 'published', "scheduled_at" = NULL, "published_at" = ${now},
            "summary" = ${snapshot.normalizedSummary},
            "published_by" = ${actor.githubId}, "updated_by" = ${actor.githubId}, "updated_at" = ${now}
          FROM eligible
          WHERE r."id" = eligible."id"
            AND (SELECT count(*) FROM archived_previous) >= 0
          RETURNING r.*
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT ${"document.publish"}, 'document_revision', published_revision."id"::text,
            ${actor.githubId}, ${actor.name},
            jsonb_build_object('seriesId', published_revision."series_id", 'locale', published_revision."locale", 'revision', published_revision."revision")
          FROM published_revision
          RETURNING "id"
        )
        SELECT ${revisionSelect}
        FROM published_revision r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return requiredRevision(result.rows, "Revision changed before it could be published")
    },

    async archiveCurrent(seriesId, locale, expectedRevisionId, actor, now) {
      const result = await database.execute(sql`
        WITH locked_series AS (
          SELECT s.*
          FROM ${documentSeries} s
          WHERE s."id" = ${seriesId}::uuid
          FOR UPDATE
        ), locked_revisions AS (
          SELECT r."id", r."series_id", r."locale", r."status"
          FROM ${documentRevisions} r
          INNER JOIN locked_series ON locked_series."id" = r."series_id"
          FOR UPDATE OF r
        ), locked_revision AS (
          SELECT * FROM locked_revisions
          WHERE "id" = ${expectedRevisionId}::uuid
            AND "locale" = ${locale}::document_locale
            AND "status" = 'published'
        ), eligible AS (
          SELECT locked_revision.*
          FROM locked_revision
          WHERE NOT (
            locked_revision."locale" = 'ko'
            AND EXISTS (
              SELECT 1 FROM locked_revisions english
              WHERE english."locale" = 'en' AND english."status" = 'published'
            )
          )
        ), archived_revision AS (
          UPDATE ${documentRevisions} r
          SET "status" = 'archived', "updated_by" = ${actor.githubId}, "updated_at" = ${now}
          FROM eligible
          WHERE r."id" = eligible."id"
          RETURNING r.*
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document.archive', 'document_revision', archived_revision."id"::text,
            ${actor.githubId}, ${actor.name},
            jsonb_build_object('seriesId', archived_revision."series_id", 'locale', archived_revision."locale")
          FROM archived_revision
          RETURNING "id"
        )
        SELECT ${revisionSelect}
        FROM archived_revision r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      return result.rows[0] ? mapRevision(result.rows[0]) : null
    },

    async listAdminSummaries(filter: AdminDocumentSummaryFilter = {}) {
      const conditions: SQL[] = []
      if (filter.seriesId) conditions.push(sql`r."series_id" = ${filter.seriesId}::uuid`)
      if (filter.kind) conditions.push(sql`s."kind" = ${filter.kind}::document_kind`)
      if (filter.locale) conditions.push(sql`r."locale" = ${filter.locale}::document_locale`)
      if (filter.status) conditions.push(sql`r."status" = ${filter.status}::document_status`)
      if (filter.search) {
        conditions.push(sql`r."title" ILIKE ${`%${filter.search.replace(/[\\%_]/g, "\\$&")}%`} ESCAPE '\\'`)
      }
      if (filter.before) {
        conditions.push(sql`(r."updated_at", r."id") < (${filter.before.updatedAt}, ${filter.before.id}::uuid)`)
      }
      const where = conditions.length ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``
      const limit = Math.min(100, Math.max(1, filter.limit ?? 50))
      const result = await database.execute(sql`
        SELECT ${adminSummarySelect}
        FROM ${documentRevisions} r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        ${where}
        ORDER BY r."updated_at" DESC, r."id" DESC
        LIMIT ${limit + 1}
      `)
      const items = result.rows.slice(0, limit).map(mapAdminSummary)
      const last = items.at(-1)
      return {
        items,
        nextCursor: result.rows.length > limit && last
          ? { updatedAt: last.updatedAt, id: last.id }
          : null,
      }
    },

    async listPublished(filter: PublishedDocumentFilter) {
      const category = filter.category ? sql`AND s."category" = ${filter.category}` : sql``
      const searchPattern = filter.search
        ? `%${filter.search.replace(/[\\%_]/g, "\\$&")}%`
        : null
      const search = searchPattern
        ? sql`AND (
            r."title" ILIKE ${searchPattern} ESCAPE '\\'
            OR r."summary" ILIKE ${searchPattern} ESCAPE '\\'
          )`
        : sql``
      const oldestFirst = filter.sort === "oldest"
      const before = filter.before
        ? sql`AND (
            (s."pinned" = false AND ${filter.before.pinned} = true)
            OR (
              s."pinned" = ${filter.before.pinned}
              AND ${oldestFirst
                ? sql`(r."published_at", r."id") > (${filter.before.publishedAt}, ${filter.before.id}::uuid)`
                : sql`(r."published_at", r."id") < (${filter.before.publishedAt}, ${filter.before.id}::uuid)`}
            )
          )`
        : sql``
      const order = oldestFirst
        ? sql`s."pinned" DESC, r."published_at" ASC, r."id" ASC`
        : sql`s."pinned" DESC, r."published_at" DESC, r."id" DESC`
      const limit = Math.min(50, Math.max(1, filter.limit ?? 20))
      const result = await database.execute(sql`
        SELECT ${publicSelect}
        FROM ${documentRevisions} r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        WHERE r."status" = 'published' AND s."archived_at" IS NULL
          AND s."kind" = ${filter.kind}::document_kind
          AND r."locale" = ${filter.locale}::document_locale
          ${category} ${search} ${before}
        ORDER BY ${order}
        LIMIT ${limit}
      `)
      return result.rows.map(mapPublished)
    },

    async getPublished(kind: DocumentKind, slug: string, locale: Locale): Promise<PublishedLookup> {
      const result = await database.execute(sql`
        SELECT
          localized."id" AS "id", s."id" AS "seriesId", s."kind" AS "kind",
          localized."locale" AS "locale", s."slug" AS "slug", s."category" AS "category",
          s."pinned" AS "pinned", localized."revision" AS "revision",
          localized."title" AS "title", localized."summary" AS "summary",
          localized."body_markdown" AS "bodyMarkdown", localized."effective_at" AS "effectiveAt",
          localized."published_at" AS "publishedAt",
          COALESCE(available."locales", ARRAY[]::text[]) AS "availableLocales"
        FROM ${documentSeries} s
        LEFT JOIN LATERAL (
          SELECT r."id", r."locale", r."revision", r."title", r."summary",
            r."body_markdown", r."effective_at", r."published_at"
          FROM ${documentRevisions} r
          WHERE r."series_id" = s."id" AND r."locale" = ${locale}::document_locale
            AND r."status" = 'published'
          LIMIT 1
        ) localized ON true
        LEFT JOIN LATERAL (
          SELECT array_agg(r."locale"::text ORDER BY r."locale") AS locales
          FROM ${documentRevisions} r
          WHERE r."series_id" = s."id" AND r."status" = 'published'
        ) available ON true
        WHERE s."kind" = ${kind}::document_kind AND s."slug" = ${slug}
          AND s."archived_at" IS NULL
        LIMIT 1
      `)
      const row = result.rows[0] as (PublishedRow & { id: string | null; availableLocales?: unknown }) | undefined
      if (!row) return { document: null, availableLocales: [] }
      return {
        document: row.id ? mapPublished(row) : null,
        availableLocales: mapAvailableLocales(row.availableLocales),
      }
    },

    async publishDue(now: Date, actor: AdminActor): Promise<PublishDueResult> {
      const due = await database.execute(sql`
        SELECT r."id", s."kind", r."locale", s."slug", s."category", s."pinned",
          r."title", r."summary", r."body_markdown" AS "bodyMarkdown",
          r."effective_at" AS "effectiveAt"
        FROM ${documentRevisions} r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        WHERE r."status" = 'scheduled' AND r."scheduled_at" <= ${now}
        ORDER BY r."scheduled_at" ASC, CASE r."locale" WHEN 'ko' THEN 0 ELSE 1 END, r."id" ASC
      `)
      const publishedRevisions: PublishDueResult["publishedRevisions"] = []
      const failedIds: string[] = []
      for (const row of due.rows as Array<{
        id: string
        kind: DocumentKind
        locale: Locale
        slug: string
        category: string | null
        pinned: boolean
        title: string
        summary: string
        bodyMarkdown: string
        effectiveAt: Date | null
      }>) {
        try {
          const published = await this.publishRevision(row.id, {
            kind: row.kind,
            locale: row.locale,
            slug: row.slug,
            category: row.category,
            pinned: row.pinned,
            title: row.title,
            summary: row.summary,
            normalizedSummary: row.summary.trim(),
            bodyMarkdown: row.bodyMarkdown,
            effectiveAt: row.effectiveAt,
          }, actor, now)
          publishedRevisions.push({
            id: published.id,
            kind: published.kind,
            locale: published.locale,
            slug: published.slug,
          })
        } catch {
          failedIds.push(row.id)
        }
      }
      return { publishedRevisions, failedIds }
    },
  }
}

export const documentStore = createDocumentStore({
  execute(query) {
    return getDb().execute(query)
  },
})
