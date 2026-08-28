import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SetupCompany } from "@/components/nova-auth-pages";
export default async function SetupPage(){const session=await auth.api.getSession({headers:await headers()});if(!session)redirect("/login");return <SetupCompany/>}
