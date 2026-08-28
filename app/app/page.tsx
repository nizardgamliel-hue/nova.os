import type { Metadata } from "next";
import { AdaptiveDashboard } from "@/components/nova-dashboard-with-ai";
import "./adaptive.css";
import "./dashboard-nova.css";
import { headers } from "next/headers";import { resolveAuthContext } from "@/lib/auth/context";import { getDb } from "@/lib/db";import { companyProfiles,contacts,deals,organizations,workspaceConfigs } from "@/lib/db/schema";import { desc,eq } from "drizzle-orm";import { buildIndustryExperience } from "@/lib/nova/industry-engine";

export const metadata: Metadata = {
  title: "Vue d’ensemble",
  description: "Pilotez vos agents, missions, automatisations et connecteurs depuis le tableau de bord NOVA.",
};

export default async function NovaAppPage() {
  const auth=await resolveAuthContext(await headers());if(!auth.context)return null;const id=auth.context.organization.id;const [[org],[profile],[workspace],contactRows,dealRows]=await Promise.all([getDb().select().from(organizations).where(eq(organizations.id,id)).limit(1),getDb().select().from(companyProfiles).where(eq(companyProfiles.organizationId,id)).limit(1),getDb().select().from(workspaceConfigs).where(eq(workspaceConfigs.organizationId,id)).limit(1),getDb().select().from(contacts).where(eq(contacts.organizationId,id)).orderBy(desc(contacts.updatedAt)).limit(5),getDb().select().from(deals).where(eq(deals.organizationId,id)).orderBy(desc(deals.updatedAt)).limit(5)]);const experience=buildIndustryExperience({organization:org,profile,workspace});const pipelineValue=dealRows.reduce((sum,d)=>sum+Number(d.value),0);return <AdaptiveDashboard experience={experience} organizationName={org.name} contactCount={contactRows.length} dealCount={dealRows.length} pipelineValue={pipelineValue} recentContacts={contactRows} recentDeals={dealRows}/>;
}
