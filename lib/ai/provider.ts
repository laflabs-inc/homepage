import "server-only"

import { generateText, type LanguageModel } from "ai"

import { decryptCredential } from "@/lib/agent/crypto"
import { createOpenAITextModel } from "@/lib/agent/provider"
import { agentStore } from "@/lib/agent/store"
import type { AgentSettings, StoredCredential, TextModelFactory } from "@/lib/agent/types"
import type { TokenUsage } from "@/lib/ai/cost"
import { getAiSecurityEnv } from "@/lib/env"

const SUMMARY_OUTPUT_TOKEN_LIMIT = 256

export type SummaryTokenUsage = TokenUsage & { totalTokens: number }

export type SummaryProviderResult = {
  text: string
  model: string
  usage: SummaryTokenUsage
}

export interface AiTextProvider {
  generateSummary(input: { prompt: string; maxOutputTokens: number }): Promise<SummaryProviderResult>
}

type GenerateRequest = {
  model: LanguageModel
  prompt: string
  temperature: number
  maxOutputTokens: number
  maxRetries: number
  abortSignal: AbortSignal
}

type ProviderDependencies = {
  settings: Pick<{ getSettings(): Promise<AgentSettings> }, "getSettings">
  credentials: Pick<{ getCredential(): Promise<StoredCredential | null> }, "getCredential">
  getEncryptionKey: () => Buffer
  factory: TextModelFactory
  generate: (request: GenerateRequest) => Promise<{
    text: string
    usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
  }>
}

export class AiTextProviderError extends Error {
  constructor(public readonly code: "configuration_unavailable" | "provider_unavailable" | "invalid_response") {
    super(code === "configuration_unavailable"
      ? "AI summary configuration is unavailable"
      : code === "invalid_response"
        ? "AI returned an invalid summary response"
        : "AI summary generation is unavailable")
    this.name = "AiTextProviderError"
  }
}

function safeUsage(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : null
}

const defaultDependencies: ProviderDependencies = {
  settings: agentStore,
  credentials: agentStore,
  getEncryptionKey: () => Buffer.from(getAiSecurityEnv().AI_CREDENTIAL_ENCRYPTION_KEY, "base64"),
  factory: createOpenAITextModel,
  generate: (request) => generateText(request),
}

export function createAiTextProvider(dependencies: ProviderDependencies = defaultDependencies): AiTextProvider {
  return {
    async generateSummary({ prompt, maxOutputTokens }) {
      let settings: AgentSettings
      let credential: StoredCredential | null
      let model: LanguageModel
      try {
        [settings, credential] = await Promise.all([
          dependencies.settings.getSettings(),
          dependencies.credentials.getCredential(),
        ])
        if (
          !settings.enabled
          || !settings.model
          || !credential
          || credential.verificationStatus !== "verified"
          || credential.verifiedModel !== settings.model
        ) throw new Error("inactive")
        const apiKey = decryptCredential(credential, dependencies.getEncryptionKey())
        model = dependencies.factory(apiKey, settings.model)
      } catch {
        throw new AiTextProviderError("configuration_unavailable")
      }

      let result: Awaited<ReturnType<ProviderDependencies["generate"]>>
      try {
        result = await dependencies.generate({
          model,
          prompt,
          temperature: 0,
          maxOutputTokens: Math.min(settings.maxOutputTokens, maxOutputTokens, SUMMARY_OUTPUT_TOKEN_LIMIT),
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(15_000),
        })
      } catch {
        throw new AiTextProviderError("provider_unavailable")
      }

      const inputTokens = safeUsage(result.usage.inputTokens)
      const outputTokens = safeUsage(result.usage.outputTokens)
      const totalTokens = safeUsage(result.usage.totalTokens)
      if (inputTokens === null || outputTokens === null) {
        throw new AiTextProviderError("invalid_response")
      }
      return {
        text: result.text,
        model: settings.model,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: totalTokens ?? inputTokens + outputTokens,
        },
      }
    },
  }
}

export const aiTextProvider = createAiTextProvider()
