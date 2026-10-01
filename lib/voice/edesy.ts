const EDESY_BASE_URL = "https://voice-agent.edesy.in/api/v1";

export interface EdesyAgent {
  id: string;
  name: string;
  language: string;
  prompt: string;
  greetingMessage: string;
  llmProvider: string;
  callProvider: string;
  voice?: string;
  variables?: Record<string, string>;
}

export interface EdesyCall {
  conversationId: string;
  status: string;
  duration?: number;
  summary?: string;
  fullText?: string;
}

export interface EdesyCallResult {
  success: boolean;
  data?: EdesyCall;
  error?: string;
  code?: string;
}

export interface EdesyAgentResult {
  success: boolean;
  data?: EdesyAgent;
  error?: string;
  code?: string;
}

function getApiKey(): string {
  return process.env.EDESY_API_KEY || "";
}

function getWorkspaceId(): string {
  return process.env.EDESY_WORKSPACE_ID || "";
}

function getHeaders(): HeadersInit {
  return {
    "Authorization": `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

export async function createEdesyAgent(config: {
  name: string;
  language?: string;
  prompt: string;
  greetingMessage: string;
  llmProvider?: string;
  callProvider?: string;
  voice?: string;
  variables?: Record<string, string>;
}): Promise<EdesyAgentResult> {
  try {
    const response = await fetch(`${EDESY_BASE_URL}/agents`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: config.name,
        language: config.language || "hindi_english",
        prompt: config.prompt,
        greetingMessage: config.greetingMessage,
        llmProvider: config.llmProvider || "gemini-live-2.5",
        callProvider: config.callProvider || "twilio",
        voice: config.voice,
        variables: config.variables,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
        code: result.code,
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function placeEdesyCall(config: {
  agentId: string;
  phoneNumber: string;
  metadata?: Record<string, string>;
  callbackUrl?: string;
  variables?: Record<string, string>;
}): Promise<EdesyCallResult> {
  try {
    const response = await fetch(`${EDESY_BASE_URL}/calls`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        agentId: config.agentId,
        phoneNumber: config.phoneNumber,
        metadata: config.metadata,
        callbackUrl: config.callbackUrl,
        variables: config.variables,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
        code: result.code,
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getEdesyCall(conversationId: string): Promise<EdesyCallResult> {
  try {
    const response = await fetch(`${EDESY_BASE_URL}/calls/${conversationId}`, {
      method: "GET",
      headers: getHeaders(),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
        code: result.code,
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function listEdesyCalls(limit: number = 50, offset: number = 0): Promise<{
  success: boolean;
  data?: EdesyCall[];
  total?: number;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${EDESY_BASE_URL}/calls?limit=${limit}&offset=${offset}`,
      { method: "GET", headers: getHeaders() }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
      };
    }

    return { success: true, data: result.data, total: result.total };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteEdesyAgent(agentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${EDESY_BASE_URL}/agents/${agentId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function isEdesyConfigured(): boolean {
  return !!getApiKey();
}

export function getEdesyWorkspaceId(): string {
  return getWorkspaceId();
}