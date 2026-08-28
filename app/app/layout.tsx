import { NovaPlatformShell } from "@/components/nova-platform-shell";
import "../platform.css";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveAuthContext } from "@/lib/auth/context";
import { getDb } from "@/lib/db";
import { companyProfiles, memberships, organizations, workspaceConfigs } from "@/lib/db/schema";import { buildIndustryExperience } from "@/lib/nova/industry-engine";
import { and, asc, eq } from "drizzle-orm";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders=await headers();const session=await auth.api.getSession({headers:requestHeaders});if(!session)redirect("/login");
  const resolved=await resolveAuthContext(requestHeaders);if(!resolved.context)redirect("/setup");
  const [active]=await getDb().select({organization:organizations,profile:companyProfiles,workspace:workspaceConfigs}).from(organizations).leftJoin(companyProfiles,eq(companyProfiles.organizationId,organizations.id)).leftJoin(workspaceConfigs,eq(workspaceConfigs.organizationId,organizations.id)).where(eq(organizations.id,resolved.context.organization.id)).limit(1);if(!active?.organization.onboardingCompleted)redirect("/onboarding");const experience=buildIndustryExperience({organization:active.organization,profile:active.profile!,workspace:active.workspace!});
  const available=await getDb().select({id:organizations.id,name:organizations.name,role:memberships.role}).from(memberships).innerJoin(organizations,eq(memberships.organizationId,organizations.id)).where(and(eq(memberships.userId,session.user.id),eq(memberships.status,"active"))).orderBy(asc(organizations.name));
  return <NovaPlatformShell user={{name:session.user.name,email:session.user.email,image:session.user.image}} activeOrganization={{id:resolved.context.organization.id,name:resolved.context.organization.name,role:resolved.context.membership.role}} organizations={available} enabledModules={active.workspace?.enabledModules||[]} navigationPriority={experience.navigationPriority} terminology={experience.terminology}>{children}</NovaPlatformShell>;
}
