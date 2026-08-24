import { describe, expect, it, vi } from "vitest"

import { verifyOpenAICredential } from "@/lib/agent/provider"

describe("OpenAI credential verifier", () => {
  it("performs one deterministic bounded inference against the exact model", async () => {
    const model = { modelId: "gpt-test" } as never
    const factory = vi.fn(() => model)
    const generate = vi.fn(async () => ({ text: "OK" }))

    await verifyOpenAICredential("candidate-key", "gpt-test", { factory, generate })

    expect(factory).toHaveBeenCalledWith("candidate-key", "gpt-test")
    expect(generate).toHaveBeenCalledTimes(1)
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({
      model,
      maxOutputTokens: 4,
      temperature: 0,
      maxRetries: 0,
      abortSignal: expect.any(AbortSignal),
    }))
  })
})
