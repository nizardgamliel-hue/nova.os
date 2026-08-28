import { and, desc, eq, ilike, or } from "drizzle-orm";
import { tool } from "ai";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { companyProfiles, contacts, deals, organizations, workspaceConfigs } from "@/lib/db/schema";
import type { AuthContext } from "@/lib/auth/context";
import { can, type Permission } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/auth/audit";
import { buildNovaContext } from "./context-engine";

export type NovaToolMode = "READ_ONLY" | "WRITE" | "EXTERNAL_ACTION" | "DESTRUCTIVE";
export type NovaToolRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Definition = { id: string; key: string; name: string; description: string; inputSchema: z.ZodType; requiredPermission: Permission; riskLevel: NovaToolRisk; mode: NovaToolMode };

export const novaToolRegistry: Definition[] = [
  { id:"company.getProfile", key:"company_getProfile", name:"Reading company profile", description:"Get the verified Organization and Company Profile for the active workspace.", inputSchema:z.object({}), requiredPermission:"companyProfile.read", riskLevel:"LOW", mode:"READ_ONLY" },
  { id:"crm.contacts.summary", key:"crm_contacts_summary", name:"Consulting CRM contacts", description:"Get contact totals, status breakdown and latest recorded activity for the active workspace.", inputSchema:z.object({}), requiredPermission:"contacts.read", riskLevel:"LOW", mode:"READ_ONLY" },
  { id:"crm.contacts.search", key:"crm_contacts_search", name:"Searching CRM contacts", description:"Search contacts in the active workspace by person, company or email.", inputSchema:z.object({ query:z.string().trim().min(1).max(120), limit:z.number().int().min(1).max(20).optional() }), requiredPermission:"contacts.read", riskLevel:"LOW", mode:"READ_ONLY" },
  { id:"crm.contact.get", key:"crm_contact_get", name:"Reading CRM contact", description:"Read one contact from the active workspace by its exact ID.", inputSchema:z.object({ id:z.string().uuid() }), requiredPermission:"contacts.read", riskLevel:"LOW", mode:"READ_ONLY" },
  { id:"crm.pipeline.summary", key:"crm_pipeline_summary", name:"Analyzing pipeline", description:"Calculate verified deal count, open pipeline, won value, conversion and stage breakdown.", inputSchema:z.object({}), requiredPermission:"deals.read", riskLevel:"LOW", mode:"READ_ONLY" },
  { id:"crm.deals.list", key:"crm_deals_list", name:"Reading opportunities", description:"List real deals in the active workspace with optional stage and value filters.", inputSchema:z.object({ stage:z.enum(["new","qualified","proposal","negotiation","won","lost"]).optional(), minValue:z.number().nonnegative().optional(), limit:z.number().int().min(1).max(30).optional() }), requiredPermission:"deals.read", riskLevel:"LOW", mode:"READ_ONLY" },
  { id:"crm.deal.get", key:"crm_deal_get", name:"Reading opportunity", description:"Read one deal from the active workspace by its exact ID.", inputSchema:z.object({ id:z.string().uuid() }), requiredPermission:"deals.read", riskLevel:"LOW", mode:"READ_ONLY" },
  { id:"workspace.getContext", key:"workspace_getContext", name:"Reading workspace context", description:"Get Workspace Config and Industry Engine context for the active workspace.", inputSchema:z.object({}), requiredPermission:"workspaceConfig.read", riskLevel:"LOW", mode:"READ_ONLY" },
  { id:"business.getBrief", key:"business_getBrief", name:"Building business brief", description:"Build a verified read-only brief from company, contacts and pipeline data that the user can access.", inputSchema:z.object({}), requiredPermission:"companyProfile.read", riskLevel:"LOW", mode:"READ_ONLY" },
];

