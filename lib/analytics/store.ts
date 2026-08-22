import "server-only"

import { lt, sql } from "drizzle-orm"

import { getDb } from "@/lib/db"
import {
  analyticsEvents,
  analyticsRateWindows,
  analyticsWithdrawalGuards,
} from "@/lib/db/schema"
import type {
  AnalyticsEventType,
  AnalyticsLocale,
  DeviceCategory,
} from "@/lib/analytics/normalize"

const WITHDRAWAL_GUARD_TTL_MS = 10 * 60 * 1000

export type StoredAnalyticsEvent = {
  eventId: string
  visitorHash: string
  sessionHash: string
  eventType: AnalyticsEventType
  pathname: string
  targetId: string | null
  locale: AnalyticsLocale
  deviceCategory: DeviceCategory
  referrerHost: string | null
  occurredAt: Date
  receivedAt: Date
}

export type AnalyticsStoreCollectionResult =
  | { status: "accepted"; accepted: number }
  | { status: "guarded" | "rate_limited"; accepted: 0 }

export interface AnalyticsStore {
  collectEvents(
    visitorHash: string,
    minute: Date,
    events: StoredAnalyticsEvent[],
  ): Promise<AnalyticsStoreCollectionResult>
  withdrawVisitorAnalytics(visitorHash: string): Promise<void>
  deleteBefore(
    cutoff: Date,
    expiredGuardsBefore?: Date,
  ): Promise<{ events: number; windows: number }>
}

export const analyticsStore: AnalyticsStore = {
  async collectEvents(visitorHash, minute, events) {
    if (events.length < 1 || events.length > 60) {
      return { status: "rate_limited", accepted: 0 }
    }

    const eventValues = sql.join(events.map((event) => sql`(
      ${event.eventId}::uuid,
      ${visitorHash}::text,
      ${event.sessionHash}::text,
      ${event.eventType}::text,
      ${event.pathname}::text,
      ${event.targetId}::text,
      ${event.locale}::text,
      ${event.deviceCategory}::text,
      ${event.referrerHost}::text,
      ${event.occurredAt}::timestamptz,
      ${event.receivedAt}::timestamptz
    )`), sql`, `)
    const database = getDb()
    const [, collection] = await database.batch([
      database.execute(sql`
        SELECT pg_advisory_xact_lock(hashtextextended(${visitorHash}, 0))
      `),
      database.execute<{ status: "accepted" | "guarded" | "rate_limited"; accepted: number }>(sql`
        WITH eligible AS (
          SELECT 1 AS allowed
          WHERE NOT EXISTS (
            SELECT 1
            FROM ${analyticsWithdrawalGuards}
            WHERE ${analyticsWithdrawalGuards.visitorHash} = ${visitorHash}
              AND ${analyticsWithdrawalGuards.expiresAt} > statement_timestamp()
          )
        ), rate_window AS (
          INSERT INTO ${analyticsRateWindows} ("visitor_hash", "minute_bucket", "event_count")
          SELECT ${visitorHash}, ${minute}, ${events.length}
          FROM eligible
          ON CONFLICT ("visitor_hash", "minute_bucket") DO UPDATE
          SET "event_count" = ${analyticsRateWindows.eventCount} + ${events.length}
          WHERE ${analyticsRateWindows.eventCount} + ${events.length} <= 60
          RETURNING "visitor_hash"
        ), event_input (
          "event_id", "visitor_hash", "session_hash", "event_type", "pathname",
          "target_id", "locale", "device_category", "referrer_host", "occurred_at", "received_at"
        ) AS (
          VALUES ${eventValues}
        ), inserted AS (
          INSERT INTO ${analyticsEvents} (
            "event_id", "visitor_hash", "session_hash", "event_type", "pathname",
            "target_id", "locale", "device_category", "referrer_host", "occurred_at", "received_at"
          )
          SELECT event_input.*
          FROM event_input
          WHERE EXISTS (SELECT 1 FROM rate_window)
          ON CONFLICT ("event_id") DO NOTHING
          RETURNING "event_id"
        )
        SELECT
          CASE
            WHEN NOT EXISTS (SELECT 1 FROM eligible) THEN 'guarded'
            WHEN NOT EXISTS (SELECT 1 FROM rate_window) THEN 'rate_limited'
            ELSE 'accepted'
          END AS status,
          (SELECT count(*)::integer FROM inserted) AS accepted
      `),
    ])
    const result = collection.rows[0]

    if (result.status === "accepted") {
      return { status: "accepted", accepted: Number(result.accepted) }
    }
    return { status: result.status, accepted: 0 }
  },

  async withdrawVisitorAnalytics(visitorHash) {
    const database = getDb()
    await database.batch([
      database.execute(sql`
        SELECT pg_advisory_xact_lock(hashtextextended(${visitorHash}, 0))
      `),
      database.execute(sql`
        WITH guard AS (
          INSERT INTO ${analyticsWithdrawalGuards} ("visitor_hash", "expires_at")
          VALUES (
            ${visitorHash},
            statement_timestamp() + ${WITHDRAWAL_GUARD_TTL_MS} * INTERVAL '1 millisecond'
          )
          ON CONFLICT ("visitor_hash") DO UPDATE
          SET "expires_at" = EXCLUDED."expires_at"
          RETURNING "visitor_hash"
        ), deleted_events AS (
          DELETE FROM ${analyticsEvents}
          WHERE ${analyticsEvents.visitorHash} = (SELECT "visitor_hash" FROM guard)
          RETURNING "event_id"
        ), deleted_windows AS (
          DELETE FROM ${analyticsRateWindows}
          WHERE ${analyticsRateWindows.visitorHash} = (SELECT "visitor_hash" FROM guard)
          RETURNING "visitor_hash"
        )
        SELECT 1
      `),
    ])
  },

  async deleteBefore(cutoff, expiredGuardsBefore = new Date()) {
    const database = getDb()
    const [events, windows] = await database.batch([
      database.delete(analyticsEvents)
        .where(lt(analyticsEvents.receivedAt, cutoff))
        .returning({ id: analyticsEvents.id }),
      database.delete(analyticsRateWindows)
        .where(lt(analyticsRateWindows.minuteBucket, cutoff))
        .returning({ visitorHash: analyticsRateWindows.visitorHash }),
      database.delete(analyticsWithdrawalGuards)
        .where(lt(analyticsWithdrawalGuards.expiresAt, expiredGuardsBefore))
        .returning({ visitorHash: analyticsWithdrawalGuards.visitorHash }),
    ])

    return { events: events.length, windows: windows.length }
  },
}
