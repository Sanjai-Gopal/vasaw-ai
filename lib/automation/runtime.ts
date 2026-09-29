import { NODE_TYPE_REGISTRY } from "@/lib/data/automation-registry";
import type { FlowConnection, FlowNode, FlowWorkflow } from "@/lib/types/automation-flow";
import { runWebsiteQA, analyzeQAReport } from "@/lib/agents/website-qa/qa-agent";
import type { QAReport } from "@/lib/agents/website-qa/types";

export type WorkflowRunMode = "dry_run" | "live";
export type WorkflowStepStatus = "success" | "preview" | "skipped" | "error";

export interface WorkflowStepResult {
  node: FlowNode;
  index: number;
  status: WorkflowStepStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  message: string;
}

export interface WorkflowRunOptions {
  mode: WorkflowRunMode;
  input: Record<string, unknown>;
  isCancelled?: () => Promise<boolean>;
  onStep?: (step: WorkflowStepResult) => Promise<void>;
  onStepStart?: (node: FlowNode, index: number, input: Record<string, unknown>, startedAt: string) => Promise<void>;
  onStepError?: (node: FlowNode, index: number, input: Record<string, unknown>, startedAt: string, error: Error) => Promise<void>;
}

export class WorkflowValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowValidationError";
  }
}

export class WorkflowNodeExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowNodeExecutionError";
  }
}

