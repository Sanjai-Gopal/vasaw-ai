import type { AIRequest, AIResponse, ChatMessage, ProviderAdapter, ProviderId } from "../types";
import { classifyError, isAbortError } from "../errors";

const TIMEOUT_MS = 60_000;

function pickModel(task: AIRequest["task"], models: Record<string, string>): string {
  return models[task] ?? models.general;
}

function headers(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

export function createOpenAICompatibleProvider(
  id: ProviderId,
  baseUrl: string,
  apiKey: string,
  models: Record<string, string>
): ProviderAdapter {
  async function chat(request: AIRequest, modelOverride?: string): Promise<AIResponse> {
    const model = modelOverride ?? pickModel(request.task, models);
    const body = {
      model,
      messages: request.messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    if (request.signal) {
      request.signal.addEventListener("abort", () => controller.abort());
    }

    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: headers(apiKey),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const { kind } = classifyError(res.status, text);
        return {
          provider: id,
          model,
          success: false,
          content: null,
          latencyMs,
          errorKind: kind,
          errorMessage: `[${res.status}] ${text.slice(0, 200)}`,
          retryCount: 0,
          fallbackUsed: false,
        };
      }

      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content ?? null;

      return {
        provider: id,
        model,
        success: true,
        content,
        latencyMs,
        errorKind: null,
        errorMessage: null,
        retryCount: 0,
        fallbackUsed: false,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      if (isAbortError(err)) {
        return {
          provider: id,
          model,
          success: false,
          content: null,
          latencyMs,
          errorKind: "timeout",
          errorMessage: `Request timed out after ${TIMEOUT_MS}ms`,
          retryCount: 0,
          fallbackUsed: false,
        };
      }

      return {
        provider: id,
        model,
        success: false,
        content: null,
        latencyMs,
        errorKind: "transient",
        errorMessage: err instanceof Error ? err.message : "Unknown network error",
        retryCount: 0,
        fallbackUsed: false,
      };
    }
  }

  async function test(): Promise<boolean> {
    if (!apiKey) return false;
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: headers(apiKey),
        body: JSON.stringify({
          model: models.general,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status === 429) return true;
      return res.ok;
    } catch {
      return false;
    }
  }

  return { id, chat, test };
}
