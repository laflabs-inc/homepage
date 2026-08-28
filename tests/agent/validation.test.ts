import { describe, expect, it } from "vitest"

import {
  agentCredentialSetupSchema,
  agentRuntimeSettingsUpdateSchema,
  agentSettingsUpdateSchema,
  usdToMicrousdSchema,
} from "@/lib/agent/validation"

const validSettings = {
  enabled: false,
  model: "gpt-5-mini",
  dailyTokenLimit: 20_000,
  dailyQuestionLimit: 10,
  maxOutputTokens: 600,
  monthlyCostLimitUsd: "50.00",
  inputPriceUsdPerMillion: "1.25",
  outputPriceUsdPerMillion: "10",
  resetTimezone: "Asia/Seoul",
  dailyResetMinute: 0,
  cookieRetentionDays: 180,
  summaryPolicy: "review" as const,
  version: 1,
}

describe("Agent settings validation", () => {
  it("accepts only catalog models in the credential setup boundary", () => {
    expect(agentCredentialSetupSchema.parse({
      apiKey: "sk-project",
      model: "gpt-5.6-luna",
      version: 3,
    })).toEqual({
      apiKey: "sk-project",
      model: "gpt-5.6-luna",
      version: 3,
    })
    expect(agentCredentialSetupSchema.safeParse({
      model: "gpt-5.6-terra",
      version: 3,
    }).success).toBe(true)
    expect(agentCredentialSetupSchema.safeParse({
      model: "custom-model",
      version: 3,
    }).success).toBe(false)
    expect(agentCredentialSetupSchema.safeParse({
      apiKey: "not-a-provider-key",
      model: "gpt-5.6-luna",
      version: 3,
    }).success).toBe(false)
  })

  it("keeps model and catalog prices out of runtime settings updates", () => {
    const runtime = { ...validSettings }
    delete (runtime as Partial<typeof validSettings>).model
    delete (runtime as Partial<typeof validSettings>).inputPriceUsdPerMillion
    delete (runtime as Partial<typeof validSettings>).outputPriceUsdPerMillion

    expect(agentRuntimeSettingsUpdateSchema.safeParse(runtime).success).toBe(true)
    expect(agentRuntimeSettingsUpdateSchema.safeParse({
      ...runtime,
      model: "gpt-5.6-luna",
    }).success).toBe(false)
    expect(agentRuntimeSettingsUpdateSchema.safeParse({
      ...runtime,
      inputPriceUsdPerMillion: "0.20",
    }).success).toBe(false)
  })

  it.each([
    ["dailyTokenLimit", 1_000, 1_000_000],
    ["dailyQuestionLimit", 1, 1_000],
    ["maxOutputTokens", 64, 8_192],
    ["dailyResetMinute", 0, 1_439],
    ["cookieRetentionDays", 1, 365],
  ] as const)("accepts the exact %s boundaries", (field, lower, upper) => {
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, [field]: lower }).success).toBe(true)
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, [field]: upper }).success).toBe(true)
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, [field]: lower - 1 }).success).toBe(false)
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, [field]: upper + 1 }).success).toBe(false)
  })

  it("limits monthly cost to USD 1.00 through 10,000.00", () => {
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, monthlyCostLimitUsd: "1.00" }).success).toBe(true)
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, monthlyCostLimitUsd: "10000.00" }).success).toBe(true)
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, monthlyCostLimitUsd: "0.999999" }).success).toBe(false)
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, monthlyCostLimitUsd: "10000.000001" }).success).toBe(false)
  })

  it("requires output tokens not to exceed the daily token limit", () => {
    expect(agentSettingsUpdateSchema.safeParse({
      ...validSettings,
      dailyTokenLimit: 1_000,
      maxOutputTokens: 1_001,
    }).success).toBe(false)
  })

  it("accepts only valid IANA timezone identifiers", () => {
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, resetTimezone: "America/New_York" }).success).toBe(true)
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, resetTimezone: "Mars/Olympus_Mons" }).success).toBe(false)
  })

  it("accepts 1 to 120 printable model characters", () => {
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, model: "x" }).success).toBe(true)
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, model: "x".repeat(120) }).success).toBe(true)
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, model: "" }).success).toBe(false)
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, model: "x".repeat(121) }).success).toBe(false)
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, model: "gpt\n5" }).success).toBe(false)
  })

  it("parses decimal USD into integer micro-USD without floating-point rounding", () => {
    expect(usdToMicrousdSchema.parse("0.000001")).toBe(1)
    expect(usdToMicrousdSchema.parse("12.345678")).toBe(12_345_678)
    expect(usdToMicrousdSchema.safeParse("1.0000001").success).toBe(false)
  })

  it("transforms prices and requires a positive optimistic version", () => {
    expect(agentSettingsUpdateSchema.parse(validSettings)).toMatchObject({
      monthlyCostLimitMicrousd: 50_000_000,
      inputPriceMicrousdPerMillion: 1_250_000,
      outputPriceMicrousdPerMillion: 10_000_000,
      version: 1,
    })
    expect(agentSettingsUpdateSchema.safeParse({ ...validSettings, version: 0 }).success).toBe(false)
  })

  it("allows unset model and prices only while disabled", () => {
    const unset = {
      ...validSettings,
      model: null,
      inputPriceUsdPerMillion: null,
      outputPriceUsdPerMillion: null,
    }
    expect(agentSettingsUpdateSchema.safeParse(unset).success).toBe(true)
    expect(agentSettingsUpdateSchema.safeParse({ ...unset, enabled: true }).success).toBe(false)
  })
})
