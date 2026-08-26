CREATE TYPE "public"."document_kind" AS ENUM('notice', 'legal', 'disclosure', 'design');--> statement-breakpoint
CREATE TYPE "public"."document_locale" AS ENUM('ko', 'en');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'scheduled', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"actor_github_id" text NOT NULL,
	"actor_name" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"series_id" uuid NOT NULL,
	"locale" "document_locale" NOT NULL,
	"revision" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body_markdown" text NOT NULL,
	"status" "document_status" NOT NULL,
	"effective_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"published_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "document_kind" NOT NULL,
	"slug" text NOT NULL,
	"category" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_revisions" ADD CONSTRAINT "document_revisions_series_id_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_revisions_series_locale_revision_unique" ON "document_revisions" USING btree ("series_id","locale","revision");--> statement-breakpoint
CREATE INDEX "document_revisions_series_locale_status_idx" ON "document_revisions" USING btree ("series_id","locale","status");--> statement-breakpoint
CREATE INDEX "document_revisions_status_scheduled_at_idx" ON "document_revisions" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "document_series_kind_slug_unique" ON "document_series" USING btree ("kind","slug");--> statement-breakpoint
CREATE INDEX "document_series_kind_archived_at_idx" ON "document_series" USING btree ("kind","archived_at");