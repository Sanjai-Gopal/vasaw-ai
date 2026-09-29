import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthenticatedUser } from "@/lib/supabase/auth";
import type { FlowWorkflow } from "@/lib/types/automation-flow";
import { parseWorkflowDefinition } from "./runtime";

export const MAX_AUTOMATION_BODY_BYTES = 64 * 1024;

export function assertSafeJsonValue(value: unknown, depth = 0): void {
  if (depth > 24) throw new Error("Request data is nested too deeply.");
  if (Array.isArray(value)) {
    if (value.length > 5000) throw new Error("Request data contains too many items.");
    for (const item of value) assertSafeJsonValue(item, depth + 1);
    return;
  }
  if (!value || typeof value !== "object") return;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 1000) throw new Error("Request data contains too many fields.");
  for (const [key, item] of entries) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      throw new Error("Request data contains a reserved object key.");
    }
    assertSafeJsonValue(item, depth + 1);
  }
}

export function redactSensitiveData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitiveData);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
    key,
    /secret|token|password|api[_-]?key|authorization|cookie/i.test(key)
      ? "[redacted]"
      : redactSensitiveData(item),
  ]));
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_AUTOMATION_BODY_BYTES) {
    throw new Error("Request body is too large. Maximum size is 64 KB.");
  }
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }
  assertSafeJsonValue(parsed);
  return parsed as Record<string, unknown>;
}

function assertNoInlineSecrets(value: unknown, path = "workflow"): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) assertNoInlineSecrets(item, `${path}[${index}]`);
    return;
  }
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (/(?:^|_)(?:secret|token|password|api[_-]?key|authorization)(?:$|_)/i.test(key)) {
      if (item !== undefined && item !== null && item !== "") {
        throw new Error(`Remove credential-like value at ${path}.${key}; workflow definitions must not contain secrets.`);
      }
    }
    assertNoInlineSecrets(item, `${path}.${key}`);
  }
}

export function normalizeWorkflowForStorage(value: unknown): FlowWorkflow {
  assertSafeJsonValue(value);
  const parsed = parseWorkflowDefinition(value);
  assertNoInlineSecrets(parsed);
  const now = new Date().toISOString();
  return {
    ...parsed,
    id: "",
    description: typeof parsed.description === "string" ? parsed.description.slice(0, 2000) : "",
    createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : now,
    updatedAt: now,
    runsCount: 0,
    lastExecution: undefined,
    nodes: parsed.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      name: node.name,
      position: node.position,
      parameters: node.parameters,
      status: "idle",
      disabled: Boolean(node.disabled),
    })),
    connections: parsed.connections.map((connection) => ({
      id: connection.id,
      fromNodeId: connection.fromNodeId,
      fromPortId: connection.fromPortId,
      toNodeId: connection.toNodeId,
      toPortId: connection.toPortId,
    })),
  };
}

export async function getOwnedAutomation(
  admin: SupabaseClient,
  id: string,
  user: AuthenticatedUser
) {
  let query = admin.from("automations").select("*").eq("id", id);
  query = user.organizationId
    ? query.or(`owner_user_id.eq.${user.id},organization_id.eq.${user.organizationId}`)
    : query.eq("owner_user_id", user.id);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("Could not load workflow.");
  return data;
}

export function workflowFromRow(row: Record<string, unknown>): FlowWorkflow {
  const workflow = row.workflow_data as FlowWorkflow;
  return {
    ...workflow,
    id: String(row.id),
    name: String(row.name ?? workflow.name),
    description: String(row.description ?? workflow.description ?? ""),
    active: Boolean(row.active),
    createdAt: String(row.created_at ?? workflow.createdAt),
    updatedAt: String(row.updated_at ?? workflow.updatedAt),
    executionMode: row.execution_mode === "live" ? "live" : "dry_run",
  } as FlowWorkflow;
}

export function createWebhookSecret() {
  const secret = randomBytes(32).toString("base64url");
  return { secret, hash: hashWebhookSecret(secret) };
}

export function hashWebhookSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function verifyWebhookSecret(candidate: string, storedHash: string) {
  const candidateHash = Buffer.from(hashWebhookSecret(candidate), "hex");
  const expectedHash = Buffer.from(storedHash, "hex");
  return candidateHash.length === expectedHash.length && timingSafeEqual(candidateHash, expectedHash);
}

export function isWebhookWorkflow(workflow: FlowWorkflow) {
  return workflow.nodes.some((node) => node.type === "trigger_webhook" && !node.disabled);
}
