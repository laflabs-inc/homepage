import "server-only"

import type { AdminActor } from "@/lib/auth/admin-api"
import {
  CredentialDecryptionError,
  credentialFingerprint,
  decryptCredential,
  encryptCredential,
} from "@/lib/agent/crypto"
import { getAgentModel } from "@/lib/agent/model-catalog"
import { agentStore } from "@/lib/agent/store"
import type {
  AgentCredentialSetupInput,
  AgentConfiguration,
  AgentRepository,
  AgentRuntimeSettingsUpdate,
  AgentSettings,
  AgentSettingsDto,
  AgentSettingsUpdate,
  CredentialStatusDto,
  CredentialVerifier,
  StoredCredential,
} from "@/lib/agent/types"
import { credentialInputSchema } from "@/lib/agent/validation"
import { getAiSecurityEnv } from "@/lib/env"
import {
  CredentialVerificationError,
  type CredentialVerificationErrorCode,
  verifyOpenAICredential,
} from "@/lib/agent/provider"

export type AgentServiceErrorCode =
  | "invalid_settings"
  | "version_conflict"
  | "unsupported_model"
  | "credential_required"
  | "credential_unavailable"
  | "credential_invalid"
  | "model_access_denied"
  | "model_not_found"
  | "verification_request_invalid"
  | "quota_exhausted"
  | "rate_limited"
  | "model_unverified"
  | "encryption_unavailable"
  | "provider_unavailable"

export class AgentServiceError extends Error {
  constructor(
    public readonly code: AgentServiceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = "AgentServiceError"
  }
}

type AgentServiceDependencies = {
  verify: CredentialVerifier
  getEncryptionKey: () => Buffer
  now: () => Date
}

const defaultDependencies: AgentServiceDependencies = {
  verify: verifyOpenAICredential,
  getEncryptionKey: () => Buffer.from(getAiSecurityEnv().AI_CREDENTIAL_ENCRYPTION_KEY, "base64"),
  now: () => new Date(),
}

const settingNames = [
  "enabled",
  "model",
  "dailyTokenLimit",
  "dailyQuestionLimit",
  "maxOutputTokens",
  "monthlyCostLimitMicrousd",
  "inputPriceMicrousdPerMillion",
  "outputPriceMicrousdPerMillion",
  "resetTimezone",
  "dailyResetMinute",
  "cookieRetentionDays",
  "summaryPolicy",
] as const satisfies readonly (keyof AgentSettingsUpdate)[]

function settingsDto(settings: AgentSettings): AgentSettingsDto {
  return {
    enabled: settings.enabled,
    model: settings.model,
    dailyTokenLimit: settings.dailyTokenLimit,
    dailyQuestionLimit: settings.dailyQuestionLimit,
    maxOutputTokens: settings.maxOutputTokens,
    monthlyCostLimitMicrousd: settings.monthlyCostLimitMicrousd,
    inputPriceMicrousdPerMillion: settings.inputPriceMicrousdPerMillion,
    outputPriceMicrousdPerMillion: settings.outputPriceMicrousdPerMillion,
    pricingCheckedAt: settings.pricingCheckedAt,
    resetTimezone: settings.resetTimezone,
    dailyResetMinute: settings.dailyResetMinute,
    cookieRetentionDays: settings.cookieRetentionDays,
    summaryPolicy: settings.summaryPolicy,
    version: settings.version,
    updatedBy: settings.updatedBy,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  }
}

function credentialDto(credential: StoredCredential | null): CredentialStatusDto {
  if (!credential) {
    return {
      configured: false,
      provider: "openai",
      fingerprint: null,
      verifiedModel: null,
      verificationStatus: null,
      verifiedAt: null,
      createdBy: null,
      createdAt: null,
      updatedAt: null,
    }
  }
  return {
    configured: true,
    provider: credential.provider,
    fingerprint: credential.fingerprint,
    verifiedModel: credential.verifiedModel,
    verificationStatus: credential.verificationStatus,
    verifiedAt: credential.verifiedAt,
    createdBy: credential.createdBy,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
  }
}

function configuration(settings: AgentSettings, credential: StoredCredential | null): AgentConfiguration {
  return { settings: settingsDto(settings), credential: credentialDto(credential) }
}

function requireEncryptionKey(dependencies: AgentServiceDependencies): Buffer {
  try {
    return dependencies.getEncryptionKey()
  } catch (error) {
    throw new AgentServiceError("encryption_unavailable", "Credential encryption is unavailable", { cause: error })
  }
}

