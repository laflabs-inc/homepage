import { describe, expect, it, vi } from "vitest"
import type { SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core"

import type { AdminActor } from "@/lib/auth/admin-api"
import { decryptCredential } from "@/lib/agent/crypto"
import type { SupportedAgentModelId } from "@/lib/agent/model-catalog"
import { CredentialVerificationError } from "@/lib/agent/provider"
import { AgentServiceError, createAgentService } from "@/lib/agent/service"
import { createAgentStore } from "@/lib/agent/store"
import type {
  AgentRepository,
  AgentRuntimeSettingsUpdate,
  AgentSettings,
  AgentSettingsUpdate,
  CredentialReplacement,
  CredentialVerifier,
  StoredCredential,
  VerificationStatus,
} from "@/lib/agent/types"

type VerifiedSetupInput = {
  version: number
  model: SupportedAgentModelId
  inputPriceMicrousdPerMillion: number
  outputPriceMicrousdPerMillion: number
  pricingCheckedAt: Date
  credential: CredentialReplacement
  expectedCredential: Pick<StoredCredential, "fingerprint" | "generation"> | null
  replacingKey: boolean
}

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

function runtimeUpdate(
  current: AgentSettings,
  overrides: Partial<AgentRuntimeSettingsUpdate> = {},
): AgentRuntimeSettingsUpdate {
  return {
    enabled: current.enabled,
    dailyTokenLimit: current.dailyTokenLimit,
    dailyQuestionLimit: current.dailyQuestionLimit,
    maxOutputTokens: current.maxOutputTokens,
    monthlyCostLimitMicrousd: current.monthlyCostLimitMicrousd,
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
  beforeUpdate?: () => void
  beforeSetup?: () => void
  private generationCounter = 0

  private touch() {
    return new Date(now.getTime() + ++this.generationCounter)
  }

  private generation() {
    return `generation-${this.generationCounter}`
  }

  async getSettings() { return this.settings }
  async getCredential() { return this.credential }

  async updateSettings(input: AgentSettingsUpdate, admin: AdminActor, changedSettings: string[]) {
    this.beforeUpdate?.()
    if (input.version !== this.settings.version) return { status: "version_conflict" as const }
    if (input.enabled && !this.credential) return { status: "credential_unavailable" as const }
    if (input.enabled && (
      this.credential?.verificationStatus !== "verified"
      || this.credential.verifiedModel !== input.model
    )) return { status: "model_unverified" as const }
    const modelChanged = input.model !== this.settings.model
    this.settings = {
      ...this.settings,
      ...input,
      enabled: modelChanged ? false : input.enabled,
      inputPriceMicrousdPerMillion: modelChanged ? null : input.inputPriceMicrousdPerMillion,
      outputPriceMicrousdPerMillion: modelChanged ? null : input.outputPriceMicrousdPerMillion,
      pricingCheckedAt: modelChanged ? null : this.settings.pricingCheckedAt,
      version: this.settings.version + 1,
      updatedBy: admin.githubId,
      updatedAt: now,
    }
    if (modelChanged && this.credential) {
      const updatedAt = this.touch()
      this.credential = {
        ...this.credential,
        verificationStatus: "failed",
        verifiedModel: null,
        verifiedAt: null,
        updatedAt,
        generation: this.generation(),
      }
    }
    this.events.push("settings:update")
    this.audits.push({ action: "agent.settings.update", metadata: { changedSettings } })
    return { status: "updated" as const, settings: this.settings }
  }

  async replaceCredential(input: CredentialReplacement, admin: AdminActor, replacing: boolean) {
    this.events.push("credential:replace")
    const updatedAt = this.touch()
    this.credential = {
      ...input,
      createdBy: admin.githubId,
      createdAt: now,
      updatedAt,
      generation: this.generation(),
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

  async applyVerifiedSetup(input: VerifiedSetupInput, admin: AdminActor) {
    this.beforeSetup?.()
    if (input.version !== this.settings.version) return { status: "version_conflict" as const }
    if (input.expectedCredential === null) {
      if (this.credential !== null) return { status: "version_conflict" as const }
    } else if (
      this.credential?.fingerprint !== input.expectedCredential.fingerprint
      || this.credential.generation !== input.expectedCredential.generation
    ) {
      return { status: "version_conflict" as const }
    }

    const modelChanged = input.model !== this.settings.model
    this.settings = {
      ...this.settings,
      enabled: modelChanged ? false : this.settings.enabled,
      model: input.model,
      inputPriceMicrousdPerMillion: input.inputPriceMicrousdPerMillion,
      outputPriceMicrousdPerMillion: input.outputPriceMicrousdPerMillion,
      pricingCheckedAt: input.pricingCheckedAt,
      version: this.settings.version + 1,
      updatedBy: admin.githubId,
      updatedAt: now,
    }
    const prior = this.credential
    const updatedAt = this.touch()
    this.credential = {
      ...input.credential,
      createdBy: input.replacingKey || !prior ? admin.githubId : prior.createdBy,
      createdAt: input.replacingKey || !prior ? now : prior.createdAt,
      updatedAt,
      generation: this.generation(),
    }
    this.events.push("setup:apply")
    return { status: "updated" as const, settings: this.settings, credential: this.credential }
  }

  async recordCredentialTest(
    model: string,
    result: VerificationStatus,
    expected: Pick<StoredCredential, "fingerprint" | "generation">,
    admin: AdminActor,
    verifiedAt: Date,
  ) {
    this.events.push("test:lock-settings", "test:lock-credential")
    if (
      this.settings.model !== model
      || !this.credential
      || this.credential.fingerprint !== expected.fingerprint
      || this.credential.generation !== expected.generation
    ) return { status: "stale" as const }
    const updatedAt = this.touch()
    this.credential = {
      ...this.credential,
      verifiedModel: result === "verified" ? model : null,
      verificationStatus: result,
      verifiedAt: result === "verified" ? verifiedAt : null,
      updatedAt,
      generation: this.generation(),
    }
    if (result === "failed" && this.settings.enabled) {
      this.settings = {
        ...this.settings,
        enabled: false,
        version: this.settings.version + 1,
        updatedBy: admin.githubId,
        updatedAt: this.touch(),
      }
    }
    this.audits.push({
      action: "agent.credential.test",
      metadata: {
        provider: "openai",
        fingerprint: this.credential.fingerprint,
        model,
        result,
      },
    })
    return { status: "updated" as const, credential: this.credential }
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
  it("verifies and saves the selected catalog model with server-owned prices", async () => {
    const repository = new MemoryAgentRepository()
    repository.settings = settings({
      model: null,
      inputPriceMicrousdPerMillion: null,
      outputPriceMicrousdPerMillion: null,
      pricingCheckedAt: null,
    })
    const verify = vi.fn(async () => { repository.events.push("setup:verify") })

    const result = await service(repository, verify).configureCredential({
      apiKey: "sk-candidate",
      model: "gpt-5.6-luna",
      version: repository.settings.version,
    }, actor)

    expect(verify).toHaveBeenCalledWith("sk-candidate", "gpt-5.6-luna")
    expect(repository.events).toEqual(["setup:verify", "setup:apply"])
    expect(result.settings).toMatchObject({
      model: "gpt-5.6-luna",
      inputPriceMicrousdPerMillion: 200_000,
      outputPriceMicrousdPerMillion: 1_200_000,
      pricingCheckedAt: new Date("2026-08-27T00:00:00.000Z"),
    })
    expect(decryptCredential(repository.credential!, encryptionKey)).toBe("sk-candidate")
  })

  it("applies a new catalog model with the stored encrypted credential", async () => {
    const repository = new MemoryAgentRepository()
    repository.settings = settings({
      model: null,
      inputPriceMicrousdPerMillion: null,
      outputPriceMicrousdPerMillion: null,
      pricingCheckedAt: null,
    })
    const agent = service(repository)
    await agent.configureCredential({
      apiKey: "sk-stored",
      model: "gpt-5.6-luna",
      version: repository.settings.version,
    }, actor)
    repository.settings = { ...repository.settings, enabled: true }
    const ciphertext = repository.credential!.ciphertext
    const verify = vi.fn(async () => {})

    const result = await service(repository, verify).configureCredential({
      model: "gpt-5.6-terra",
      version: repository.settings.version,
    }, actor)

    expect(verify).toHaveBeenCalledWith("sk-stored", "gpt-5.6-terra")
    expect(result.settings).toMatchObject({
      enabled: false,
      model: "gpt-5.6-terra",
      inputPriceMicrousdPerMillion: 2_000_000,
      outputPriceMicrousdPerMillion: 12_000_000,
    })
    expect(repository.credential).toMatchObject({
      ciphertext,
      verifiedModel: "gpt-5.6-terra",
      verificationStatus: "verified",
    })
  })

  it("requires a submitted key for first-time setup", async () => {
    const repository = new MemoryAgentRepository()
    repository.settings = settings({ model: null })

    await expect(service(repository).configureCredential({
      model: "gpt-5.6-luna",
      version: repository.settings.version,
    }, actor)).rejects.toMatchObject({ code: "credential_required" })
  })

  it("rejects unsupported models before provider verification", async () => {
    const repository = new MemoryAgentRepository()
    const verify = vi.fn(async () => {})

    await expect(service(repository, verify).configureCredential({
      apiKey: "sk-candidate",
      model: "custom-model",
      version: repository.settings.version,
    } as never, actor)).rejects.toMatchObject({ code: "unsupported_model" })
    expect(verify).not.toHaveBeenCalled()
  })

  it("does not overwrite a credential that changes during model verification", async () => {
    const repository = new MemoryAgentRepository()
    repository.settings = settings({ model: null })
    const agent = service(repository)
    await agent.configureCredential({
      apiKey: "sk-stored",
      model: "gpt-5.6-luna",
      version: repository.settings.version,
    }, actor)
    const prior = repository.credential
    repository.beforeSetup = () => {
      repository.credential = { ...repository.credential!, generation: "concurrent-generation" }
    }

    await expect(agent.configureCredential({
      model: "gpt-5.6-terra",
      version: repository.settings.version,
    }, actor)).rejects.toMatchObject({ code: "version_conflict" })
    expect(repository.credential).toEqual({ ...prior, generation: "concurrent-generation" })
    expect(repository.settings.model).toBe("gpt-5.6-luna")
  })

  it("updates runtime limits without accepting model or catalog price changes", async () => {
    const repository = new MemoryAgentRepository()
    repository.settings = settings({
      model: "gpt-5.6-luna",
      inputPriceMicrousdPerMillion: 200_000,
      outputPriceMicrousdPerMillion: 1_200_000,
    })

    const result = await service(repository).updateRuntimeSettings(runtimeUpdate(repository.settings, {
      dailyQuestionLimit: 25,
    }), actor)

    expect(result.settings).toMatchObject({
      model: "gpt-5.6-luna",
      inputPriceMicrousdPerMillion: 200_000,
      outputPriceMicrousdPerMillion: 1_200_000,
      dailyQuestionLimit: 25,
    })
  })

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
    const failing = service(repository, vi.fn(async () => {
      throw new CredentialVerificationError("credential_invalid")
    }))

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

    for (const forbidden of ["apiKey", "ciphertext", "iv", "authTag", "generation"]) {
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

  it("rejects enablement when a concurrent failed test invalidates the credential after the pre-read", async () => {
    const repository = new MemoryAgentRepository()
    await service(repository).replaceCredential("sk-stored", actor)
    repository.beforeUpdate = () => {
      repository.credential = { ...repository.credential!, verificationStatus: "failed" }
    }

    await expect(service(repository).updateSettings(update(repository.settings, { enabled: true }), actor))
      .rejects.toMatchObject({ code: "model_unverified" })

    expect(repository.settings.enabled).toBe(false)
  })

  it("clears pricing and verification whenever the model changes, including A to B to A", async () => {
    const repository = new MemoryAgentRepository()
    repository.settings = settings({ enabled: true })
    await service(repository).replaceCredential("sk-stored", actor)
    const ciphertext = repository.credential!.ciphertext

    const changedToB = await service(repository).updateSettings(update(repository.settings, {
      enabled: true,
      model: "gpt-b",
    }), actor)

    expect(changedToB.settings).toMatchObject({
      enabled: false,
      model: "gpt-b",
      inputPriceMicrousdPerMillion: null,
      outputPriceMicrousdPerMillion: null,
      pricingCheckedAt: null,
    })
    expect(repository.credential).toMatchObject({
      ciphertext,
      verificationStatus: "failed",
      verifiedModel: null,
      verifiedAt: null,
    })

    const changedBackToA = await service(repository).updateSettings(update(repository.settings, {
      model: "gpt-test",
      inputPriceMicrousdPerMillion: 3_000_000,
      outputPriceMicrousdPerMillion: 4_000_000,
    }), actor)

    expect(changedBackToA.settings).toMatchObject({
      enabled: false,
      model: "gpt-test",
      inputPriceMicrousdPerMillion: null,
      outputPriceMicrousdPerMillion: null,
      pricingCheckedAt: null,
    })
    await expect(service(repository).updateSettings(update(repository.settings, {
      enabled: true,
      inputPriceMicrousdPerMillion: 3_000_000,
      outputPriceMicrousdPerMillion: 4_000_000,
    }), actor)).rejects.toMatchObject({ code: "model_unverified" })
  })

  it("tests the stored key against the current exact model and disables on failure", async () => {
    const repository = new MemoryAgentRepository()
    await service(repository).replaceCredential("sk-stored", actor)
    repository.settings = settings({ enabled: true, model: "gpt-new" })
    const verify = vi.fn(async (_key: string, model: string) => {
      expect(model).toBe("gpt-new")
      throw new CredentialVerificationError("provider_unavailable")
    })

    await expect(service(repository, verify).testCredential(actor))
      .rejects.toMatchObject({ code: "provider_unavailable" })

    expect(repository.settings.enabled).toBe(false)
    expect(repository.credential).toMatchObject({ verifiedModel: null, verificationStatus: "failed", verifiedAt: null })
  })

  it("disables AI when enable commits while a failing provider test is in flight", async () => {
    const repository = new MemoryAgentRepository()
    await service(repository).replaceCredential("sk-stored", actor)
    let rejectVerification!: (error: Error) => void
    let verificationStarted!: () => void
    const started = new Promise<void>((resolve) => { verificationStarted = resolve })
    const verify = vi.fn(() => new Promise<void>((_resolve, reject) => {
      rejectVerification = reject
      verificationStarted()
    }))

    const test = service(repository, verify).testCredential(actor)
    await started
    await service(repository).updateSettings(update(repository.settings, { enabled: true }), actor)
    expect(repository.settings.enabled).toBe(true)
    rejectVerification(new CredentialVerificationError("provider_unavailable"))

    await expect(test).rejects.toMatchObject({ code: "provider_unavailable" })
    expect(repository.settings.enabled).toBe(false)
    expect(repository.events.slice(-2)).toEqual(["test:lock-settings", "test:lock-credential"])
  })

  it("does not let an in-flight failed test overwrite a replacement credential", async () => {
    const repository = new MemoryAgentRepository()
    await service(repository).replaceCredential("sk-prior", actor)
    let rejectVerification!: (error: Error) => void
    let verificationStarted!: () => void
    const started = new Promise<void>((resolve) => { verificationStarted = resolve })
    const verify = vi.fn(() => new Promise<void>((_resolve, reject) => {
      rejectVerification = reject
      verificationStarted()
    }))

    const test = service(repository, verify).testCredential(actor)
    await started
    await service(repository).replaceCredential("sk-replacement", actor)
    const replacement = repository.credential
    rejectVerification(new CredentialVerificationError("credential_invalid"))

    await expect(test).rejects.toMatchObject({ code: "version_conflict" })
    expect(repository.credential).toBe(replacement)
    expect(repository.credential).toMatchObject({ verificationStatus: "verified", verifiedModel: "gpt-test" })
  })

  it("does not let an in-flight A test revalidate A after an A to B to A round trip", async () => {
    const repository = new MemoryAgentRepository()
    await service(repository).replaceCredential("sk-stored", actor)
    let finishVerification!: () => void
    let verificationStarted!: () => void
    const started = new Promise<void>((resolve) => { verificationStarted = resolve })
    const verify = vi.fn(() => new Promise<void>((resolve) => {
      finishVerification = resolve
      verificationStarted()
    }))

    const test = service(repository, verify).testCredential(actor)
    await started
    await service(repository).updateSettings(update(repository.settings, { model: "gpt-b" }), actor)
    await service(repository).updateSettings(update(repository.settings, { model: "gpt-test" }), actor)
    finishVerification()

    await expect(test).rejects.toMatchObject({ code: "version_conflict" })
    expect(repository.credential).toMatchObject({
      verificationStatus: "failed",
      verifiedModel: null,
      verifiedAt: null,
    })
  })

  it("uses optimistic versions for settings updates", async () => {
    const repository = new MemoryAgentRepository()

    await expect(service(repository).updateSettings(update(repository.settings, { version: 99 }), actor))
      .rejects.toMatchObject({ code: "version_conflict" })
  })

  it.each([
    ["credential_invalid", "credential_invalid"],
    ["model_access_denied", "model_access_denied"],
    ["model_not_found", "model_not_found"],
    ["verification_request_invalid", "verification_request_invalid"],
    ["quota_exhausted", "quota_exhausted"],
    ["rate_limited", "rate_limited"],
    ["provider_unavailable", "provider_unavailable"],
  ] as const)("maps typed verification %s consistently for registration and tests", async (cause, code) => {
    const registrationRepository = new MemoryAgentRepository()
    const failing = vi.fn(async () => { throw new CredentialVerificationError(cause) })

    await expect(service(registrationRepository, failing).replaceCredential("sk-candidate", actor))
      .rejects.toMatchObject({ code })

    const testRepository = new MemoryAgentRepository()
    await service(testRepository).replaceCredential("sk-stored", actor)
    await expect(service(testRepository, failing).testCredential(actor))
      .rejects.toMatchObject({ code })
  })

  it("preserves a typed verification diagnostic without writing it to audit history", async () => {
    const repository = new MemoryAgentRepository()
    const diagnostic = {
      statusCode: 400,
      providerCode: "invalid_request_error",
      providerType: "invalid_request_error",
      providerParam: "temperature",
      requestId: "req_diagnostic_123",
      providerMessage: "Unsupported parameter: temperature",
    }
    const failing = vi.fn(async () => {
      throw new CredentialVerificationError("verification_request_invalid", diagnostic)
    })

    await expect(service(repository, failing).configureCredential({
      apiKey: "sk-candidate",
      model: "gpt-5.6-luna",
      version: repository.settings.version,
    }, actor)).rejects.toMatchObject({
      code: "verification_request_invalid",
      diagnostic,
    })
    expect(JSON.stringify(repository.audits)).not.toContain("temperature")
    expect(JSON.stringify(repository.audits)).not.toContain("sk-candidate")
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
  it("updates the verified model, catalog prices, and credential in one transaction", async () => {
    const current = settings({
      enabled: true,
      model: "gpt-5.6-luna",
      version: 4,
    })
    const execute = vi.fn(async (query: SQL) => {
      void query
      return { rows: [{
        updateStatus: "updated",
        ...current,
        enabled: false,
        model: "gpt-5.6-terra",
        inputPriceMicrousdPerMillion: 2_000_000,
        outputPriceMicrousdPerMillion: 12_000_000,
        pricingCheckedAt: now,
        version: 5,
        credentialProvider: "openai",
        credentialCiphertext: "encrypted",
        credentialIv: "iv",
        credentialAuthTag: "tag",
        credentialFingerprint: "123456789abc",
        credentialVerifiedModel: "gpt-5.6-terra",
        credentialVerificationStatus: "verified",
        credentialVerifiedAt: now,
        credentialCreatedBy: actor.githubId,
        credentialCreatedAt: now,
        credentialUpdatedAt: now,
        credentialGeneration: "1787562000654321",
      }] }
    })
    const store = createAgentStore({ execute })

    await expect(store.applyVerifiedSetup({
      version: 4,
      model: "gpt-5.6-terra",
      inputPriceMicrousdPerMillion: 2_000_000,
      outputPriceMicrousdPerMillion: 12_000_000,
      pricingCheckedAt: now,
      credential: {
        provider: "openai",
        ciphertext: "encrypted",
        iv: "iv",
        authTag: "tag",
        fingerprint: "123456789abc",
        verifiedModel: "gpt-5.6-terra",
        verificationStatus: "verified",
        verifiedAt: now,
      },
      expectedCredential: {
        fingerprint: "prior-fingerprint",
        generation: "1787562000123456",
      },
      replacingKey: false,
    }, actor)).resolves.toMatchObject({
      status: "updated",
      settings: {
        enabled: false,
        model: "gpt-5.6-terra",
        inputPriceMicrousdPerMillion: 2_000_000,
        outputPriceMicrousdPerMillion: 12_000_000,
      },
      credential: {
        fingerprint: "123456789abc",
        verifiedModel: "gpt-5.6-terra",
        generation: "1787562000654321",
      },
    })

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0]![0])
    expect(compiled.sql).toMatch(/locked_settings[^]*FOR UPDATE[^]*locked_credential[^]*FOR UPDATE/)
    expect(compiled.sql).toMatch(/locked_settings\."version"[^]*locked_credential\."fingerprint"[^]*extract\(epoch FROM locked_credential\."updated_at"\)/)
    expect(compiled.sql).toMatch(/UPDATE "agent_settings"[^]*input_price_microusd_per_million[^]*output_price_microusd_per_million[^]*pricing_checked_at/)
    expect(compiled.sql).toMatch(/INSERT INTO "ai_provider_credentials"[^]*ON CONFLICT/)
    expect(compiled.params).toEqual(expect.arrayContaining([
      4,
      "gpt-5.6-terra",
      2_000_000,
      12_000_000,
      "prior-fingerprint",
      "1787562000123456",
    ]))
  })

  it("returns a setup version conflict without mapping missing rows", async () => {
    const execute = vi.fn(async (query: SQL) => {
      void query
      return { rows: [{ updateStatus: "version_conflict" }] }
    })
    const store = createAgentStore({ execute })

    await expect(store.applyVerifiedSetup({
      version: 99,
      model: "gpt-5.6-luna",
      inputPriceMicrousdPerMillion: 200_000,
      outputPriceMicrousdPerMillion: 1_200_000,
      pricingCheckedAt: now,
      credential: {
        provider: "openai",
        ciphertext: "encrypted",
        iv: "iv",
        authTag: "tag",
        fingerprint: "123456789abc",
        verifiedModel: "gpt-5.6-luna",
        verificationStatus: "verified",
        verifiedAt: now,
      },
      expectedCredential: null,
      replacingKey: true,
    }, actor)).resolves.toEqual({ status: "version_conflict" })
  })

  it("keeps optimistic version matching in the settings update", async () => {
    const execute = vi.fn(async (query: SQL) => {
      void query
      return { rows: [] }
    })
    const store = createAgentStore({ execute })
    const current = settings()

    expect(await store.updateSettings(update(current), actor, [])).toEqual({ status: "version_conflict" })

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0]![0])
    expect(compiled.sql).toMatch(/WHEN locked_settings\."version" <> \$/)
    expect(compiled.params).toContain(current.version)
  })

  it("atomically checks exact credential verification when enabling", async () => {
    const execute = vi.fn(async (query: SQL) => {
      void query
      return { rows: [{ updateStatus: "model_unverified" }] }
    })
    const store = createAgentStore({ execute })

    expect(await store.updateSettings(update(settings(), { enabled: true }), actor, ["enabled"]))
      .toEqual({ status: "model_unverified" })

    const { sql } = new PgDialect().sqlToQuery(execute.mock.calls[0]![0])
    expect(sql).toMatch(/FOR UPDATE[^]*ai_provider_credentials[^]*verification_status[^]*verified_model/)
    expect(sql).toMatch(/locked_credential[^]*SELECT count\(\*\) FROM locked_settings[^]*FOR UPDATE/)
  })

  it("invalidates verification and clears prices in the same model-change statement", async () => {
    const execute = vi.fn(async (query: SQL) => {
      void query
      return { rows: [{ updateStatus: "version_conflict" }] }
    })
    const store = createAgentStore({ execute })

    await store.updateSettings(update(settings(), { model: "gpt-b" }), actor, ["model"])

    const { sql } = new PgDialect().sqlToQuery(execute.mock.calls[0]![0])
    expect(sql).toMatch(/input_price_microusd_per_million[^]*THEN NULL/)
    expect(sql).toMatch(/output_price_microusd_per_million[^]*THEN NULL/)
    expect(sql).toMatch(/pricing_checked_at[^]*THEN NULL/)
    expect(sql).toMatch(/verification_status[^]*verified_model[^]*verified_at/)
  })

  it("locks settings before credential for every test result and rejects stale generations", async () => {
    const execute = vi.fn(async (query: SQL) => {
      void query
      return { rows: [{ recordStatus: "stale" }] }
    })
    const store = createAgentStore({ execute })
    const credential = {
      fingerprint: "123456789abc",
      generation: "1787562000123456",
    }

    expect(await store.recordCredentialTest("gpt-test", "failed", credential, actor, now))
      .toEqual({ status: "stale" })

    const { sql } = new PgDialect().sqlToQuery(execute.mock.calls[0]![0])
    const settingsLock = sql.indexOf('FROM "agent_settings"')
    const credentialLock = sql.indexOf('FROM "ai_provider_credentials"')
    expect(settingsLock).toBeGreaterThan(-1)
    expect(settingsLock).toBeLessThan(credentialLock)
    expect(sql).toMatch(/locked_credential[^]*SELECT count\(\*\) FROM locked_settings[^]*FOR UPDATE/)
    expect(sql).toMatch(/fingerprint[^]*extract\(epoch FROM locked_credential\."updated_at"\)[^]*recordStatus/)
    expect(new PgDialect().sqlToQuery(execute.mock.calls[0]![0]).params).toContain("1787562000123456")
  })

  it("accepts a current microsecond-precision generation token and returns the next opaque token", async () => {
    const execute = vi.fn(async (query: SQL) => {
      void query
      return { rows: [{
        recordStatus: "updated",
        provider: "openai",
        ciphertext: "encrypted",
        iv: "iv",
        authTag: "tag",
        fingerprint: "123456789abc",
        verifiedModel: "gpt-test",
        verificationStatus: "verified",
        verifiedAt: now,
        createdBy: actor.githubId,
        createdAt: now,
        updatedAt: now,
        generation: "1787562000654321",
      }] }
    })
    const store = createAgentStore({ execute })

    await expect(store.recordCredentialTest("gpt-test", "verified", {
      fingerprint: "123456789abc",
      generation: "1787562000123456",
    }, actor, now)).resolves.toMatchObject({
      status: "updated",
      credential: { generation: "1787562000654321" },
    })

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0]![0])
    expect(compiled.params).toContain("1787562000123456")
    expect(compiled.sql).toMatch(/extract\(epoch FROM c\."updated_at"\)[^]*AS "generation"/)
  })

  it("makes valid failure disablement precede evidence invalidation", async () => {
    const execute = vi.fn(async (query: SQL) => {
      void query
      return { rows: [{ recordStatus: "stale" }] }
    })
    const store = createAgentStore({ execute })

    await store.recordCredentialTest("gpt-test", "failed", {
      fingerprint: "123456789abc",
      generation: "1787562000123456",
    }, actor, now)

    const { sql } = new PgDialect().sqlToQuery(execute.mock.calls[0]![0])
    expect(sql.indexOf('UPDATE "agent_settings"')).toBeLessThan(sql.indexOf('UPDATE "ai_provider_credentials"'))
    expect(sql).toMatch(/updated_credential[^]*disabled_settings/)
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
