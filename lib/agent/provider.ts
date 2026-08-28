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

export type CredentialVerificationErrorCode =
  | "credential_invalid"
  | "model_access_denied"
  | "model_not_found"
  | "verification_request_invalid"
  | "quota_exhausted"
  | "rate_limited"
  | "provider_unavailable"

export class CredentialVerificationError extends Error {
  constructor(public readonly code: CredentialVerificationErrorCode) {
    super(code)
    this.name = "CredentialVerificationError"
  }
}

function providerErrorCode(error: APICallError): string | null {
  if (!error.responseBody) return null
  try {
    const body = JSON.parse(error.responseBody) as { error?: { code?: unknown } }
    return typeof body.error?.code === "string" ? body.error.code : null
  } catch {
    return null
  }
}

function verificationError(error: unknown): CredentialVerificationError {
  if (NoSuchModelError.isInstance(error)) {
    return new CredentialVerificationError("model_not_found")
  }
  if (InvalidPromptError.isInstance(error)) {
    return new CredentialVerificationError("verification_request_invalid")
  }
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 401) return new CredentialVerificationError("credential_invalid")
    if (error.statusCode === 403) return new CredentialVerificationError("model_access_denied")
    if (error.statusCode === 404) return new CredentialVerificationError("model_not_found")
    if (error.statusCode === 400 || error.statusCode === 422) {
      return new CredentialVerificationError("verification_request_invalid")
    }
    if (error.statusCode === 429) {
      return new CredentialVerificationError(
        providerErrorCode(error) === "insufficient_quota" ? "quota_exhausted" : "rate_limited",
      )
    }
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
