import { describe, expect, it } from "vitest"

import { estimateCostMicrousd } from "@/lib/ai/cost"

describe("estimateCostMicrousd", () => {
  it("prices input and output tokens in integer micro-US-dollars", () => {
    expect(estimateCostMicrousd(
      { inputTokens: 1_000_000, outputTokens: 500_000 },
      { inputMicrousdPerMillion: 250_000, outputMicrousdPerMillion: 2_000_000 },
    )).toBe(1_250_000)
  })

  it("rounds each exact bigint token-price component upward", () => {
    expect(estimateCostMicrousd(
      { inputTokens: 1, outputTokens: 1 },
      { inputMicrousdPerMillion: 1, outputMicrousdPerMillion: 1 },
    )).toBe(2)
    expect(estimateCostMicrousd(
      { inputTokens: 999_999, outputTokens: 0 },
      { inputMicrousdPerMillion: 1_000_001, outputMicrousdPerMillion: 0 },
    )).toBe(1_000_000)
  })

  it.each([
    [{ inputTokens: -1, outputTokens: 0 }, { inputMicrousdPerMillion: 1, outputMicrousdPerMillion: 1 }],
    [{ inputTokens: 1.5, outputTokens: 0 }, { inputMicrousdPerMillion: 1, outputMicrousdPerMillion: 1 }],
    [{ inputTokens: 1, outputTokens: 0 }, { inputMicrousdPerMillion: -1, outputMicrousdPerMillion: 1 }],
  ])("rejects non-negative-safe-integer violations", (usage, prices) => {
    expect(() => estimateCostMicrousd(usage, prices)).toThrow(RangeError)
  })

  it("rejects a result outside JavaScript's safe integer range", () => {
    expect(() => estimateCostMicrousd(
      { inputTokens: Number.MAX_SAFE_INTEGER, outputTokens: Number.MAX_SAFE_INTEGER },
      {
        inputMicrousdPerMillion: Number.MAX_SAFE_INTEGER,
        outputMicrousdPerMillion: Number.MAX_SAFE_INTEGER,
      },
    )).toThrow(RangeError)
  })
})
