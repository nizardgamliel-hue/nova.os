import { timingSafeEqual } from "node:crypto";
import { runAllRules } from "@/lib/crm/service";
import { crmError } from "@/lib/crm/http";
export const runtime="nodejs";
export const maxDuration=60;
export async function POST(request:Request){const secret=process.env.CRON_SECRET;if(!secret)return Response.json({error:"CRON_NOT_CONFIGURED"},{status:503});const a=Buffer.from(request.headers.get("authorization")||""),b=Buffer.from(`Bearer ${secret}`);if(a.length!==b.length||!timingSafeEqual(a,b))return Response.json({error:"UNAUTHORIZED"},{status:401});try{return Response.json({data:await runAllRules()});}catch(e){return crmError(e);}}
