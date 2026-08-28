import { desc, eq } from "drizzle-orm";
import { requireContext } from "@/lib/auth/context";
import { getDb } from "@/lib/db";
import { auditLogs, memberships, user } from "@/lib/db/schema";
import { rolePermissions } from "@/lib/auth/permissions";
export async function GET(request:Request){const auth=await requireContext(request,"security.read");if(auth.response)return auth.response;const context=auth.context!;const [members,logs]=await Promise.all([getDb().select({id:memberships.id,name:user.name,email:user.email,role:memberships.role,status:memberships.status}).from(memberships).innerJoin(user,eq(memberships.userId,user.id)).where(eq(memberships.organizationId,context.organization.id)),getDb().select().from(auditLogs).where(eq(auditLogs.organizationId,context.organization.id)).orderBy(desc(auditLogs.createdAt)).limit(30)]);return Response.json({data:{authentication:{provider:"Better Auth",authenticated:true,user:context.user},session:{active:true,userAgent:request.headers.get("user-agent")},members,permissions:Object.fromEntries(Object.entries(rolePermissions).map(([role,set])=>[role,[...set]])),auditLogs:logs,comingSoon:["2FA","SSO"]}})}
