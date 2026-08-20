import type { ProviderAdapter } from "../types";
import { createOpenAICompatibleProvider } from "./openai-compatible";

let adapter: ProviderAdapter | null = null;

export function getGroqProvider(apiKey: string): ProviderAdapter {
  if (adapter) return adapter;
  adapter = createOpenAICompatibleProvider(
    "groq",
    "https://api.groq.com/openai/v1",
    apiKey,
    {
      general: "llama-3.3-70b-versatile",
      reasoning: "deepseek-r1-distill-llama-70b",
      coding: "deepseek-coder-v2-32b",
    }
  );
  return adapter;
}
