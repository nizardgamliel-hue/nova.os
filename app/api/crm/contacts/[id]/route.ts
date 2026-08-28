import { and, eq } from "drizzle-orm";
import { contacts } from "@/lib/db/schema";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { contactPatchSchema, uuidSchema } from "@/lib/db/validation";
import { apiError, databaseUnavailable } from "@/lib/db/http";
import { requireContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/auth/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return databaseUnavailable();
  const auth=await requireContext(_request,"contacts.read"); if(auth.response)return auth.response;
  try { const id=uuidSchema.parse((await params).id); const [data]=await getDb().select().from(contacts).where(and(eq(contacts.id,id),eq(contacts.organizationId,auth.context!.organization.id))).limit(1); return data?Response.json({data}):Response.json({error:"NOT_FOUND"},{status:404}); } catch(error){return apiError(error)}
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return databaseUnavailable();
  const auth=await requireContext(request,"contacts.update"); if(auth.response)return auth.response; const context=auth.context!;
  try { const id=uuidSchema.parse((await params).id); const input=contactPatchSchema.parse(await request.json()); const [data]=await getDb().update(contacts).set({...input,updatedAt:new Date()}).where(and(eq(contacts.id,id),eq(contacts.organizationId,context.organization.id))).returning(); if(data)await writeAudit(request,context,"contact.updated","contact",data.id,{fields:Object.keys(input)}); return data?Response.json({data}):Response.json({error:"NOT_FOUND"},{status:404}); } catch(error){return apiError(error)}
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return databaseUnavailable();
  const auth=await requireContext(_request,"contacts.delete"); if(auth.response)return auth.response; const context=auth.context!;
  try { const id=uuidSchema.parse((await params).id); const [data]=await getDb().delete(contacts).where(and(eq(contacts.id,id),eq(contacts.organizationId,context.organization.id))).returning({id:contacts.id}); if(data)await writeAudit(_request,context,"contact.deleted","contact",data.id); return data?Response.json({data}):Response.json({error:"NOT_FOUND"},{status:404}); } catch(error){return apiError(error)}
}
