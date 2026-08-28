import { eq } from "drizzle-orm";
import { requireContext } from "@/lib/auth/context";
import { getDb } from "@/lib/db";
import { organizations, user } from "@/lib/db/schema";
import { companySchema, profileSchema } from "@/lib/auth/validation";
import { writeAudit } from "@/lib/auth/audit";
import { z } from "zod";
export async function GET(request:Request){const auth=await requireContext(request);if(auth.response)return auth.response;const context=auth.context!;const [profile]=await getDb().select({name:user.name,email:user.email,image:user.image,locale:user.locale,timezone:user.timezone}).from(user).where(eq(user.id,context.user.id)).limit(1);const [company]=await getDb().select().from(organizations).where(eq(organizations.id,context.organization.id)).limit(1);return Response.json({data:{profile,company,role:context.membership.role}})}
export async function PATCH(request:Request){const auth=await requireContext(request);if(auth.response)return auth.response;const context=auth.context!;try{const body=z.object({company:companySchema.optional(),profile:profileSchema.optional()}).strict().parse(await request.json());if(body.company){const permitted=await requireContext(request,"organization.update");if(permitted.response)return permitted.response;await getDb().update(organizations).set({...body.company,updatedAt:new Date()}).where(eq(organizations.id,context.organization.id));await writeAudit(request,context,"organization.updated","organization",context.organization.id,{fields:Object.keys(body.company)})}if(body.profile)await getDb().update(user).set({...body.profile,updatedAt:new Date()}).where(eq(user.id,context.user.id));return GET(request)}catch{return Response.json({error:"INVALID_SETTINGS"},{status:400})}}
