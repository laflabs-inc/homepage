import "server-only"

import { sql, type SQL } from "drizzle-orm"

import { aiProviderCredentials, agentSettings, adminAuditLog } from "@/lib/db/schema"
import { getDb } from "@/lib/db"
import type {
  AgentRepository,
  AgentSettings,
  StoredCredential,
} from "@/lib/agent/types"

type SqlExecutor = {
  execute(query: SQL): Promise<{ rows: unknown[] }>
}

const settingsSelect = sql.raw(`
  s."id" AS "id", s."enabled" AS "enabled", s."model" AS "model",
  s."daily_token_limit" AS "dailyTokenLimit", s."daily_question_limit" AS "dailyQuestionLimit",
  s."max_output_tokens" AS "maxOutputTokens",
  s."monthly_cost_limit_microusd" AS "monthlyCostLimitMicrousd",
  s."input_price_microusd_per_million" AS "inputPriceMicrousdPerMillion",
  s."output_price_microusd_per_million" AS "outputPriceMicrousdPerMillion",
  s."pricing_checked_at" AS "pricingCheckedAt", s."reset_timezone" AS "resetTimezone",
  s."daily_reset_minute" AS "dailyResetMinute", s."cookie_retention_days" AS "cookieRetentionDays",
  s."summary_policy" AS "summaryPolicy", s."version" AS "version",
  s."updated_by" AS "updatedBy", s."created_at" AS "createdAt", s."updated_at" AS "updatedAt"
`)

const credentialSelect = sql.raw(`
  c."provider" AS "provider", c."ciphertext" AS "ciphertext", c."iv" AS "iv",
  c."auth_tag" AS "authTag", c."fingerprint" AS "fingerprint",
  c."verified_model" AS "verifiedModel", c."verification_status" AS "verificationStatus",
  c."verified_at" AS "verifiedAt", c."created_by" AS "createdBy",
  c."created_at" AS "createdAt", c."updated_at" AS "updatedAt",
  (extract(epoch FROM c."updated_at") * 1000000)::bigint::text AS "generation"
`)

