import { readFileSync } from "node:fs"
import { join } from "node:path"
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core"
import { describe, expect, it } from "vitest"

import * as schema from "@/lib/db/schema"

const tables = schema as unknown as Record<string, PgTable>

describe("agent schema", () => {
  it("stores configurable limits separately from provider ciphertext", () => {
    const agentSettings = tables.agentSettings
    const aiProviderCredentials = tables.aiProviderCredentials

    expect(agentSettings).toBeDefined()
    expect(aiProviderCredentials).toBeDefined()
    if (!agentSettings || !aiProviderCredentials) return

    expect(getTableConfig(agentSettings).columns.map((column) => column.name)).toEqual([
      "id", "enabled", "model", "daily_token_limit", "daily_question_limit",
      "max_output_tokens", "monthly_cost_limit_microusd",
      "input_price_microusd_per_million", "output_price_microusd_per_million",
      "pricing_checked_at", "reset_timezone", "daily_reset_minute", "cookie_retention_days",
      "summary_policy", "version", "updated_by", "created_at", "updated_at",
    ])
    expect(getTableConfig(aiProviderCredentials).columns.map((column) => column.name)).toEqual([
      "provider", "ciphertext", "iv", "auth_tag", "fingerprint",
      "verified_model", "verification_status", "verified_at", "created_by",
      "created_at", "updated_at",
    ])
  })

  it("provides the safe singleton defaults", () => {
    const agentSettings = tables.agentSettings

    expect(agentSettings).toBeDefined()
    if (!agentSettings) return

    const columns = Object.fromEntries(
      getTableConfig(agentSettings).columns.map((column) => [column.name, column]),
    )

    expect(columns.id.default).toBe("default")
    expect(columns.enabled.default).toBe(false)
    expect(columns.model.default).toBeUndefined()
    expect(columns.model.notNull).toBe(false)
    expect(columns.daily_token_limit.default).toBe(20_000)
    expect(columns.daily_question_limit.default).toBe(10)
    expect(columns.max_output_tokens.default).toBe(600)
    expect(columns.monthly_cost_limit_microusd.default).toBe(50_000_000)
    expect(columns.input_price_microusd_per_million.default).toBeUndefined()
    expect(columns.input_price_microusd_per_million.notNull).toBe(false)
    expect(columns.output_price_microusd_per_million.default).toBeUndefined()
    expect(columns.output_price_microusd_per_million.notNull).toBe(false)
    expect(columns.reset_timezone.default).toBe("Asia/Seoul")
    expect(columns.daily_reset_minute.default).toBe(0)
    expect(columns.cookie_retention_days.default).toBe(180)
    expect(columns.summary_policy.default).toBe("review")
    expect(columns.version.default).toBe(1)
  })

  it("seeds the singleton settings row idempotently", () => {
    const migration = readFileSync(
      join(process.cwd(), "drizzle/0005_agent_control_plane.sql"),
      "utf8",
    )

    expect(migration).toContain('INSERT INTO "agent_settings"')
    expect(migration).toContain("'default'")
    expect(migration).toMatch(/ON CONFLICT\s*\("id"\)\s*DO NOTHING/)
  })
})
