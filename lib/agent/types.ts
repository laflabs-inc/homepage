import type { AdminActor } from "@/lib/auth/admin-api"
import type { CredentialEnvelope } from "@/lib/agent/crypto"
import type { SupportedAgentModelId } from "@/lib/agent/model-catalog"
import type { LanguageModel } from "ai"

export type SummaryPolicy = "review" | "automatic"
export type VerificationStatus = "verified" | "failed"

export type AgentSettings = {
  id: "default"
  enabled: boolean
  model: string | null
  dailyTokenLimit: number
  dailyQuestionLimit: number
  maxOutputTokens: number
  monthlyCostLimitMicrousd: number
  inputPriceMicrousdPerMillion: number | null
  outputPriceMicrousdPerMillion: number | null
  pricingCheckedAt: Date | null
  resetTimezone: string
  dailyResetMinute: number
  cookieRetentionDays: number
  summaryPolicy: SummaryPolicy
  version: number
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

export type AgentSettingsDto = Omit<AgentSettings, "id">

export type StoredCredential = CredentialEnvelope & {
  provider: "openai"
  fingerprint: string
  generation: string
  verifiedModel: string | null
  verificationStatus: VerificationStatus
  verifiedAt: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type CredentialStatusDto = {
  configured: boolean
  provider: "openai"
  fingerprint: string | null
  verifiedModel: string | null
  verificationStatus: VerificationStatus | null
  verifiedAt: Date | null
  createdBy: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export type AgentConfiguration = {
  settings: AgentSettingsDto
  credential: CredentialStatusDto
}

export type AgentSettingsUpdate = Pick<
  AgentSettings,
  | "enabled"
  | "model"
  | "dailyTokenLimit"
  | "dailyQuestionLimit"
  | "maxOutputTokens"
  | "monthlyCostLimitMicrousd"
  | "inputPriceMicrousdPerMillion"
  | "outputPriceMicrousdPerMillion"
  | "resetTimezone"
  | "dailyResetMinute"
  | "cookieRetentionDays"
  | "summaryPolicy"
> & { version: number }

export type AgentRuntimeSettingsUpdate = Pick<
  AgentSettings,
  | "enabled"
  | "dailyTokenLimit"
  | "dailyQuestionLimit"
  | "maxOutputTokens"
  | "monthlyCostLimitMicrousd"
  | "resetTimezone"
  | "dailyResetMinute"
  | "cookieRetentionDays"
  | "summaryPolicy"
> & { version: number }

export type AgentCredentialSetupInput = {
  apiKey?: string
  model: SupportedAgentModelId
  version: number
}

export type CredentialReplacement = Pick<
  StoredCredential,
  "provider" | "ciphertext" | "iv" | "authTag" | "fingerprint"
> & {
  verifiedModel: string
  verificationStatus: "verified"
  verifiedAt: Date
}

export type VerifiedAgentSetup = {
  version: number
  model: SupportedAgentModelId
  inputPriceMicrousdPerMillion: number
  outputPriceMicrousdPerMillion: number
  pricingCheckedAt: Date
  credential: CredentialReplacement
  expectedCredential: CredentialTestGeneration | null
  replacingKey: boolean
}

export type VerifiedAgentSetupResult =
  | { status: "updated"; settings: AgentSettings; credential: StoredCredential }
  | { status: "version_conflict" }

export type AgentSettingsUpdateResult =
  | { status: "updated"; settings: AgentSettings }
  | { status: "version_conflict" }
  | { status: "credential_unavailable" }
  | { status: "model_unverified" }

export type CredentialTestGeneration = Pick<StoredCredential, "fingerprint" | "generation">

export type CredentialTestRecordResult =
  | { status: "updated"; credential: StoredCredential }
  | { status: "stale" }

export type CredentialVerificationDiagnostic = {
  statusCode: number | null
  providerCode: string | null
  providerType: string | null
  providerParam: string | null
  requestId: string | null
  providerMessage: string | null
}

export type CredentialVerifier = (apiKey: string, modelId: string) => Promise<void>
export type TextModelFactory = (apiKey: string, modelId: string) => LanguageModel

export interface AgentRepository {
  getSettings(): Promise<AgentSettings>
  getCredential(): Promise<StoredCredential | null>
  updateSettings(
    input: AgentSettingsUpdate,
    actor: AdminActor,
    changedSettings: string[],
  ): Promise<AgentSettingsUpdateResult>
  replaceCredential(input: CredentialReplacement, actor: AdminActor, replacing: boolean): Promise<StoredCredential>
  applyVerifiedSetup(input: VerifiedAgentSetup, actor: AdminActor): Promise<VerifiedAgentSetupResult>
  recordCredentialTest(
    model: string,
    result: VerificationStatus,
    expected: CredentialTestGeneration,
    actor: AdminActor,
    verifiedAt: Date,
  ): Promise<CredentialTestRecordResult>
  disableAndDeleteCredential(actor: AdminActor): Promise<AgentSettings>
}
