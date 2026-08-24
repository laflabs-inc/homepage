CREATE TYPE "public"."summary_policy" AS ENUM('review', 'automatic');--> statement-breakpoint
CREATE TABLE "agent_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"model" text,
	"daily_token_limit" integer DEFAULT 20000 NOT NULL,
	"daily_question_limit" integer DEFAULT 10 NOT NULL,
	"max_output_tokens" integer DEFAULT 600 NOT NULL,
	"monthly_cost_limit_microusd" bigint DEFAULT 50000000 NOT NULL,
	"input_price_microusd_per_million" bigint,
	"output_price_microusd_per_million" bigint,
	"pricing_checked_at" timestamp with time zone,
	"reset_timezone" text DEFAULT 'Asia/Seoul' NOT NULL,
	"daily_reset_minute" integer DEFAULT 0 NOT NULL,
	"cookie_retention_days" integer DEFAULT 180 NOT NULL,
	"summary_policy" "summary_policy" DEFAULT 'review' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_provider_credentials" (
	"provider" text PRIMARY KEY DEFAULT 'openai' NOT NULL,
	"ciphertext" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"fingerprint" text NOT NULL,
	"verified_model" text NOT NULL,
	"verification_status" text DEFAULT 'verified' NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "agent_settings" ("id", "updated_by")
VALUES ('default', 'system:migration')
ON CONFLICT ("id") DO NOTHING;
