ALTER TABLE "media_asset_references" ADD CONSTRAINT "media_asset_references_revision_fk"
  FOREIGN KEY ("revision_id") REFERENCES "public"."document_revisions"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
CREATE INDEX "media_asset_references_owner_idx" ON "media_asset_references"
  USING btree ("owner_type", "owner_id", "field");
