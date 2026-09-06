import type { ProviderConfig, ProviderId } from "./types";

function env(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[name]?.trim() || undefined;
}

export function getProviders(): ProviderConfig[] {
  return [
    {
      id: "nvidia",
      apiKey: env("NVIDIA_API_KEY") ?? "",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      models: {
        general: env("NVIDIA_GENERAL_MODEL") ?? "nvidia/nemotron-mini-4b-instruct",
        reasoning: env("NVIDIA_REASONING_MODEL") ?? "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        coding: env("NVIDIA_CODING_MODEL") ?? "nvidia/nemotron-mini-4b-instruct",
      },
      priority: 1,
    },
    {
      id: "groq",
      apiKey: env("GROQ_API_KEY") ?? "",
      baseUrl: "https://api.groq.com/openai/v1",
      models: {
        general: "qwen/qwen3.6-27b",
        reasoning: "groq/compound",
        coding: "qwen/qwen3.6-27b",
      },
      priority: 2,
    },
    {
      id: "gemini",
      apiKey: env("GEMINI_API_KEY") || env("GOOGLE_API_KEY") || "",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      models: {
        general: env("GEMINI_GENERAL_MODEL") || "gemini-flash-lite-latest",
        reasoning: env("GEMINI_REASONING_MODEL") || "gemini-flash-lite-latest",
        coding: env("GEMINI_CODING_MODEL") || "gemini-flash-lite-latest",
      },
      priority: 3,
    },
    {
      id: "cloudflare",
      apiKey: env("CLOUDFLARE_API_TOKEN") ?? "",
      baseUrl: `https://api.cloudflare.com/client/v4/accounts/${env("CLOUDFLARE_ACCOUNT_ID") ?? ""}/ai`,
      models: {
        general: "@cf/meta/llama-3.3-70b-instruct-fp8",
        reasoning: "@cf/deepseek/deepseek-r1-distill-qwen-32b",
        coding: "@cf/qwen/qwen2.5-coder-32b-instruct",
      },
      priority: 4,
    },
  ];
}

export function getProviderConfig(id: ProviderId): ProviderConfig | undefined {
  return getProviders().find((p) => p.id === id);
}

export function getAvailableProviders(): ProviderConfig[] {
  return getProviders().filter((p) => p.apiKey.length > 0);
}

export function getProvidersByPriority(): ProviderConfig[] {
  return getAvailableProviders().sort((a, b) => a.priority - b.priority);
}

export function isProviderConfigured(id: ProviderId): boolean {
  const p = getProviderConfig(id);
  return !!p && p.apiKey.length > 0;
}