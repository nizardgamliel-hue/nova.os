import { auditLogs } from "@/lib/db/schema";
import { getDb } from "@/lib/db";
import type { AuthContext } from "./context";

export async function writeAudit(request:Request,context:AuthContext,action:string,resourceType:string,resourceId?:string,metadata:Record<string,unknown>={}){
  await getDb().insert(auditLogs).values({organizationId:context.organization.id,userId:context.user.id,action,resourceType,resourceId,metadata,ip:request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),userAgent:request.headers.get("user-agent")});
}
