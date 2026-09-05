import { WhatsAppProvider, WhatsAppProviderType } from "../types";
import { MockWhatsAppProvider } from "./mock";
import { MetaWhatsAppProvider } from "./meta";

/**
 * Factory to get the appropriate WhatsApp provider based on mode.
 * Default fallback is "mock" if mode is not specified or in testing/development environments.
 */
export function getWhatsAppProvider(mode?: WhatsAppProviderType): WhatsAppProvider {
  if (mode === "meta") {
    return new MetaWhatsAppProvider();
  }
  return new MockWhatsAppProvider();
}

/**
 * Sanitizes sensitive credentials (tokens, phone IDs, app secrets) from error messages and logs.
 */
export function sanitizeWhatsAppError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/(EAAG[a-zA-Z0-9_-]+)/g, "[REDACTED_ACCESS_TOKEN]")
    .replace(/(Bearer\s+)[a-zA-Z0-9._-]+/gi, "$1[REDACTED_TOKEN]")
    .replace(/(app_secret=)[a-zA-Z0-9_-]+/gi, "$1[REDACTED]")
    .replace(/(access_token=)[a-zA-Z0-9_-]+/gi, "$1[REDACTED]");
}

/**
 * Determines if an HTTP error or network failure is transient and safe to retry.
 */
export function isTransientWhatsAppError(statusCode?: number, errorMessage?: string): boolean {
  if (statusCode) {
    if (statusCode === 429) return true; // Rate limit
    if (statusCode >= 500 && statusCode < 600) return true; // Server errors (500, 502, 503, 504)
  }
  if (errorMessage) {
    const msg = errorMessage.toLowerCase();
    if (msg.includes("etimedout") || msg.includes("econnreset") || msg.includes("econnrefused") || msg.includes("fetch failed") || msg.includes("network")) {
      return true;
    }
  }
  return false;
}

/**
 * Bounded exponential backoff retry runner for transient operations.
 */
export async function withWhatsAppRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    shouldRetry?: (error: unknown, status?: number) => boolean;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 300;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation(attempt);
    } catch (err: unknown) {
      lastError = err;
      if (attempt === maxRetries) break;

      const shouldRetry = options.shouldRetry
        ? options.shouldRetry(err)
        : isTransientWhatsAppError(
            (err as { statusCode?: number })?.statusCode,
            err instanceof Error ? err.message : String(err)
          );

      if (!shouldRetry) {
        break;
      }

      // Exponential backoff with small jitter: delay = baseDelayMs * 2^attempt
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 50;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
