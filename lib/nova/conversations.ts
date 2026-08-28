import { and, asc, desc, eq, isNull } from "drizzle-orm";
import type { UIMessage } from "ai";
import { getDb } from "@/lib/db";
import { novaConversations, novaMessages } from "@/lib/db/schema";
import type { AuthContext } from "@/lib/auth/context";

export function conversationTitle(text:string){const cleaned=text.replace(/\s+/g," ").replace(/^ask nova\s*:\s*/i,"").trim();return cleaned.length>56?`${cleaned.slice(0,53).trim()}…`:cleaned||"New conversation"}

export async function listConversations(context:AuthContext){return getDb().select().from(novaConversations).where(and(eq(novaConversations.organizationId,context.organization.id),eq(novaConversations.userId,context.user.id),isNull(novaConversations.archivedAt))).orderBy(desc(novaConversations.updatedAt)).limit(50)}
export async function getConversation(context:AuthContext,id:string){return (await getDb().select().from(novaConversations).where(and(eq(novaConversations.id,id),eq(novaConversations.organizationId,context.organization.id),eq(novaConversations.userId,context.user.id))).limit(1))[0]}
export async function createConversation(context:AuthContext,title="New conversation"){return (await getDb().insert(novaConversations).values({organizationId:context.organization.id,userId:context.user.id,title}).returning())[0]}
export async function loadMessages(conversationId:string){const rows=await getDb().select().from(novaMessages).where(eq(novaMessages.conversationId,conversationId)).orderBy(asc(novaMessages.createdAt)).limit(100);return rows.map(row=>({id:row.externalId,role:row.role==="tool"?"assistant":row.role,parts:Array.isArray((row.metadata as any)?.parts)?(row.metadata as any).parts:[{type:"text",text:row.content}]} as UIMessage))}
export function textFromMessage(message:UIMessage){return message.parts.filter((part):part is Extract<typeof part,{type:"text"}>=>part.type==="text").map(part=>part.text).join("\n").trim()}
export async function saveMessage(conversationId:string,message:UIMessage){const text=textFromMessage(message);await getDb().insert(novaMessages).values({conversationId,externalId:message.id,role:message.role==="system"?"assistant":message.role,content:text,metadata:{parts:message.parts}}).onConflictDoNothing();await getDb().update(novaConversations).set({updatedAt:new Date()}).where(eq(novaConversations.id,conversationId))}
