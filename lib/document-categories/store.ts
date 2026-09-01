import "server-only"

import { sql, type SQL } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { adminAuditLog, documentCategories } from "@/lib/db/schema"
import type { DocumentCategory, DocumentCategoryRepository } from "@/lib/document-categories/types"

type SqlExecutor = {
  execute(query: SQL): Promise<{ rows: unknown[] }>
}

const categorySelect = sql.raw(`
  c."id" AS "id", c."kind" AS "kind", c."slug" AS "slug",
  c."label_ko" AS "labelKo", c."label_en" AS "labelEn",
  c."sort_order" AS "sortOrder", c."active" AS "active", c."version" AS "version",
  c."created_by" AS "createdBy", c."updated_by" AS "updatedBy",
  c."created_at" AS "createdAt", c."updated_at" AS "updatedAt"
`)

function mapCategory(value: unknown): DocumentCategory {
  const row = value as DocumentCategory
  return {
    id: row.id, kind: row.kind, slug: row.slug, labelKo: row.labelKo, labelEn: row.labelEn,
    sortOrder: Number(row.sortOrder), active: row.active, version: Number(row.version),
    createdBy: row.createdBy, updatedBy: row.updatedBy,
    createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt),
  }
}

type MutationRow = { updateStatus?: unknown; categories?: unknown }

