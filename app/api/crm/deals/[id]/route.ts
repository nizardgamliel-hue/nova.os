import { and, eq } from "drizzle-orm";
import { deals } from "@/lib/db/schema";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { dealPatchSchema, uuidSchema } from "@/lib/db/validation";
import { apiError, databaseUnavailable } from "@/lib/db/http";
import { requireContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/auth/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return databaseUnavailable();
  const auth=await requireContext(_request,"deals.read"); if(auth.response)return auth.response;
  try { const id=uuidSchema.parse((await params).id); const [data]=await getDb().select().from(deals).where(and(eq(deals.id,id),eq(deals.organizationId,auth.context!.organization.id))).limit(1); return data?Response.json({data}):Response.json({error:"NOT_FOUND"},{status:404}); } catch(error){return apiError(error)}
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return databaseUnavailable();
  const auth=await requireContext(request,"deals.update"); if(auth.response)return auth.response; const context=auth.context!;
  try { const id=uuidSchema.parse((await params).id); const input=dealPatchSchema.parse(await request.json()); const [before]=await getDb().select({stage:deals.stage}).from(deals).where(and(eq(deals.id,id),eq(deals.organizationId,context.organization.id))).limit(1); if(!before)return Response.json({error:"NOT_FOUND"},{status:404}); const {value,...rest}=input; const values={...rest,...(value===undefined?{}:{value:String(value)}),updatedAt:new Date()}; const [data]=await getDb().update(deals).set(values).where(and(eq(deals.id,id),eq(deals.organizationId,context.organization.id))).returning(); const stageChanged=input.stage&&input.stage!==before.stage; await writeAudit(request,context,stageChanged?"deal.stage_changed":"deal.updated","deal",data.id,{fields:Object.keys(input),from:before.stage,to:data.stage}); return Response.json({data}); } catch(error){return apiError(error)}
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return databaseUnavailable();
  const auth=await requireContext(_request,"deals.delete"); if(auth.response)return auth.response; const context=auth.context!;
  try { const id=uuidSchema.parse((await params).id); const [data]=await getDb().delete(deals).where(and(eq(deals.id,id),eq(deals.organizationId,context.organization.id))).returning({id:deals.id}); if(data)await writeAudit(_request,context,"deal.deleted","deal",data.id); return data?Response.json({data}):Response.json({error:"NOT_FOUND"},{status:404}); } catch(error){return apiError(error)}
}
