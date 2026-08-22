import "server-only"

import { eq, lt, sql } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { analyticsEvents, analyticsRateWindows } from "@/lib/db/schema"
import type {
  AnalyticsEventType,
  AnalyticsLocale,
  DeviceCategory,
} from "@/lib/analytics/normalize"

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

export interface AnalyticsStore {
  consumeRateWindow(visitorHash: string, minute: Date, amount: number): Promise<boolean>
  insertEvents(events: StoredAnalyticsEvent[]): Promise<number>
  deleteVisitorEvents(visitorHash: string): Promise<void>
  deleteBefore(cutoff: Date): Promise<{ events: number; windows: number }>
}

export const analyticsStore: AnalyticsStore = {
  async consumeRateWindow(visitorHash, minute, amount) {
    if (!Number.isInteger(amount) || amount < 1 || amount > 60) return false

    const rows = await getDb().insert(analyticsRateWindows).values({
      visitorHash,
      minuteBucket: minute,
      eventCount: amount,
    }).onConflictDoUpdate({
      target: [analyticsRateWindows.visitorHash, analyticsRateWindows.minuteBucket],
      set: {
        eventCount: sql`${analyticsRateWindows.eventCount} + ${amount}`,
      },
      setWhere: sql`${analyticsRateWindows.eventCount} + ${amount} <= 60`,
    }).returning({ eventCount: analyticsRateWindows.eventCount })

    return rows.length === 1
  },

  async insertEvents(events) {
    if (events.length === 0) return 0

    const inserted = await getDb().insert(analyticsEvents).values(events).onConflictDoNothing({
      target: analyticsEvents.eventId,
    }).returning({ eventId: analyticsEvents.eventId })
    return inserted.length
  },

  async deleteVisitorEvents(visitorHash) {
    await getDb().delete(analyticsEvents).where(eq(analyticsEvents.visitorHash, visitorHash))
  },

  async deleteBefore(cutoff) {
    const events = await getDb().delete(analyticsEvents)
      .where(lt(analyticsEvents.receivedAt, cutoff))
      .returning({ id: analyticsEvents.id })
    const windows = await getDb().delete(analyticsRateWindows)
      .where(lt(analyticsRateWindows.minuteBucket, cutoff))
      .returning({ visitorHash: analyticsRateWindows.visitorHash })

    return { events: events.length, windows: windows.length }
  },
}
