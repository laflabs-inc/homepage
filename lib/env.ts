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
