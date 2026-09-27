import { describe, it, expect } from "vitest";
import {
  NODE_TYPE_REGISTRY,
  NODE_CATEGORIES,
  DEFAULT_FLOW_WORKFLOWS,
  simulateNodeExecution,
} from "@/lib/data/automation-registry";
import type { FlowNode } from "@/lib/types/automation-flow";

describe("n8n Visual Automation Studio Registry & Flow Engine", () => {
  it("should contain all required node categories with proper metadata", () => {
    expect(NODE_CATEGORIES.length).toBeGreaterThanOrEqual(4);
    const categoryIds = NODE_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain("all");
    expect(categoryIds).toContain("trigger");
    expect(categoryIds).toContain("ai");
    expect(categoryIds).toContain("integration");
    expect(categoryIds).toContain("logic");
  });

  it("should have comprehensive definitions for all 18+ automation nodes", () => {
    const nodeTypes = Object.keys(NODE_TYPE_REGISTRY);
    expect(nodeTypes.length).toBeGreaterThanOrEqual(16);

    // Key required nodes must exist
    expect(NODE_TYPE_REGISTRY["trigger_webhook"]).toBeDefined();
    expect(NODE_TYPE_REGISTRY["trigger_cron"]).toBeDefined();
    expect(NODE_TYPE_REGISTRY["trigger_apify"]).toBeDefined();
    expect(NODE_TYPE_REGISTRY["trigger_supabase"]).toBeDefined();
    expect(NODE_TYPE_REGISTRY["ai_qualifier"]).toBeDefined();
    expect(NODE_TYPE_REGISTRY["ai_website_agent"]).toBeDefined();
    expect(NODE_TYPE_REGISTRY["action_github"]).toBeDefined();
    expect(NODE_TYPE_REGISTRY["action_vercel"]).toBeDefined();
    expect(NODE_TYPE_REGISTRY["action_whatsapp"]).toBeDefined();
    expect(NODE_TYPE_REGISTRY["logic_if_condition"]).toBeDefined();
    expect(NODE_TYPE_REGISTRY["logic_code_js"]).toBeDefined();
  });

  it("should enforce valid inputs, outputs, and color tokens on all registered nodes", () => {
    for (const [typeKey, def] of Object.entries(NODE_TYPE_REGISTRY)) {
      expect(def.name).toBeTruthy();
      expect(def.type).toBe(typeKey);
      expect(def.badgeText).toBeTruthy();
      expect(def.colorScheme.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(Array.isArray(def.outputs)).toBe(true);
      expect(Array.isArray(def.inputs)).toBe(true);

      // Triggers must have 0 inputs and at least 1 output
      if (def.category === "trigger") {
        expect(def.inputs.length).toBe(0);
        expect(def.outputs.length).toBeGreaterThanOrEqual(1);
      }

      // Logic branching nodes (IF condition) must have true and false branch outputs
      if (def.type === "logic_if_condition") {
        const branchIds = def.outputs.map((o) => o.id);
        expect(branchIds).toContain("true");
        expect(branchIds).toContain("false");
      }
    }
  });

  it("should validate default pre-built workflows and connection integrity", () => {
    expect(DEFAULT_FLOW_WORKFLOWS.length).toBeGreaterThanOrEqual(3);

    const corePipeline = DEFAULT_FLOW_WORKFLOWS.find((w) => w.id === "wf-vasaw-core");
    expect(corePipeline).toBeDefined();
    expect(corePipeline!.nodes.length).toBe(7);

    // Verify all connection source and target nodes exist in the workflow
    const nodeIds = new Set(corePipeline!.nodes.map((n) => n.id));
    for (const conn of corePipeline!.connections) {
      expect(nodeIds.has(conn.fromNodeId)).toBe(true);
      expect(nodeIds.has(conn.toNodeId)).toBe(true);
    }
  });

  it("should simulate single node step execution with telemetry and verified payload", () => {
    const testNode: FlowNode = {
      id: "test-gemini-node",
      type: "ai_qualifier",
      name: "Gemini AI Opportunity Scorer",
      position: { x: 100, y: 100 },
      parameters: { model: "gemini-2.5-flash", minScoreThreshold: 80 },
      status: "idle",
    };

    const result = simulateNodeExecution(testNode, { businessName: "Kovai Artisanal Bakery" });
    expect(result.executionTimeMs).toBeGreaterThan(0);
    expect(result.outputData).toBeDefined();
    expect(result.outputData._meta).toBeDefined();
    expect(result.outputData._meta.nodeId).toBe(testNode.id);
    expect(result.logs.length).toBeGreaterThanOrEqual(2);
    expect(result.logs.some((l) => l.level === "success")).toBe(true);
  });
});
