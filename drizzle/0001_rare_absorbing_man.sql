CREATE TABLE "analytics_withdrawal_guards" (
	"visitor_hash" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "analytics_withdrawal_guards_expiry_idx" ON "analytics_withdrawal_guards" USING btree ("expires_at");