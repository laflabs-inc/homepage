ALTER TABLE "ai_usage_reservations" ADD COLUMN "subject_id" uuid;--> statement-breakpoint
ALTER TABLE "ai_usage_reservations" ADD COLUMN "reconciled_at" timestamp with time zone;--> statement-breakpoint
UPDATE "ai_usage_reservations" SET "subject_id" = "id" WHERE "kind" = 'summary';--> statement-breakpoint
CREATE UNIQUE INDEX "ai_usage_reservations_subject_unique" ON "ai_usage_reservations" USING btree ("subject_id") WHERE "ai_usage_reservations"."subject_id" IS NOT NULL;
