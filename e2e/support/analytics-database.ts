import { neon } from "@neondatabase/serverless"

import { hashAnalyticsId, verifyVisitorToken } from "../../lib/analytics/identity"
import {
  createVerifiedDatabaseBoundary,
  E2E_ANALYTICS_HASH_SECRET,
  validateE2eDatabaseEnvironment,
  verifyE2eDatabaseSentinel,
} from "./test-database"

const databaseSentinel = process.env.E2E_DATABASE_SENTINEL ?? ""
const testDatabaseUrl = validateE2eDatabaseEnvironment({
  testDatabaseUrl: process.env.TEST_DATABASE_URL,
  databaseUrl: process.env.DATABASE_URL,
  productionSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://laflabs.co",
  productionDatabaseHostname: process.env.E2E_PRODUCTION_DATABASE_HOSTNAME,
  databaseSentinel,
  ci: Boolean(process.env.CI),
})

const sql = neon(testDatabaseUrl)
const withVerifiedDatabase = createVerifiedDatabaseBoundary(async () => {
  await verifyE2eDatabaseSentinel(databaseSentinel, async (expectedSentinel) => {
    const rows = await sql`
      SELECT count(*)::integer AS matches
      FROM e2e_database_sentinel
      WHERE name = 'laflabs-playwright'
        AND sentinel = ${expectedSentinel}
    ` as Array<{ matches: number | string }>
    return Number(rows[0]?.matches ?? 0)
  })
})

export async function ensureE2eDatabaseSentinel(): Promise<void> {
  await withVerifiedDatabase(async () => undefined)
}

export function visitorHashFromToken(token: string): string | null {
  const visitorId = verifyVisitorToken(token, E2E_ANALYTICS_HASH_SECRET)
  return visitorId ? hashAnalyticsId(visitorId, E2E_ANALYTICS_HASH_SECRET) : null
}

export async function countVisitorRows(visitorHash: string): Promise<{
  events: number
  windows: number
}> {
  return withVerifiedDatabase(async () => {
    const rows = await sql`
      SELECT
        (SELECT count(*)::integer FROM analytics_events WHERE visitor_hash = ${visitorHash}) AS events,
        (SELECT count(*)::integer FROM analytics_rate_windows WHERE visitor_hash = ${visitorHash}) AS windows
    ` as Array<{ events: number | string; windows: number | string }>

    return {
      events: Number(rows[0]?.events ?? 0),
      windows: Number(rows[0]?.windows ?? 0),
    }
  })
}

export async function visitorEventTypeCounts(
  visitorHash: string,
): Promise<Record<string, number>> {
  return withVerifiedDatabase(async () => {
    const rows = await sql`
      SELECT event_type AS "eventType", count(*)::integer AS count
      FROM analytics_events
      WHERE visitor_hash = ${visitorHash}
      GROUP BY event_type
    ` as Array<{ eventType: string; count: number | string }>

    return Object.fromEntries(rows.map((row) => [row.eventType, Number(row.count)]))
  })
}

export async function visitorPageViewReferrers(visitorHash: string): Promise<string[]> {
  return withVerifiedDatabase(async () => {
    const rows = await sql`
      SELECT DISTINCT referrer_host AS "referrerHost"
      FROM analytics_events
      WHERE visitor_hash = ${visitorHash}
        AND event_type = 'page_view'
        AND referrer_host IS NOT NULL
      ORDER BY referrer_host ASC
    ` as Array<{ referrerHost: string }>

    return rows.map(({ referrerHost }) => referrerHost)
  })
}

export async function cleanupVisitorRows(visitorHash: string): Promise<void> {
  await withVerifiedDatabase(async () => {
    await sql.transaction([
      sql`DELETE FROM analytics_events WHERE visitor_hash = ${visitorHash}`,
      sql`DELETE FROM analytics_rate_windows WHERE visitor_hash = ${visitorHash}`,
      sql`DELETE FROM analytics_withdrawal_guards WHERE visitor_hash = ${visitorHash}`,
    ])
  })
}
