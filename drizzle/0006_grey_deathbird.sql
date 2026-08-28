CREATE TYPE "public"."nova_action_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'EXECUTING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."nova_approval_policy" AS ENUM('NEVER_REQUIRED', 'REQUIRED', 'CONDITIONAL', 'FORBIDDEN');--> statement-breakpoint
CREATE TYPE "public"."nova_risk_level" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TABLE "nova_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"conversation_id" uuid,
	"action_type" text NOT NULL,
	"tool_id" text NOT NULL,
	"status" "nova_action_status" DEFAULT 'PENDING_APPROVAL' NOT NULL,
	"risk_level" "nova_risk_level" NOT NULL,
	"approval_policy" "nova_approval_policy" NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"executed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nova_actions" ADD CONSTRAINT "nova_actions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nova_actions" ADD CONSTRAINT "nova_actions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nova_actions" ADD CONSTRAINT "nova_actions_conversation_id_nova_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."nova_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nova_actions_org_status_idx" ON "nova_actions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "nova_actions_user_idx" ON "nova_actions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nova_actions_expires_idx" ON "nova_actions" USING btree ("expires_at");