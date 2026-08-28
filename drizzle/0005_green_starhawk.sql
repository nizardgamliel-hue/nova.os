CREATE TYPE "public"."nova_message_role" AS ENUM('user', 'assistant', 'tool');--> statement-breakpoint
CREATE TABLE "nova_ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"conversation_id" uuid,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"estimated_cost" numeric(14, 8),
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nova_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT 'New conversation' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "nova_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"role" "nova_message_role" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nova_ai_usage" ADD CONSTRAINT "nova_ai_usage_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nova_ai_usage" ADD CONSTRAINT "nova_ai_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nova_ai_usage" ADD CONSTRAINT "nova_ai_usage_conversation_id_nova_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."nova_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nova_conversations" ADD CONSTRAINT "nova_conversations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nova_conversations" ADD CONSTRAINT "nova_conversations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nova_messages" ADD CONSTRAINT "nova_messages_conversation_id_nova_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."nova_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nova_ai_usage_org_created_idx" ON "nova_ai_usage" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "nova_ai_usage_user_created_idx" ON "nova_ai_usage" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "nova_ai_usage_conversation_idx" ON "nova_ai_usage" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "nova_conversations_org_user_updated_idx" ON "nova_conversations" USING btree ("organization_id","user_id","updated_at");--> statement-breakpoint
CREATE INDEX "nova_conversations_archived_idx" ON "nova_conversations" USING btree ("archived_at");--> statement-breakpoint
CREATE UNIQUE INDEX "nova_messages_conversation_external_unique" ON "nova_messages" USING btree ("conversation_id","external_id");--> statement-breakpoint
CREATE INDEX "nova_messages_conversation_created_idx" ON "nova_messages" USING btree ("conversation_id","created_at");