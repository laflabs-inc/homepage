CREATE TABLE "document_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "document_kind" NOT NULL,
	"slug" text NOT NULL,
	"label_ko" text NOT NULL,
	"label_en" text NOT NULL,
	"sort_order" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_categories_sort_order_nonnegative" CHECK ("document_categories"."sort_order" >= 0),
	CONSTRAINT "document_categories_version_positive" CHECK ("document_categories"."version" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "document_categories_kind_slug_unique" ON "document_categories" USING btree ("kind","slug");--> statement-breakpoint
CREATE INDEX "document_categories_kind_active_order_idx" ON "document_categories" USING btree ("kind","active","sort_order");--> statement-breakpoint
INSERT INTO "document_categories" (
  "kind", "slug", "label_ko", "label_en", "sort_order", "created_by", "updated_by"
) VALUES
  ('notice', 'general', '일반', 'General', 0, 'system:migration', 'system:migration'),
  ('notice', 'service', '서비스', 'Service', 1, 'system:migration', 'system:migration'),
  ('notice', 'maintenance', '점검', 'Maintenance', 2, 'system:migration', 'system:migration'),
  ('notice', 'security', '보안', 'Security', 3, 'system:migration', 'system:migration'),
  ('legal', 'privacy', '개인정보', 'Privacy', 0, 'system:migration', 'system:migration'),
  ('legal', 'terms', '이용약관', 'Terms', 1, 'system:migration', 'system:migration'),
  ('legal', 'cookies', '쿠키', 'Cookies', 2, 'system:migration', 'system:migration'),
  ('legal', 'policy', '정책', 'Policy', 3, 'system:migration', 'system:migration'),
  ('disclosure', 'corporate', '기업', 'Corporate', 0, 'system:migration', 'system:migration'),
  ('disclosure', 'financial', '재무', 'Financial', 1, 'system:migration', 'system:migration'),
  ('disclosure', 'governance', '지배구조', 'Governance', 2, 'system:migration', 'system:migration'),
  ('disclosure', 'material', '주요사항', 'Material', 3, 'system:migration', 'system:migration')
ON CONFLICT ("kind", "slug") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "document_series" ADD CONSTRAINT "document_series_kind_category_fk" FOREIGN KEY ("kind","category") REFERENCES "public"."document_categories"("kind","slug") ON DELETE restrict ON UPDATE no action;