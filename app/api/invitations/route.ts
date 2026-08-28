import { and, desc, eq } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { requireContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/auth/audit";
import { invitationSchema } from "@/lib/auth/validation";
import { getDb } from "@/lib/db";
import { invitations } from "@/lib/db/schema";
const hash=(token:string)=>createHash("sha256").update(token).digest("hex");
export async function GET(request:Request){const auth=await requireContext(request,"members.read");if(auth.response)return auth.response;const data=await getDb().select({id:invitations.id,email:invitations.email,role:invitations.role,status:invitations.status,expiresAt:invitations.expiresAt,createdAt:invitations.createdAt,acceptedAt:invitations.acceptedAt}).from(invitations).where(eq(invitations.organizationId,auth.context!.organization.id)).orderBy(desc(invitations.createdAt));return Response.json({data,emailDelivery:"BLOCKED_NOT_CONFIGURED"})}
export async function POST(request:Request){const auth=await requireContext(request,"members.invite");if(auth.response)return auth.response;const context=auth.context!;try{const input=invitationSchema.parse(await request.json());const token=randomBytes(32).toString("base64url");const expiresAt=new Date(Date.now()+7*24*60*60*1000);const [data]=await getDb().insert(invitations).values({organizationId:context.organization.id,email:input.email,role:input.role,tokenHash:hash(token),expiresAt,invitedBy:context.user.id}).returning({id:invitations.id,email:invitations.email,role:invitations.role,status:invitations.status,expiresAt:invitations.expiresAt});await writeAudit(request,context,"member.invited","invitation",data.id,{email:data.email,role:data.role});return Response.json({data,acceptUrl:`${process.env.BETTER_AUTH_URL||"https://guyf.vercel.app"}/invite/${token}`,emailSent:false,emailDelivery:"BLOCKED_NOT_CONFIGURED"},{status:201})}catch{return Response.json({error:"INVALID_INVITATION"},{status:400})}}
