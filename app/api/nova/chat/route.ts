import { and, count, eq, gt } from "drizzle-orm";
import { createAgentUIStreamResponse, isStepCount, ToolLoopAgent, type UIMessage } from "ai";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/auth/audit";
import { getDb } from "@/lib/db";
import { novaAiUsage, novaConversations } from "@/lib/db/schema";
import { buildNovaContext } from "@/lib/nova/context-engine";
import { conversationTitle, getConversation, loadMessages, saveMessage, textFromMessage } from "@/lib/nova/conversations";
import { getNovaModel, isNovaProviderConfigured } from "@/lib/nova/ai-provider";
import { buildNovaInstructions } from "@/lib/nova/system-instructions";
import { runRelevantNovaTools } from "@/lib/nova/tool-registry";

export const maxDuration = 60;
const schema=z.object({conversationId:z.string().uuid(),messages:z.array(z.custom<UIMessage>()).min(1).max(24)});

export async function POST(request:Request){
  const access=await requireContext(request);if(access.response)return access.response;const context=access.context!;
  const origin=request.headers.get("origin"),host=request.headers.get("host");if(origin&&host&&new URL(origin).host!==host)return Response.json({error:"FORBIDDEN_ORIGIN"},{status:403});
  const length=Number(request.headers.get("content-length")||0);if(length>64_000)return Response.json({error:"PAYLOAD_TOO_LARGE"},{status:413});
  if(!isNovaProviderConfigured())return Response.json({error:"AI_PROVIDER_NOT_CONFIGURED"},{status:503});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"INVALID_REQUEST"},{status:400});
  const conversation=await getConversation(context,parsed.data.conversationId);if(!conversation)return Response.json({error:"NOT_FOUND"},{status:404});
  const incoming=parsed.data.messages.at(-1)!;if(incoming.role!=="user")return Response.json({error:"USER_MESSAGE_REQUIRED"},{status:400});const userText=textFromMessage(incoming);if(!userText||userText.length>12_000)return Response.json({error:"MESSAGE_INVALID"},{status:400});
  const since=new Date(Date.now()-60_000);const [{value:recentRequests}]=await getDb().select({value:count()}).from(novaAiUsage).where(and(eq(novaAiUsage.organizationId,context.organization.id),eq(novaAiUsage.userId,context.user.id),gt(novaAiUsage.createdAt,since)));if(Number(recentRequests)>=20)return Response.json({error:"RATE_LIMITED"},{status:429});
  await saveMessage(conversation.id,incoming);if(conversation.title==="New conversation")await getDb().update(novaConversations).set({title:conversationTitle(userText),updatedAt:new Date()}).where(eq(novaConversations.id,conversation.id));
  await writeAudit(request,context,"nova.message.sent","nova_conversation",conversation.id,{messageId:incoming.id,contentLength:userText.length});
  const model=getNovaModel(userText.length>500||/analyse|analy[sz]e|priorit|focus|brief/i.test(userText)?"REASONING":"FAST"),started=Date.now();
  const [usageRow]=await getDb().insert(novaAiUsage).values({organizationId:context.organization.id,userId:context.user.id,conversationId:conversation.id,provider:model.provider,model:model.model}).returning({id:novaAiUsage.id});
  const companyContext=await buildNovaContext(context),retrieval=await runRelevantNovaTools(request,context,userText);
  const agent=new ToolLoopAgent({
    model:model.model,
    instructions:buildNovaInstructions(`${companyContext.prompt}\nVERIFIED READ-ONLY TOOL RESULTS FOR THIS QUESTION:\n${retrieval.length?JSON.stringify(retrieval):"No business tool was relevant or permitted. Do not invent missing data."}`),
    tools:{},
    stopWhen:isStepCount(6),temperature:model.temperature,maxOutputTokens:model.maxOutputTokens,maxRetries:1,
    providerOptions:{gateway:{user:context.user.id,tags:["feature:nova-core",`organization:${context.organization.id}`]}},
    onEnd:async({usage})=>{await getDb().update(novaAiUsage).set({inputTokens:usage.inputTokens,outputTokens:usage.outputTokens,totalTokens:usage.totalTokens,latencyMs:Date.now()-started}).where(eq(novaAiUsage.id,usageRow.id))},
  });
  const previous=(await loadMessages(conversation.id)).slice(-16);
  return createAgentUIStreamResponse({agent:agent as any,uiMessages:previous as any,timeout:{totalMs:55_000},originalMessages:previous as any,sendReasoning:false,sendSources:false,onError:(error)=>{console.error("NOVA_AI_ERROR",error instanceof Error?error.message:"unknown");return "Nova is temporarily unavailable. Please try again."},onEnd:async({responseMessage,isAborted})=>{if(!isAborted)await saveMessage(conversation.id,responseMessage as UIMessage)}});
}
