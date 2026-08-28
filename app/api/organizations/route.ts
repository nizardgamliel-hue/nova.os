import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { auditLogs, companyProfiles, memberships, organizations, workspaceConfigs } from "@/lib/db/schema";
import { companySchema, slugify } from "@/lib/auth/validation";

export async function GET(request:Request){
  const session=await auth.api.getSession({headers:request.headers}); if(!session)return Response.json({error:"UNAUTHORIZED"},{status:401});
  const data=await getDb().select({id:organizations.id,name:organizations.name,slug:organizations.slug,industry:organizations.industry,country:organizations.country,language:organizations.language,timezone:organizations.timezone,role:memberships.role}).from(memberships).innerJoin(organizations,eq(memberships.organizationId,organizations.id)).where(and(eq(memberships.userId,session.user.id),eq(memberships.status,"active"))).orderBy(asc(organizations.name));
  return Response.json({data});
}
export async function POST(request:Request){
  const session=await auth.api.getSession({headers:request.headers}); if(!session)return Response.json({error:"UNAUTHORIZED"},{status:401});
  const existing=await getDb().select({id:memberships.id}).from(memberships).where(eq(memberships.userId,session.user.id)).limit(1); if(existing.length)return Response.json({error:"ALREADY_HAS_ORGANIZATION"},{status:409});
  try{const input=companySchema.parse(await request.json());const suffix=crypto.randomUUID().slice(0,6);const [organization]=await getDb().insert(organizations).values({...input,slug:`${slugify(input.name)}-${suffix}`}).returning();await getDb().insert(memberships).values({userId:session.user.id,organizationId:organization.id,role:"OWNER"});await Promise.all([getDb().insert(companyProfiles).values({organizationId:organization.id}),getDb().insert(workspaceConfigs).values({organizationId:organization.id})]);await getDb().insert(auditLogs).values([{organizationId:organization.id,userId:session.user.id,action:"organization.created",resourceType:"organization",resourceId:organization.id,metadata:{name:organization.name},ip:request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),userAgent:request.headers.get("user-agent")},{organizationId:organization.id,userId:session.user.id,action:"onboarding.started",resourceType:"organization",resourceId:organization.id,metadata:{step:1},ip:request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),userAgent:request.headers.get("user-agent")}]);return Response.json({data:organization},{status:201});}catch{return Response.json({error:"INVALID_COMPANY"},{status:400})}
}
