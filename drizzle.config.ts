import { defineConfig } from "drizzle-kit"

const databaseUrl = process.env.DATABASE_URL?.trim()

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
})
