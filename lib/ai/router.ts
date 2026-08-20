import type {
  AIRequest,
  AIResponse,
  AIResult,
  CircuitState,
  HealthResult,
  ProviderAdapter,
  ProviderId,
} from "./types";
import { AIProviderError } from "./errors";
import { getProviderConfig, getProvidersByPriority } from "./config";
import { getNvidiaProvider } from "./providers/nvidia";
import { getGroqProvider } from "./providers/groq";
import { getGeminiProvider } from "./providers/gemini";
import { getCloudflareProvider } from "./providers/cloudflare";

const MAX_RETRIES_PER_PROVIDER = 2;
const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 8_000;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 60_000;

const circuitState: Record<ProviderId, CircuitState> = {
  nvidia: { failures: 0, lastFailureAt: null, cooldownUntil: null },
  groq: { failures: 0, lastFailureAt: null, cooldownUntil: null },
  gemini: { failures: 0, lastFailureAt: null, cooldownUntil: null },
  cloudflare: { failures: 0, lastFailureAt: null, cooldownUntil: null },
};

function resetCircuit(id: ProviderId): void {
  circuitState[id] = { failures: 0, lastFailureAt: null, cooldownUntil: null };
}

function tripCircuit(id: ProviderId): void {
  const state = circuitState[id];
  state.failures += 1;
  state.lastFailureAt = Date.now();
  if (state.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    state.cooldownUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
  }
}

function isCircuitOpen(id: ProviderId): boolean {
  const state = circuitState[id];
  if (!state.cooldownUntil) return false;
  if (Date.now() >= state.cooldownUntil) {
    state.cooldownUntil = null;
    state.failures = 0;
    return false;
  }
  return true;
}

function getAdapter(id: ProviderId): ProviderAdapter {
  const config = getProviderConfig(id);
  if (!config) throw new AIProviderError(id, "auth", `Provider ${id} not configured`);

  switch (id) {
    case "nvidia":
      return getNvidiaProvider(config.apiKey);
    case "groq":
      return getGroqProvider(config.apiKey);
    case "gemini":
      return getGeminiProvider(config.apiKey);
    case "cloudflare":
      return getCloudflareProvider(config.apiKey);
  }
}

function backoff(attempt: number): number {
  const ms = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
  return ms + Math.random() * 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function routeRequest(request: AIRequest): Promise<AIResult> {
  const providers = getProvidersByPriority();

  if (providers.length === 0) {
    throw new AIProviderError("nvidia", "auth", "No providers configured");
  }

  const attempts: AIResult["attempts"] = [];
  let lastResponse: AIResponse | null = null;

  for (let providerIndex = 0; providerIndex < providers.length; providerIndex++) {
    const config = providers[providerIndex];
    const adapter = getAdapter(config.id);

    if (isCircuitOpen(config.id)) {
      continue;
    }

    for (let retry = 0; retry <= MAX_RETRIES_PER_PROVIDER; retry++) {
      const model = config.models[request.task];
      const response = await adapter.chat(request, model);
      response.retryCount = retry;
      response.fallbackUsed = providerIndex > 0;

      if (response.success) {
        resetCircuit(config.id);
        return { response, attempts, resumable: false };
      }

      lastResponse = response;
      attempts.push({
        provider: config.id,
        errorKind: response.errorKind ?? "unknown",
        errorMessage: response.errorMessage ?? "unknown",
      });

      const kind = response.errorKind ?? "unknown";

      if (kind === "auth" || kind === "invalid_request") {
        tripCircuit(config.id);
        break;
      }

      if (kind === "rate_limit" || kind === "timeout" || kind === "transient") {
        tripCircuit(config.id);

        if (retry < MAX_RETRIES_PER_PROVIDER) {
          const waitMs = backoff(retry);
          await sleep(waitMs);
          continue;
        }

        break;
      }

      break;
    }
  }

  return {
    response: lastResponse ?? {
      provider: providers[0].id,
      model: providers[0].models[request.task],
      success: false,
      content: null,
      latencyMs: 0,
      errorKind: "unknown",
      errorMessage: "No provider responded",
      retryCount: 0,
      fallbackUsed: false,
    },
    attempts,
    resumable: true,
  };
}

export async function healthCheck(): Promise<HealthResult[]> {
  const results: HealthResult[] = [];
  const allProviderIds: ProviderId[] = ["nvidia", "groq", "gemini", "cloudflare"];

  for (const id of allProviderIds) {
    const config = getProviderConfig(id);
    if (!config || !config.apiKey) {
      results.push({ provider: id, configured: false, reachable: false, latencyMs: null, error: "Not configured" });
      continue;
    }

    try {
      const adapter = getAdapter(id);
      const start = Date.now();
      const reachable = await adapter.test();
      const latencyMs = Date.now() - start;
      results.push({
        provider: id,
        configured: true,
        reachable,
        latencyMs,
        error: reachable ? null : "Health check failed",
      });
    } catch (err) {
      results.push({
        provider: id,
        configured: true,
        reachable: false,
        latencyMs: null,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return results;
}

export function getCircuitState(id: ProviderId): CircuitState {
  return { ...circuitState[id] };
}