function mapSettings(value: unknown): AgentSettings {
  const row = value as AgentSettings
  return {
    id: "default",
    enabled: row.enabled,
    model: row.model,
    dailyTokenLimit: row.dailyTokenLimit,
    dailyQuestionLimit: row.dailyQuestionLimit,
    maxOutputTokens: row.maxOutputTokens,
    monthlyCostLimitMicrousd: Number(row.monthlyCostLimitMicrousd),
    inputPriceMicrousdPerMillion: row.inputPriceMicrousdPerMillion === null
      ? null
      : Number(row.inputPriceMicrousdPerMillion),
    outputPriceMicrousdPerMillion: row.outputPriceMicrousdPerMillion === null
      ? null
      : Number(row.outputPriceMicrousdPerMillion),
    pricingCheckedAt: row.pricingCheckedAt,
    resetTimezone: row.resetTimezone,
    dailyResetMinute: row.dailyResetMinute,
    cookieRetentionDays: row.cookieRetentionDays,
    summaryPolicy: row.summaryPolicy,
    version: row.version,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function mapCredential(value: unknown): StoredCredential {
  const row = value as StoredCredential
  return {
    provider: "openai",
    ciphertext: row.ciphertext,
    iv: row.iv,
    authTag: row.authTag,
    fingerprint: row.fingerprint,
    generation: row.generation,
    verifiedModel: row.verifiedModel,
    verificationStatus: row.verificationStatus === "verified" ? "verified" : "failed",
    verifiedAt: row.verifiedAt,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createAgentStore(database: SqlExecutor): AgentRepository {
  return {
    async getSettings() {
      const result = await database.execute(sql`
        SELECT ${settingsSelect}
        FROM ${agentSettings} s
        WHERE s."id" = 'default'
        LIMIT 1
      `)
      if (!result.rows[0]) throw new Error("Agent settings are unavailable")
      return mapSettings(result.rows[0])
    },

    async getCredential() {
      const result = await database.execute(sql`
        SELECT ${credentialSelect}
        FROM ${aiProviderCredentials} c
        WHERE c."provider" = 'openai'
        LIMIT 1
      `)
      return result.rows[0] ? mapCredential(result.rows[0]) : null
    },

    async updateSettings(input, actor, changedSettings) {
      const changedSettingsJson = JSON.stringify(changedSettings)
      const result = await database.execute(sql`
        WITH locked_settings AS (
          SELECT * FROM ${agentSettings}
          WHERE "id" = 'default'
          FOR UPDATE
        ), locked_credential AS (
          SELECT * FROM ${aiProviderCredentials}
          WHERE "provider" = 'openai'
            AND (SELECT count(*) FROM locked_settings) >= 0
          FOR UPDATE
        ), update_decision AS (
          SELECT CASE
            WHEN locked_settings."version" <> ${input.version} THEN 'version_conflict'
            WHEN ${input.enabled} AND locked_credential."provider" IS NULL THEN 'credential_unavailable'
            WHEN ${input.enabled} AND (
              locked_credential."verification_status" <> 'verified'
              OR locked_credential."verified_model" IS DISTINCT FROM ${input.model}
            ) THEN 'model_unverified'
            ELSE 'updated'
          END AS "updateStatus"
          FROM locked_settings
          LEFT JOIN locked_credential ON true
        ), invalidated_credential AS (
          UPDATE ${aiProviderCredentials} c
          SET "verification_status" = 'failed', "verified_model" = NULL,
            "verified_at" = NULL, "updated_at" = statement_timestamp()
          FROM locked_settings, update_decision
          WHERE c."provider" = 'openai'
            AND update_decision."updateStatus" = 'updated'
            AND locked_settings."model" IS DISTINCT FROM ${input.model}
          RETURNING c."provider"
        ), updated_settings AS (
          UPDATE ${agentSettings} s
          SET "enabled" = CASE
                WHEN locked_settings."model" IS DISTINCT FROM ${input.model} THEN false
                ELSE ${input.enabled} END,
            "model" = ${input.model},
            "daily_token_limit" = ${input.dailyTokenLimit},
            "daily_question_limit" = ${input.dailyQuestionLimit},
            "max_output_tokens" = ${input.maxOutputTokens},
            "monthly_cost_limit_microusd" = ${input.monthlyCostLimitMicrousd},
            "input_price_microusd_per_million" = CASE
              WHEN locked_settings."model" IS DISTINCT FROM ${input.model} THEN NULL
              ELSE ${input.inputPriceMicrousdPerMillion} END,
            "output_price_microusd_per_million" = CASE
              WHEN locked_settings."model" IS DISTINCT FROM ${input.model} THEN NULL
              ELSE ${input.outputPriceMicrousdPerMillion} END,
            "pricing_checked_at" = CASE
              WHEN locked_settings."model" IS DISTINCT FROM ${input.model} THEN NULL
              WHEN locked_settings."input_price_microusd_per_million" IS DISTINCT FROM ${input.inputPriceMicrousdPerMillion}
                OR locked_settings."output_price_microusd_per_million" IS DISTINCT FROM ${input.outputPriceMicrousdPerMillion}
              THEN statement_timestamp() ELSE locked_settings."pricing_checked_at" END,
            "reset_timezone" = ${input.resetTimezone},
            "daily_reset_minute" = ${input.dailyResetMinute},
            "cookie_retention_days" = ${input.cookieRetentionDays},
            "summary_policy" = ${input.summaryPolicy}::summary_policy,
            "version" = locked_settings."version" + 1,
            "updated_by" = ${actor.githubId}, "updated_at" = statement_timestamp()
          FROM locked_settings, update_decision
          WHERE s."id" = locked_settings."id"
            AND update_decision."updateStatus" = 'updated'
            AND (SELECT count(*) FROM invalidated_credential) >= 0
          RETURNING s.*
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT CASE
              WHEN locked_settings."enabled" IS DISTINCT FROM updated_settings."enabled"
                THEN CASE WHEN updated_settings."enabled" THEN 'agent.enable' ELSE 'agent.disable' END
              ELSE 'agent.settings.update'
            END,
            'agent_settings', 'default', ${actor.githubId}, ${actor.name},
            jsonb_build_object('changedSettings', ${changedSettingsJson}::jsonb)
          FROM updated_settings
          INNER JOIN locked_settings ON locked_settings."id" = updated_settings."id"
          RETURNING "id"
        )
        SELECT update_decision."updateStatus", ${settingsSelect}
        FROM update_decision
        LEFT JOIN updated_settings s ON true
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      const row = result.rows[0] as { updateStatus?: unknown } | undefined
      if (!row || row.updateStatus === "version_conflict") return { status: "version_conflict" }
      if (row.updateStatus === "credential_unavailable") return { status: "credential_unavailable" }
      if (row.updateStatus === "model_unverified") return { status: "model_unverified" }
      if (row.updateStatus !== "updated") throw new Error("Agent settings update returned an invalid status")
      return { status: "updated", settings: mapSettings(row) }
    },

    async replaceCredential(input, actor, replacing) {
      const action = replacing ? "agent.credential.replace" : "agent.credential.register"
      const result = await database.execute(sql`
        WITH stored_credential AS (
          INSERT INTO ${aiProviderCredentials} (
            "provider", "ciphertext", "iv", "auth_tag", "fingerprint", "verified_model",
            "verification_status", "verified_at", "created_by", "created_at", "updated_at"
          ) VALUES (
            ${input.provider}, ${input.ciphertext}, ${input.iv}, ${input.authTag}, ${input.fingerprint},
            ${input.verifiedModel}, ${input.verificationStatus}, ${input.verifiedAt},
            ${actor.githubId}, statement_timestamp(), statement_timestamp()
          )
          ON CONFLICT ("provider") DO UPDATE SET
            "ciphertext" = EXCLUDED."ciphertext", "iv" = EXCLUDED."iv",
            "auth_tag" = EXCLUDED."auth_tag", "fingerprint" = EXCLUDED."fingerprint",
            "verified_model" = EXCLUDED."verified_model",
            "verification_status" = EXCLUDED."verification_status",
            "verified_at" = EXCLUDED."verified_at", "created_by" = EXCLUDED."created_by",
            "created_at" = statement_timestamp(), "updated_at" = statement_timestamp()
          RETURNING *
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT ${action}, 'ai_provider_credential', stored_credential."provider",
            ${actor.githubId}, ${actor.name}, jsonb_build_object(
              'provider', stored_credential."provider", 'fingerprint', stored_credential."fingerprint",
              'model', stored_credential."verified_model", 'result', stored_credential."verification_status"
            )
          FROM stored_credential
          RETURNING "id"
        )
        SELECT ${credentialSelect}
        FROM stored_credential c
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      if (!result.rows[0]) throw new Error("Credential could not be stored")
      return mapCredential(result.rows[0])
    },

    async recordCredentialTest(model, verificationStatus, expected, actor, verifiedAt) {
      const result = await database.execute(sql`
        WITH locked_settings AS (
          SELECT * FROM ${agentSettings}
          WHERE "id" = 'default'
          FOR UPDATE
        ), locked_credential AS (
          SELECT * FROM ${aiProviderCredentials}
          WHERE "provider" = 'openai'
            AND (SELECT count(*) FROM locked_settings) >= 0
          FOR UPDATE
        ), record_decision AS (
          SELECT CASE WHEN
            locked_settings."model" IS NOT DISTINCT FROM ${model}
            AND locked_credential."fingerprint" IS NOT DISTINCT FROM ${expected.fingerprint}
            AND (extract(epoch FROM locked_credential."updated_at") * 1000000)::bigint::text
              IS NOT DISTINCT FROM ${expected.generation}
            THEN 'current' ELSE 'stale'
          END AS "recordStatus"
          FROM locked_settings
          LEFT JOIN locked_credential ON true
        ), disabled_settings AS (
          UPDATE ${agentSettings} s
          SET "enabled" = false, "version" = "version" + 1,
            "updated_by" = ${actor.githubId}, "updated_at" = statement_timestamp()
          FROM record_decision
          WHERE s."id" = 'default'
            AND record_decision."recordStatus" = 'current'
            AND ${verificationStatus} = 'failed' AND s."enabled" = true
          RETURNING s."id"
        ), updated_credential AS (
          UPDATE ${aiProviderCredentials} c
          SET "verified_model" = CASE WHEN ${verificationStatus} = 'verified' THEN ${model} ELSE NULL END,
            "verification_status" = ${verificationStatus},
            "verified_at" = CASE WHEN ${verificationStatus} = 'verified' THEN ${verifiedAt} ELSE NULL END,
            "updated_at" = statement_timestamp()
          FROM record_decision
          WHERE c."provider" = 'openai'
            AND record_decision."recordStatus" = 'current'
            AND (SELECT count(*) FROM disabled_settings) >= 0
          RETURNING c.*
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'agent.credential.test', 'ai_provider_credential', updated_credential."provider",
            ${actor.githubId}, ${actor.name}, jsonb_build_object(
              'provider', updated_credential."provider", 'fingerprint', updated_credential."fingerprint",
              'model', ${model}, 'result', updated_credential."verification_status"
            )
          FROM updated_credential
          RETURNING "id"
        )
        SELECT CASE WHEN updated_credential."provider" IS NULL THEN 'stale' ELSE 'updated' END AS "recordStatus",
          ${credentialSelect}
        FROM record_decision
        LEFT JOIN updated_credential c ON true
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      const row = result.rows[0] as { recordStatus?: unknown } | undefined
      if (!row || row.recordStatus === "stale") return { status: "stale" }
      if (row.recordStatus !== "updated") throw new Error("Credential test returned an invalid status")
      return { status: "updated", credential: mapCredential(row) }
    },

    async disableAndDeleteCredential(actor) {
      const result = await database.execute(sql`
        WITH disabled_settings AS (
          UPDATE ${agentSettings}
          SET "enabled" = false, "version" = "version" + 1,
            "updated_by" = ${actor.githubId}, "updated_at" = statement_timestamp()
          WHERE "id" = 'default'
          RETURNING *
        ), deleted_credential AS (
          DELETE FROM ${aiProviderCredentials}
          WHERE "provider" = 'openai'
            AND (SELECT count(*) FROM disabled_settings) >= 0
          RETURNING *
        ), audit_entry AS (
          INSERT INTO ${adminAuditLog} (
            "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
          )
          SELECT 'agent.credential.delete', 'ai_provider_credential', deleted_credential."provider",
            ${actor.githubId}, ${actor.name}, jsonb_build_object(
              'provider', deleted_credential."provider", 'fingerprint', deleted_credential."fingerprint",
              'model', deleted_credential."verified_model", 'result', 'deleted'
            )
          FROM deleted_credential
          RETURNING "id"
        )
        SELECT ${settingsSelect}
        FROM disabled_settings s
        WHERE (SELECT count(*) FROM audit_entry) >= 0
      `)
      if (!result.rows[0]) throw new Error("Agent settings are unavailable")
      return mapSettings(result.rows[0])
    },
  }
}

export const agentStore = createAgentStore({
  execute(query) {
    return getDb().execute(query)
  },
})
