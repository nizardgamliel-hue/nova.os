import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { contacts, deals, novaActions, automationStepRuns, automationRuns } from "@/lib/db/schema";
import { contactInputSchema, contactPatchSchema, dealInputSchema, dealPatchSchema } from "@/lib/db/validation";
import { can, type Permission } from "@/lib/auth/permissions";
import type { AuthContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/auth/audit";

export const actionDefinitions = {
  "crm.contact.create": { permission:"contacts.create" as Permission, risk:"MEDIUM" as const, policy:"REQUIRED" as const, schema:contactInputSchema },
  "crm.contact.update": { permission:"contacts.update" as Permission, risk:"MEDIUM" as const, policy:"REQUIRED" as const, schema:contactPatchSchema.extend({id:z.string().uuid()}) },
  "crm.deal.create": { permission:"deals.create" as Permission, risk:"MEDIUM" as const, policy:"REQUIRED" as const, schema:dealInputSchema },
  "crm.deal.update": { permission:"deals.update" as Permission, risk:"MEDIUM" as const, policy:"REQUIRED" as const, schema:dealPatchSchema.extend({id:z.string().uuid()}) },
  "crm.contact.delete": { permission:"contacts.delete" as Permission, risk:"HIGH" as const, policy:"FORBIDDEN" as const, schema:z.object({id:z.string().uuid()}) },
  "crm.deal.delete": { permission:"deals.delete" as Permission, risk:"HIGH" as const, policy:"FORBIDDEN" as const, schema:z.object({id:z.string().uuid()}) },
} as const;
export type ActionType = keyof typeof actionDefinitions;

export async function requestAction(ctx:AuthContext, type:ActionType, raw:unknown, conversationId?:string, request?:Request){
  const def=actionDefinitions[type]; if(!def) throw new Error("UNKNOWN_ACTION");
  if(!can(ctx.membership.role,def.permission)) throw new Error("FORBIDDEN");
  if(def.policy==="FORBIDDEN") throw new Error("ACTION_FORBIDDEN");
  const input=def.schema.parse(raw) as Record<string,unknown>;
  const [action]=await getDb().insert(novaActions).values({organizationId:ctx.organization.id,userId:ctx.user.id,conversationId,actionType:type,toolId:type,status:"PENDING_APPROVAL",riskLevel:def.risk,approvalPolicy:def.policy,input,expiresAt:new Date(Date.now()+30*60*1000)}).returning();
  if(request) await writeAudit(request,ctx,"nova.action.requested","nova_action",action.id,{toolId:type,risk:def.risk});
  return action;
}

export async function approveAction(ctx:AuthContext, id:string, request:Request){
  const db=getDb(); const [a]=await db.select().from(novaActions).where(and(eq(novaActions.id,id),eq(novaActions.organizationId,ctx.organization.id),eq(novaActions.userId,ctx.user.id))).limit(1);
  if(!a) throw new Error("NOT_FOUND"); if(a.status==="SUCCEEDED") return a; if(a.status!=="PENDING_APPROVAL") throw new Error("NOT_APPROVABLE"); if(a.expiresAt<=new Date()) { await db.update(novaActions).set({status:"EXPIRED",cancelledAt:new Date()}).where(eq(novaActions.id,a.id)); throw new Error("EXPIRED"); }
  const type=a.actionType as ActionType; const def=actionDefinitions[type]; if(!def||!can(ctx.membership.role,def.permission)||def.policy==="FORBIDDEN") throw new Error("FORBIDDEN");
  const [claimed]=await db.update(novaActions).set({status:"EXECUTING",approvedAt:new Date()}).where(and(eq(novaActions.id,a.id),eq(novaActions.status,"PENDING_APPROVAL"))).returning(); if(!claimed) throw new Error("ALREADY_PROCESSED");
  await writeAudit(request,ctx,"nova.action.approved","nova_action",a.id,{toolId:type});
  try { let result:unknown;
    if(type==="crm.contact.create") { const input=contactInputSchema.parse(a.input); const [row]=await db.insert(contacts).values({...input,organizationId:ctx.organization.id}).returning(); result=row; }
    else if(type==="crm.contact.update") { const {id,...patch}=contactPatchSchema.extend({id:z.string().uuid()}).parse(a.input); const [row]=await db.update(contacts).set({...patch,updatedAt:new Date()}).where(and(eq(contacts.id,id),eq(contacts.organizationId,ctx.organization.id))).returning(); if(!row) throw new Error("NOT_FOUND"); result=row; }
    else if(type==="crm.deal.create") { const input=dealInputSchema.parse(a.input); const {organizationId:_,value,...rest}=input; const [row]=await db.insert(deals).values({...rest,value:String(value),organizationId:ctx.organization.id}).returning(); result=row; }
    else if(type==="crm.deal.update") { const {id,...rawPatch}=dealPatchSchema.extend({id:z.string().uuid()}).parse(a.input); const {organizationId:_,value,...patch}=rawPatch; const [row]=await db.update(deals).set({...patch,...(value===undefined?{}:{value:String(value)}),updatedAt:new Date()}).where(and(eq(deals.id,id),eq(deals.organizationId,ctx.organization.id))).returning(); if(!row) throw new Error("NOT_FOUND"); result=row; }
    else throw new Error("UNSUPPORTED_ACTION");
    const [done]=await db.update(novaActions).set({status:"SUCCEEDED",result,executedAt:new Date()}).where(and(eq(novaActions.id,a.id),eq(novaActions.status,"EXECUTING"))).returning(); const [linked]=await db.update(automationStepRuns).set({status:"SUCCEEDED",output:result,completedAt:new Date()}).where(eq(automationStepRuns.actionId,a.id)).returning({runId:automationStepRuns.automationRunId}); if(linked) await db.update(automationRuns).set({status:"SUCCEEDED",completedAt:new Date()}).where(and(eq(automationRuns.id,linked.runId),eq(automationRuns.status,"QUEUED"))); await writeAudit(request,ctx,"nova.action.executed","nova_action",a.id,{toolId:type,resourceId:(result as {id?:string})?.id}); return done;
  } catch(e){ await db.update(novaActions).set({status:"FAILED",error:e instanceof Error?e.message:"Execution failed",executedAt:new Date()}).where(eq(novaActions.id,a.id)); await writeAudit(request,ctx,"nova.action.failed","nova_action",a.id,{toolId:type}); throw e; }
}

export async function cancelAction(ctx:AuthContext,id:string,request:Request){ const db=getDb(); const [a]=await db.update(novaActions).set({status:"CANCELLED",cancelledAt:new Date()}).where(and(eq(novaActions.id,id),eq(novaActions.organizationId,ctx.organization.id),eq(novaActions.userId,ctx.user.id),eq(novaActions.status,"PENDING_APPROVAL"))).returning(); if(!a) throw new Error("NOT_FOUND"); const [linked]=await db.update(automationStepRuns).set({status:"FAILED",error:"Action cancelled",completedAt:new Date()}).where(eq(automationStepRuns.actionId,id)).returning({runId:automationStepRuns.automationRunId}); if(linked) await db.update(automationRuns).set({status:"CANCELLED",completedAt:new Date()}).where(and(eq(automationRuns.id,linked.runId),eq(automationRuns.status,"QUEUED"))); await writeAudit(request,ctx,"nova.action.cancelled","nova_action",id); return a; }
