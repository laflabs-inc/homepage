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
    [401, "credential_invalid"],
    [403, "credential_invalid"],
    [400, "credential_invalid"],
    [404, "credential_invalid"],
    [422, "credential_invalid"],
    [429, "provider_unavailable"],
    [500, "provider_unavailable"],
  ] as const)("maps provider status %s to a safe typed cause", async (statusCode, code) => {
    const raw = new APICallError({
      message: "raw provider message candidate-key",
      url: "https://api.openai.invalid",
      requestBodyValues: {},
      responseBody: "raw provider body candidate-key",
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
