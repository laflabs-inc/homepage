import { sql } from "drizzle-orm"
import { bigint, boolean, check, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

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
export const summaryPolicyEnum = pgEnum("summary_policy", ["review", "automatic"])
export const aiUsageReservationKindEnum = pgEnum("ai_usage_reservation_kind", ["question", "summary"])

export const agentSettings = pgTable("agent_settings", {
  id: text("id").default("default").primaryKey(),
  enabled: boolean("enabled").default(false).notNull(),
  model: text("model"),
  dailyTokenLimit: integer("daily_token_limit").default(20_000).notNull(),
  dailyQuestionLimit: integer("daily_question_limit").default(10).notNull(),
  maxOutputTokens: integer("max_output_tokens").default(600).notNull(),
  monthlyCostLimitMicrousd: bigint("monthly_cost_limit_microusd", { mode: "number" }).default(50_000_000).notNull(),
  inputPriceMicrousdPerMillion: bigint("input_price_microusd_per_million", { mode: "number" }),
  outputPriceMicrousdPerMillion: bigint("output_price_microusd_per_million", { mode: "number" }),
  pricingCheckedAt: timestamp("pricing_checked_at", { withTimezone: true }),
  resetTimezone: text("reset_timezone").default("Asia/Seoul").notNull(),
  dailyResetMinute: integer("daily_reset_minute").default(0).notNull(),
  cookieRetentionDays: integer("cookie_retention_days").default(180).notNull(),
  summaryPolicy: summaryPolicyEnum("summary_policy").default("review").notNull(),
  version: integer("version").default(1).notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const aiProviderCredentials = pgTable("ai_provider_credentials", {
  provider: text("provider").default("openai").primaryKey(),
  ciphertext: text("ciphertext").notNull(),
  iv: text("iv").notNull(),
  authTag: text("auth_tag").notNull(),
  fingerprint: text("fingerprint").notNull(),
  verifiedModel: text("verified_model"),
  verificationStatus: text("verification_status").default("verified").notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

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

export const aiUsageDaily = pgTable("ai_usage_daily", {
  visitorHash: text("visitor_hash").notNull(),
  dateBucket: timestamp("date_bucket", { withTimezone: true }).notNull(),
  questionCount: integer("question_count").default(0).notNull(),
  inputTokens: bigint("input_tokens", { mode: "number" }).default(0).notNull(),
  outputTokens: bigint("output_tokens", { mode: "number" }).default(0).notNull(),
  totalTokens: bigint("total_tokens", { mode: "number" }).default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.visitorHash, table.dateBucket] }),
  index("ai_usage_daily_date_bucket_idx").on(table.dateBucket),
  check("ai_usage_daily_question_count_nonnegative", sql`${table.questionCount} >= 0`),
  check("ai_usage_daily_input_tokens_nonnegative", sql`${table.inputTokens} >= 0`),
  check("ai_usage_daily_output_tokens_nonnegative", sql`${table.outputTokens} >= 0`),
  check("ai_usage_daily_total_tokens_nonnegative", sql`${table.totalTokens} >= 0`),
])

export const aiUsageMonthly = pgTable("ai_usage_monthly", {
  monthBucket: timestamp("month_bucket", { withTimezone: true }).primaryKey(),
  questionCount: integer("question_count").default(0).notNull(),
  summaryCount: integer("summary_count").default(0).notNull(),
  inputTokens: bigint("input_tokens", { mode: "number" }).default(0).notNull(),
  outputTokens: bigint("output_tokens", { mode: "number" }).default(0).notNull(),
  totalTokens: bigint("total_tokens", { mode: "number" }).default(0).notNull(),
  estimatedCostMicrousd: bigint("estimated_cost_microusd", { mode: "number" }).default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("ai_usage_monthly_question_count_nonnegative", sql`${table.questionCount} >= 0`),
  check("ai_usage_monthly_summary_count_nonnegative", sql`${table.summaryCount} >= 0`),
  check("ai_usage_monthly_input_tokens_nonnegative", sql`${table.inputTokens} >= 0`),
  check("ai_usage_monthly_output_tokens_nonnegative", sql`${table.outputTokens} >= 0`),
  check("ai_usage_monthly_total_tokens_nonnegative", sql`${table.totalTokens} >= 0`),
  check("ai_usage_monthly_estimated_cost_microusd_nonnegative", sql`${table.estimatedCostMicrousd} >= 0`),
])

export const aiUsageReservations = pgTable("ai_usage_reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id"),
  visitorHash: text("visitor_hash"),
  dateBucket: timestamp("date_bucket", { withTimezone: true }),
  monthBucket: timestamp("month_bucket", { withTimezone: true }).notNull(),
  kind: aiUsageReservationKindEnum("kind").notNull(),
  reservedTokens: bigint("reserved_tokens", { mode: "number" }).notNull(),
  reservedCostMicrousd: bigint("reserved_cost_microusd", { mode: "number" }).notNull(),
  reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("ai_usage_reservations_expiry_idx").on(table.expiresAt),
  uniqueIndex("ai_usage_reservations_subject_unique")
    .on(table.subjectId)
    .where(sql`${table.subjectId} IS NOT NULL`),
  check("ai_usage_reservations_reserved_tokens_nonnegative", sql`${table.reservedTokens} >= 0`),
  check("ai_usage_reservations_reserved_cost_microusd_nonnegative", sql`${table.reservedCostMicrousd} >= 0`),
])