export class WorkflowCancelledError extends Error {
  constructor() {
    super("Run cancellation was requested.");
    this.name = "WorkflowCancelledError";
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function parseWorkflowDefinition(value: unknown): FlowWorkflow {
  const workflow = asRecord(value);
  if (
    typeof workflow.name !== "string" ||
    !workflow.name.trim() ||
    !Array.isArray(workflow.nodes) ||
    !Array.isArray(workflow.connections)
  ) {
    throw new WorkflowValidationError("Workflow must include a name, nodes, and connections.");
  }
  if (workflow.nodes.length < 1 || workflow.nodes.length > 100) {
    throw new WorkflowValidationError("A workflow must contain between 1 and 100 nodes.");
  }
  if (workflow.connections.length > 250) {
    throw new WorkflowValidationError("A workflow cannot contain more than 250 connections.");
  }

  const nodes = workflow.nodes as FlowNode[];
  const connections = workflow.connections as FlowConnection[];
  const ids = new Set<string>();
  for (const node of nodes) {
    if (
      !node || typeof node.id !== "string" || !node.id ||
      typeof node.type !== "string" || !NODE_TYPE_REGISTRY[node.type] ||
      typeof node.name !== "string" || !node.name ||
      !node.parameters || typeof node.parameters !== "object" || Array.isArray(node.parameters)
    ) {
      throw new WorkflowValidationError("Each node needs a unique ID, known node type, name, and parameters.");
    }
    if (ids.has(node.id)) throw new WorkflowValidationError(`Duplicate node ID: ${node.id}`);
    ids.add(node.id);
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edgeIds = new Set<string>();
  for (const edge of connections) {
    if (
      !edge || typeof edge.id !== "string" || !edge.id || edgeIds.has(edge.id) ||
      !nodeById.has(edge.fromNodeId) || !nodeById.has(edge.toNodeId)
    ) {
      throw new WorkflowValidationError("Each connection needs a unique ID and valid source and destination nodes.");
    }
    edgeIds.add(edge.id);
    const source = NODE_TYPE_REGISTRY[nodeById.get(edge.fromNodeId)!.type];
    const target = NODE_TYPE_REGISTRY[nodeById.get(edge.toNodeId)!.type];
    if (!source.outputs.some((port) => port.id === edge.fromPortId)) {
      throw new WorkflowValidationError(`Connection ${edge.id} uses an unknown source port.`);
    }
    if (!target.inputs.some((port) => port.id === edge.toPortId)) {
      throw new WorkflowValidationError(`Connection ${edge.id} uses an unknown destination port.`);
    }
  }

  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();
  for (const edge of connections) {
    indegree.set(edge.toNodeId, (indegree.get(edge.toNodeId) ?? 0) + 1);
    outgoing.set(edge.fromNodeId, [...(outgoing.get(edge.fromNodeId) ?? []), edge.toNodeId]);
  }
  const ready = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  let visited = 0;
  while (ready.length) {
    const id = ready.shift()!;
    visited += 1;
    for (const targetId of outgoing.get(id) ?? []) {
      const next = (indegree.get(targetId) ?? 0) - 1;
      indegree.set(targetId, next);
      if (next === 0) ready.push(targetId);
    }
  }
  if (visited !== nodes.length) throw new WorkflowValidationError("Workflow contains a cycle. Remove the loop before saving.");

  return workflow as unknown as FlowWorkflow;
}

function orderNodes(workflow: FlowWorkflow): FlowNode[] {
  const originalIndex = new Map(workflow.nodes.map((node, index) => [node.id, index]));
  const indegree = new Map(workflow.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();
  for (const edge of workflow.connections) {
    indegree.set(edge.toNodeId, (indegree.get(edge.toNodeId) ?? 0) + 1);
    outgoing.set(edge.fromNodeId, [...(outgoing.get(edge.fromNodeId) ?? []), edge.toNodeId]);
  }
  const ready = workflow.nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  const order: string[] = [];
  while (ready.length) {
    ready.sort((a, b) => (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0));
    const id = ready.shift()!;
    order.push(id);
    for (const targetId of outgoing.get(id) ?? []) {
      const next = (indegree.get(targetId) ?? 0) - 1;
      indegree.set(targetId, next);
      if (next === 0) ready.push(targetId);
    }
  }
  const byId = new Map(workflow.nodes.map((node) => [node.id, node]));
  return order.map((id) => byId.get(id)!);
}

function readPath(value: unknown, path: string): unknown {
  return path.split(".").filter(Boolean).reduce<unknown>((cursor, key) => {
    if (!cursor || typeof cursor !== "object") return undefined;
    return (cursor as Record<string, unknown>)[key];
  }, value);
}

function evaluateCondition(node: FlowNode, input: Record<string, unknown>) {
  const path = String(node.parameters.fieldPath ?? "");
  const left = readPath(input, path);
  const operator = String(node.parameters.operator ?? ">=");
  const right = node.parameters.compareValue;
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  const numeric = left !== undefined && left !== null && String(left).trim() !== "" &&
    Number.isFinite(leftNumber) && Number.isFinite(rightNumber);
  let result: boolean;
  switch (operator) {
    case "isEmpty": result = left === undefined || left === null || left === ""; break;
    case ">=": result = numeric && leftNumber >= rightNumber; break;
    case "<=": result = numeric && leftNumber <= rightNumber; break;
    case "==": result = numeric ? leftNumber === rightNumber : String(left) === String(right); break;
    case "!=": result = numeric ? leftNumber !== rightNumber : String(left) !== String(right); break;
    default: throw new WorkflowNodeExecutionError(`Unsupported condition operator: ${operator}`);
  }
  return {
    ...input,
    condition: { fieldPath: path, operator, compareValue: right, actualValue: left, result },
    branchSelected: result ? "true" : "false",
  };
}

function executeSafeNode(node: FlowNode, input: Record<string, unknown>, mode: WorkflowRunMode) {
  if (node.type === "trigger_manual") {
    return { status: "success" as const, output: { ...input, trigger: { type: "manual" } }, message: "Manual trigger received input." };
  }
  if (node.type === "trigger_webhook") {
    return { status: "success" as const, output: { ...input, trigger: { type: "webhook" } }, message: "Authenticated webhook payload accepted." };
  }
  if (node.type === "ai_website_qa") {
    const url = String(node.parameters.url ?? "https://example.com");
    const config = JSON.parse(String(node.parameters.config ?? "{}"));
    return {
      status: "preview" as const,
      output: {
        ...input,
        _automation: {
          previewOnly: true,
          nodeType: "ai_website_qa",
          url,
          report: {
            url,
            timestamp: new Date().toISOString(),
            viewport: config.viewport ?? "desktop",
            passed: true,
            summary: { critical: 0, warning: 0, info: 0, total: 0 },
            issues: [],
          },
        },
      },
      message: `Website QA check (preview only) for ${url}`,
    };
  }
  if (node.type === "ai_website_analysis") {
    const report = JSON.parse(node.parameters.report ?? "{}") as QAReport;
    const analysis = analyzeQAReport(report);
    return {
      status: "preview" as const,
      output: {
        ...input,
        _automation: {
          previewOnly: true,
          nodeType: "ai_website_analysis",
          analysis: {
            result: analysis.result,
            score: analysis.score,
            summary: analysis.summary,
            recommendations: analysis.recommendations,
          },
        },
      },
      message: `QA report analyzed (preview only): ${analysis.result} (score: ${analysis.score})`,
    };
  }
  if (node.type === "logic_if_condition") {
    return { status: "success" as const, output: evaluateCondition(node, input), message: "Condition evaluated and selected an output branch." };
  }
  if (node.type === "logic_deduplicate") {
    const field = String(node.parameters.uniqueKey ?? "phone");
    const rows = Array.isArray(input.items) ? input.items : Array.isArray(input) ? input : null;
    if (!rows) return { status: "success" as const, output: input, message: "No items array was provided; input passed through." };
    const seen = new Set<string>();
    const unique = rows.filter((row) => {
      const item = asRecord(row);
      let key: string;
      if (field === "name_city") key = `${String(item.businessName ?? item.name ?? "").trim().toLowerCase()}|${String(item.city ?? item.location ?? "").trim().toLowerCase()}`;
      else if (field === "phone") key = String(item[field] ?? "").replace(/\D/g, "");
      else key = String(item[field] ?? "").trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { status: "success" as const, output: { ...input, items: unique, inputCount: rows.length, uniqueCount: unique.length }, message: `Removed ${rows.length - unique.length} duplicate item(s).` };
  }
  if (node.type.startsWith("trigger_")) {
    return { status: "skipped" as const, output: input, message: `${node.name} requires its own trigger source and was skipped in a manual run.` };
  }
  const definition = NODE_TYPE_REGISTRY[node.type];
  if (definition.category === "logic" && node.type === "logic_delay") {
    return { status: mode === "dry_run" ? "preview" as const : "success" as const, output: input, message: mode === "dry_run" ? "Delay recorded as a preview; no wait was performed." : "Delay adapter is not enabled." };
  }
  if (mode === "dry_run") {
    return {
      status: "preview" as const,
      output: {
        ...input,
        _automation: { previewOnly: true, nodeType: node.type, note: "No provider call was made; this output is not a provider result." },
      },
      message: `${definition.name} is preview-only; no provider call was made.`,
    };
  }
  throw new WorkflowNodeExecutionError(`${definition.name} has no live server adapter configured. No action was performed.`);
}

export async function executeWorkflow(
  workflowInput: unknown,
  options: WorkflowRunOptions
): Promise<{ output: Record<string, unknown>; steps: WorkflowStepResult[]; status: "completed" | "preview_completed" }> {
  const workflow = parseWorkflowDefinition(workflowInput);
  const orderedNodes = orderNodes(workflow);
  const outputs = new Map<string, Record<string, unknown>>();
  const steps: WorkflowStepResult[] = [];

  for (let index = 0; index < orderedNodes.length; index += 1) {
    if (await options.isCancelled?.()) throw new WorkflowCancelledError();
    const node = orderedNodes[index];
    const incoming = workflow.connections.filter((connection) => connection.toNodeId === node.id);
    const eligible = incoming.filter((connection) => {
      const upstream = outputs.get(connection.fromNodeId);
      if (!upstream) return false;
      const branch = upstream.branchSelected;
      return typeof branch !== "string" || branch === connection.fromPortId;
    });
    const input = Object.assign({}, ...eligible.map((connection) => outputs.get(connection.fromNodeId) ?? {}),
      incoming.length === 0 ? options.input : {});
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    let result: ReturnType<typeof executeSafeNode>;

    await options.onStepStart?.(node, index, input, startedAt);

    try {
      if (node.disabled) {
        result = { status: "skipped", output: input, message: "Disabled node passed its input through." };
      } else if (incoming.length > 0 && eligible.length === 0) {
        result = { status: "skipped", output: input, message: "Skipped because the selected branch did not lead here." };
      } else {
        result = executeSafeNode(node, input, options.mode);
      }
    } catch (error) {
      const executionError = error instanceof Error ? error : new Error("Node execution failed.");
      await options.onStepError?.(node, index, input, startedAt, executionError);
      throw executionError;
    }

    outputs.set(node.id, result.output);
    const completedAt = new Date().toISOString();
    const step: WorkflowStepResult = {
      node,
      index,
      status: result.status,
      input,
      output: result.output,
      startedAt,
      completedAt,
      durationMs: Date.now() - startedMs,
      message: result.message,
    };
    steps.push(step);
    await options.onStep?.(step);
  }

  const terminalOutputs = orderedNodes
    .filter((node) => !workflow.connections.some((edge) => edge.fromNodeId === node.id))
    .map((node) => outputs.get(node.id) ?? {});
  const hasPreview = steps.some((step) => step.status === "preview");
  return {
    output: { terminalOutputs },
    steps,
    status: hasPreview ? "preview_completed" : "completed",
  };
}
