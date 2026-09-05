import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  executeWorkflow,
  resumeWorkflow,
  cancelWorkflow,
  getWorkflowStatus,
  executeCampaign,
  isValidTransition,
  transitionLead,
  WORKFLOW_STAGE_ORDER,
  getNextStage,
  sanitizeOrchestrationError,
} from "@/lib/agents/orchestrator";
import { POST as orchestratorApiHandler } from "@/app/api/agents/orchestrator/route";
import { NextRequest } from "next/server";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => {
  return {
    getSupabaseAdmin: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "test-insert-id" }, error: null }),
          }),
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "test-id" }, error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "lead-1", status: "scraped" }, error: null }),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    }),
  };
});

describe("Orchestrator — Agents 1 to 6 Coordinator", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ==========================================
  // 1. Validation & Campaign Input
  // ==========================================
  describe("Validation & Campaign Input", () => {
    it("should reject workflow execution when campaignId is missing or empty", async () => {
      await expect(
        executeWorkflow({
          campaignId: "",
          locations: ["Coimbatore"],
          categories: ["restaurant"],
          mode: "mock",
        })
      ).rejects.toThrow(/campaignId/);
    });

    it("should reject workflow execution when locations are missing or empty", async () => {
      await expect(
        executeWorkflow({
          campaignId: "test-camp",
          locations: [],
          categories: ["restaurant"],
          mode: "mock",
        })
      ).rejects.toThrow(/locations/);
    });

    it("should reject workflow execution when categories are missing or empty", async () => {
      await expect(
        executeWorkflow({
          campaignId: "test-camp",
          locations: ["Coimbatore"],
          categories: [],
          mode: "mock",
        })
      ).rejects.toThrow(/categories/);
    });
  });

  // ==========================================
  // 2. Full 6-Agent End-to-End Execution
  // ==========================================
  describe("Complete Six-Agent Workflow Execution", () => {
    it("should coordinate Agents 1 to 6 through complete mock workflow successfully", async () => {
      const result = await executeWorkflow({
        campaignId: "campaign-full-001",
        locations: ["Coimbatore"],
        categories: ["restaurant"],
        maxItems: 2,
        mode: "mock",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("COMPLETED");
      expect(result.currentStage).toBe("COMPLETED");

      // Verify all 6 stages completed
      expect(result.stages.scraping).toBe("COMPLETED");
      expect(result.stages.qualifying).toBe("COMPLETED");
      expect(result.stages.storing).toBe("COMPLETED");
      expect(result.stages.website).toBe("COMPLETED");
      expect(result.stages.deployment).toBe("COMPLETED");
      expect(result.stages.whatsapp).toBe("COMPLETED");

      // Verify stats
      expect(result.stats.scraped).toBeGreaterThan(0);
      expect(result.stats.qualified).toBeGreaterThan(0);
      expect(result.stats.websitesBuilt).toBeGreaterThan(0);
      expect(result.stats.websitesDeployed).toBeGreaterThan(0);
      expect(result.stats.messagesSent).toBeGreaterThan(0);
      expect(result.stats.durationMs).toBeGreaterThan(0);

      // Verify Lead Lifecycle transitions
      for (const leadResult of result.leadResults) {
        if (leadResult.qualified && leadResult.websiteEligible) {
          expect(leadResult.websiteStatus).toBe("READY");
          expect(leadResult.deploymentStatus).toBe("READY");
          expect(leadResult.liveUrl).toBeDefined();
          expect(leadResult.messageStatus).toBe("SENT");
          // Lead finished in contacted status via Agent 6
          expect(leadResult.currentLifecycleStatus).toBe("contacted");
        }
      }
    });

    it("should support skipOutreach option to stop before WhatsApp stage", async () => {
      const result = await executeWorkflow({
        campaignId: "campaign-skip-outreach",
        locations: ["Coimbatore"],
        categories: ["restaurant"],
        maxItems: 2,
        mode: "mock",
        skipOutreach: true,
      });

      expect(result.success).toBe(true);
      expect(result.stages.deployment).toBe("COMPLETED");
      expect(result.stages.whatsapp).toBe("SKIPPED");
      expect(result.stats.messagesSent).toBe(0);

      const deployedLead = result.leadResults.find((l) => l.deploymentStatus === "READY");
      if (deployedLead) {
        // Deployed lead stays in website_deployed status when outreach is skipped
        expect(deployedLead.currentLifecycleStatus).toBe("website_deployed");
      }
    });
  });

  // ==========================================
  // 3. State Machine & Lead Lifecycle Transitions
  // ==========================================
  describe("State Machine & Lifecycle Transitions", () => {
    it("should validate allowed lead lifecycle transitions", () => {
      expect(isValidTransition("new", "scraped")).toBe(true);
      expect(isValidTransition("scraped", "checking")).toBe(true);
      expect(isValidTransition("checking", "qualified")).toBe(true);
      expect(isValidTransition("qualified", "website_building")).toBe(true);
      expect(isValidTransition("website_building", "website_ready")).toBe(true);
      expect(isValidTransition("website_ready", "deploying")).toBe(true);
      expect(isValidTransition("deploying", "deployed")).toBe(true);
      expect(isValidTransition("deployed", "contacted")).toBe(true);
      expect(isValidTransition("website_deployed", "contacted")).toBe(true);
      expect(isValidTransition("contacted", "replied")).toBe(true);
    });

    it("should reject illegal lead lifecycle transitions", () => {
      expect(isValidTransition("new", "deployed")).toBe(false);
      expect(isValidTransition("scraped", "contacted")).toBe(false);
      expect(isValidTransition("rejected", "deployed")).toBe(false);
    });

    it("should execute transitionLead without throwing for valid transitions", async () => {
      await expect(
        transitionLead("lead-1", "checking", "orchestrator")
      ).resolves.not.toThrow();
    });

    it("should throw for invalid transitions in transitionLead", async () => {
      await expect(
        transitionLead("lead-1", "deployed", "orchestrator")
      ).rejects.toThrow(/Invalid transition/);
    });

    it("should define stage order sequence correctly", () => {
      expect(WORKFLOW_STAGE_ORDER).toEqual([
        "SCRAPING",
        "QUALIFYING",
        "STORING",
        "BUILDING_WEBSITE",
        "DEPLOYING",
        "CONTACTING",
        "COMPLETED",
      ]);
    });

    it("should advance correctly to next stage using getNextStage", () => {
      expect(getNextStage("SCRAPING")).toBe("QUALIFYING");
      expect(getNextStage("QUALIFYING")).toBe("STORING");
      expect(getNextStage("STORING")).toBe("BUILDING_WEBSITE");
      expect(getNextStage("BUILDING_WEBSITE")).toBe("DEPLOYING");
      expect(getNextStage("DEPLOYING")).toBe("CONTACTING");
      expect(getNextStage("CONTACTING")).toBe("COMPLETED");
      expect(getNextStage("COMPLETED")).toBeNull();
    });
  });

  // ==========================================
  // 4. Cancellation & Workflow Status
  // ==========================================
  describe("Cancellation & Status Tracking", () => {
    it("should register cancellation and stop downstream stages", async () => {
      const workflowId = "wf-cancel-test-1";
      cancelWorkflow(workflowId);

      const result = await executeWorkflow({
        campaignId: "camp-cancelled",
        locations: ["Coimbatore"],
        categories: ["restaurant"],
        workflowId,
        mode: "mock",
      });

      expect(result.status).toBe("CANCELLED");
      expect(result.stages.scraping).toBe("PENDING");
      expect(result.stages.deployment).toBe("PENDING");
    });

    it("should retrieve workflow status by workflowId", async () => {
      const workflowId = "wf-status-test-1";
      const executed = await executeWorkflow({
        campaignId: "camp-status",
        locations: ["Coimbatore"],
        categories: ["restaurant"],
        maxItems: 1,
        workflowId,
        mode: "mock",
      });

      const retrieved = getWorkflowStatus(workflowId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.workflowId).toBe(workflowId);
      expect(retrieved?.status).toBe(executed.status);
    });
  });

  // ==========================================
  // 5. Resume & Idempotency
  // ==========================================
  describe("Resume & Idempotency", () => {
    it("should return completed result directly on resume of completed workflow", async () => {
      const workflowId = "wf-resume-complete";
      const initial = await executeWorkflow({
        campaignId: "camp-initial",
        locations: ["Coimbatore"],
        categories: ["restaurant"],
        maxItems: 1,
        workflowId,
        mode: "mock",
      });
      expect(initial.status).toBe("COMPLETED");

      const resumed = await resumeWorkflow(workflowId);
      expect(resumed.status).toBe("COMPLETED");
      expect(resumed.workflowId).toBe(workflowId);
    });

    it("should execute executeCampaign backwards-compatible function", async () => {
      const result = await executeCampaign("camp-legacy", ["Coimbatore"], ["restaurant"], {
        maxItems: 1,
        mode: "mock",
      });

      expect(result.success).toBe(true);
      expect(result.campaignId).toBe("camp-legacy");
      expect(result.stages.scraping).toBe("COMPLETED");
    });
  });

  // ==========================================
  // 6. Security & Secret Redaction
  // ==========================================
  describe("Security & Secret Redaction", () => {
    it("should sanitize tokens and secrets from orchestration errors", () => {
      const errorMsg = "Failed with EAAG1234567890abcdef and Bearer secret_12345 and vcp_abcdef123456";
      const sanitized = sanitizeOrchestrationError(new Error(errorMsg));
      expect(sanitized).not.toContain("EAAG1234567890abcdef");
      expect(sanitized).not.toContain("secret_12345");
      expect(sanitized).not.toContain("vcp_abcdef123456");
      expect(sanitized).toContain("[REDACTED_TOKEN]");
      expect(sanitized).toContain("[REDACTED_VERCEL_TOKEN]");
    });
  });

  // ==========================================
  // 7. API Route Handlers
  // ==========================================
  describe("API Route Handlers", () => {
    it("should start workflow via POST /api/agents/orchestrator with 200", async () => {
      const req = new NextRequest("http://localhost:3000/api/agents/orchestrator", {
        method: "POST",
        body: JSON.stringify({
          action: "start",
          campaignId: "camp-api-test",
          locations: ["Coimbatore"],
          categories: ["restaurant"],
          maxItems: 1,
          mode: "mock",
        }),
      });

      const res = await orchestratorApiHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.agent).toBe("orchestrator");
      expect(json.result?.status).toBe("COMPLETED");
    });

    it("should reject invalid request with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/agents/orchestrator", {
        method: "POST",
        body: JSON.stringify({
          action: "start",
          campaignId: "",
        }),
      });

      const res = await orchestratorApiHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("should return workflow status via POST /api/agents/orchestrator action='status'", async () => {
      const workflowId = "wf-api-status-check";
      await executeWorkflow({
        campaignId: "camp-status-api",
        locations: ["Coimbatore"],
        categories: ["restaurant"],
        maxItems: 1,
        workflowId,
        mode: "mock",
      });

      const req = new NextRequest("http://localhost:3000/api/agents/orchestrator", {
        method: "POST",
        body: JSON.stringify({
          action: "status",
          workflowId,
        }),
      });

      const res = await orchestratorApiHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.result?.workflowId).toBe(workflowId);
    });

    it("should cancel workflow via POST /api/agents/orchestrator action='cancel'", async () => {
      const req = new NextRequest("http://localhost:3000/api/agents/orchestrator", {
        method: "POST",
        body: JSON.stringify({
          action: "cancel",
          workflowId: "wf-to-cancel",
        }),
      });

      const res = await orchestratorApiHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe("CANCELLED");
    });
  });
});
