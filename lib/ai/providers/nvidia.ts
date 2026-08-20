import type { ProviderAdapter } from "../types";
import { createOpenAICompatibleProvider } from "./openai-compatible";

let adapter: ProviderAdapter | null = null;

export function getNvidiaProvider(apiKey: string): ProviderAdapter {
  if (adapter) return adapter;
  adapter = createOpenAICompatibleProvider(
    "nvidia",
    "https://integrate.api.nvidia.com/v1",
    apiKey,
    {
      general: process.env.NVIDIA_GENERAL_MODEL ?? "meta/llama-3.3-70b-instruct",
      reasoning: process.env.NVIDIA_REASONING_MODEL ?? "deepseek/deepseek-r1",
      coding: process.env.NVIDIA_CODING_MODEL ?? "qwen/qwen2.5-coder-32b-instruct",
    }
  );
  return adapter;
}
