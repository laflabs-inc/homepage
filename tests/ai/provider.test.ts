import { randomBytes } from "node:crypto"

import { describe, expect, it, vi } from "vitest"

import { encryptCredential } from "@/lib/agent/crypto"
import type { AgentSettings, StoredCredential } from "@/lib/agent/types"
import { AiTextProviderError, createAiTextProvider } from "@/lib/ai/provider"

const now = new Date("2026-08-24T10:00:00.000Z")
const key = randomBytes(32)

function settings(overrides: Partial<AgentSettings> = {}): AgentSettings {
  return {
    id: "default",
    enabled: true,
    model: "gpt-summary",
    dailyTokenLimit: 20_000,
    dailyQuestionLimit: 10,
    maxOutputTokens: 600,
    monthlyCostLimitMicrousd: 50_000_000,
    inputPriceMicrousdPerMillion: 1_000_000,
    outputPriceMicrousdPerMillion: 2_000_000,
    pricingCheckedAt: now,
    resetTimezone: "Asia/Seoul",
    dailyResetMinute: 0,
    cookieRetentionDays: 180,
    summaryPolicy: "review",
    version: 1,
    updatedBy: "github:42",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function credential(overrides: Partial<StoredCredential> = {}): StoredCredential {
  return {
    provider: "openai",
    ...encryptCredential("sk-summary", key),
    fingerprint: "fingerprint",
    generation: "1",
    verifiedModel: "gpt-summary",
    verificationStatus: "verified",
    verifiedAt: now,
    createdBy: "github:42",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function dependencies(overrides: Record<string, unknown> = {}) {
  const model = { modelId: "gpt-summary" } as never
  return {
    settings: { getSettings: vi.fn(async () => settings()) },
    credentials: { getCredential: vi.fn(async () => credential()) },
    getEncryptionKey: vi.fn(() => key),
    factory: vi.fn(() => model),
    generate: vi.fn(async () => ({
      text: "Generated summary",
      usage: { inputTokens: 123, outputTokens: 17, totalTokens: 140 },
    })),
    model,
    ...overrides,
  }
}

describe("AI summary provider", () => {
  it("uses the active verified credential with the exact configured model and a small output ceiling", async () => {
    const deps = dependencies()
    const provider = createAiTextProvider(deps)

    await expect(provider.generateSummary({ prompt: "bounded prompt", maxOutputTokens: 600 })).resolves.toEqual({
      text: "Generated summary",
      model: "gpt-summary",
      usage: { inputTokens: 123, outputTokens: 17, totalTokens: 140 },
    })
    expect(deps.factory).toHaveBeenCalledWith("sk-summary", "gpt-summary")
    expect(deps.generate).toHaveBeenCalledWith(expect.objectContaining({
      model: deps.model,
      prompt: "bounded prompt",
      maxOutputTokens: 256,
      temperature: 0,
      maxRetries: 0,
      abortSignal: expect.any(AbortSignal),
    }))
  })

  it.each([
    [settings({ enabled: false }), credential()],
    [settings(), null],
    [settings(), credential({ verificationStatus: "failed" })],
    [settings(), credential({ verifiedModel: "gpt-other" })],
  ])("fails closed before inference unless Agent configuration is active and exact-model verified", async (current, stored) => {
    const deps = dependencies({
      settings: { getSettings: vi.fn(async () => current) },
      credentials: { getCredential: vi.fn(async () => stored) },
    })

    await expect(createAiTextProvider(deps).generateSummary({ prompt: "private draft", maxOutputTokens: 600 }))
      .rejects.toMatchObject({ code: "configuration_unavailable" })
    expect(deps.generate).not.toHaveBeenCalled()
  })

  it("maps provider and malformed-usage failures to safe typed errors", async () => {
    const providerFailure = dependencies({
      generate: vi.fn(async () => { throw new Error("raw provider body sk-summary private draft") }),
    })
    const malformedUsage = dependencies({
      generate: vi.fn(async () => ({ text: "summary", usage: { inputTokens: undefined, outputTokens: 2 } })),
    })

    for (const deps of [providerFailure, malformedUsage]) {
      let caught: unknown
      try {
        await createAiTextProvider(deps).generateSummary({ prompt: "private draft", maxOutputTokens: 64 })
      } catch (error) {
        caught = error
      }
      expect(caught).toBeInstanceOf(AiTextProviderError)
      expect(String(caught)).not.toContain("raw provider")
      expect(JSON.stringify(caught)).not.toContain("private draft")
      expect(JSON.stringify(caught)).not.toContain("sk-summary")
    }
  })
})
