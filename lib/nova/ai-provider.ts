export type NovaModelProfile = "FAST" | "REASONING" | "FUTURE_SPECIALIZED";

const defaultModel = "poolside/laguna-s-2.1-free";

export const novaModelConfig = {
  provider: "vercel-ai-gateway",
  profiles: {
    FAST: { model: process.env.NOVA_MODEL_FAST ?? process.env.NOVA_MODEL ?? defaultModel, temperature: 0.2, maxOutputTokens: 1200 },
    REASONING: { model: process.env.NOVA_MODEL_REASONING ?? process.env.NOVA_MODEL ?? defaultModel, temperature: 0.2, maxOutputTokens: 1800 },
    FUTURE_SPECIALIZED: { model: process.env.NOVA_MODEL_SPECIALIZED ?? process.env.NOVA_MODEL ?? defaultModel, temperature: 0.2, maxOutputTokens: 1600 },
  },
  timeoutMs: 55_000,
  retries: 1,
} as const;

export function getNovaModel(profile: NovaModelProfile = "FAST") {
  return { provider: novaModelConfig.provider, profile, ...novaModelConfig.profiles[profile] };
}

export function isNovaProviderConfigured() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.NOVA_GATEWAY_READY === "true");
}
