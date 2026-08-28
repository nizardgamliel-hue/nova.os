import { and, desc, eq, ilike, or } from "drizzle-orm";
import { contacts } from "@/lib/db/schema";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { contactInputSchema } from "@/lib/db/validation";
import { apiError, databaseUnavailable } from "@/lib/db/http";
import { requireContext } from "@/lib/auth/context";
import { writeAudit } from "@/lib/auth/audit";
import { emitBusinessEvent } from "@/lib/nova/automation-engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailable();
  const auth=await requireContext(request,"contacts.read"); if(auth.response)return auth.response; const context=auth.context!;
  const url = new URL(request.url); const query = url.searchParams.get("q")?.trim(); const status = url.searchParams.get("status");
  const clauses = [eq(contacts.organizationId, context.organization.id)];
  if (query) clauses.push(or(ilike(contacts.firstName, `%${query}%`), ilike(contacts.lastName, `%${query}%`), ilike(contacts.company, `%${query}%`), ilike(contacts.email, `%${query}%`))!);
  if (status && ["new","qualified","contacted","customer","inactive"].includes(status)) clauses.push(eq(contacts.status, status as typeof contacts.status.enumValues[number]));
  const data = await getDb().select().from(contacts).where(and(...clauses)).orderBy(desc(contacts.updatedAt));
  return Response.json({ data });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailable();
  const auth=await requireContext(request,"contacts.create"); if(auth.response)return auth.response; const context=auth.context!;
  try {
    const input = contactInputSchema.parse(await request.json());
    const [created] = await getDb().insert(contacts).values({ ...input, organizationId: context.organization.id }).returning();
    await writeAudit(request,context,"contact.created","contact",created.id,{email:created.email}); await emitBusinessEvent(context,"contact.created","contact",created.id,created as unknown as Record<string,unknown>,`contact.created:${created.id}:${created.updatedAt?.toISOString()}`);
    return Response.json({ data: created }, { status: 201 });
  } catch (error) { return apiError(error); }
}
