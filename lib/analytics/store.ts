import "server-only"

import { eq } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { analyticsEvents } from "@/lib/db/schema"

export interface AnalyticsStore {
  deleteVisitorEvents(visitorHash: string): Promise<void>
}

export const analyticsStore: AnalyticsStore = {
  async deleteVisitorEvents(visitorHash) {
    await getDb().delete(analyticsEvents).where(eq(analyticsEvents.visitorHash, visitorHash))
  },
}
