import { desc, eq, sql } from "drizzle-orm";
import { deals } from "@/lib/db/schema";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { dealInputSchema } from "@/lib/db/validation";
import { apiError, databaseUnavailable } from "@/lib/db/http";
import { requireContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/auth/audit";
import { emitBusinessEvent } from "@/lib/nova/automation-engine";

export const dynamic = "force-dynamic";

export async function GET(request:Request) {
  if (!isDatabaseConfigured()) return databaseUnavailable();
  const auth=await requireContext(request,"deals.read"); if(auth.response)return auth.response; const context=auth.context!;
  const db=getDb();
  const [data,kpiRows]=await Promise.all([
    db.select().from(deals).where(eq(deals.organizationId,context.organization.id)).orderBy(desc(deals.updatedAt)),
    db.select({total:sql<string>`coalesce(sum(${deals.value}),0)`,won:sql<string>`coalesce(sum(${deals.value}) filter (where ${deals.stage}='won'),0)`,wonCount:sql<number>`count(*) filter (where ${deals.stage}='won')`,closedCount:sql<number>`count(*) filter (where ${deals.stage} in ('won','lost'))`,count:sql<number>`count(*)`}).from(deals).where(eq(deals.organizationId,context.organization.id)),
  ]);
  const k=kpiRows[0]; const count=Number(k.count); const closed=Number(k.closedCount);
  return Response.json({data,kpis:{pipelineValue:Number(k.total),wonRevenue:Number(k.won),conversionRate:closed?Number(k.wonCount)/closed*100:0,averageDealValue:count?Number(k.total)/count:0}});
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailable();
  const auth=await requireContext(request,"deals.create"); if(auth.response)return auth.response; const context=auth.context!;
  try { const input=dealInputSchema.parse(await request.json()); const [data]=await getDb().insert(deals).values({...input,value:String(input.value),organizationId:context.organization.id}).returning(); await writeAudit(request,context,"deal.created","deal",data.id,{stage:data.stage}); await emitBusinessEvent(context,"deal.created","deal",data.id,data as unknown as Record<string,unknown>,`deal.created:${data.id}:${data.updatedAt?.toISOString()}`); return Response.json({data},{status:201}); } catch(error){return apiError(error)}
}
