import type { ErrorKind, ProviderId } from "./types";

export class AIProviderError extends Error {
  public readonly kind: ErrorKind;
  public readonly provider: ProviderId;
  public readonly retryable: boolean;

  constructor(provider: ProviderId, kind: ErrorKind, message: string, retryable = false) {
    super(`[${provider}] ${message}`);
    this.name = "AIProviderError";
    this.kind = kind;
    this.provider = provider;
    this.retryable = retryable;
  }
}

export class AllProvidersFailedError extends Error {
  public readonly attempts: Array<{ provider: ProviderId; errorKind: ErrorKind; errorMessage: string }>;

  constructor(attempts: Array<{ provider: ProviderId; errorKind: ErrorKind; errorMessage: string }>) {
    super(
      `All providers failed. ${attempts.length} attempt(s): ` +
        attempts.map((a) => `${a.provider}(${a.errorKind}: ${a.errorMessage})`).join("; ")
    );
    this.name = "AllProvidersFailedError";
    this.attempts = attempts;
  }
}

export function classifyError(status: number, body: string): { kind: ErrorKind; retryable: boolean } {
  if (status === 429) return { kind: "rate_limit", retryable: true };
  if (status === 408 || status === 504) return { kind: "timeout", retryable: true };
  if (status === 401 || status === 403) return { kind: "auth", retryable: false };
  if (status === 400 || status === 422) return { kind: "invalid_request", retryable: false };
  if (status >= 500) return { kind: "transient", retryable: true };

  try {
    const parsed = JSON.parse(body);
    const msg = typeof parsed === "string" ? parsed : parsed?.error?.message || parsed?.message || body;
    const lower = String(msg).toLowerCase();
    if (lower.includes("rate limit") || lower.includes("too many") || lower.includes("429"))
      return { kind: "rate_limit", retryable: true };
    if (lower.includes("timeout") || lower.includes("deadline")) return { kind: "timeout", retryable: true };
    if (lower.includes("unauthorized") || lower.includes("invalid key") || lower.includes("authentication"))
      return { kind: "auth", retryable: false };
  } catch {
    // not JSON, use raw
  }

  return { kind: "unknown", retryable: false };
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}
