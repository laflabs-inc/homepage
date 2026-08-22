import { z } from "zod"

const databaseSchema = z.object({ DATABASE_URL: z.string().url() })
const analyticsSchema = z.object({ ANALYTICS_HASH_SECRET: z.string().min(32) })
const authSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  AUTH_GITHUB_ID: z.string().min(1),
  AUTH_GITHUB_SECRET: z.string().min(1),
  ADMIN_GITHUB_ORG: z.string().min(1).default("laflabs-inc"),
})
const cronSchema = z.object({ CRON_SECRET: z.string().min(16) })
const schema = databaseSchema.merge(analyticsSchema).merge(authSchema).merge(cronSchema)

export type ServerEnv = z.infer<typeof schema>

export const parseServerEnv = (input: Record<string, string | undefined>) => schema.parse(input)
export const getDatabaseEnv = () => databaseSchema.parse(process.env)
export const getAnalyticsEnv = () => analyticsSchema.parse(process.env)
export const getAuthEnv = () => authSchema.parse(process.env)
export const getCronEnv = () => cronSchema.parse(process.env)
