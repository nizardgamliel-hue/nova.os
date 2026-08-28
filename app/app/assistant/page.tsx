import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveAuthContext } from "@/lib/auth/context";
import { buildNovaContext } from "@/lib/nova/context-engine";
import { NovaAiChat } from "@/components/nova-ai-chat";
import "../nova-ai.css";

export default async function AssistantPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const resolved=await resolveAuthContext(await headers());if(!resolved.context)redirect("/login");
  const [{q},context]=await Promise.all([searchParams,buildNovaContext(resolved.context)]);
  return <NovaAiChat initialPrompt={q?.slice(0,12000)||""} template={context.experience.template}/>;
}
