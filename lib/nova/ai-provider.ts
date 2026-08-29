export type NovaModelProfile = "FAST" | "REASONING" | "FUTURE_SPECIALIZED";

// Keep one backwards-compatible fallback, but allow every Nova workload to be
// switched independently through environment variables. Production should set
// NOVA_MODEL (or the profile-specific variables) so a provider/model outage
// never requires a code change.
const legacyFallbackModel = "poolside/laguna-s-2.1-free";

function configuredModel(profileEnv?: string) {
  return profileEnv?.trim() || process.env.NOVA_MODEL?.trim() || legacyFallbackModel;
}

export const novaModelConfig = {
  provider: "vercel-ai-gateway",
  profiles: {
    FAST: { model: configuredModel(process.env.NOVA_MODEL_FAST), temperature: 0.2, maxOutputTokens: 1200 },
    REASONING: { model: configuredModel(process.env.NOVA_MODEL_REASONING), temperature: 0.2, maxOutputTokens: 1800 },
    FUTURE_SPECIALIZED: { model: configuredModel(process.env.NOVA_MODEL_SPECIALIZED), temperature: 0.2, maxOutputTokens: 1600 },
  },
  timeoutMs: 55_000,
  retries: 1,
} as const;

export function getNovaModel(profile: NovaModelProfile = "FAST") {
  return { provider: novaModelConfig.provider, profile, ...novaModelConfig.profiles[profile] };
}

export function isNovaProviderConfigured() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN ||
      process.env.NOVA_GATEWAY_READY === "true",
  );
}
