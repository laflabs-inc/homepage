import { z } from "zod"

const MICROS_PER_USD = 1_000_000
const decimalUsdPattern = /^(?:0|[1-9]\d*)(?:\.(\d{1,6}))?$/

export const usdToMicrousdSchema = z.string().regex(decimalUsdPattern).transform((value) => {
  const [whole, fraction = ""] = value.split(".")
  return Number(whole) * MICROS_PER_USD + Number(fraction.padEnd(6, "0"))
}).pipe(z.number().int().safe())

const nullablePriceSchema = z.union([usdToMicrousdSchema, z.null()])
const modelSchema = z.string().min(1).max(120).regex(/^[\x20-\x7e]+$/).nullable()
const timezoneSchema = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}, "Invalid IANA timezone")

export const agentSettingsUpdateSchema = z.object({
  enabled: z.boolean(),
  model: modelSchema,
  dailyTokenLimit: z.number().int().min(1_000).max(1_000_000),
  dailyQuestionLimit: z.number().int().min(1).max(1_000),
  maxOutputTokens: z.number().int().min(64).max(8_192),
  monthlyCostLimitUsd: usdToMicrousdSchema,
  inputPriceUsdPerMillion: nullablePriceSchema,
  outputPriceUsdPerMillion: nullablePriceSchema,
  resetTimezone: timezoneSchema,
  dailyResetMinute: z.number().int().min(0).max(1_439),
  cookieRetentionDays: z.number().int().min(1).max(365),
  summaryPolicy: z.enum(["review", "automatic"]),
  version: z.number().int().positive(),
}).strict().superRefine((settings, context) => {
  if (settings.maxOutputTokens > settings.dailyTokenLimit) {
    context.addIssue({
      code: "custom",
      path: ["maxOutputTokens"],
      message: "Maximum output tokens cannot exceed the daily token limit",
    })
  }
  if (settings.monthlyCostLimitUsd < 1_000_000 || settings.monthlyCostLimitUsd > 10_000_000_000) {
    context.addIssue({
      code: "custom",
      path: ["monthlyCostLimitUsd"],
      message: "Monthly cost limit must be between USD 1 and USD 10,000",
    })
  }
  if (settings.enabled && (
    settings.model === null
    || settings.inputPriceUsdPerMillion === null
    || settings.outputPriceUsdPerMillion === null
  )) {
    context.addIssue({
      code: "custom",
      path: ["enabled"],
      message: "Model and prices are required before enabling AI",
    })
  }
}).transform(({ monthlyCostLimitUsd, inputPriceUsdPerMillion, outputPriceUsdPerMillion, ...settings }) => ({
  ...settings,
  monthlyCostLimitMicrousd: monthlyCostLimitUsd,
  inputPriceMicrousdPerMillion: inputPriceUsdPerMillion,
  outputPriceMicrousdPerMillion: outputPriceUsdPerMillion,
}))

export const credentialInputSchema = z.object({
  apiKey: z.string().trim().min(1).max(512).regex(/^sk-[\x21-\x7e]+$/),
}).strict()
