import type { ProviderAdapter } from "../types";
import { createOpenAICompatibleProvider } from "./openai-compatible";

let adapter: ProviderAdapter | null = null;

export function getCloudflareProvider(apiToken: string): ProviderAdapter {
  if (adapter) return adapter;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai`;

  adapter = createOpenAICompatibleProvider(
    "cloudflare",
    baseUrl,
    apiToken,
    {
      general: "@cf/meta/llama-3.3-70b-instruct-fp8",
      reasoning: "@cf/deepseek/deepseek-r1-distill-qwen-32b",
      coding: "@cf/qwen/qwen2.5-coder-32b-instruct",
    }
  );
  return adapter;
}
