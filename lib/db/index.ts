import "server-only"
import { drizzle } from "drizzle-orm/neon-http"
import { getDatabaseEnv } from "@/lib/env"
import * as schema from "@/lib/db/schema"

function createDb() {
  return drizzle(getDatabaseEnv().DATABASE_URL, { schema })
}

let client: ReturnType<typeof createDb> | undefined

export function getDb() {
  client ??= createDb()
  return client
}
