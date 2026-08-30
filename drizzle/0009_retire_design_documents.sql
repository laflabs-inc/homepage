DELETE FROM "document_revisions"
WHERE "series_id" IN (
  SELECT "id" FROM "document_series" WHERE "kind" = 'design'
);--> statement-breakpoint
DELETE FROM "document_series" WHERE "kind" = 'design';--> statement-breakpoint
ALTER TABLE "document_series" ALTER COLUMN "kind" TYPE text USING "kind"::text;--> statement-breakpoint
DROP TYPE "public"."document_kind";--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('notice', 'legal', 'disclosure');--> statement-breakpoint
ALTER TABLE "document_series" ALTER COLUMN "kind" TYPE "public"."document_kind"
USING "kind"::"public"."document_kind";