export function createDocumentCategoryStore(
  database: SqlExecutor,
): DocumentCategoryRepository {
  return {
    async list(filter = {}) {
      const kind = filter.kind ? sql`WHERE c."kind" = ${filter.kind}::document_kind` : sql`WHERE true`
      const active = filter.active === undefined ? sql`` : sql`AND c."active" = ${filter.active}`
      const result = await database.execute(sql`
        SELECT ${categorySelect}
        FROM ${documentCategories} c
        ${kind} ${active}
        ORDER BY "kind" ASC, "sort_order" ASC, "slug" ASC
      `)
      return result.rows.map(mapCategory)
    },

    async create(input, actor) {
      const result = await database.execute(sql`
        WITH inserted_category AS (
          INSERT INTO ${documentCategories} (
            "kind", "slug", "label_ko", "label_en", "sort_order", "created_by", "updated_by"
          ) VALUES (
            ${input.kind}::document_kind, ${input.slug}, ${input.labelKo}, ${input.labelEn},
            ${input.sortOrder}, ${actor.githubId}, ${actor.githubId}
          )
          ON CONFLICT ("kind","slug") DO NOTHING
          RETURNING *
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document_category.create', 'document_category', inserted_category."id"::text,
            ${actor.githubId}, ${actor.name},
            jsonb_build_object(
              'kind', inserted_category."kind", 'slug', inserted_category."slug",
              'active', inserted_category."active", 'sortOrder', inserted_category."sort_order"
            )
          FROM inserted_category
          RETURNING "id"
        )
        SELECT 'created' AS "updateStatus", ${categorySelect}
        FROM inserted_category c
        WHERE (SELECT count(*) FROM audit_entry) >= 0
        UNION ALL
        SELECT 'slug_conflict', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
        WHERE NOT EXISTS (SELECT 1 FROM inserted_category)
      `)
      const row = result.rows[0] as MutationRow | undefined
      return row?.updateStatus === "created"
        ? { status: "created", category: mapCategory(row) }
        : { status: "slug_conflict" }
    },

    async update(id, input, actor) {
      const result = await database.execute(sql`
        WITH locked_category AS (
          SELECT * FROM ${documentCategories} WHERE "id" = ${id}::uuid FOR UPDATE
        ), update_decision AS (
          SELECT CASE
            WHEN NOT EXISTS (SELECT 1 FROM locked_category) THEN 'not_found'
            WHEN (SELECT "version" FROM locked_category) <> ${input.version} THEN 'version_conflict'
            ELSE 'updated'
          END AS "updateStatus"
        ), updated_category AS (
          UPDATE ${documentCategories} c
          SET "label_ko" = ${input.labelKo}, "label_en" = ${input.labelEn},
            "sort_order" = ${input.sortOrder}, "active" = ${input.active},
            "version" = c."version" + 1, "updated_by" = ${actor.githubId},
            "updated_at" = statement_timestamp()
          FROM update_decision
          WHERE c."id" = ${id}::uuid AND update_decision."updateStatus" = 'updated'
          RETURNING c.*
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document_category.update', 'document_category', updated_category."id"::text,
            ${actor.githubId}, ${actor.name},
            jsonb_build_object(
              'kind', updated_category."kind", 'slug', updated_category."slug",
              'active', updated_category."active", 'sortOrder', updated_category."sort_order",
              'changedFields', '["labelKo","labelEn","sortOrder","active"]'::jsonb
            )
          FROM updated_category
          RETURNING "id"
        )
        SELECT update_decision."updateStatus", ${categorySelect}
        FROM update_decision
        LEFT JOIN updated_category c ON true
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      const row = result.rows[0] as MutationRow | undefined
      if (row?.updateStatus === "updated") {
        return { status: "updated", category: mapCategory(row) }
      }
      return { status: row?.updateStatus === "version_conflict" ? "version_conflict" : "not_found" }
    },

    async reorder(input, actor) {
      const result = await database.execute(sql`
        WITH input_items AS (
          SELECT "id", "version", ("position" - 1)::integer AS "sortOrder"
          FROM jsonb_to_recordset(${JSON.stringify(input.items)}::jsonb) WITH ORDINALITY
            AS item("id" uuid, "version" integer, "position" bigint)
        ), locked_categories AS (
          SELECT * FROM ${documentCategories}
          WHERE "kind" = ${input.kind}::document_kind
          ORDER BY "id" FOR UPDATE
        ), update_decision AS (
          SELECT CASE
            WHEN (SELECT count(*) FROM input_items) <> (SELECT count(*) FROM locked_categories)
              OR EXISTS (
                SELECT 1 FROM input_items
                LEFT JOIN locked_categories USING ("id")
                WHERE locked_categories."id" IS NULL
              ) THEN 'category_set_changed'
            WHEN EXISTS (
              SELECT 1 FROM input_items
              INNER JOIN locked_categories USING ("id")
              WHERE input_items."version" <> locked_categories."version"
            ) THEN 'version_conflict'
            ELSE 'updated'
          END AS "updateStatus"
        ), updated_categories AS (
          UPDATE ${documentCategories} c
          SET "sort_order" = input_items."sortOrder", "version" = c."version" + 1,
            "updated_by" = ${actor.githubId}, "updated_at" = statement_timestamp()
          FROM input_items, update_decision
          WHERE c."id" = input_items."id" AND update_decision."updateStatus" = 'updated'
          RETURNING c.*
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'document_category.reorder', 'document_category_set', ${input.kind},
            ${actor.githubId}, ${actor.name},
            jsonb_build_object(
              'kind', ${input.kind},
              'orderedIds', (SELECT jsonb_agg("id" ORDER BY "sortOrder") FROM input_items)
            )
          FROM update_decision WHERE update_decision."updateStatus" = 'updated'
          RETURNING "id"
        )
        SELECT update_decision."updateStatus",
          COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', c."id", 'kind', c."kind", 'slug', c."slug",
              'labelKo', c."label_ko", 'labelEn', c."label_en",
              'sortOrder', c."sort_order", 'active', c."active", 'version', c."version",
              'createdBy', c."created_by", 'updatedBy', c."updated_by",
              'createdAt', c."created_at", 'updatedAt', c."updated_at"
            ) ORDER BY c."sort_order", c."slug")
            FROM updated_categories c
          ), '[]'::jsonb) AS "categories"
        FROM update_decision
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      const row = result.rows[0] as MutationRow | undefined
      if (row?.updateStatus === "updated") {
        return {
          status: "updated",
          categories: Array.isArray(row.categories) ? row.categories.map(mapCategory) : [],
        }
      }
      return {
        status: row?.updateStatus === "version_conflict"
          ? "version_conflict"
          : "category_set_changed",
      }
    },
  }
}

export const documentCategoryStore = createDocumentCategoryStore({
  execute: (query) => getDb().execute(query),
})
