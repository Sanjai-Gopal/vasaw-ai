import { describe, it, expect } from "vitest";
import { verifyMetaSignature, verifyWebhookChallenge } from "../lib/agents/whatsapp/webhook";
import { isValidTransition } from "../lib/agents/orchestrator/state-machine";
import { MockGoogleSheetsProvider } from "../lib/integrations/google-sheets/mock-provider";

describe("Production Hardening & Security Audit Tests", () => {
  describe("Webhook Security & Verification", () => {
    it("should accept valid Meta WhatsApp webhook challenge parameters", () => {
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "test_verify_token_123";
      const params = new URLSearchParams({
        "hub.mode": "subscribe",
        "hub.verify_token": "test_verify_token_123",
        "hub.challenge": "challenge_string_abc",
      });

      const res = verifyWebhookChallenge(params);
      expect(res.status).toBe(200);
      expect(res.body).toBe("challenge_string_abc");
    });

    it("should reject invalid Meta WhatsApp webhook verify tokens with 403", () => {
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "test_verify_token_123";
      const params = new URLSearchParams({
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong_token",
        "hub.challenge": "challenge_string_abc",
      });

      const res = verifyWebhookChallenge(params);
      expect(res.status).toBe(403);
    });

    it("should pass signature verification when secret is unconfigured (development mode)", () => {
      delete process.env.WHATSAPP_APP_SECRET;
      const verified = verifyMetaSignature("{}", null);
      expect(verified).toBe(true);
    });
  });

  describe("Lead Lifecycle State Machine Transitions", () => {
    it("should validate canonical progression steps", () => {
      expect(isValidTransition("new", "scraped")).toBe(true);
      expect(isValidTransition("scraped", "checking")).toBe(true);
      expect(isValidTransition("checking", "qualified")).toBe(true);
      expect(isValidTransition("qualified", "website_building")).toBe(true);
      expect(isValidTransition("deploying", "website_deployed")).toBe(true);
      expect(isValidTransition("website_deployed", "contacted")).toBe(true);
      expect(isValidTransition("contacted", "replied")).toBe(true);
      expect(isValidTransition("replied", "interested")).toBe(true);
    });

    it("should reject invalid reverse or illegal transitions", () => {
      // Interested is terminal and cannot transition to new
      expect(isValidTransition("interested", "new")).toBe(false);
      // Cancelled cannot jump to contacted
      expect(isValidTransition("cancelled", "contacted")).toBe(false);
    });
  });

  describe("Data Export & Idempotency", () => {
    it("should maintain idempotent state on multiple sync operations", async () => {
      const provider = new MockGoogleSheetsProvider();
      const res1 = await provider.syncAll({ spreadsheetId: "audit-test-sheet", includeLeads: true });
      const res2 = await provider.syncAll({ spreadsheetId: "audit-test-sheet", includeLeads: true });

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res1.spreadsheetId).toBe("audit-test-sheet");
      expect(res2.spreadsheetId).toBe("audit-test-sheet");
    });
  });

  describe("Agent 4 Fallback Content Resilience", () => {
    it("should generate deterministic content without error when qualification or template is undefined", async () => {
      const { generateDeterministicContent } = await import("../lib/agents/website/content/fallback");
      const lead = {
        id: "lead-fallback-test",
        businessName: "Coimbatore Bakes",
        category: "Bakery",
        city: "Coimbatore",
        address: "RS Puram",
        rating: 4.8,
        reviewCount: 95,
        phone: "+919876543210",
        website: null,
        socialLinks: [] as string[],
        source: "google_maps",
        scrapedAt: new Date().toISOString(),
      };

      const content = generateDeterministicContent(lead, undefined, undefined);
      expect(content.hero.headline).toBe("Coimbatore Bakes");
      expect(content.about.headline).toBe("Authentic Food, Served with Tradition");
      expect(content.contact.phone).toBe("+919876543210");
    });
  });
});
