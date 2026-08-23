import "server-only"

import { sql, type SQL } from "drizzle-orm"

import type { AdminActor } from "@/lib/auth/admin-api"
import { getDb } from "@/lib/db"
import { adminAuditLog, documentRevisions, documentSeries } from "@/lib/db/schema"
import type {
  AdminDocumentFilter,
  DocumentDraftInput,
  DocumentKind,
  DocumentRepository,
  DocumentRevision,
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
type PublishedRow = PublishedDocument & { availableLocales?: Locale[] }

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
    effectiveAt: row.effectiveAt,
    scheduledAt: row.scheduledAt,
    publishedAt: row.publishedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    publishedBy: row.publishedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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
    effectiveAt: row.effectiveAt,
    publishedAt: row.publishedAt,
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

    async updateDraft(revisionId, input, actor) {
      const values = inputValues(input)
      const result = await database.execute(sql`
        WITH locked_revision AS (
          SELECT r."id", r."series_id", r."locale", r."status"
          FROM ${documentRevisions} r
          WHERE r."id" = ${revisionId}::uuid
          FOR UPDATE
        ), eligible AS (
          SELECT locked_revision.*
          FROM locked_revision
          INNER JOIN ${documentSeries} s ON s."id" = locked_revision."series_id"
          WHERE locked_revision."status" = 'draft'
            AND locked_revision."locale" = ${input.locale}::document_locale
            AND (
              (s."kind" = ${input.kind}::document_kind AND s."slug" = ${input.slug})
              OR NOT EXISTS (
                SELECT 1 FROM ${documentRevisions} history
                WHERE history."series_id" = locked_revision."series_id"
                  AND history."status" IN ('published', 'archived')
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

    async deleteDraft(revisionId, actor) {
      const result = await database.execute(sql`
        WITH locked_revision AS (
          SELECT r."id", r."series_id", r."locale", r."status",
            NOT EXISTS (
              SELECT 1 FROM ${documentRevisions} sibling
              WHERE sibling."series_id" = r."series_id" AND sibling."id" <> r."id"
            ) AS only_revision
          FROM ${documentRevisions} r
          INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
          WHERE r."id" = ${revisionId}::uuid
          FOR UPDATE OF r, s
        ), deletable_revision AS (
          SELECT locked_revision.*
          FROM locked_revision
          WHERE locked_revision."status" = 'draft'
            AND NOT (
              locked_revision."locale" = 'ko'
              AND NOT EXISTS (
                SELECT 1 FROM ${documentRevisions} other_korean
                WHERE other_korean."series_id" = locked_revision."series_id"
                  AND other_korean."locale" = 'ko'
                  AND other_korean."id" <> locked_revision."id"
                  AND other_korean."status" IN ('scheduled', 'published', 'archived')
              )
              AND EXISTS (
                SELECT 1 FROM ${documentRevisions} english
                WHERE english."series_id" = locked_revision."series_id"
                  AND english."locale" = 'en'
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
        ), eligible_series AS (
          SELECT locked_series.*
          FROM locked_series
          WHERE NOT EXISTS (
            SELECT 1 FROM ${documentRevisions} editable
            WHERE editable."series_id" = locked_series."id"
              AND editable."locale" = ${input.locale}::document_locale
              AND editable."status" IN ('draft', 'scheduled')
          )
            AND (
              ${input.locale}::document_locale <> 'en'
              OR EXISTS (
                SELECT 1 FROM ${documentRevisions} korean
                WHERE korean."series_id" = locked_series."id"
                  AND korean."locale" = 'ko'
              )
            )
        ), next_number AS (
          SELECT COALESCE(max(r."revision"), 0) + 1 AS revision
          FROM ${documentRevisions} r, eligible_series
          WHERE r."series_id" = eligible_series."id" AND r."locale" = ${input.locale}::document_locale
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

    async scheduleRevision(revisionId, scheduledAt, actor) {
      const result = await database.execute(sql`
        WITH locked_revision AS (
          SELECT r.*, s."kind", s."slug", s."category"
          FROM ${documentRevisions} r
          INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
          WHERE r."id" = ${revisionId}::uuid
          FOR UPDATE OF r, s
        ), eligible AS (
          SELECT locked_revision.*
          FROM locked_revision
          WHERE locked_revision."status" = 'draft'
            AND char_length(locked_revision."slug") BETWEEN 1 AND 160
            AND locked_revision."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
            AND char_length(locked_revision."title") BETWEEN 1 AND 160
            AND char_length(locked_revision."summary") BETWEEN 1 AND 240
            AND char_length(locked_revision."body_markdown") BETWEEN 1 AND 200000
            AND (
              (locked_revision."kind" = 'notice' AND (locked_revision."category" IS NULL OR locked_revision."category" IN ('general', 'service', 'maintenance', 'security')))
              OR (locked_revision."kind" = 'legal' AND (locked_revision."category" IS NULL OR locked_revision."category" IN ('privacy', 'terms', 'cookies', 'policy')))
              OR (locked_revision."kind" = 'disclosure' AND (locked_revision."category" IS NULL OR locked_revision."category" IN ('corporate', 'financial', 'governance', 'material')))
              OR (locked_revision."kind" = 'design' AND (locked_revision."category" IS NULL OR locked_revision."category" IN ('foundation', 'brand', 'component', 'resource')))
            )
        ), scheduled_revision AS (
          UPDATE ${documentRevisions} r
          SET "status" = 'scheduled', "scheduled_at" = ${scheduledAt},
            "updated_by" = ${actor.githubId}, "updated_at" = statement_timestamp()
          FROM eligible
          WHERE r."id" = eligible."id"
            AND ${scheduledAt} > statement_timestamp()
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
        WITH locked_revision AS (
          SELECT "id", "series_id", "locale", "status", "scheduled_at"
          FROM ${documentRevisions}
          WHERE "id" = ${revisionId}::uuid
          FOR UPDATE
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

    async publishRevision(revisionId, actor, now) {
      const result = await database.execute(sql`
        WITH locked_revision AS (
          SELECT r.*, s."kind", s."slug", s."category", s."pinned"
          FROM ${documentRevisions} r
          INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
          WHERE r."id" = ${revisionId}::uuid
          FOR UPDATE
        ), eligible AS (
          SELECT locked_revision.*
          FROM locked_revision
          WHERE locked_revision."status" IN ('draft', 'scheduled')
            AND char_length(locked_revision."title") BETWEEN 1 AND 160
            AND char_length(locked_revision."summary") BETWEEN 1 AND 240
            AND char_length(locked_revision."body_markdown") BETWEEN 1 AND 200000
            AND (
              (locked_revision."kind" = 'notice' AND (locked_revision."category" IS NULL OR locked_revision."category" IN ('general', 'service', 'maintenance', 'security')))
              OR (locked_revision."kind" = 'legal' AND (locked_revision."category" IS NULL OR locked_revision."category" IN ('privacy', 'terms', 'cookies', 'policy')))
              OR (locked_revision."kind" = 'disclosure' AND (locked_revision."category" IS NULL OR locked_revision."category" IN ('corporate', 'financial', 'governance', 'material')))
              OR (locked_revision."kind" = 'design' AND (locked_revision."category" IS NULL OR locked_revision."category" IN ('foundation', 'brand', 'component', 'resource')))
            )
            AND (
              locked_revision."locale" = 'ko'
              OR EXISTS (
                SELECT 1 FROM ${documentRevisions} korean
                WHERE korean."series_id" = locked_revision."series_id"
                  AND korean."locale" = 'ko' AND korean."status" = 'published'
              )
            )
        ), archived_previous AS (
          UPDATE ${documentRevisions} previous
          SET "status" = 'archived', "updated_by" = ${actor.githubId}, "updated_at" = ${now}
          FROM eligible
          WHERE previous."series_id" = eligible."series_id"
            AND previous."locale" = eligible."locale"
            AND previous."status" = 'published'
            AND previous."id" <> eligible."id"
          RETURNING previous."id"
        ), published_revision AS (
          UPDATE ${documentRevisions} r
          SET "status" = 'published', "scheduled_at" = NULL, "published_at" = ${now},
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
        WITH locked_revision AS (
          SELECT "id", "series_id", "locale", "status"
          FROM ${documentRevisions}
          WHERE "id" = ${expectedRevisionId}::uuid
            AND "series_id" = ${seriesId}::uuid AND "locale" = ${locale}::document_locale
            AND "status" = 'published'
          FOR UPDATE
        ), archived_revision AS (
          UPDATE ${documentRevisions} r
          SET "status" = 'archived', "updated_by" = ${actor.githubId}, "updated_at" = ${now}
          FROM locked_revision
          WHERE r."id" = locked_revision."id" AND locked_revision."status" = 'published'
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

    async listAdmin(filter: AdminDocumentFilter = {}) {
      const conditions: SQL[] = []
      if (filter.seriesId) conditions.push(sql`r."series_id" = ${filter.seriesId}::uuid`)
      if (filter.kind) conditions.push(sql`s."kind" = ${filter.kind}::document_kind`)
      if (filter.locale) conditions.push(sql`r."locale" = ${filter.locale}::document_locale`)
      if (filter.status) conditions.push(sql`r."status" = ${filter.status}::document_status`)
      const where = conditions.length ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``
      const result = await database.execute(sql`
        SELECT ${revisionSelect}
        FROM ${documentRevisions} r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        ${where}
        ORDER BY r."updated_at" DESC, r."id" DESC
      `)
      return result.rows.map(mapRevision)
    },

    async listPublished(filter: PublishedDocumentFilter) {
      const category = filter.category ? sql`AND s."category" = ${filter.category}` : sql``
      const before = filter.before
        ? sql`AND (
            (s."pinned" = false AND ${filter.before.pinned} = true)
            OR (
              s."pinned" = ${filter.before.pinned}
              AND (r."published_at", r."id") < (${filter.before.publishedAt}, ${filter.before.id}::uuid)
            )
          )`
        : sql``
      const limit = Math.min(50, Math.max(1, filter.limit ?? 20))
      const result = await database.execute(sql`
        SELECT ${publicSelect}
        FROM ${documentRevisions} r
        INNER JOIN ${documentSeries} s ON s."id" = r."series_id"
        WHERE r."status" = 'published' AND s."archived_at" IS NULL
          AND s."kind" = ${filter.kind}::document_kind
          AND r."locale" = ${filter.locale}::document_locale
          ${category} ${before}
        ORDER BY s."pinned" DESC, r."published_at" DESC, r."id" DESC
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
          COALESCE(available."locales", ARRAY[]::document_locale[]) AS "availableLocales"
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
          SELECT array_agg(r."locale" ORDER BY r."locale") AS locales
          FROM ${documentRevisions} r
          WHERE r."series_id" = s."id" AND r."status" = 'published'
        ) available ON true
        WHERE s."kind" = ${kind}::document_kind AND s."slug" = ${slug}
          AND s."archived_at" IS NULL
        LIMIT 1
      `)
      const row = result.rows[0] as (PublishedRow & { id: string | null; availableLocales: Locale[] }) | undefined
      if (!row) return { document: null, availableLocales: [] }
      return {
        document: row.id ? mapPublished(row) : null,
        availableLocales: row.availableLocales,
      }
    },

    async publishDue(now: Date, actor: AdminActor): Promise<PublishDueResult> {
      const due = await database.execute(sql`
        SELECT "id" FROM ${documentRevisions}
        WHERE "status" = 'scheduled' AND "scheduled_at" <= ${now}
        ORDER BY "scheduled_at" ASC, CASE "locale" WHEN 'ko' THEN 0 ELSE 1 END, "id" ASC
      `)
      const publishedIds: string[] = []
      const failedIds: string[] = []
      for (const row of due.rows as Array<{ id: string }>) {
        try {
          await this.publishRevision(row.id, actor, now)
          publishedIds.push(row.id)
        } catch {
          failedIds.push(row.id)
        }
      }
      return { publishedIds, failedIds }
    },
  }
}

export const documentStore = createDocumentStore({
  execute(query) {
    return getDb().execute(query)
  },
})
