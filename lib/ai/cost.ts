export type TokenUsage = { inputTokens: number; outputTokens: number }
export type TokenPrices = {
  inputMicrousdPerMillion: number
  outputMicrousdPerMillion: number
}

function nonnegativeSafeInteger(value: number, name: string): bigint {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be a non-negative safe integer`)
  return BigInt(value)
}

export function estimateCostMicrousd(usage: TokenUsage, prices: TokenPrices): number {
  const inputCost = (
    nonnegativeSafeInteger(usage.inputTokens, "inputTokens")
      * nonnegativeSafeInteger(prices.inputMicrousdPerMillion, "inputMicrousdPerMillion")
    + 999_999n
  ) / 1_000_000n
  const outputCost = (
    nonnegativeSafeInteger(usage.outputTokens, "outputTokens")
      * nonnegativeSafeInteger(prices.outputMicrousdPerMillion, "outputMicrousdPerMillion")
    + 999_999n
  ) / 1_000_000n
  const cost = inputCost + outputCost
  if (cost > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("estimated cost exceeds the safe integer range")
  return Number(cost)
}
