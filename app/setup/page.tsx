import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveAuthContext } from "@/lib/auth/context";
import { SetupCompany } from "@/components/nova-auth-pages";
export default async function SetupPage(){const session=await auth.api.getSession({headers:await headers()});if(!session)redirect("/login");if((await resolveAuthContext(await headers())).context)redirect("/app");return <SetupCompany/>}
