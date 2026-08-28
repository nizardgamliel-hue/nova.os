import { desc, eq } from "drizzle-orm";
import { requireContext } from "@/lib/auth/context";
import { getDb } from "@/lib/db";
import { novaActions } from "@/lib/db/schema";
import { requestAction, actionDefinitions } from "@/lib/nova/action-engine";
export async function GET(request:Request){const auth=await requireContext(request);if(auth.response)return auth.response;const rows=await getDb().select().from(novaActions).where(eq(novaActions.organizationId,auth.context!.organization.id)).orderBy(desc(novaActions.requestedAt));return Response.json({data:rows});}
export async function POST(request:Request){const auth=await requireContext(request);if(auth.response)return auth.response;try{const body=await request.json();const type=body.actionType as keyof typeof actionDefinitions;const action=await requestAction(auth.context!,type,body.input,body.conversationId,request);return Response.json({data:action},{status:201});}catch(e){const message=e instanceof Error?e.message:"INVALID_ACTION";const status=message==="FORBIDDEN"||message==="ACTION_FORBIDDEN"?403:400;return Response.json({error:message},{status});}}
