import { and, eq } from "drizzle-orm";
import { requireContext } from "@/lib/auth/context";
import { getDb } from "@/lib/db";
import { invitations } from "@/lib/db/schema";
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){const auth=await requireContext(request,"members.invite");if(auth.response)return auth.response;const [data]=await getDb().update(invitations).set({status:"cancelled"}).where(and(eq(invitations.id,(await params).id),eq(invitations.organizationId,auth.context!.organization.id),eq(invitations.status,"pending"))).returning({id:invitations.id});return data?Response.json({data}):Response.json({error:"NOT_FOUND"},{status:404})}
