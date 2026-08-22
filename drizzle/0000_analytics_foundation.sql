CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"visitor_hash" text NOT NULL,
	"session_hash" text NOT NULL,
	"event_type" text NOT NULL,
	"pathname" text NOT NULL,
	"target_id" text,
	"locale" text NOT NULL,
	"device_category" text NOT NULL,
	"referrer_host" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_rate_windows" (
	"visitor_hash" text NOT NULL,
	"minute_bucket" timestamp with time zone NOT NULL,
	"event_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "analytics_rate_windows_visitor_hash_minute_bucket_pk" PRIMARY KEY("visitor_hash","minute_bucket")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_event_id_unique" ON "analytics_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "analytics_received_at_idx" ON "analytics_events" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "analytics_type_received_idx" ON "analytics_events" USING btree ("event_type","received_at");--> statement-breakpoint
CREATE INDEX "analytics_visitor_idx" ON "analytics_events" USING btree ("visitor_hash");