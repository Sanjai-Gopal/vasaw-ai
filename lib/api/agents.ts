import { apiClient } from "./client";

export interface AgentStatusData {
  id: string;
  name: string;
  stage: string;
  status: "idle" | "running" | "ready" | "paused" | "error";
  lastRun?: string;
  duration?: string;
  totalProcessed?: number;
  successRate?: string;
}

export interface GetAgentStatusResponse {
  ok: boolean;
  agents: AgentStatusData[];
}

export interface OrchestratorRunPayload {
  campaignId?: string;
  locations?: string[];
  categories?: string[];
  maxItems?: number;
  skipOutreach?: boolean;
  mode?: "mock" | "real";
}

export async function fetchAgentStatus(): Promise<AgentStatusData[]> {
  const res = await apiClient<GetAgentStatusResponse>("/api/agents/status");
  return res.agents || [];
}

export async function runAgent(
  agentName: string,
  payload: Record<string, unknown> = {}
): Promise<{ ok: boolean; [key: string]: unknown }> {
  return apiClient<{ ok: boolean; [key: string]: unknown }>(`/api/agents/${agentName}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function runOrchestrator(
  payload: OrchestratorRunPayload = {}
): Promise<{ ok: boolean; workflowId?: string; result?: unknown }> {
  return apiClient<{ ok: boolean; workflowId?: string; result?: unknown }>(
    "/api/agents/orchestrator",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
