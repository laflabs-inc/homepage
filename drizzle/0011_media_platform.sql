CREATE TYPE "public"."media_asset_reference_owner_type" AS ENUM('document_revision');--> statement-breakpoint
CREATE TYPE "public"."media_asset_status" AS ENUM('pending', 'processing', 'ready', 'failed', 'archived', 'deleting', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."media_asset_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "media_asset_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"owner_type" "media_asset_reference_owner_type" NOT NULL,
	"owner_id" text NOT NULL,
	"field" text NOT NULL,
	"revision_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_asset_references_owner_unique" UNIQUE NULLS NOT DISTINCT("asset_id","owner_type","owner_id","field","revision_id")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visibility" "media_asset_visibility" DEFAULT 'public' NOT NULL,
	"status" "media_asset_status" DEFAULT 'pending' NOT NULL,
	"original_filename" text NOT NULL,
	"safe_filename" text,
	"declared_media_type" text NOT NULL,
	"media_type" text,
	"byte_size" integer,
	"width" integer,
	"height" integer,
	"checksum_sha256" text,
	"staging_pathname" text,
	"staging_url" text,
	"public_pathname" text,
	"public_url" text,
	"alt_ko" text,
	"alt_en" text,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"failure_code" text,
	"family_id" uuid NOT NULL,
	"previous_asset_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_by_name" text NOT NULL,
	"updated_by_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ready_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"archived_by" text,
	"deleted_by" text,
	CONSTRAINT "media_assets_version_positive" CHECK ("media_assets"."version" > 0),
	CONSTRAINT "media_assets_byte_size_nonnegative" CHECK ("media_assets"."byte_size" IS NULL OR "media_assets"."byte_size" >= 0),
	CONSTRAINT "media_assets_width_nonnegative" CHECK ("media_assets"."width" IS NULL OR "media_assets"."width" >= 0),
	CONSTRAINT "media_assets_height_nonnegative" CHECK ("media_assets"."height" IS NULL OR "media_assets"."height" >= 0)
);
--> statement-breakpoint
ALTER TABLE "media_asset_references" ADD CONSTRAINT "media_asset_references_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_previous_asset_fk" FOREIGN KEY ("previous_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_asset_references_asset_idx" ON "media_asset_references" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "media_assets_status_created_idx" ON "media_assets" USING btree ("status","created_at","id");--> statement-breakpoint
CREATE INDEX "media_assets_checksum_idx" ON "media_assets" USING btree ("checksum_sha256");--> statement-breakpoint
CREATE INDEX "media_assets_original_filename_lower_idx" ON "media_assets" USING btree (lower("original_filename"));--> statement-breakpoint
CREATE INDEX "media_assets_safe_filename_lower_idx" ON "media_assets" USING btree (lower("safe_filename"));--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_family_version_unique" ON "media_assets" USING btree ("family_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "media_public_pathname_unique" ON "media_assets" USING btree ("public_pathname");--> statement-breakpoint
CREATE UNIQUE INDEX "media_staging_pathname_unique" ON "media_assets" USING btree ("staging_pathname");