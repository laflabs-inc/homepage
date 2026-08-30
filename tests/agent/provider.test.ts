import { describe, expect, it, vi } from "vitest"

import { APICallError } from "ai"

import {
  CredentialVerificationError,
  verifyOpenAICredential,
} from "@/lib/agent/provider"

describe("OpenAI credential verifier", () => {
  it("performs one deterministic bounded inference against the exact model", async () => {
    const model = { modelId: "gpt-test" } as never
    const factory = vi.fn(() => model)
    const generate = vi.fn<(request: { prompt: string; temperature?: unknown }) => Promise<{ text: string }>>()
    generate.mockResolvedValue({ text: "OK" })

    const timeout = vi.spyOn(AbortSignal, "timeout")

    await verifyOpenAICredential("candidate-key", "gpt-test", { factory, generate })

    expect(factory).toHaveBeenCalledWith("candidate-key", "gpt-test")
    expect(generate).toHaveBeenCalledTimes(1)
    expect(timeout).toHaveBeenCalledWith(10_000)
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({
      model,
      prompt: "Reply with exactly OK.",
      maxOutputTokens: 16,
      maxRetries: 0,
      providerOptions: { openai: { reasoningEffort: "none" } },
      abortSignal: expect.any(AbortSignal),
    }))
    expect(generate.mock.calls[0]?.[0]).not.toHaveProperty("temperature")
  })

  it.each([
    [401, null, "credential_invalid"],
    [403, null, "model_access_denied"],
    [400, null, "verification_request_invalid"],
    [404, null, "model_not_found"],
    [422, null, "verification_request_invalid"],
    [429, "insufficient_quota", "quota_exhausted"],
    [429, "rate_limit_exceeded", "rate_limited"],
    [500, null, "provider_unavailable"],
  ] as const)("maps provider status %s and code %s to safe cause %s", async (statusCode, providerCode, code) => {
    const raw = new APICallError({
      message: "raw provider message candidate-key",
      url: "https://api.openai.invalid",
      requestBodyValues: {},
      responseBody: JSON.stringify({
        error: { code: providerCode, message: "raw provider body candidate-key" },
      }),
      statusCode,
    })

    let caught: unknown
    try {
      await verifyOpenAICredential("candidate-key", "gpt-test", {
        factory: () => ({}) as never,
        generate: async () => { throw raw },
      })
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(CredentialVerificationError)
    expect(caught).toMatchObject({ code })
    expect(String(caught)).not.toContain("candidate-key")
  })

  it("returns redacted, bounded OpenAI request diagnostics", async () => {
    const secret = `sk-proj-${"secretvalue".repeat(40)}`
    const raw = new APICallError({
      message: "raw provider fallback message",
      url: "https://api.openai.invalid",
      requestBodyValues: {},
      statusCode: 400,
      responseHeaders: { "X-Request-ID": "req_test_123" },
      responseBody: JSON.stringify({
        error: {
          message: `Unsupported parameter:\ntemperature for ${secret} ${"🧪".repeat(400)}`,
          type: "invalid_request_error",
          param: "temperature",
          code: "unsupported_parameter",
        },
      }),
    })

    let caught: unknown
    try {
      await verifyOpenAICredential("candidate-key", "gpt-test", {
        factory: () => ({}) as never,
        generate: async () => { throw raw },
      })
    } catch (error) {
      caught = error
    }

    expect(caught).toMatchObject({
      code: "verification_request_invalid",
      diagnostic: {
        statusCode: 400,
        providerCode: "unsupported_parameter",
        providerType: "invalid_request_error",
        providerParam: "temperature",
        requestId: "req_test_123",
      },
    })
    expect(caught).toBeInstanceOf(CredentialVerificationError)
    const diagnostic = (caught as CredentialVerificationError).diagnostic
    expect(diagnostic.providerMessage).toContain("[REDACTED]")
    expect(diagnostic.providerMessage).not.toContain(secret)
    expect(diagnostic.providerMessage).not.toMatch(/[\r\n\t]/)
    expect(Array.from(diagnostic.providerMessage ?? "")).toHaveLength(300)
  })

  it("uses null diagnostic fields for malformed provider responses", async () => {
    const raw = new APICallError({
      message: "raw provider fallback message",
      url: "https://api.openai.invalid",
      requestBodyValues: {},
      statusCode: 400,
      responseHeaders: { "x-request-id": "req_test_456" },
      responseBody: "{not valid JSON",
    })

    await expect(verifyOpenAICredential("candidate-key", "gpt-test", {
      factory: () => ({}) as never,
      generate: async () => { throw raw },
    })).rejects.toMatchObject({
      code: "verification_request_invalid",
      diagnostic: {
        statusCode: 400,
        providerCode: null,
        providerType: null,
        providerParam: null,
        requestId: "req_test_456",
        providerMessage: null,
      },
    })
  })

  it("uses null diagnostic fields for non-provider failures", async () => {
    await expect(verifyOpenAICredential("candidate-key", "gpt-test", {
      factory: () => ({}) as never,
      generate: async () => { throw new Error("raw network failure") },
    })).rejects.toMatchObject({
      code: "provider_unavailable",
      diagnostic: {
        statusCode: null,
        providerCode: null,
        providerType: null,
        providerParam: null,
        requestId: null,
        providerMessage: null,
      },
    })
  })

  it.each([
    new DOMException("raw timeout", "TimeoutError"),
    new DOMException("raw abort", "AbortError"),
    new Error("raw network failure"),
  ])("maps timeout, abort, and network failures to provider_unavailable", async (raw) => {
    await expect(verifyOpenAICredential("candidate-key", "gpt-test", {
      factory: () => ({}) as never,
      generate: async () => { throw raw },
    })).rejects.toMatchObject({ code: "provider_unavailable" })
  })
})
