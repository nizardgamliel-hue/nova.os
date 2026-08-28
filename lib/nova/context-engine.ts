import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { companyProfiles, organizations, workspaceConfigs } from "@/lib/db/schema";
import type { AuthContext } from "@/lib/auth/context";
import { rolePermissions } from "@/lib/auth/permissions";
import { buildIndustryExperience } from "./industry-engine";

export async function buildNovaContext(context: AuthContext) {
  const db = getDb();
  const [[organization], [profile], [workspace]] = await Promise.all([
    db.select().from(organizations).where(eq(organizations.id, context.organization.id)).limit(1),
    db.select().from(companyProfiles).where(eq(companyProfiles.organizationId, context.organization.id)).limit(1),
    db.select().from(workspaceConfigs).where(eq(workspaceConfigs.organizationId, context.organization.id)).limit(1),
  ]);
  const experience = buildIndustryExperience({organization,profile:profile??{},workspace:workspace??{}});
  const permissions = [...rolePermissions[context.membership.role]];
  const targeted = {
    organization: { name: organization.name, industry: organization.industry, country: organization.country, language: organization.language, timezone: organization.timezone },
    profile: profile ? { description: profile.description, businessModels: profile.businessModels, goals: profile.goals, currentTools: profile.currentTools, communicationChannels: profile.communicationChannels, timeConsumingProcesses: profile.timeConsumingProcesses, departments: profile.departments, workMode: profile.workMode } : null,
    workspace: workspace ? { enabledModules: workspace.enabledModules, desiredAgents: workspace.desiredAgents, desiredAutomations: workspace.desiredAutomations, desiredIntegrations: workspace.desiredIntegrations, industryTemplate: workspace.industryTemplate } : null,
    industry: { template: experience.template, terminology: experience.terminology, priorities: experience.navigationPriority },
    user: { name: context.user.name, role: context.membership.role, permissions },
  };
  return { organization, profile, workspace, experience, permissions, targeted, prompt: JSON.stringify(targeted) };
}
