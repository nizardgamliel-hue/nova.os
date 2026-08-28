CREATE TABLE "company_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sub_industry" text,
	"business_models" text[] DEFAULT '{}' NOT NULL,
	"business_model_other" text,
	"company_size" text,
	"employee_count" integer,
	"website" text,
	"description" text,
	"goals" text[] DEFAULT '{}' NOT NULL,
	"goal_other" text,
	"current_tools" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"communication_channels" text[] DEFAULT '{}' NOT NULL,
	"time_consuming_processes" text[] DEFAULT '{}' NOT NULL,
	"process_to_automate" text,
	"departments" text[] DEFAULT '{}' NOT NULL,
	"sales_team_size" integer,
	"support_team_size" integer,
	"management_team_size" integer,
	"work_mode" text,
	"operational_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"enabled_modules" text[] DEFAULT '{}' NOT NULL,
	"desired_agents" text[] DEFAULT '{}' NOT NULL,
	"desired_automations" text[] DEFAULT '{}' NOT NULL,
	"desired_integrations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dashboard_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"industry_template" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "onboarding_current_step" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_configs" ADD CONSTRAINT "workspace_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "company_profiles_org_unique" ON "company_profiles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "company_profiles_updated_idx" ON "company_profiles" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_configs_org_unique" ON "workspace_configs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workspace_configs_updated_idx" ON "workspace_configs" USING btree ("updated_at");