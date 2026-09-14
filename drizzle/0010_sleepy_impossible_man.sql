ALTER TABLE "business_events" ADD COLUMN "status" text DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "business_events" ADD COLUMN "processing_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_events" ADD COLUMN "processed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_events" ADD COLUMN "claimed_by" text;--> statement-breakpoint
ALTER TABLE "business_events" ADD COLUMN "attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "business_events" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "business_events" ADD COLUMN "available_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "business_events_claim_idx" ON "business_events" USING btree ("status","available_at","occurred_at");