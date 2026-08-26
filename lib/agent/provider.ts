import "server-only"

import { createOpenAI } from "@ai-sdk/openai"
import {
  APICallError,
  generateText,
  InvalidPromptError,
  NoSuchModelError,
  type LanguageModel,
} from "ai"

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

export type CredentialVerificationErrorCode = "credential_invalid" | "provider_unavailable"

export class CredentialVerificationError extends Error {
  constructor(public readonly code: CredentialVerificationErrorCode) {
    super(code === "credential_invalid" ? "Credential or model was rejected" : "Provider is unavailable")
    this.name = "CredentialVerificationError"
  }
}

function verificationError(error: unknown): CredentialVerificationError {
  if (NoSuchModelError.isInstance(error) || InvalidPromptError.isInstance(error)) {
    return new CredentialVerificationError("credential_invalid")
  }
  if (APICallError.isInstance(error) && [400, 401, 403, 404, 422].includes(error.statusCode ?? 0)) {
    return new CredentialVerificationError("credential_invalid")
  }
  return new CredentialVerificationError("provider_unavailable")
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
  try {
    await dependencies.generate({
      model: dependencies.factory(apiKey, modelId),
      prompt: "Reply OK.",
      temperature: 0,
      maxOutputTokens: 4,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(5_000),
    })
  } catch (error) {
    throw verificationError(error)
  }
}
