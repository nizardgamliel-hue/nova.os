import { and, asc, eq } from "drizzle-orm";
import { auth } from "./index";
import { getDb } from "@/lib/db";
import { memberships, organizations } from "@/lib/db/schema";
import { can, type Permission, type Role } from "./permissions";

export const ACTIVE_ORG_COOKIE="nova_active_organization";
const parseCookie=(header:string|null,name:string)=>header?.split(";").map(v=>v.trim()).find(v=>v.startsWith(`${name}=`))?.slice(name.length+1);

export type AuthContext={user:{id:string;name:string;email:string;image?:string|null};organization:{id:string;name:string;slug:string};membership:{id:string;role:Role;status:string}};
export async function resolveAuthContext(headers:Headers,permission?:Permission):Promise<{context?:AuthContext;response?:Response}>{
  const session=await auth.api.getSession({headers});
  if(!session)return {response:Response.json({error:"UNAUTHORIZED"},{status:401})};
  const activeId=parseCookie(headers.get("cookie"),ACTIVE_ORG_COOKIE);
  const rows=await getDb().select({membership:memberships,organization:organizations}).from(memberships).innerJoin(organizations,eq(memberships.organizationId,organizations.id)).where(and(eq(memberships.userId,session.user.id),eq(memberships.status,"active"))).orderBy(asc(memberships.createdAt));
  if(!rows.length)return {response:Response.json({error:"MEMBERSHIP_REQUIRED"},{status:403})};
  const selected=rows.find(row=>row.organization.id===activeId)||rows[0];
  const role=selected.membership.role as Role;
  if(permission&&!can(role,permission))return {response:Response.json({error:"FORBIDDEN",permission},{status:403})};
  return {context:{user:{id:session.user.id,name:session.user.name,email:session.user.email,image:session.user.image},organization:selected.organization,membership:{id:selected.membership.id,role,status:selected.membership.status}}};
}

export async function requireContext(request:Request,permission?:Permission){return resolveAuthContext(request.headers,permission)}
