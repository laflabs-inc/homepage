import { PGlite } from "@electric-sql/pglite"
import type { SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core"
import { describe, expect, it } from "vitest"

import { createAgentStore } from "@/lib/agent/store"

const actor = { githubId: "github:42", name: "Laf Admin" }

describe("agent store integration", () => {
  it("persists runtime settings and its audit entry in PostgreSQL", async () => {
    const database = new PGlite()
    const dialect = new PgDialect()

    try {
      await database.exec(`
        CREATE TYPE "public"."summary_policy" AS ENUM('review', 'automatic');
        CREATE TABLE "agent_settings" (
          "id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
          "enabled" boolean DEFAULT false NOT NULL,
          "model" text,
          "daily_token_limit" integer DEFAULT 20000 NOT NULL,
          "daily_question_limit" integer DEFAULT 10 NOT NULL,
          "max_output_tokens" integer DEFAULT 600 NOT NULL,
          "monthly_cost_limit_microusd" bigint DEFAULT 50000000 NOT NULL,
          "input_price_microusd_per_million" bigint,
          "output_price_microusd_per_million" bigint,
          "pricing_checked_at" timestamp with time zone,
          "reset_timezone" text DEFAULT 'Asia/Seoul' NOT NULL,
          "daily_reset_minute" integer DEFAULT 0 NOT NULL,
          "cookie_retention_days" integer DEFAULT 180 NOT NULL,
          "summary_policy" "summary_policy" DEFAULT 'review' NOT NULL,
          "version" integer DEFAULT 1 NOT NULL,
          "updated_by" text NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
        CREATE TABLE "ai_provider_credentials" (
          "provider" text PRIMARY KEY DEFAULT 'openai' NOT NULL,
          "ciphertext" text NOT NULL,
          "iv" text NOT NULL,
          "auth_tag" text NOT NULL,
          "fingerprint" text NOT NULL,
          "verified_model" text,
          "verification_status" text DEFAULT 'verified' NOT NULL,
          "verified_at" timestamp with time zone,
          "created_by" text NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
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
        INSERT INTO "agent_settings" ("id", "updated_by") VALUES ('default', 'system:migration');
      `)

      const store = createAgentStore({
        async execute(query: SQL) {
          const compiled = dialect.sqlToQuery(query)
          return database.query(compiled.sql, compiled.params as never[]) as Promise<{ rows: unknown[] }>
        },
      })
      const current = await store.getSettings()

      await expect(store.updateSettings({
        enabled: false,
        model: current.model,
        dailyTokenLimit: 25_000,
        dailyQuestionLimit: current.dailyQuestionLimit,
        maxOutputTokens: current.maxOutputTokens,
        monthlyCostLimitMicrousd: current.monthlyCostLimitMicrousd,
        inputPriceMicrousdPerMillion: current.inputPriceMicrousdPerMillion,
        outputPriceMicrousdPerMillion: current.outputPriceMicrousdPerMillion,
        resetTimezone: current.resetTimezone,
        dailyResetMinute: current.dailyResetMinute,
        cookieRetentionDays: current.cookieRetentionDays,
        summaryPolicy: current.summaryPolicy,
        version: current.version,
      }, actor, ["dailyTokenLimit"])).resolves.toMatchObject({
        status: "updated",
        settings: { dailyTokenLimit: 25_000, version: 2 },
      })

      const audit = await database.query<{ changedSettings: string[] }>(
        `SELECT "metadata"->'changedSettings' AS "changedSettings" FROM "admin_audit_log"`,
      )
      expect(audit.rows).toEqual([{ changedSettings: ["dailyTokenLimit"] }])
    } finally {
      await database.close()
    }
  })
})
