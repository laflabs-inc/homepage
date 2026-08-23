import { boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

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
}, (table) => [
  primaryKey({ columns: [table.visitorHash, table.minuteBucket] }),
  index("analytics_rate_minute_idx").on(table.minuteBucket),
])

export const analyticsWithdrawalGuards = pgTable("analytics_withdrawal_guards", {
  visitorHash: text("visitor_hash").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [index("analytics_withdrawal_guards_expiry_idx").on(table.expiresAt)])

export const documentKindEnum = pgEnum("document_kind", ["notice", "legal", "disclosure", "design"])
export const documentLocaleEnum = pgEnum("document_locale", ["ko", "en"])
export const documentStatusEnum = pgEnum("document_status", ["draft", "scheduled", "published", "archived"])

export const documentSeries = pgTable("document_series", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: documentKindEnum("kind").notNull(),
  slug: text("slug").notNull(),
  category: text("category"),
  pinned: boolean("pinned").default(false).notNull(),
  metadataLocked: boolean("metadata_locked").default(false).notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("document_series_kind_slug_unique").on(table.kind, table.slug),
  index("document_series_kind_archived_at_idx").on(table.kind, table.archivedAt),
])

export const documentRevisions = pgTable("document_revisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  seriesId: uuid("series_id").notNull().references(() => documentSeries.id, { onDelete: "restrict" }),
  locale: documentLocaleEnum("locale").notNull(),
  revision: integer("revision").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  bodyMarkdown: text("body_markdown").notNull(),
  status: documentStatusEnum("status").notNull(),
  effectiveAt: timestamp("effective_at", { withTimezone: true }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by").notNull(),
  publishedBy: text("published_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("document_revisions_series_locale_revision_unique").on(table.seriesId, table.locale, table.revision),
  index("document_revisions_series_locale_status_idx").on(table.seriesId, table.locale, table.status),
  index("document_revisions_status_scheduled_at_idx").on(table.status, table.scheduledAt),
])

export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  actorGithubId: text("actor_github_id").notNull(),
  actorName: text("actor_name").notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})
