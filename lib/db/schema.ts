import { index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull(),
  visitorHash: text("visitor_hash").notNull(),
  sessionHash: text("session_hash").notNull(),
  eventType: text("event_type").notNull(),
  pathname: text("pathname").notNull(),
  targetId: text("target_id"),
  locale: text("locale").notNull(),
  deviceCategory: text("device_category").notNull(),
  referrerHost: text("referrer_host"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("analytics_event_id_unique").on(table.eventId),
  index("analytics_received_at_idx").on(table.receivedAt),
  index("analytics_type_received_idx").on(table.eventType, table.receivedAt),
  index("analytics_visitor_idx").on(table.visitorHash),
])

export const analyticsRateWindows = pgTable("analytics_rate_windows", {
  visitorHash: text("visitor_hash").notNull(),
  minuteBucket: timestamp("minute_bucket", { withTimezone: true }).notNull(),
  eventCount: integer("event_count").default(0).notNull(),
}, (table) => [primaryKey({ columns: [table.visitorHash, table.minuteBucket] })])

export const analyticsWithdrawalGuards = pgTable("analytics_withdrawal_guards", {
  visitorHash: text("visitor_hash").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [index("analytics_withdrawal_guards_expiry_idx").on(table.expiresAt)])
