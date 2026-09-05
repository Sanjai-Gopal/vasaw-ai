export interface LogPayload {
  workflowId?: string;
  campaignId?: string;
  leadId?: string;
  agent?: string;
  stage?: string;
  provider?: string;
  status?: string;
  durationMs?: number;
  error?: string;
  details?: Record<string, unknown>;
}

// Patterns of sensitive tokens and private keys to automatically redact
const SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /private_?key/i,
  /authorization/i,
  /cookie/i,
  /key/i,
];

function redactSensitiveData(obj: unknown, depth = 0): unknown {
  if (depth > 5) return "[DEPTH_LIMIT]";
  if (!obj || typeof obj !== "object") {
    if (typeof obj === "string") {
      // Redact potential Bearer tokens or RSA private keys in plain strings
      if (obj.startsWith("Bearer ")) return "Bearer [REDACTED]";
      if (obj.includes("BEGIN PRIVATE KEY")) return "[REDACTED_RSA_PRIVATE_KEY]";
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pat) => pat.test(key));
    if (isSensitive) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitiveData(value, depth + 1);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

export const logger = {
  info(message: string, payload?: LogPayload) {
    const entry = {
      level: "INFO",
      timestamp: new Date().toISOString(),
      message,
      ...(payload ? (redactSensitiveData(payload) as Record<string, unknown>) : {}),
    };
    console.log(JSON.stringify(entry));
  },

  warn(message: string, payload?: LogPayload) {
    const entry = {
      level: "WARN",
      timestamp: new Date().toISOString(),
      message,
      ...(payload ? (redactSensitiveData(payload) as Record<string, unknown>) : {}),
    };
    console.warn(JSON.stringify(entry));
  },

  error(message: string, payload?: LogPayload) {
    const entry = {
      level: "ERROR",
      timestamp: new Date().toISOString(),
      message,
      ...(payload ? (redactSensitiveData(payload) as Record<string, unknown>) : {}),
    };
    console.error(JSON.stringify(entry));
  },

  audit(event: string, payload?: LogPayload) {
    const entry = {
      level: "AUDIT",
      timestamp: new Date().toISOString(),
      event,
      ...(payload ? (redactSensitiveData(payload) as Record<string, unknown>) : {}),
    };
    console.log(JSON.stringify(entry));
  },
};
