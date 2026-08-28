import { AdaptiveDashboard as IndustryDashboard } from "@/components/nova-adaptive-dashboard";
import { DashboardNovaInput } from "@/components/dashboard-nova-input";
export function AdaptiveDashboard(props:Parameters<typeof IndustryDashboard>[0]){return <><DashboardNovaInput/><IndustryDashboard {...props}/></>}
