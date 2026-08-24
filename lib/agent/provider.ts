import "server-only"

import { createOpenAI } from "@ai-sdk/openai"
import { generateText, type LanguageModel } from "ai"

import type { TextModelFactory } from "@/lib/agent/types"

type VerificationRequest = {
  model: LanguageModel
  prompt: string
  temperature: number
  maxOutputTokens: number
  maxRetries: number
  abortSignal: AbortSignal
}

type ProviderDependencies = {
  factory: TextModelFactory
  generate: (request: VerificationRequest) => Promise<unknown>
}

export const createOpenAITextModel: TextModelFactory = (apiKey, modelId) => {
  const openai = createOpenAI({ apiKey })
  return openai(modelId)
}

const defaultDependencies: ProviderDependencies = {
  factory: createOpenAITextModel,
  generate: (request) => generateText(request),
}

export async function verifyOpenAICredential(
  apiKey: string,
  modelId: string,
  dependencies: ProviderDependencies = defaultDependencies,
): Promise<void> {
  await dependencies.generate({
    model: dependencies.factory(apiKey, modelId),
    prompt: "Reply OK.",
    temperature: 0,
    maxOutputTokens: 4,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(5_000),
  })
}
