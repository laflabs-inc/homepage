ALTER TABLE "document_series" ADD COLUMN "metadata_locked" boolean;
--> statement-breakpoint
UPDATE "document_series" s
SET "metadata_locked" = true
WHERE EXISTS (
	SELECT 1
	FROM "document_revisions" r
	WHERE r."series_id" = s."id"
		AND r."status" <> 'draft'
);
--> statement-breakpoint
UPDATE "document_series"
SET "metadata_locked" = false
WHERE "metadata_locked" IS NULL;
--> statement-breakpoint
ALTER TABLE "document_series" ALTER COLUMN "metadata_locked" SET DEFAULT false;
--> statement-breakpoint
ALTER TABLE "document_series" ALTER COLUMN "metadata_locked" SET NOT NULL;
