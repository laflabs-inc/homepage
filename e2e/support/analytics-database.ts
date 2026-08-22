import { neon } from "@neondatabase/serverless"

import { hashAnalyticsId, verifyVisitorToken } from "../../lib/analytics/identity"
import {
  E2E_ANALYTICS_HASH_SECRET,
  validateE2eDatabaseEnvironment,
} from "./test-database"

const testDatabaseUrl = validateE2eDatabaseEnvironment({
  testDatabaseUrl: process.env.TEST_DATABASE_URL,
  databaseUrl: process.env.DATABASE_URL,
  productionSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://laflabs.co",
  productionDatabaseHostname: process.env.E2E_PRODUCTION_DATABASE_HOSTNAME,
})

const sql = neon(testDatabaseUrl)

export function visitorHashFromToken(token: string): string | null {
  const visitorId = verifyVisitorToken(token, E2E_ANALYTICS_HASH_SECRET)
  return visitorId ? hashAnalyticsId(visitorId, E2E_ANALYTICS_HASH_SECRET) : null
}

export async function countVisitorRows(visitorHash: string): Promise<{
  events: number
  windows: number
}> {
  const rows = await sql`
    SELECT
      (SELECT count(*)::integer FROM analytics_events WHERE visitor_hash = ${visitorHash}) AS events,
      (SELECT count(*)::integer FROM analytics_rate_windows WHERE visitor_hash = ${visitorHash}) AS windows
  ` as Array<{ events: number | string; windows: number | string }>

  return {
    events: Number(rows[0]?.events ?? 0),
    windows: Number(rows[0]?.windows ?? 0),
  }
}

export async function cleanupVisitorRows(visitorHash: string): Promise<void> {
  await sql.transaction([
    sql`DELETE FROM analytics_events WHERE visitor_hash = ${visitorHash}`,
    sql`DELETE FROM analytics_rate_windows WHERE visitor_hash = ${visitorHash}`,
    sql`DELETE FROM analytics_withdrawal_guards WHERE visitor_hash = ${visitorHash}`,
  ])
}
