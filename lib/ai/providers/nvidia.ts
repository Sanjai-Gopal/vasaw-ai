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
      general: process.env.NVIDIA_GENERAL_MODEL ?? "nvidia/nemotron-mini-4b-instruct",
      reasoning: process.env.NVIDIA_REASONING_MODEL ?? "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
      coding: process.env.NVIDIA_CODING_MODEL ?? "nvidia/nemotron-mini-4b-instruct",
    }
  );
  return adapter;
}