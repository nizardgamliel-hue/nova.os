ALTER TABLE "business_events" ADD COLUMN "root_execution_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "business_events" ADD COLUMN "parent_event_id" uuid;--> statement-breakpoint
ALTER TABLE "business_events" ADD COLUMN "depth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "business_events" ADD COLUMN "stop_reason" text;--> statement-breakpoint
CREATE INDEX "business_events_root_idx" ON "business_events" USING btree ("organization_id","root_execution_id");