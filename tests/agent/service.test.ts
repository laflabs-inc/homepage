import { describe, expect, it, vi } from "vitest"
import type { SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core"

import type { AdminActor } from "@/lib/auth/admin-api"
import { decryptCredential } from "@/lib/agent/crypto"
import { AgentServiceError, createAgentService } from "@/lib/agent/service"
import { createAgentStore } from "@/lib/agent/store"
import type {
  AgentRepository,
  AgentSettings,
  AgentSettingsUpdate,
  CredentialReplacement,
  CredentialVerifier,
  StoredCredential,
  VerificationStatus,
} from "@/lib/agent/types"

const actor: AdminActor = { githubId: "github:42", name: "Laf Admin" }
const encryptionKey = Buffer.alloc(32, 9)
const now = new Date("2026-08-24T10:00:00.000Z")

function settings(overrides: Partial<AgentSettings> = {}): AgentSettings {
  return {
    id: "default",
    enabled: false,
    model: "gpt-test",
    dailyTokenLimit: 20_000,
    dailyQuestionLimit: 10,
    maxOutputTokens: 600,
    monthlyCostLimitMicrousd: 50_000_000,
    inputPriceMicrousdPerMillion: 1_000_000,
    outputPriceMicrousdPerMillion: 2_000_000,
    pricingCheckedAt: now,
    resetTimezone: "Asia/Seoul",
    dailyResetMinute: 0,
    cookieRetentionDays: 180,
    summaryPolicy: "review",
    version: 1,
    updatedBy: actor.githubId,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function update(current: AgentSettings, overrides: Partial<AgentSettingsUpdate> = {}): AgentSettingsUpdate {
  return {
    enabled: current.enabled,
    model: current.model,
    dailyTokenLimit: current.dailyTokenLimit,
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
    ...overrides,
  }
}

class MemoryAgentRepository implements AgentRepository {
  settings = settings()
  credential: StoredCredential | null = null
  events: string[] = []
  audits: Array<{ action: string; metadata: Record<string, unknown> }> = []

  async getSettings() { return this.settings }
  async getCredential() { return this.credential }

  async updateSettings(input: AgentSettingsUpdate, admin: AdminActor, changedSettings: string[]) {
    if (input.version !== this.settings.version) return null
    this.settings = {
      ...this.settings,
      ...input,
      version: this.settings.version + 1,
      updatedBy: admin.githubId,
      updatedAt: now,
    }
    this.events.push("settings:update")
    this.audits.push({ action: "agent.settings.update", metadata: { changedSettings } })
    return this.settings
  }

  async replaceCredential(input: CredentialReplacement, admin: AdminActor, replacing: boolean) {
    this.events.push("credential:replace")
    this.credential = {
      ...input,
      createdBy: admin.githubId,
      createdAt: now,
      updatedAt: now,
    }
    this.audits.push({
      action: replacing ? "agent.credential.replace" : "agent.credential.register",
      metadata: {
        provider: input.provider,
        fingerprint: input.fingerprint,
        model: input.verifiedModel,
        result: input.verificationStatus,
      },
    })
    return this.credential
  }

  async recordCredentialTest(model: string, result: VerificationStatus, admin: AdminActor, verifiedAt: Date) {
    void admin
    if (!this.credential) return null
    this.credential = { ...this.credential, verifiedModel: model, verificationStatus: result, verifiedAt }
    if (result === "failed") this.settings = { ...this.settings, enabled: false }
    this.audits.push({
      action: "agent.credential.test",
      metadata: {
        provider: "openai",
        fingerprint: this.credential.fingerprint,
        model,
        result,
      },
    })
    return this.credential
  }

  async disableAndDeleteCredential(admin: AdminActor) {
    void admin
    this.settings = { ...this.settings, enabled: false, version: this.settings.version + 1 }
    this.events.push("settings:disable")
    this.credential = null
    this.events.push("credential:delete")
    return this.settings
  }
}

function service(
  repository: MemoryAgentRepository,
  verify: CredentialVerifier = vi.fn(async () => {}),
) {
  return createAgentService(repository, {
    verify,
    getEncryptionKey: () => encryptionKey,
    now: () => now,
  })
}

describe("Agent service", () => {
  it("verifies a candidate before replacing the stored credential", async () => {
    const repository = new MemoryAgentRepository()
    const verify = vi.fn(async () => { repository.events.push("credential:verify") })

    await service(repository, verify).replaceCredential("sk-candidate", actor)

    expect(repository.events).toEqual(["credential:verify", "credential:replace"])
    expect(decryptCredential(repository.credential!, encryptionKey)).toBe("sk-candidate")
    expect(repository.credential).not.toHaveProperty("apiKey")
  })

  it("leaves the prior encrypted row untouched when candidate verification fails", async () => {
    const repository = new MemoryAgentRepository()
    await service(repository).replaceCredential("sk-prior", actor)
    const prior = repository.credential
    const failing = service(repository, vi.fn(async () => { throw new Error("provider body with key") }))

    await expect(failing.replaceCredential("sk-candidate", actor)).rejects.toMatchObject({ code: "credential_invalid" })

    expect(repository.credential).toBe(prior)
    expect(decryptCredential(repository.credential!, encryptionKey)).toBe("sk-prior")
  })

  it("leaves the prior encrypted row untouched when candidate encryption is unavailable", async () => {
    const repository = new MemoryAgentRepository()
    await service(repository).replaceCredential("sk-prior", actor)
    const prior = repository.credential
    const verify = vi.fn(async () => { repository.events.push("credential:verify") })
    const agent = createAgentService(repository, {
      verify,
      getEncryptionKey: () => { throw new Error("missing encryption environment") },
      now: () => now,
    })

    await expect(agent.replaceCredential("sk-candidate", actor))
      .rejects.toMatchObject({ code: "encryption_unavailable" })

    expect(repository.credential).toBe(prior)
    expect(repository.events.at(-1)).toBe("credential:verify")
  })

  it("returns configuration DTOs without key or credential envelope fields", async () => {
    const repository = new MemoryAgentRepository()
    await service(repository).replaceCredential("sk-candidate", actor)

    const dto = await service(repository).getConfiguration()
    const serialized = JSON.stringify(dto)

    for (const forbidden of ["apiKey", "ciphertext", "iv", "authTag"]) {
      expect(serialized).not.toContain(`\"${forbidden}\"`)
    }
    expect(dto.credential).toMatchObject({ configured: true, provider: "openai", verifiedModel: "gpt-test" })
  })

  it.each([
    [null, "verified", "gpt-test", "credential_unavailable"],
    ["stored", "failed", "gpt-test", "model_unverified"],
    ["stored", "verified", "gpt-other", "model_unverified"],
  ] as const)("rejects enablement without an exact-model verified credential", async (key, status, model, code) => {
    const repository = new MemoryAgentRepository()
    if (key) {
      await service(repository).replaceCredential("sk-stored", actor)
      repository.credential = { ...repository.credential!, verificationStatus: status, verifiedModel: model }
    }

    await expect(service(repository).updateSettings(update(repository.settings, { enabled: true }), actor))
      .rejects.toMatchObject({ code })
  })

  it("automatically disables AI when the model changes", async () => {
    const repository = new MemoryAgentRepository()
    repository.settings = settings({ enabled: true })
    await service(repository).replaceCredential("sk-stored", actor)

    const result = await service(repository).updateSettings(update(repository.settings, {
      enabled: true,
      model: "gpt-new",
    }), actor)

    expect(result.settings.enabled).toBe(false)
    expect(result.settings.model).toBe("gpt-new")
  })

  it("tests the stored key against the current exact model and disables on failure", async () => {
    const repository = new MemoryAgentRepository()
    await service(repository).replaceCredential("sk-stored", actor)
    repository.settings = settings({ enabled: true, model: "gpt-new" })
    const verify = vi.fn(async (_key: string, model: string) => {
      expect(model).toBe("gpt-new")
      throw new Error("unavailable")
    })

    await expect(service(repository, verify).testCredential(actor))
      .rejects.toMatchObject({ code: "provider_unavailable" })

    expect(repository.settings.enabled).toBe(false)
    expect(repository.credential).toMatchObject({ verifiedModel: "gpt-new", verificationStatus: "failed" })
  })

  it("uses optimistic versions for settings updates", async () => {
    const repository = new MemoryAgentRepository()

    await expect(service(repository).updateSettings(update(repository.settings, { version: 99 }), actor))
      .rejects.toMatchObject({ code: "version_conflict" })
  })

  it("disables AI before deleting the credential", async () => {
    const repository = new MemoryAgentRepository()
    repository.settings = settings({ enabled: true })
    await service(repository).replaceCredential("sk-stored", actor)
    repository.events = []

    const result = await service(repository).deleteCredential(actor)

    expect(repository.events).toEqual(["settings:disable", "credential:delete"])
    expect(result.settings.enabled).toBe(false)
    expect(result.credential.configured).toBe(false)
  })

  it("limits audit metadata to the approved setting and credential fields", async () => {
    const repository = new MemoryAgentRepository()
    const agent = service(repository)
    await agent.updateSettings(update(repository.settings, { dailyQuestionLimit: 20 }), actor)
    await agent.replaceCredential("sk-private", actor)

    expect(repository.audits).toEqual([
      { action: "agent.settings.update", metadata: { changedSettings: ["dailyQuestionLimit"] } },
      {
        action: "agent.credential.register",
        metadata: {
          provider: "openai",
          fingerprint: expect.stringMatching(/^[a-f0-9]{12}$/),
          model: "gpt-test",
          result: "verified",
        },
      },
    ])
    expect(JSON.stringify(repository.audits)).not.toContain("sk-private")
  })

  it("exposes stable service error codes", () => {
    expect(new AgentServiceError("provider_unavailable", "safe").code).toBe("provider_unavailable")
  })
})

describe("Agent store", () => {
  it("keeps optimistic version matching in the settings update", async () => {
    const execute = vi.fn(async (query: SQL) => {
      void query
      return { rows: [] }
    })
    const store = createAgentStore({ execute })
    const current = settings()

    expect(await store.updateSettings(update(current), actor, [])).toBeNull()

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0]![0])
    expect(compiled.sql).toMatch(/WHERE[^]*"version" = \$/)
    expect(compiled.params).toContain(current.version)
  })

  it("makes credential deletion depend on disabling settings first", async () => {
    const execute = vi.fn(async (query: SQL) => {
      void query
      return { rows: [settings({ enabled: false, version: 2 })] }
    })
    const store = createAgentStore({ execute })

    await store.disableAndDeleteCredential(actor)

    const { sql } = new PgDialect().sqlToQuery(execute.mock.calls[0]![0])
    expect(sql.indexOf("UPDATE \"agent_settings\"")).toBeLessThan(sql.indexOf("DELETE FROM \"ai_provider_credentials\""))
    expect(sql).toMatch(/deleted_credential[^]*disabled_settings/)
  })
})
