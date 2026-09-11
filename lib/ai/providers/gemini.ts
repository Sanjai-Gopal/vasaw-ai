import type { AIRequest, AIResponse, ChatMessage, ProviderAdapter } from "../types";
import { classifyError, isAbortError } from "../errors";

const TIMEOUT_MS = 60_000;

const getModels = () => ({
  general: process.env.GEMINI_GENERAL_MODEL || "gemini-flash-latest",
  reasoning: process.env.GEMINI_REASONING_MODEL || "gemini-flash-latest",
  coding: process.env.GEMINI_CODING_MODEL || "gemini-flash-latest",
});

function mapRole(role: ChatMessage["role"]): "user" | "model" {
  return role === "assistant" ? "model" : "user";
}

let cachedApiKey = "";
let adapter: ProviderAdapter | null = null;

export function getGeminiProvider(apiKey: string): ProviderAdapter {
  if (adapter && cachedApiKey === apiKey) return adapter;
  cachedApiKey = apiKey;

  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  async function chat(request: AIRequest, modelOverride?: string): Promise<AIResponse> {
    const currentModels = getModels();
    const model = modelOverride ?? currentModels[request.task] ?? currentModels.general;
    const contents = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: mapRole(m.role), parts: [{ text: m.content }] }));

    const systemInstruction = request.messages.find((m) => m.role === "system");
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 2048,
      },
    };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    if (request.signal) {
      request.signal.addEventListener("abort", () => controller.abort());
    }

    const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
    const start = Date.now();

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const rawText = await res.text().catch(() => "");
        const sanitizedText = rawText.replace(/key=[^&\s"']+/gi, "key=[REDACTED]");
        const { kind } = classifyError(res.status, sanitizedText);
        return {
          provider: "gemini",
          model,
          success: false,
          content: null,
          latencyMs,
          errorKind: kind,
          errorMessage: `[${res.status}] ${sanitizedText.slice(0, 200)}`,
          retryCount: 0,
          fallbackUsed: false,
        };
      }

      const json = await res.json();
      const content =
        json?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

      return {
        provider: "gemini",
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
          provider: "gemini",
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

      const rawMsg = err instanceof Error ? err.message : "Unknown network error";
      const sanitizedMsg = rawMsg.replace(/key=[^&\s"']+/gi, "key=[REDACTED]");

      return {
        provider: "gemini",
        model,
        success: false,
        content: null,
        latencyMs,
        errorKind: "transient",
        errorMessage: sanitizedMsg,
        retryCount: 0,
        fallbackUsed: false,
      };
    }
  }

  async function test(): Promise<boolean> {
    if (!apiKey) return false;
    try {
      const currentModels = getModels();
      const res = await fetch(
        `${baseUrl}/models/${currentModels.general}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "ping" }] }],
            generationConfig: { maxOutputTokens: 1 },
          }),
          signal: AbortSignal.timeout(10_000),
        }
      );
      if (res.status === 429) return true;
      return res.ok;
    } catch {
      return false;
    }
  }

  adapter = { id: "gemini", chat, test };
  return adapter;
}
