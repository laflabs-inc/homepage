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
    const generate = vi.fn(async () => ({ text: "OK" }))

    const timeout = vi.spyOn(AbortSignal, "timeout")

    await verifyOpenAICredential("candidate-key", "gpt-test", { factory, generate })

    expect(factory).toHaveBeenCalledWith("candidate-key", "gpt-test")
    expect(generate).toHaveBeenCalledTimes(1)
    expect(timeout).toHaveBeenCalledWith(5_000)
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({
      model,
      maxOutputTokens: 4,
      temperature: 0,
      maxRetries: 0,
      abortSignal: expect.any(AbortSignal),
    }))
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
    expect(JSON.stringify(caught)).not.toContain("raw provider")
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
