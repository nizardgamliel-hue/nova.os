import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/context";
import { getDb } from "@/lib/db";
import { memberships } from "@/lib/db/schema";
export async function POST(request:Request){const session=await auth.api.getSession({headers:request.headers});if(!session)return Response.json({error:"UNAUTHORIZED"},{status:401});try{const {organizationId}=z.object({organizationId:z.string().uuid()}).parse(await request.json());const [membership]=await getDb().select({id:memberships.id}).from(memberships).where(and(eq(memberships.userId,session.user.id),eq(memberships.organizationId,organizationId),eq(memberships.status,"active"))).limit(1);if(!membership)return Response.json({error:"FORBIDDEN"},{status:403});const response=NextResponse.json({ok:true});response.cookies.set(ACTIVE_ORG_COOKIE,organizationId,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*365});return response}catch{return Response.json({error:"INVALID_ORGANIZATION"},{status:400})}}