type ToolResult = Record<string, unknown>;
export function createNovaTools(request: Request, context: AuthContext) {
  const db=getDb(), orgId=context.organization.id;
  const handlers:Record<string,(input:any)=>Promise<ToolResult>>={
    "company.getProfile":async()=>{const [[organization],[profile]]=await Promise.all([db.select().from(organizations).where(eq(organizations.id,orgId)).limit(1),db.select().from(companyProfiles).where(eq(companyProfiles.organizationId,orgId)).limit(1)]);return {organization,profile,source:"Company Profile"}},
    "crm.contacts.summary":async()=>{const rows=await db.select().from(contacts).where(eq(contacts.organizationId,orgId));const statusBreakdown=Object.fromEntries(["new","qualified","contacted","customer","inactive"].map(status=>[status,rows.filter(row=>row.status===status).length]));const recentActivity=rows.map(row=>row.lastActivityAt).filter(Boolean).sort((a,b)=>+new Date(b!)-+new Date(a!))[0]??null;return {total:rows.length,statusBreakdown,recentActivity,source:`CRM · ${rows.length} contacts`}},
    "crm.contacts.search":async({query,limit=10})=>{const pattern=`%${query}%`;const rows=await db.select({id:contacts.id,firstName:contacts.firstName,lastName:contacts.lastName,company:contacts.company,email:contacts.email,status:contacts.status,lastActivityAt:contacts.lastActivityAt}).from(contacts).where(and(eq(contacts.organizationId,orgId),or(ilike(contacts.firstName,pattern),ilike(contacts.lastName,pattern),ilike(contacts.company,pattern),ilike(contacts.email,pattern)))).orderBy(desc(contacts.updatedAt)).limit(limit);return {contacts:rows,total:rows.length,source:`CRM · contact search`}},
    "crm.contact.get":async({id})=>{const [row]=await db.select().from(contacts).where(and(eq(contacts.organizationId,orgId),eq(contacts.id,id))).limit(1);return {contact:row??null,source:"CRM · contact"}},
    "crm.pipeline.summary":async()=>{const rows=await db.select().from(deals).where(eq(deals.organizationId,orgId));const open=rows.filter(row=>row.stage!=="won"&&row.stage!=="lost"),won=rows.filter(row=>row.stage==="won");const stageBreakdown=Object.fromEntries(["new","qualified","proposal","negotiation","won","lost"].map(stage=>[stage,rows.filter(row=>row.stage===stage).length]));const totalPipeline=open.reduce((sum,row)=>sum+Number(row.value),0),wonValue=won.reduce((sum,row)=>sum+Number(row.value),0);return {totalDeals:rows.length,openDeals:open.length,totalPipeline,wonValue,conversion:rows.length?Number((won.length/rows.length*100).toFixed(1)):0,stageBreakdown,currency:"EUR",source:`CRM · ${rows.length} opportunities`}},
    "crm.deals.list":async({stage,minValue,limit=20})=>{let rows=await db.select({id:deals.id,title:deals.title,company:deals.company,value:deals.value,currency:deals.currency,stage:deals.stage,probability:deals.probability,expectedCloseDate:deals.expectedCloseDate,updatedAt:deals.updatedAt}).from(deals).where(stage?and(eq(deals.organizationId,orgId),eq(deals.stage,stage)):eq(deals.organizationId,orgId)).orderBy(desc(deals.updatedAt)).limit(limit);if(minValue!==undefined)rows=rows.filter(row=>Number(row.value)>=minValue);return {deals:rows,total:rows.length,source:`CRM · ${rows.length} opportunities`}},
    "crm.deal.get":async({id})=>{const [row]=await db.select().from(deals).where(and(eq(deals.organizationId,orgId),eq(deals.id,id))).limit(1);return {deal:row??null,source:"CRM · opportunity"}},
    "workspace.getContext":async()=>{const data=await buildNovaContext(context);return {workspace:data.workspace,industry:data.targeted.industry,source:"Nova Workspace Configuration"}},
    "business.getBrief":async()=>{const company=await handlers["company.getProfile"]({}),prospects=can(context.membership.role,"contacts.read")?await handlers["crm.contacts.summary"]({}):{unavailable:"contacts.read permission required"},pipeline=can(context.membership.role,"deals.read")?await handlers["crm.pipeline.summary"]({}):{unavailable:"deals.read permission required"};return {company,prospects,pipeline,limitations:["Finance, support, email and tasks are not connected unless explicitly shown elsewhere."],source:"Company Profile + CRM"}},
  };
  const tools:Record<string,any>={};
  for(const definition of novaToolRegistry){
    if(!can(context.membership.role,definition.requiredPermission))continue;
    tools[definition.key]=tool({description:`${definition.description} Tool id: ${definition.id}. READ-ONLY.`,inputSchema:definition.inputSchema,execute:async(input)=>{const started=Date.now();let success=false;try{const result=await handlers[definition.id](input);success=true;return {...result,_nova:{toolId:definition.id,name:definition.name,mode:definition.mode,riskLevel:definition.riskLevel}}}finally{await writeAudit(request,context,"nova.tool.executed","nova_tool",definition.id,{toolId:definition.id,success,latencyMs:Date.now()-started}).catch(()=>undefined)}}});
  }
  return tools;
}

export async function runRelevantNovaTools(request:Request,context:AuthContext,question:string){
  const tools=createNovaTools(request,context),q=question.toLowerCase();const calls:{key:string;input:Record<string,unknown>}[]=[];
  if(/what do you know|know about my company|connais.*entreprise|company profile|business profile/.test(q))calls.push({key:"company_getProfile",input:{}});
  if(/how many (prospects|contacts|customers|leads)|combien de (prospects|contacts|clients)/.test(q))calls.push({key:"crm_contacts_summary",input:{}});
  if(/pipeline|sales metrics|chiffre.*opportunit/.test(q))calls.push({key:"crm_pipeline_summary",input:{}});
  if(/which opportunities|opportunit.*focus|focus.*opportunit|priorit.*deal/.test(q))calls.push({key:"crm_deals_list",input:{limit:20}});
  const search=question.match(/(?:find|search|trouve|cherche)\s+([\p{L}][\p{L}\s'-]{1,80}?)(?:\s+(?:in|dans)\s+(?:my|mon|le)|[.!?]|$)/iu);if(search&&!/every organization|all contacts|toutes? les organisations/i.test(question))calls.push({key:"crm_contacts_search",input:{query:search[1].trim(),limit:10}});
  if(/what should i focus|business brief|brief.*business|résum.*entreprise|summarize my business/.test(q))calls.push({key:"business_getBrief",input:{}});
  if(/workspace|enabled modules|active modules/.test(q))calls.push({key:"workspace_getContext",input:{}});
  const unique=[...new Map(calls.map(call=>[call.key,call])).values()],results=[];
  for(const call of unique){const selected=tools[call.key];if(!selected?.execute)continue;const output=await selected.execute(call.input,{toolCallId:crypto.randomUUID(),messages:[],abortSignal:request.signal});results.push({tool:call.key,name:novaToolRegistry.find(item=>item.key===call.key)?.name,output})}
  return results;
}
