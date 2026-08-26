import { z } from "zod"

const databaseSchema = z.object({ DATABASE_URL: z.string().url() })
const optionalAnalyticsSecret = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().min(32).optional(),
)
const analyticsFields = {
  ANALYTICS_HASH_SECRET: z.string().min(32),
  ANALYTICS_HASH_SECRET_PREVIOUS: optionalAnalyticsSecret,
}
const analyticsSchema = z.object(analyticsFields).superRefine((environment, context) => {
  if (
    environment.ANALYTICS_HASH_SECRET_PREVIOUS &&
    environment.ANALYTICS_HASH_SECRET_PREVIOUS === environment.ANALYTICS_HASH_SECRET
  ) {
    context.addIssue({
      code: "custom",
      path: ["ANALYTICS_HASH_SECRET_PREVIOUS"],
      message: "ANALYTICS_HASH_SECRET_PREVIOUS must differ from ANALYTICS_HASH_SECRET",
    })
  }
})
const authSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  AUTH_GITHUB_ID: z.string().min(1),
  AUTH_GITHUB_SECRET: z.string().min(1),
  ADMIN_GITHUB_ORG: z.string().min(1).default("laflabs-inc"),
})
const cronSchema = z.object({ CRON_SECRET: z.string().min(16) })
const base64EncryptionKey = z.string().superRefine((value, context) => {
  const decoded = Buffer.from(value, "base64")

  if (decoded.length !== 32 || decoded.toString("base64") !== value) {
    context.addIssue({
      code: "custom",
      message: "AI_CREDENTIAL_ENCRYPTION_KEY must be canonical base64 for 32 bytes",
    })
  }
})
const aiSecuritySchema = z.object({
  AI_CREDENTIAL_ENCRYPTION_KEY: base64EncryptionKey,
  AI_COOKIE_SECRET: z.string().min(32),
}).superRefine((environment, context) => {
  if (environment.AI_CREDENTIAL_ENCRYPTION_KEY === environment.AI_COOKIE_SECRET) {
    context.addIssue({
      code: "custom",
      path: ["AI_COOKIE_SECRET"],
      message: "AI_COOKIE_SECRET must differ from AI_CREDENTIAL_ENCRYPTION_KEY",
    })
  }
})
const schema = databaseSchema
  .merge(z.object(analyticsFields))
  .merge(authSchema)
  .merge(cronSchema)
  .superRefine((environment, context) => {
    if (
      environment.ANALYTICS_HASH_SECRET_PREVIOUS &&
      environment.ANALYTICS_HASH_SECRET_PREVIOUS === environment.ANALYTICS_HASH_SECRET
    ) {
      context.addIssue({
        code: "custom",
        path: ["ANALYTICS_HASH_SECRET_PREVIOUS"],
        message: "ANALYTICS_HASH_SECRET_PREVIOUS must differ from ANALYTICS_HASH_SECRET",
      })
    }
  })

export type ServerEnv = z.infer<typeof schema>

export const parseServerEnv = (input: Record<string, string | undefined>) => schema.parse(input)
export const getDatabaseEnv = () => databaseSchema.parse(process.env)
export const getAnalyticsEnv = () => analyticsSchema.parse(process.env)
export const getAuthEnv = () => authSchema.parse(process.env)
export const getCronEnv = () => cronSchema.parse(process.env)
export const getAiSecurityEnv = () => aiSecuritySchema.parse(process.env)
