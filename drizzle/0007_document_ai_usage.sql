CREATE TYPE "public"."ai_usage_reservation_kind" AS ENUM('question', 'summary');--> statement-breakpoint
CREATE TABLE "ai_usage_daily" (
	"visitor_hash" text NOT NULL,
	"date_bucket" timestamp with time zone NOT NULL,
	"question_count" integer DEFAULT 0 NOT NULL,
	"input_tokens" bigint DEFAULT 0 NOT NULL,
	"output_tokens" bigint DEFAULT 0 NOT NULL,
	"total_tokens" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_daily_visitor_hash_date_bucket_pk" PRIMARY KEY("visitor_hash","date_bucket"),
	CONSTRAINT "ai_usage_daily_question_count_nonnegative" CHECK ("ai_usage_daily"."question_count" >= 0),
	CONSTRAINT "ai_usage_daily_input_tokens_nonnegative" CHECK ("ai_usage_daily"."input_tokens" >= 0),
	CONSTRAINT "ai_usage_daily_output_tokens_nonnegative" CHECK ("ai_usage_daily"."output_tokens" >= 0),
	CONSTRAINT "ai_usage_daily_total_tokens_nonnegative" CHECK ("ai_usage_daily"."total_tokens" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ai_usage_monthly" (
	"month_bucket" timestamp with time zone PRIMARY KEY NOT NULL,
	"question_count" integer DEFAULT 0 NOT NULL,
	"summary_count" integer DEFAULT 0 NOT NULL,
	"input_tokens" bigint DEFAULT 0 NOT NULL,
	"output_tokens" bigint DEFAULT 0 NOT NULL,
	"total_tokens" bigint DEFAULT 0 NOT NULL,
	"estimated_cost_microusd" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_monthly_question_count_nonnegative" CHECK ("ai_usage_monthly"."question_count" >= 0),
	CONSTRAINT "ai_usage_monthly_summary_count_nonnegative" CHECK ("ai_usage_monthly"."summary_count" >= 0),
	CONSTRAINT "ai_usage_monthly_input_tokens_nonnegative" CHECK ("ai_usage_monthly"."input_tokens" >= 0),
	CONSTRAINT "ai_usage_monthly_output_tokens_nonnegative" CHECK ("ai_usage_monthly"."output_tokens" >= 0),
	CONSTRAINT "ai_usage_monthly_total_tokens_nonnegative" CHECK ("ai_usage_monthly"."total_tokens" >= 0),
	CONSTRAINT "ai_usage_monthly_estimated_cost_microusd_nonnegative" CHECK ("ai_usage_monthly"."estimated_cost_microusd" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ai_usage_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_hash" text,
	"date_bucket" timestamp with time zone,
	"month_bucket" timestamp with time zone NOT NULL,
	"kind" "ai_usage_reservation_kind" NOT NULL,
	"reserved_tokens" bigint NOT NULL,
	"reserved_cost_microusd" bigint NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_reservations_reserved_tokens_nonnegative" CHECK ("ai_usage_reservations"."reserved_tokens" >= 0),
	CONSTRAINT "ai_usage_reservations_reserved_cost_microusd_nonnegative" CHECK ("ai_usage_reservations"."reserved_cost_microusd" >= 0)
);
--> statement-breakpoint
CREATE INDEX "ai_usage_daily_date_bucket_idx" ON "ai_usage_daily" USING btree ("date_bucket");--> statement-breakpoint
CREATE INDEX "ai_usage_reservations_expiry_idx" ON "ai_usage_reservations" USING btree ("expires_at");