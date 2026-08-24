import "server-only"

import type { AdminActor } from "@/lib/auth/admin-api"
import {
  CredentialDecryptionError,
  credentialFingerprint,
  decryptCredential,
  encryptCredential,
} from "@/lib/agent/crypto"
import { agentStore } from "@/lib/agent/store"
import type {
  AgentConfiguration,
  AgentRepository,
  AgentSettings,
  AgentSettingsDto,
  AgentSettingsUpdate,
  CredentialStatusDto,
  CredentialVerifier,
  StoredCredential,
} from "@/lib/agent/types"
import { credentialInputSchema } from "@/lib/agent/validation"
import { getAiSecurityEnv } from "@/lib/env"
import { verifyOpenAICredential } from "@/lib/agent/provider"

export type AgentServiceErrorCode =
  | "invalid_settings"
  | "version_conflict"
  | "credential_unavailable"
  | "credential_invalid"
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

function validateEnablement(input: AgentSettingsUpdate, credential: StoredCredential | null): void {
  if (!input.enabled) return
  if (!input.model || input.inputPriceMicrousdPerMillion === null || input.outputPriceMicrousdPerMillion === null) {
    throw new AgentServiceError("invalid_settings", "Model and prices are required before enabling AI")
  }
  if (!credential) {
    throw new AgentServiceError("credential_unavailable", "An OpenAI credential is required before enabling AI")
  }
  if (credential.verificationStatus !== "verified" || credential.verifiedModel !== input.model) {
    throw new AgentServiceError("model_unverified", "The configured model must pass a connection test")
  }
}

export function createAgentService(
  repository: AgentRepository,
  dependencyOverrides: Partial<AgentServiceDependencies> = {},
) {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides }

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
      const modelChanged = input.model !== current.model
      const next = modelChanged ? { ...input, enabled: false } : input
      const credential = await repository.getCredential()
      validateEnablement(next, credential)

      const changedSettings = settingNames.filter((name) => next[name] !== current[name])
      const updated = await repository.updateSettings(next, actor, changedSettings)
      if (!updated) {
        throw new AgentServiceError("version_conflict", "Agent settings changed before they could be updated")
      }
      return configuration(updated, credential)
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
        throw new AgentServiceError("credential_invalid", "The OpenAI credential or model could not be verified", { cause: error })
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
      try {
        await dependencies.verify(apiKey, settings.model)
      } catch (error) {
        await repository.recordCredentialTest(settings.model, "failed", actor, verifiedAt)
        throw new AgentServiceError("provider_unavailable", "OpenAI verification failed", { cause: error })
      }
      const verified = await repository.recordCredentialTest(settings.model, "verified", actor, verifiedAt)
      if (!verified) throw new AgentServiceError("credential_unavailable", "The OpenAI credential was removed")
      return configuration(settings, verified)
    },

    async deleteCredential(actor: AdminActor): Promise<AgentConfiguration> {
      const settings = await repository.disableAndDeleteCredential(actor)
      return configuration(settings, null)
    },
  }
}

export const agentService = createAgentService(agentStore)
