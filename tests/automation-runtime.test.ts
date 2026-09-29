import { describe, expect, it } from "vitest";
import { NODE_TYPE_REGISTRY } from "@/lib/data/automation-registry";
import type { FlowConnection, FlowNode, FlowWorkflow } from "@/lib/types/automation-flow";
import { executeWorkflow, parseWorkflowDefinition, WorkflowValidationError } from "@/lib/automation/runtime";

function makeNode(type: string, id: string, parameters: Record<string, unknown> = {}): FlowNode {
  const definition = NODE_TYPE_REGISTRY[type];
  return {
    id,
    type,
    name: definition.name,
    position: { x: 0, y: 0 },
    parameters: { ...definition.defaultData.parameters, ...parameters },
    status: "idle",
  };
}

function makeWorkflow(nodes: FlowNode[], connections: FlowConnection[]): FlowWorkflow {
  return {
    id: "test-workflow",
    name: "Runtime test",
    description: "",
    category: "ops",
    active: false,
    nodes,
    connections,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    runsCount: 0,
  };
}

describe("automation workflow runtime", () => {
  it("rejects cycles before execution", () => {
    const nodes = [makeNode("logic_deduplicate", "a"), makeNode("logic_deduplicate", "b")];
    const connections: FlowConnection[] = [
      { id: "ab", fromNodeId: "a", fromPortId: "out", toNodeId: "b", toPortId: "in" },
      { id: "ba", fromNodeId: "b", fromPortId: "out", toNodeId: "a", toPortId: "in" },
    ];
    expect(() => parseWorkflowDefinition(makeWorkflow(nodes, connections))).toThrow(WorkflowValidationError);
  });

  it("executes in graph order and follows the selected IF branch", async () => {
    const nodes = [
      makeNode("trigger_manual", "trigger"),
      makeNode("logic_if_condition", "condition", { fieldPath: "score", operator: ">=", compareValue: "80" }),
      makeNode("action_whatsapp", "high"),
      makeNode("action_resend_email", "low"),
    ];
    const connections: FlowConnection[] = [
      { id: "1", fromNodeId: "trigger", fromPortId: "out", toNodeId: "condition", toPortId: "in" },
      { id: "2", fromNodeId: "condition", fromPortId: "true", toNodeId: "high", toPortId: "in" },
      { id: "3", fromNodeId: "condition", fromPortId: "false", toNodeId: "low", toPortId: "in" },
    ];
    const execution = await executeWorkflow(makeWorkflow(nodes, connections), { mode: "dry_run", input: { score: 91 } });
    expect(execution.steps.map((step) => step.node.id)).toEqual(["trigger", "condition", "high", "low"]);
    expect(execution.steps.find((step) => step.node.id === "high")?.status).toBe("preview");
    expect(execution.steps.find((step) => step.node.id === "low")?.status).toBe("skipped");
    expect(execution.steps.find((step) => step.node.id === "high")?.output._automation).toMatchObject({ previewOnly: true });
  });

  it("passes data through a disabled node without inventing provider output", async () => {
    const trigger = makeNode("trigger_manual", "trigger");
    const disabledAction = { ...makeNode("action_whatsapp", "send"), disabled: true };
    const check = makeNode("logic_if_condition", "check", { fieldPath: "customer.id", operator: "!=", compareValue: "" });
    const connections: FlowConnection[] = [
      { id: "1", fromNodeId: "trigger", fromPortId: "out", toNodeId: "send", toPortId: "in" },
      { id: "2", fromNodeId: "send", fromPortId: "out", toNodeId: "check", toPortId: "in" },
    ];
    const execution = await executeWorkflow(makeWorkflow([trigger, disabledAction, check], connections), {
      mode: "dry_run",
      input: { customer: { id: "c-1" } },
    });
    expect(execution.steps.find((step) => step.node.id === "send")?.status).toBe("skipped");
    expect(execution.steps.find((step) => step.node.id === "send")?.output.customer).toEqual({ id: "c-1" });
    expect(execution.steps.find((step) => step.node.id === "check")?.status).toBe("success");
  });
});
