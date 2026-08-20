export type ProviderId = "nvidia" | "groq" | "gemini" | "cloudflare";

export type TaskType = "general" | "reasoning" | "coding";

export type ErrorKind =
  | "rate_limit"
  | "timeout"
  | "auth"
  | "invalid_request"
  | "transient"
  | "unknown";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIRequest {
  messages: ChatMessage[];
  task: TaskType;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AIResponse {
  provider: ProviderId;
  model: string;
  success: boolean;
  content: string | null;
  latencyMs: number;
  errorKind: ErrorKind | null;
  errorMessage: string | null;
  retryCount: number;
  fallbackUsed: boolean;
}

export interface ProviderModelConfig {
  general: string;
  reasoning: string;
  coding: string;
}

export interface ProviderConfig {
  id: ProviderId;
  apiKey: string;
  baseUrl: string;
  models: ProviderModelConfig;
  priority: number;
}

export interface ProviderAdapter {
  id: ProviderId;
  chat(request: AIRequest, modelOverride?: string): Promise<AIResponse>;
  test(): Promise<boolean>;
}

export interface CircuitState {
  failures: number;
  lastFailureAt: number | null;
  cooldownUntil: number | null;
}

export interface HealthResult {
  provider: ProviderId;
  configured: boolean;
  reachable: boolean;
  latencyMs: number | null;
  error: string | null;
}

export interface AIResult {
  response: AIResponse;
  attempts: Array<{ provider: ProviderId; errorKind: string; errorMessage: string }>;
  resumable: boolean;
}
