import type { AdminActor } from "@/lib/auth/admin-api"
import type { CredentialEnvelope } from "@/lib/agent/crypto"
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

export type CredentialReplacement = Pick<
  StoredCredential,
  "provider" | "ciphertext" | "iv" | "authTag" | "fingerprint"
> & {
  verifiedModel: string
  verificationStatus: "verified"
  verifiedAt: Date
}

export type AgentSettingsUpdateResult =
  | { status: "updated"; settings: AgentSettings }
  | { status: "version_conflict" }
  | { status: "credential_unavailable" }
  | { status: "model_unverified" }

export type CredentialTestGeneration = Pick<StoredCredential, "fingerprint" | "updatedAt">

export type CredentialTestRecordResult =
  | { status: "updated"; credential: StoredCredential }
  | { status: "stale" }

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
  recordCredentialTest(
    model: string,
    result: VerificationStatus,
    expected: CredentialTestGeneration,
    actor: AdminActor,
    verifiedAt: Date,
  ): Promise<CredentialTestRecordResult>
  disableAndDeleteCredential(actor: AdminActor): Promise<AgentSettings>
}