function validateEnablementSettings(input: AgentSettingsUpdate): void {
  if (!input.enabled) return
  if (!input.model || input.inputPriceMicrousdPerMillion === null || input.outputPriceMicrousdPerMillion === null) {
    throw new AgentServiceError("invalid_settings", "Model and prices are required before enabling AI")
  }
}

function verificationServiceCode(error: unknown): CredentialVerificationErrorCode {
  return error instanceof CredentialVerificationError ? error.code : "provider_unavailable"
}

function verificationServiceMessage(code: CredentialVerificationErrorCode): string {
  return code === "provider_unavailable" ? "OpenAI verification is unavailable" : "OpenAI verification failed"
}

export function createAgentService(
  repository: AgentRepository,
  dependencyOverrides: Partial<AgentServiceDependencies> = {},
) {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides }

  async function persistSettings(
    input: AgentSettingsUpdate,
    actor: AdminActor,
    current?: AgentSettings,
  ): Promise<AgentConfiguration> {
    current ??= await repository.getSettings()
    const modelChanged = input.model !== current.model
    const next = modelChanged ? {
      ...input,
      enabled: false,
      inputPriceMicrousdPerMillion: null,
      outputPriceMicrousdPerMillion: null,
    } : input
    validateEnablementSettings(next)

    const changedSettings = settingNames.filter((name) => next[name] !== current[name])
    if (modelChanged) changedSettings.push("pricingCheckedAt" as typeof changedSettings[number])
    const result = await repository.updateSettings(next, actor, changedSettings)
    if (result.status === "version_conflict") {
      throw new AgentServiceError("version_conflict", "Agent settings changed before they could be updated")
    }
    if (result.status === "credential_unavailable") {
      throw new AgentServiceError("credential_unavailable", "An OpenAI credential is required before enabling AI")
    }
    if (result.status === "model_unverified") {
      throw new AgentServiceError("model_unverified", "The configured model must pass a connection test")
    }
    return configuration(result.settings, await repository.getCredential())
  }

  return {
    async getConfiguration(): Promise<AgentConfiguration> {
      const [settings, credential] = await Promise.all([
        repository.getSettings(),
        repository.getCredential(),
      ])
      return configuration(settings, credential)
    },

    async updateSettings(input: AgentSettingsUpdate, actor: AdminActor): Promise<AgentConfiguration> {
      const current = await repository.getSettings()
      return persistSettings(input, actor, current)
    },

    async updateRuntimeSettings(
      input: AgentRuntimeSettingsUpdate,
      actor: AdminActor,
    ): Promise<AgentConfiguration> {
      const current = await repository.getSettings()
      return persistSettings({
        ...input,
        model: current.model,
        inputPriceMicrousdPerMillion: current.inputPriceMicrousdPerMillion,
        outputPriceMicrousdPerMillion: current.outputPriceMicrousdPerMillion,
      }, actor, current)
    },

    async configureCredential(
      input: AgentCredentialSetupInput,
      actor: AdminActor,
    ): Promise<AgentConfiguration> {
      const catalogModel = getAgentModel(input.model)
      if (!catalogModel) {
        throw new AgentServiceError("unsupported_model", "Choose a supported OpenAI model")
      }

      const [settings, prior] = await Promise.all([
        repository.getSettings(),
        repository.getCredential(),
      ])
      if (settings.version !== input.version) {
        throw new AgentServiceError("version_conflict", "Agent settings changed before setup")
      }

      let apiKey: string
      if (input.apiKey !== undefined) {
        const parsed = credentialInputSchema.safeParse({ apiKey: input.apiKey })
        if (!parsed.success) throw new AgentServiceError("credential_invalid", "The OpenAI credential is invalid")
        apiKey = parsed.data.apiKey
      } else {
        if (!prior) throw new AgentServiceError("credential_required", "Enter an OpenAI credential")
        try {
          apiKey = decryptCredential(prior, requireEncryptionKey(dependencies))
        } catch (error) {
          if (error instanceof AgentServiceError) throw error
          const code = error instanceof CredentialDecryptionError ? "credential_unavailable" : "encryption_unavailable"
          throw new AgentServiceError(code, "The OpenAI credential is unavailable", { cause: error })
        }
      }

      try {
        await dependencies.verify(apiKey, catalogModel.id)
      } catch (error) {
        const code = verificationServiceCode(error)
        throw new AgentServiceError(code, verificationServiceMessage(code))
      }

      const verifiedAt = dependencies.now()
      const encrypted = input.apiKey === undefined
        ? {
            ciphertext: prior!.ciphertext,
            iv: prior!.iv,
            authTag: prior!.authTag,
            fingerprint: prior!.fingerprint,
          }
        : {
            ...encryptCredential(apiKey, requireEncryptionKey(dependencies)),
            fingerprint: credentialFingerprint(apiKey),
          }
      const result = await repository.applyVerifiedSetup({
        version: input.version,
        model: catalogModel.id,
        inputPriceMicrousdPerMillion: catalogModel.inputPriceMicrousdPerMillion,
        outputPriceMicrousdPerMillion: catalogModel.outputPriceMicrousdPerMillion,
        pricingCheckedAt: new Date(catalogModel.pricingCheckedAt),
        credential: {
          provider: "openai",
          ...encrypted,
          verifiedModel: catalogModel.id,
          verificationStatus: "verified",
          verifiedAt,
        },
        expectedCredential: prior
          ? { fingerprint: prior.fingerprint, generation: prior.generation }
          : null,
        replacingKey: input.apiKey !== undefined,
      }, actor)
      if (result.status === "version_conflict") {
        throw new AgentServiceError("version_conflict", "Agent setup changed while verification was running")
      }
      return configuration(result.settings, result.credential)
    },

    async replaceCredential(apiKeyInput: string, actor: AdminActor): Promise<AgentConfiguration> {
      const parsed = credentialInputSchema.safeParse({ apiKey: apiKeyInput })
      if (!parsed.success) throw new AgentServiceError("credential_invalid", "The OpenAI credential is invalid")

      const [settings, prior] = await Promise.all([
        repository.getSettings(),
        repository.getCredential(),
      ])
      if (!settings.model) {
        throw new AgentServiceError("invalid_settings", "Configure a model before registering a credential")
      }

      try {
        await dependencies.verify(parsed.data.apiKey, settings.model)
      } catch (error) {
        const code = verificationServiceCode(error)
        throw new AgentServiceError(code, verificationServiceMessage(code))
      }

      const encrypted = encryptCredential(parsed.data.apiKey, requireEncryptionKey(dependencies))
      const credential = await repository.replaceCredential({
        provider: "openai",
        ...encrypted,
        fingerprint: credentialFingerprint(parsed.data.apiKey),
        verifiedModel: settings.model,
        verificationStatus: "verified",
        verifiedAt: dependencies.now(),
      }, actor, prior !== null)
      return configuration(settings, credential)
    },

    async testCredential(actor: AdminActor): Promise<AgentConfiguration> {
      const [settings, credential] = await Promise.all([
        repository.getSettings(),
        repository.getCredential(),
      ])
      if (!credential) throw new AgentServiceError("credential_unavailable", "No OpenAI credential is configured")
      if (!settings.model) throw new AgentServiceError("invalid_settings", "Configure a model before testing the credential")

      let apiKey: string
      try {
        apiKey = decryptCredential(credential, requireEncryptionKey(dependencies))
      } catch (error) {
        if (error instanceof AgentServiceError) throw error
        const code = error instanceof CredentialDecryptionError ? "credential_unavailable" : "encryption_unavailable"
        throw new AgentServiceError(code, "The OpenAI credential is unavailable", { cause: error })
      }

      const verifiedAt = dependencies.now()
      const expected = { fingerprint: credential.fingerprint, generation: credential.generation }
      try {
        await dependencies.verify(apiKey, settings.model)
      } catch (error) {
        const recorded = await repository.recordCredentialTest(settings.model, "failed", expected, actor, verifiedAt)
        if (recorded.status === "stale") {
          throw new AgentServiceError("version_conflict", "Agent verification changed while the test was running")
        }
        const code = verificationServiceCode(error)
        throw new AgentServiceError(code, verificationServiceMessage(code))
      }
      const recorded = await repository.recordCredentialTest(settings.model, "verified", expected, actor, verifiedAt)
      if (recorded.status === "stale") {
        throw new AgentServiceError("version_conflict", "Agent verification changed while the test was running")
      }
      return configuration(await repository.getSettings(), recorded.credential)
    },

    async deleteCredential(actor: AdminActor): Promise<AgentConfiguration> {
      const settings = await repository.disableAndDeleteCredential(actor)
      return configuration(settings, null)
    },
  }
}

export const agentService = createAgentService(agentStore)
