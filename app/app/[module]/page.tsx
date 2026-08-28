import { notFound } from "next/navigation";
import { EnterpriseModulePage } from "@/components/nova-enterprise-modules";

const moduleSlugs = [
  "nova-manager", "autopilot", "prospection", "ventes", "communications",
  "marketing", "social", "service-client", "voice", "finance", "rh",
  "operations", "projets", "predict", "computer-agent", "agent-store",
  "connaissances", "abonnement",
] as const;

export function generateStaticParams() {
  return moduleSlugs.map((module) => ({ module }));
}

export default async function Page({params}:{params:Promise<{module:string}>}) {
  const { module } = await params;
  if (!moduleSlugs.includes(module as (typeof moduleSlugs)[number])) notFound();
  return <EnterpriseModulePage slug={module}/>;
}
