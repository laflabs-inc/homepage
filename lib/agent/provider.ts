import "server-only"

import { createOpenAI } from "@ai-sdk/openai"
import {
  APICallError,
  generateText,
  InvalidPromptError,
  NoSuchModelError,
  type LanguageModel,
} from "ai"

import type {
  CredentialVerificationDiagnostic,
  TextModelFactory,
} from "@/lib/agent/types"

type VerificationRequest = {
  model: LanguageModel
  prompt: string
  maxOutputTokens: number
  maxRetries: number
  abortSignal: AbortSignal
  providerOptions: {
    openai: {
      reasoningEffort: "none"
    }
  }
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
  constructor(
    public readonly code: CredentialVerificationErrorCode,
    public readonly diagnostic: CredentialVerificationDiagnostic = emptyDiagnostic(),
  ) {
    super(code)
    this.name = "CredentialVerificationError"
  }
}

const OPENAI_KEY = /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{8,}\b/g

function emptyDiagnostic(): CredentialVerificationDiagnostic {
  return {
    statusCode: null,
    providerCode: null,
    providerType: null,
    providerParam: null,
    requestId: null,
    message: null,
  }
}

function stringField(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function sanitizeMessage(value: unknown): string | null {
  if (typeof value !== "string") return null
  const oneLine = value
    .replace(/[\r\n\t]+/g, " ")
    .replace(OPENAI_KEY, "[REDACTED]")
    .trim()
  const bounded = Array.from(oneLine).slice(0, 300).join("")
  return bounded || null
}

function requestId(headers: Record<string, string> | undefined): string | null {
  if (!headers) return null
  const entry = Object.entries(headers).find(([name]) => name.toLowerCase() === "x-request-id")
  return entry ? stringField(entry[1]) : null
}

function apiDiagnostic(error: APICallError): CredentialVerificationDiagnostic {
  const diagnostic = {
    ...emptyDiagnostic(),
    statusCode: typeof error.statusCode === "number" ? error.statusCode : null,
    requestId: requestId(error.responseHeaders),
  }

  if (!error.responseBody) return diagnostic
  try {
    const body = JSON.parse(error.responseBody) as {
      error?: {
        code?: unknown
        type?: unknown
        param?: unknown
        message?: unknown
      }
    }
    return {
      ...diagnostic,
      providerCode: stringField(body.error?.code),
      providerType: stringField(body.error?.type),
      providerParam: stringField(body.error?.param),
      message: sanitizeMessage(body.error?.message),
    }
  } catch {
    return diagnostic
  }
}

function verificationError(error: unknown): CredentialVerificationError {
  const diagnostic = APICallError.isInstance(error) ? apiDiagnostic(error) : emptyDiagnostic()
  if (NoSuchModelError.isInstance(error)) {
    return new CredentialVerificationError("model_not_found", diagnostic)
  }
  if (InvalidPromptError.isInstance(error)) {
    return new CredentialVerificationError("verification_request_invalid", diagnostic)
  }
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 401) return new CredentialVerificationError("credential_invalid", diagnostic)
    if (error.statusCode === 403) return new CredentialVerificationError("model_access_denied", diagnostic)
    if (error.statusCode === 404) return new CredentialVerificationError("model_not_found", diagnostic)
    if (error.statusCode === 400 || error.statusCode === 422) {
      return new CredentialVerificationError("verification_request_invalid", diagnostic)
    }
    if (error.statusCode === 429) {
      return new CredentialVerificationError(
        diagnostic.providerCode === "insufficient_quota" ? "quota_exhausted" : "rate_limited",
        diagnostic,
      )
    }
  }
  return new CredentialVerificationError("provider_unavailable", diagnostic)
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
      prompt: "Reply with exactly OK.",
      maxOutputTokens: 16,
      maxRetries: 0,
      providerOptions: { openai: { reasoningEffort: "none" } },
      abortSignal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    throw verificationError(error)
  }
}
