import { and, eq, gt } from "drizzle-orm";
import { createHash } from "node:crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { invitations, memberships } from "@/lib/db/schema";
export async function POST(request:Request){const session=await auth.api.getSession({headers:request.headers});if(!session)return Response.json({error:"UNAUTHORIZED"},{status:401});try{const {token}=z.object({token:z.string().min(32)}).parse(await request.json());const tokenHash=createHash("sha256").update(token).digest("hex");const [invite]=await getDb().select().from(invitations).where(and(eq(invitations.tokenHash,tokenHash),eq(invitations.status,"pending"),gt(invitations.expiresAt,new Date()))).limit(1);if(!invite)return Response.json({error:"INVALID_OR_EXPIRED_INVITATION"},{status:404});if(invite.email!==session.user.email.toLowerCase())return Response.json({error:"EMAIL_MISMATCH"},{status:403});await getDb().insert(memberships).values({userId:session.user.id,organizationId:invite.organizationId,role:invite.role}).onConflictDoNothing();await getDb().update(invitations).set({status:"accepted",acceptedAt:new Date()}).where(eq(invitations.id,invite.id));return Response.json({ok:true,organizationId:invite.organizationId})}catch{return Response.json({error:"INVALID_INVITATION"},{status:400})}}
