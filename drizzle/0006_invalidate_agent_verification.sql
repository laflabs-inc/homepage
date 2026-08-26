ALTER TABLE "ai_provider_credentials" ALTER COLUMN "verified_model" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_provider_credentials" ALTER COLUMN "verified_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_provider_credentials" ALTER COLUMN "verified_at" DROP NOT NULL;
