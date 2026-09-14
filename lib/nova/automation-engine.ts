import { and, asc, eq, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { automations, automationRuns, automationStepRuns, businessEvents, novaActions } from "@/lib/db/schema";
import type { AuthContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/auth/audit";
import { approveAction } from "@/lib/nova/action-engine";

export const eventTypes=["contact.created","contact.updated","deal.created","deal.updated","deal.stage_changed","action.succeeded"] as const;
export type NovaEventType=string;
export const triggerRegistry=eventTypes.map(id=>({id,name:id.replaceAll("."," "),eventType:id,description:`Trigger on ${id}`,status:"WORKING"}));
const getPath=(obj:unknown,path:string)=>path.split(".").reduce((v,k)=>v&&typeof v==="object"?(v as Record<string,unknown>)[k]:undefined,obj);
export function evaluateCondition(value:unknown,operator:string,target:unknown){switch(operator){case"equals":return value===target;case"notEquals":return value!==target;case"contains":return typeof value==="string"&&value.includes(String(target));case"notContains":return typeof value==="string"&&!value.includes(String(target));case"greaterThan":return Number(value)>Number(target);case"greaterThanOrEqual":return Number(value)>=Number(target);case"lessThan":return Number(value)<Number(target);case"lessThanOrEqual":return Number(value)<=Number(target);case"exists":return value!==undefined&&value!==null&&value!=="";case"notExists":return value===undefined||value===null||value==="";case"in":return Array.isArray(target)&&target.includes(value);case"notIn":return Array.isArray(target)&&!target.includes(value);default:return false;}}
export function evaluateConditions(conditions:unknown,payload:unknown){const config=conditions as {mode?:string;items?:Array<{path:string;operator:string;value:unknown}>};const items=Array.isArray(config?.items)?config.items:[];const results=items.map(c=>evaluateCondition(getPath(payload,c.path),c.operator,c.value));return config?.mode==="ANY"?results.some(Boolean):results.every(Boolean);}
const actionStep=z.object({id:z.string().min(1),type:z.enum(["create_contact","update_contact","create_deal","internal_notification","emit_event"]),input:z.record(z.string(),z.unknown()).default({})});
export const automationSchema=z.object({name:z.string().trim().min(1).max(160),description:z.string().max(2000).optional().nullable(),triggerType:z.string().trim().min(1).max(120),triggerConfig:z.record(z.string(),z.unknown()).default({}),conditions:z.object({mode:z.enum(["ALL","ANY"]).default("ALL"),items:z.array(z.object({path:z.string().regex(/^(contact|deal)\.[a-zA-Z0-9_]+$/),operator:z.string(),value:z.unknown()})).default([])}).default({mode:"ALL",items:[]}),steps:z.array(actionStep).min(1).max(20),executionPolicy:z.enum(["SAFE_INTERNAL","REQUIRES_APPROVAL"]).default("SAFE_INTERNAL")});

export const MAX_AUTOMATION_DEPTH=8;
export const EVENT_CLAIM_TIMEOUT_MS=5*60*1000;
export const MAX_EVENT_ATTEMPTS=3;
export type BusinessEvent=typeof businessEvents.$inferSelect;
export const canPropagateChildEvent=(parentDepth:number)=>parentDepth+1<=MAX_AUTOMATION_DEPTH;
export const childEventIdempotencyKey=(eventId:string,automationId:string,stepId:string,type:string)=>`${eventId}:${automationId}:${stepId}:${type}`;
export const childEventLineage=(event:Pick<BusinessEvent,"id"|"rootExecutionId"|"depth">)=>({rootExecutionId:event.rootExecutionId,parentEventId:event.id,depth:event.depth+1});

export async function persistBusinessEvent(ctx:AuthContext,type:NovaEventType,resourceType:string,resourceId:string,payload:Record<string,unknown>,idempotencyKey:string,lineage?:{rootExecutionId:string;parentEventId?:string;depth?:number},source="system"){
  const db=getDb();
  const [created]=await db.insert(businessEvents).values({organizationId:ctx.organization.id,type,source,resourceType,resourceId,actorUserId:ctx.user.id,payload,idempotencyKey,rootExecutionId:lineage?.rootExecutionId,parentEventId:lineage?.parentEventId,depth:lineage?.depth??0}).onConflictDoNothing({target:[businessEvents.organizationId,businessEvents.idempotencyKey]}).returning();
  if(created)return {event:created,created:true};
  const [existing]=await db.select().from(businessEvents).where(and(eq(businessEvents.organizationId,ctx.organization.id),eq(businessEvents.idempotencyKey,idempotencyKey))).limit(1);
  if(!existing)throw new Error("EVENT_IDEMPOTENCY_COLLISION_NOT_VISIBLE");
  return {event:existing,created:false};
}

export async function claimBusinessEvent(organizationId:string,eventId:string,workerId:string,now=new Date()){
  const staleBefore=new Date(now.getTime()-EVENT_CLAIM_TIMEOUT_MS);
  const [claimed]=await getDb().update(businessEvents).set({status:"PROCESSING",claimedBy:workerId,processingStartedAt:now,attemptCount:sql`${businessEvents.attemptCount} + 1`}).where(and(
    eq(businessEvents.id,eventId),eq(businessEvents.organizationId,organizationId),lte(businessEvents.availableAt,now),lte(businessEvents.attemptCount,MAX_EVENT_ATTEMPTS-1),
    or(eq(businessEvents.status,"PENDING"),eq(businessEvents.status,"FAILED"),and(eq(businessEvents.status,"PROCESSING"),lte(businessEvents.processingStartedAt,staleBefore)))
  )).returning();
  return claimed;
}

export async function processBusinessEvent(ctx:AuthContext,eventId:string,workerId=crypto.randomUUID()){
  const event=await claimBusinessEvent(ctx.organization.id,eventId,workerId);
  if(!event)return {claimed:false as const};
  try{
    const runs=await runAutomationForEvent(ctx,event);
    await getDb().update(businessEvents).set({status:"COMPLETED",processedAt:new Date(),lastError:null}).where(and(eq(businessEvents.id,event.id),eq(businessEvents.organizationId,ctx.organization.id),eq(businessEvents.claimedBy,workerId)));
    await writeAudit(new Request("https://nova.internal"),ctx,"business_event.completed","business_event",event.id,{type:event.type,attempt:event.attemptCount});
    return {claimed:true as const,event,runs};
  }catch(error){
    const message=error instanceof Error?error.message:"Event processing failed";const retryable=event.attemptCount<MAX_EVENT_ATTEMPTS;
    await getDb().update(businessEvents).set({status:"FAILED",lastError:message,processedAt:retryable?null:new Date(),availableAt:new Date(Date.now()+(retryable?1000*event.attemptCount:0))}).where(and(eq(businessEvents.id,event.id),eq(businessEvents.organizationId,ctx.organization.id),eq(businessEvents.claimedBy,workerId)));
    await writeAudit(new Request("https://nova.internal"),ctx,"business_event.failed","business_event",event.id,{type:event.type,attempt:event.attemptCount,retryable,error:message});throw error;
  }
}

export async function processNextBusinessEvent(ctx:AuthContext,workerId:string){
  const candidates=await getDb().select({id:businessEvents.id}).from(businessEvents).where(and(eq(businessEvents.organizationId,ctx.organization.id),or(eq(businessEvents.status,"PENDING"),eq(businessEvents.status,"FAILED"),eq(businessEvents.status,"PROCESSING")))).orderBy(asc(businessEvents.occurredAt)).limit(10);
  for(const candidate of candidates){const result=await processBusinessEvent(ctx,candidate.id,workerId);if(result.claimed)return result;}
  return {claimed:false as const};
}

export async function emitBusinessEvent(ctx:AuthContext,type:NovaEventType,resourceType:string,resourceId:string,payload:Record<string,unknown>,idempotencyKey:string,lineage?:{rootExecutionId:string;parentEventId?:string;depth?:number},source="system"){
  const persisted=await persistBusinessEvent(ctx,type,resourceType,resourceId,payload,idempotencyKey,lineage,source);
  if(persisted.created)await processBusinessEvent(ctx,persisted.event.id);
  return persisted.event;
}
export const emitNovaEvent=emitBusinessEvent;

function resolveTemplates(input:unknown,context:unknown):unknown{if(typeof input==="string"){return input.replace(/\{\{([^}]+)\}\}/g,(_,p:string)=>{const path=p.trim();if(path.split(".").some(part=>["__proto__","prototype","constructor"].includes(part)))throw new Error("INVALID_TEMPLATE_PATH");const value=getPath(context,path);if(value===undefined||value===null)throw new Error(`MISSING_TEMPLATE:${path}`);return String(value);});}if(Array.isArray(input))return input.map(v=>resolveTemplates(v,context));if(input&&typeof input==="object")return Object.fromEntries(Object.entries(input).map(([k,v])=>[k,resolveTemplates(v,context)]));return input;}

export async function runAutomationForEvent(ctx:AuthContext,event:BusinessEvent){
  const db=getDb();const list=await db.select().from(automations).where(and(eq(automations.organizationId,ctx.organization.id),eq(automations.status,"ACTIVE"),eq(automations.triggerType,event.type)));const results=[];
  for(const automation of list){
    const scoped:Record<string,unknown>={contact:event.payload,deal:event.payload,event:event.payload,steps:{}};
    if(!evaluateConditions(automation.conditions,scoped)){const [run]=await db.insert(automationRuns).values({organizationId:ctx.organization.id,automationId:automation.id,triggerEventId:event.id,status:"SKIPPED",input:event.payload,startedAt:new Date(),completedAt:new Date()}).returning();results.push(run);continue;}
    const started=Date.now();const [run]=await db.insert(automationRuns).values({organizationId:ctx.organization.id,automationId:automation.id,triggerEventId:event.id,status:"RUNNING",input:event.payload,startedAt:new Date()}).returning();let failed=false;const outputs:unknown[]=[];
    for(const rawStep of automation.steps as unknown[]){const step=actionStep.parse(rawStep);const ss=Date.now();try{const input=resolveTemplates(step.input||{},scoped) as Record<string,unknown>;
      if(step.type==="emit_event"){
        const nextDepth=event.depth+1;
        if(!canPropagateChildEvent(event.depth)){const output={emitted:false,reason:"MAX_AUTOMATION_DEPTH_REACHED",nextDepth};await db.update(businessEvents).set({stopReason:"MAX_AUTOMATION_DEPTH_REACHED"}).where(and(eq(businessEvents.id,event.id),eq(businessEvents.organizationId,ctx.organization.id)));await db.insert(automationStepRuns).values({organizationId:ctx.organization.id,automationRunId:run.id,stepId:step.id,status:"SUCCEEDED",input,output,startedAt:new Date(ss),completedAt:new Date(),durationMs:Date.now()-ss});await writeAudit(new Request("https://nova.internal"),ctx,"automation.event.depth_blocked","business_event",event.id,{automationId:automation.id,stepId:step.id,nextDepth,maxDepth:MAX_AUTOMATION_DEPTH});(scoped.steps as Record<string,unknown>)[step.id]={output};outputs.push(output);continue;}
        const type=z.string().min(1).parse(input.type);const payload=z.record(z.string(),z.unknown()).parse(input.payload??{});const resourceType=String(input.resourceType??type.split(".")[0]??"event");const resourceId=String(input.resourceId??event.resourceId);const child=await emitBusinessEvent(ctx,type,resourceType,resourceId,payload,childEventIdempotencyKey(event.id,automation.id,step.id,type),childEventLineage(event),"automation");const output={emitted:true,eventId:child.id,type:child.type,depth:child.depth};await db.insert(automationStepRuns).values({organizationId:ctx.organization.id,automationRunId:run.id,stepId:step.id,status:"SUCCEEDED",input,output,startedAt:new Date(ss),completedAt:new Date(),durationMs:Date.now()-ss});(scoped.steps as Record<string,unknown>)[step.id]={output};outputs.push(output);continue;
      }
      const map:Record<string,string>={create_contact:"crm.contact.create",update_contact:"crm.contact.update",create_deal:"crm.deal.create",update_deal:"crm.deal.update"};if(!map[step.type])throw new Error("UNSUPPORTED_AUTOMATION_STEP");const actionKey=`${event.id}:${automation.id}:${step.id}`;const [createdAction]=await db.insert(novaActions).values({organizationId:ctx.organization.id,userId:ctx.user.id,actionType:map[step.type],toolId:map[step.type],idempotencyKey:actionKey,status:"PENDING_APPROVAL",riskLevel:"MEDIUM",approvalPolicy:"REQUIRED",input,expiresAt:new Date(Date.now()+1800000)}).onConflictDoNothing({target:[novaActions.organizationId,novaActions.idempotencyKey]}).returning();const [existingAction]=createdAction?[createdAction]:await db.select().from(novaActions).where(and(eq(novaActions.organizationId,ctx.organization.id),eq(novaActions.idempotencyKey,actionKey))).limit(1);const action=createdAction??existingAction;if(!action)throw new Error("ACTION_IDEMPOTENCY_COLLISION_NOT_VISIBLE");if(automation.executionPolicy==="REQUIRES_APPROVAL"){await db.insert(automationStepRuns).values({organizationId:ctx.organization.id,automationRunId:run.id,actionId:action.id,stepId:step.id,status:"QUEUED",input,startedAt:new Date(ss)});outputs.push({stepId:step.id,status:"PENDING_APPROVAL",actionId:action.id});continue;}const done=await approveAction(ctx,action.id,new Request("https://nova.internal"));await db.insert(automationStepRuns).values({organizationId:ctx.organization.id,automationRunId:run.id,actionId:action.id,stepId:step.id,status:"SUCCEEDED",input,output:done?.result,startedAt:new Date(ss),completedAt:new Date(),durationMs:Date.now()-ss});(scoped.steps as Record<string,unknown>)[step.id]={output:done?.result};outputs.push(done?.result);
    }catch(error){failed=true;await db.insert(automationStepRuns).values({organizationId:ctx.organization.id,automationRunId:run.id,stepId:step.id,status:"FAILED",input:step.input,error:error instanceof Error?error.message:"step failed",startedAt:new Date(ss),completedAt:new Date(),durationMs:Date.now()-ss});break;}}
    const pending=outputs.some(x=>typeof x==="object"&&x!==null&&"status" in x&&(x as {status:string}).status==="PENDING_APPROVAL");const [done]=await db.update(automationRuns).set({status:failed?"FAILED":pending?"QUEUED":"SUCCEEDED",completedAt:pending?undefined:new Date(),durationMs:Date.now()-started,output:outputs,error:failed?"Step failed":null}).where(and(eq(automationRuns.id,run.id),eq(automationRuns.organizationId,ctx.organization.id))).returning();results.push(done);await writeAudit(new Request("https://nova.internal"),ctx,failed?"automation.run.failed":"automation.run.completed","automation_run",run.id,{automationId:automation.id});
  }
  return results;
}
