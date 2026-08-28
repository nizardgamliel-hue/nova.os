import { InviteAcceptance } from "@/components/nova-auth-pages";
export default async function InvitePage({params}:{params:Promise<{token:string}>}){return <InviteAcceptance token={(await params).token}/>}
