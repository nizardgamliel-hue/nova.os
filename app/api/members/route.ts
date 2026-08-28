import { asc, eq } from "drizzle-orm";
import { requireContext } from "@/lib/auth/context";
import { getDb } from "@/lib/db";
import { memberships, user } from "@/lib/db/schema";
export async function GET(request:Request){const auth=await requireContext(request,"members.read");if(auth.response)return auth.response;const context=auth.context!;const data=await getDb().select({id:memberships.id,userId:user.id,name:user.name,email:user.email,image:user.image,role:memberships.role,status:memberships.status,createdAt:memberships.createdAt}).from(memberships).innerJoin(user,eq(memberships.userId,user.id)).where(eq(memberships.organizationId,context.organization.id)).orderBy(asc(memberships.createdAt));return Response.json({data})}
