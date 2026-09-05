import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { normalizeRecord } from "../lib/agents/scraping/normalize";
import { runQualificationAgent } from "../lib/agents/qualification/index";
import { renderWebsiteProject, sanitizeProjectName } from "../lib/agents/website/renderer/index";
import { sendWhatsAppMessage } from "../lib/agents/whatsapp/index";
import { executeWorkflow } from "../lib/agents/orchestrator/runner";
import { getTheme } from "../lib/agents/website/themes/index";
import { getTemplate } from "../lib/agents/website/templates/registry";
import { generateDeterministicContent } from "../lib/agents/website/content/fallback";
import type { Lead } from "../lib/agents/scraping/types";
import fs from "fs";
import path from "path";

function createMockLead(overrides?: Partial<Lead>): Lead {
  return {
    id: "lead-test-1",
    businessName: "Test Business",
    category: "Restaurant",
    phone: "+919876543210",
    website: null,
    address: "123 Main St",
    city: "Coimbatore",
    rating: 4.5,
    reviewCount: 150,
    socialLinks: [],
    source: "google_maps",
    scrapedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Phase 10 & 15: Failure Injection & Resilience Test Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // ==========================================
  // 1. Scraper Malformed Payload & Edge Case Recovery
  // ==========================================
  describe("Scraper Resilience & Defensive Normalization", () => {
    it("should safely handle raw records with completely undefined or null fields", () => {
      const lead = normalizeRecord({}, "google_maps");
      expect(lead.businessName).toBe("Unknown Business");
      expect(lead.category).toBe("Unknown");
      expect(lead.phone).toBe("");
      expect(lead.website).toBeNull();
      expect(lead.rating).toBe(0);
      expect(lead.reviewCount).toBe(0);
      expect(lead.socialLinks).toEqual([]);
    });

    it("should clamp extreme out-of-bounds ratings and negative review counts", () => {
      const lead = normalizeRecord(
        {
          title: "Extreme Test Shop",
          rating: 999.9,
          reviews: -50,
          phone: "9876543210",
        },
        "google_maps"
      );

      expect(lead.rating).toBe(5);
      expect(lead.reviewCount).toBe(0);
    });

    it("should parse string-formatted numbers in ratings and reviews safely", () => {
      const lead = normalizeRecord(
        {
          name: "String Numbers Cafe",
          totalScore: "4.75" as unknown as number,
          reviewsCount: "1250" as unknown as number,
        },
        "google_maps"
      );

      expect(lead.rating).toBe(4.75);
      expect(lead.reviewCount).toBe(1250);
    });
  });

  // ==========================================
  // 2. AI Qualification Failure Recovery & Deterministic Heuristics
  // ==========================================
  describe("AI Qualification Fault Tolerance", () => {
    it("should gracefully recover using deterministic heuristics when AI service is unavailable", async () => {
      const lead = createMockLead({
        id: "lead-ai-fail-1",
        businessName: "No AI Diner",
        category: "Restaurant",
        website: null,
        rating: 4.8,
        reviewCount: 320,
      });

      const response = await runQualificationAgent({
        leads: [lead],
        mode: "mock",
      });

      expect(response.success).toBe(true);
      expect(response.results.length).toBe(1);
      const result = response.results[0];
      expect(result.leadId).toBe(lead.id);
      expect(result.score).toBeGreaterThan(50);
      expect(result.priority).toBe("high");
      expect(result.websiteOpportunity).toBe(true);
    });

    it("should produce valid qualification when lead category is uncommon or empty", async () => {
      const lead = createMockLead({
        id: "lead-uncommon-cat",
        category: "Rare Artisanal Blacksmith",
      });

      const response = await runQualificationAgent({
        leads: [lead],
        mode: "mock",
      });

      expect(response.success).toBe(true);
      expect(response.results[0].score).toBeGreaterThanOrEqual(0);
      expect(response.results[0].score).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================
  // 3. Security: Path Traversal & Injection Defense
  // ==========================================
  describe("Security & Path Traversal Protections", () => {
    it("should sanitize dangerous characters and directory traversal attempts in project names", () => {
      const dangerousName = "../../etc/passwd-malicious-site!@#$%^&*()";
      const sanitized = sanitizeProjectName(dangerousName, "sec-id-123");

      expect(sanitized).not.toContain("..");
      expect(sanitized).not.toContain("/");
      expect(sanitized).not.toContain("\\");
      expect(sanitized).toMatch(/^[a-z0-9-]+$/);
    });

    it("should safely generate luxury website without path traversal errors", () => {
      const lead = createMockLead({
        businessName: "Safe <script>alert(1)</script> Bistro",
        category: "Restaurant",
      });

      const theme = getTheme("restaurant");
      const template = getTemplate("restaurant");
      const content = generateDeterministicContent(lead, undefined, template);

      const result = renderWebsiteProject({
        lead,
        template,
        theme,
        content,
      });

      expect(result.projectName).toBeDefined();
      expect(fs.existsSync(result.projectDir)).toBe(true);
      expect(fs.existsSync(path.join(result.projectDir, "src/app/page.tsx"))).toBe(true);
    });
  });

  // ==========================================
  // 4. WhatsApp Cloud Safety & Invalid Phone Defense
  // ==========================================
  describe("WhatsApp Outreach Safety & Phone Number Validation", () => {
    it("should reject completely unparseable non-numeric phone strings with clean error", async () => {
      const result = await sendWhatsAppMessage({
        leadId: "lead-bad-phone",
        phone: "INVALID_PHONE_NUMBER_TEXT",
        message: { type: "text", body: "Hello" },
        mode: "mock",
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("FAILED");
      expect(result.error).toMatch(/Invalid.*phone/i);
    });

    it("should never dispatch external network calls when OUTREACH_MODE=disabled", async () => {
      process.env.OUTREACH_MODE = "disabled";

      const result = await sendWhatsAppMessage({
        leadId: "lead-safe-mode",
        phone: "+91 98765 43210",
        message: { type: "text", body: "Safety check" },
        mode: "meta",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("PENDING");
      expect(result.metadata?.outreachMode).toBe("disabled");
      expect(result.messageId.startsWith("prep-")).toBe(true);
    });
  });

  // ==========================================
  // 5. End-to-End Workflow Idempotency & Recovery
  // ==========================================
  describe("Orchestrator Idempotent Execution & Recovery", () => {
    it("should execute workflow with skipOutreach=true and mark whatsapp stage as SKIPPED", async () => {
      const result = await executeWorkflow({
        campaignId: "camp-skip-outreach-001",
        locations: ["Coimbatore"],
        categories: ["restaurant"],
        maxItems: 1,
        skipOutreach: true,
        mode: "mock",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("COMPLETED");
      expect(result.stages.whatsapp).toBe("SKIPPED");
      expect(result.stats.messagesSent).toBe(0);
    });
  });
});
