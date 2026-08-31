import { PGlite } from "@electric-sql/pglite"
import type { SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core"
import { describe, expect, it } from "vitest"

import { createDocumentStore } from "@/lib/documents/store"

const revisionId = "51760c0a-27d4-4203-8464-966e4f7101e4"
const seriesId = "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131"

describe("document summary store integration", () => {
  it("stores generated summary metadata against real PostgreSQL types", async () => {
    const database = new PGlite()
    const dialect = new PgDialect()

    try {
      await database.exec(`
        CREATE TYPE "public"."document_kind" AS ENUM('notice', 'legal', 'disclosure');
        CREATE TYPE "public"."document_locale" AS ENUM('ko', 'en');
        CREATE TYPE "public"."document_status" AS ENUM('draft', 'scheduled', 'published', 'archived');
        CREATE TABLE "admin_audit_log" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "action" text NOT NULL,
          "target_type" text NOT NULL,
          "target_id" text NOT NULL,
          "actor_github_id" text NOT NULL,
          "actor_name" text NOT NULL,
          "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );
        CREATE TABLE "document_series" (
          "id" uuid PRIMARY KEY,
          "kind" "document_kind" NOT NULL,
          "slug" text NOT NULL,
          "category" text,
          "pinned" boolean DEFAULT false NOT NULL,
          "metadata_locked" boolean DEFAULT false NOT NULL,
          "archived_at" timestamp with time zone,
          "created_by" text NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
        CREATE TABLE "document_revisions" (
          "id" uuid PRIMARY KEY,
          "series_id" uuid NOT NULL REFERENCES "document_series"("id"),
          "locale" "document_locale" NOT NULL,
          "revision" integer NOT NULL,
          "title" text NOT NULL,
          "summary" text NOT NULL,
          "body_markdown" text NOT NULL,
          "status" "document_status" NOT NULL,
          "effective_at" timestamp with time zone,
          "scheduled_at" timestamp with time zone,
          "published_at" timestamp with time zone,
          "created_by" text NOT NULL,
          "updated_by" text NOT NULL,
          "published_by" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
        INSERT INTO "document_series" ("id", "kind", "slug", "created_by")
        VALUES ('${seriesId}', 'notice', 'service-update', 'github:42');
        INSERT INTO "document_revisions" (
          "id", "series_id", "locale", "revision", "title", "summary", "body_markdown",
          "status", "created_by", "updated_by"
        ) VALUES (
          '${revisionId}', '${seriesId}', 'ko', 1, '서비스 업데이트', '', '## 변경 사항',
          'draft', 'github:42', 'github:42'
        );
      `)

      const store = createDocumentStore({
        async execute(query: SQL) {
          const compiled = dialect.sqlToQuery(query)
          return database.query(compiled.sql, compiled.params as never[]) as Promise<{ rows: unknown[] }>
        },
      })

      await expect(store.updateDraftSummary(
        revisionId,
        "서비스 변경 사항을 안내합니다.",
        { title: "서비스 업데이트", bodyMarkdown: "## 변경 사항", summary: "" },
        { githubId: "github:42", name: "Laf Admin" },
        { model: "gpt-5.6-luna", generatedAt: new Date("2026-08-31T10:30:00.000Z") },
      )).resolves.toMatchObject({ summary: "서비스 변경 사항을 안내합니다." })

      const audit = await database.query<{ metadata: { model: string; generatedAt: string } }>(
        `SELECT "metadata" FROM "admin_audit_log" WHERE "action" = 'document.summary.generate'`,
      )
      expect(audit.rows[0]?.metadata).toEqual({
        model: "gpt-5.6-luna",
        generatedAt: "2026-08-31T10:30:00+00:00",
      })
    } finally {
      await database.close()
    }
  })
})
