import { requireContext } from "@/lib/auth/context";
import { getNovaModel, isNovaProviderConfigured } from "@/lib/nova/ai-provider";
export async function GET(request:Request) {
  const access=await requireContext(request);if(access.response)return access.response;
  const configured = isNovaProviderConfigured(), model=getNovaModel();
  return Response.json({
    configured,
    provider:model.provider,
    model:model.model,
    persistence: Boolean(process.env.DATABASE_URL),
    mode: configured ? "live" : "unavailable",
    tools:"READ_ONLY",
  });
}
