import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const contactStatus = pgEnum("contact_status", ["new", "qualified", "contacted", "customer", "inactive"]);
export const dealStage = pgEnum("deal_stage", ["new", "qualified", "proposal", "negotiation", "won", "lost"]);
export const memberRole = pgEnum("member_role", ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"]);
export const memberStatus = pgEnum("member_status", ["active", "suspended"]);
export const invitationStatus = pgEnum("invitation_status", ["pending", "accepted", "cancelled", "expired"]);
export const novaMessageRole = pgEnum("nova_message_role", ["user", "assistant", "tool"]);
export const novaActionStatus = pgEnum("nova_action_status", ["DRAFT","PENDING_APPROVAL","APPROVED","EXECUTING","SUCCEEDED","FAILED","CANCELLED","EXPIRED"]);
export const novaRiskLevel = pgEnum("nova_risk_level", ["LOW","MEDIUM","HIGH","CRITICAL"]);
export const novaApprovalPolicy = pgEnum("nova_approval_policy", ["NEVER_REQUIRED","REQUIRED","CONDITIONAL","FORBIDDEN"]);
export const automationStatus = pgEnum("automation_status", ["DRAFT","ACTIVE","PAUSED","DISABLED"]);
export const automationRunStatus = pgEnum("automation_run_status", ["QUEUED","RUNNING","SUCCEEDED","PARTIAL","FAILED","CANCELLED","SKIPPED"]);
export const automationStepStatus = pgEnum("automation_step_status", ["QUEUED","RUNNING","SUCCEEDED","FAILED","SKIPPED"]);

export const user = pgTable("user", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  locale: text("locale").notNull().default("fr"),
  timezone: text("timezone").notNull().default("Europe/Paris"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("user_email_idx").on(table.email), index("user_created_idx").on(table.createdAt)]);

export const session = pgTable("session", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => [index("session_user_idx").on(table.userId), index("session_expires_idx").on(table.expiresAt)]);

export const account = pgTable("account", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`), issuer: text("issuer").notNull(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), accessToken: text("access_token"), refreshToken: text("refresh_token"),
  idToken: text("id_token"), accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }), refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"), password: text("password"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("account_user_idx").on(table.userId), uniqueIndex("account_issuer_unique").on(table.issuer, table.accountId)]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(), slug: text("slug").notNull().unique(), industry: text("industry").notNull(), country: text("country").notNull(),
  language: text("language").notNull().default("fr"), timezone: text("timezone").notNull().default("Europe/Paris"), onboardingCompleted:boolean("onboarding_completed").notNull().default(false), onboardingCompletedAt:timestamp("onboarding_completed_at",{withTimezone:true}), onboardingCurrentStep:integer("onboarding_current_step").notNull().default(1), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("organizations_created_idx").on(table.createdAt)]);

export const companyProfiles=pgTable("company_profiles",{
  id:uuid("id").primaryKey().defaultRandom(),organizationId:uuid("organization_id").notNull().references(()=>organizations.id,{onDelete:"cascade"}),subIndustry:text("sub_industry"),businessModels:text("business_models").array().notNull().default([]),businessModelOther:text("business_model_other"),companySize:text("company_size"),employeeCount:integer("employee_count"),website:text("website"),description:text("description"),goals:text("goals").array().notNull().default([]),goalOther:text("goal_other"),currentTools:jsonb("current_tools").notNull().default({}),communicationChannels:text("communication_channels").array().notNull().default([]),timeConsumingProcesses:text("time_consuming_processes").array().notNull().default([]),processToAutomate:text("process_to_automate"),departments:text("departments").array().notNull().default([]),salesTeamSize:integer("sales_team_size"),supportTeamSize:integer("support_team_size"),managementTeamSize:integer("management_team_size"),workMode:text("work_mode"),operationalPreferences:jsonb("operational_preferences").notNull().default({}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("company_profiles_org_unique").on(t.organizationId),index("company_profiles_updated_idx").on(t.updatedAt)]);

export const workspaceConfigs=pgTable("workspace_configs",{
  id:uuid("id").primaryKey().defaultRandom(),organizationId:uuid("organization_id").notNull().references(()=>organizations.id,{onDelete:"cascade"}),enabledModules:text("enabled_modules").array().notNull().default([]),desiredAgents:text("desired_agents").array().notNull().default([]),desiredAutomations:text("desired_automations").array().notNull().default([]),desiredIntegrations:jsonb("desired_integrations").notNull().default([]),dashboardPreferences:jsonb("dashboard_preferences").notNull().default({}),industryTemplate:text("industry_template").notNull().default("general"),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("workspace_configs_org_unique").on(t.organizationId),index("workspace_configs_updated_idx").on(t.updatedAt)]);

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  role: memberRole("role").notNull().default("MEMBER"), status: memberStatus("status").notNull().default("active"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("memberships_user_org_unique").on(table.userId, table.organizationId), index("memberships_org_idx").on(table.organizationId), index("memberships_user_idx").on(table.userId), index("memberships_role_idx").on(table.role), index("memberships_status_idx").on(table.status)]);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }), email: text("email").notNull(), role: memberRole("role").notNull(), tokenHash: text("token_hash").notNull().unique(),
  status: invitationStatus("status").notNull().default("pending"), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), invitedBy: text("invited_by").notNull().references(() => user.id, { onDelete: "restrict" }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), acceptedAt: timestamp("accepted_at", { withTimezone: true }),
}, (table) => [index("invitations_org_idx").on(table.organizationId), index("invitations_email_idx").on(table.email), index("invitations_status_idx").on(table.status), index("invitations_expires_idx").on(table.expiresAt)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }), userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(), resourceType: text("resource_type").notNull(), resourceId: text("resource_id"), metadata: jsonb("metadata").notNull().default({}), ip: text("ip"), userAgent: text("user_agent"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("audit_logs_org_created_idx").on(table.organizationId, table.createdAt), index("audit_logs_user_idx").on(table.userId), index("audit_logs_action_idx").on(table.action)]);

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  status: contactStatus("status").notNull().default("new"),
  source: text("source").notNull().default("manual"),
  tags: text("tags").array().notNull().default([]),
  notes: text("notes"),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  demo: boolean("demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("contacts_org_idx").on(table.organizationId), index("contacts_email_idx").on(table.email)]);

export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  value: numeric("value", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  stage: dealStage("stage").notNull().default("new"),
  probability: integer("probability").notNull().default(10),
  expectedCloseDate: timestamp("expected_close_date", { withTimezone: true }),
  notes: text("notes"),
  demo: boolean("demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("deals_org_idx").on(table.organizationId), index("deals_stage_idx").on(table.organizationId, table.stage)]);

export const novaConversations = pgTable("nova_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New conversation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
}, (table) => [
  index("nova_conversations_org_user_updated_idx").on(table.organizationId, table.userId, table.updatedAt),
  index("nova_conversations_archived_idx").on(table.archivedAt),
]);

export const novaMessages = pgTable("nova_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => novaConversations.id, { onDelete: "cascade" }),
  externalId: text("external_id").notNull(),
  role: novaMessageRole("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("nova_messages_conversation_external_unique").on(table.conversationId, table.externalId),
  index("nova_messages_conversation_created_idx").on(table.conversationId, table.createdAt),
]);

export const novaAiUsage = pgTable("nova_ai_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => novaConversations.id, { onDelete: "set null" }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  totalTokens: integer("total_tokens"),
  estimatedCost: numeric("estimated_cost", { precision: 14, scale: 8 }),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("nova_ai_usage_org_created_idx").on(table.organizationId, table.createdAt),
  index("nova_ai_usage_user_created_idx").on(table.userId, table.createdAt),
  index("nova_ai_usage_conversation_idx").on(table.conversationId),
]);

export const novaActions = pgTable("nova_actions", {
  id: uuid("id").primaryKey().defaultRandom(), organizationId: uuid("organization_id").notNull().references(()=>organizations.id,{onDelete:"cascade"}), userId: text("user_id").notNull().references(()=>user.id,{onDelete:"cascade"}), conversationId: uuid("conversation_id").references(()=>novaConversations.id,{onDelete:"set null"}), actionType:text("action_type").notNull(), toolId:text("tool_id").notNull(), status:novaActionStatus("status").notNull().default("PENDING_APPROVAL"), riskLevel:novaRiskLevel("risk_level").notNull(), approvalPolicy:novaApprovalPolicy("approval_policy").notNull(), input:jsonb("input").notNull().default({}), result:jsonb("result"), error:text("error"), requestedAt:timestamp("requested_at",{withTimezone:true}).notNull().defaultNow(), approvedAt:timestamp("approved_at",{withTimezone:true}), executedAt:timestamp("executed_at",{withTimezone:true}), cancelledAt:timestamp("cancelled_at",{withTimezone:true}), expiresAt:timestamp("expires_at",{withTimezone:true}).notNull(),
}, t=>[index("nova_actions_org_status_idx").on(t.organizationId,t.status),index("nova_actions_user_idx").on(t.userId),index("nova_actions_expires_idx").on(t.expiresAt)]);

export const automations = pgTable("automations", { id:uuid("id").primaryKey().defaultRandom(), organizationId:uuid("organization_id").notNull().references(()=>organizations.id,{onDelete:"cascade"}), name:text("name").notNull(), description:text("description"), status:automationStatus("status").notNull().default("DRAFT"), triggerType:text("trigger_type").notNull(), triggerConfig:jsonb("trigger_config").notNull().default({}), conditions:jsonb("conditions").notNull().default({mode:"ALL",items:[]}), steps:jsonb("steps").notNull().default([]), executionPolicy:text("execution_policy").notNull().default("SAFE_INTERNAL"), createdBy:text("created_by").notNull().references(()=>user.id,{onDelete:"restrict"}), createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(), updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(), lastRunAt:timestamp("last_run_at",{withTimezone:true}), runCount:integer("run_count").notNull().default(0), failureCount:integer("failure_count").notNull().default(0)},t=>[index("automations_org_status_idx").on(t.organizationId,t.status),index("automations_org_updated_idx").on(t.organizationId,t.updatedAt)]);
export const automationRuns = pgTable("automation_runs", { id:uuid("id").primaryKey().defaultRandom(), organizationId:uuid("organization_id").notNull().references(()=>organizations.id,{onDelete:"cascade"}), automationId:uuid("automation_id").notNull().references(()=>automations.id,{onDelete:"cascade"}), triggerEventId:uuid("trigger_event_id"), status:automationRunStatus("status").notNull().default("QUEUED"), startedAt:timestamp("started_at",{withTimezone:true}), completedAt:timestamp("completed_at",{withTimezone:true}), durationMs:integer("duration_ms"), input:jsonb("input").notNull().default({}), output:jsonb("output"), error:text("error"), attempt:integer("attempt").notNull().default(1), createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()},t=>[index("automation_runs_org_created_idx").on(t.organizationId,t.createdAt),index("automation_runs_automation_idx").on(t.automationId,t.createdAt)]);
export const automationStepRuns = pgTable("automation_step_runs", { id:uuid("id").primaryKey().defaultRandom(), organizationId:uuid("organization_id").notNull().references(()=>organizations.id,{onDelete:"cascade"}), automationRunId:uuid("automation_run_id").notNull().references(()=>automationRuns.id,{onDelete:"cascade"}), stepId:text("step_id").notNull(), actionId:uuid("action_id").references(()=>novaActions.id,{onDelete:"set null"}), status:automationStepStatus("status").notNull().default("QUEUED"), input:jsonb("input").notNull().default({}), output:jsonb("output"), error:text("error"), startedAt:timestamp("started_at"), completedAt:timestamp("completed_at"), durationMs:integer("duration_ms")},t=>[index("automation_step_runs_run_idx").on(t.automationRunId)]);
export const businessEvents = pgTable("business_events", { id:uuid("id").primaryKey().defaultRandom(), organizationId:uuid("organization_id").notNull().references(()=>organizations.id,{onDelete:"cascade"}), type:text("type").notNull(), source:text("source").notNull().default("system"), resourceType:text("resource_type").notNull(), resourceId:text("resource_id").notNull(), actorUserId:text("actor_user_id").references(()=>user.id,{onDelete:"set null"}), payload:jsonb("payload").notNull().default({}), occurredAt:timestamp("occurred_at",{withTimezone:true}).notNull().defaultNow(), idempotencyKey:text("idempotency_key").notNull(), rootExecutionId:uuid("root_execution_id").notNull().defaultRandom(), parentEventId:uuid("parent_event_id"), depth:integer("depth").notNull().default(0), stopReason:text("stop_reason")},t=>[uniqueIndex("business_events_org_idempotency_unique").on(t.organizationId,t.idempotencyKey),index("business_events_org_type_idx").on(t.organizationId,t.type),index("business_events_root_idx").on(t.organizationId,t.rootExecutionId)]);

export type Contact = typeof contacts.$inferSelect;
export type Deal = typeof deals.$inferSelect;
