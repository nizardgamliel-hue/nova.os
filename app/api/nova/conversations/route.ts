import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/auth/audit";
import { createConversation, listConversations } from "@/lib/nova/conversations";

export async function GET(request:Request){const access=await requireContext(request);if(access.response)return access.response;return Response.json({data:await listConversations(access.context!)})}
export async function POST(request:Request){const access=await requireContext(request);if(access.response)return access.response;const parsed=z.object({title:z.string().trim().max(100).optional()}).safeParse(await request.json().catch(()=>({})));if(!parsed.success)return Response.json({error:"INVALID_REQUEST"},{status:400});const conversation=await createConversation(access.context!,parsed.data.title);await writeAudit(request,access.context!,"nova.conversation.created","nova_conversation",conversation.id);return Response.json({data:conversation},{status:201})}
