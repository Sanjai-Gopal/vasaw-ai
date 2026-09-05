import { describe, it, expect } from "vitest";
import { runQualificationAgent, validateRequest, qualifyLeadsSync } from "@/lib/agents/qualification";
import { calculateQualification, calculateQualifications } from "@/lib/agents/qualification/calculate";
import { MockProvider, AIProvider, getProvider } from "@/lib/agents/qualification/providers";
import type { Lead } from "@/lib/agents/scraping/types";
import type { QualificationResult, QualificationRequest } from "@/lib/agents/qualification/types";

const createMockLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: "test-lead-1",
  externalId: "ext-1",
  businessName: "Test Restaurant",
  category: "Restaurant",
  phone: "+91 422 123 4567",
  website: null,
  address: "123 Test St, Coimbatore",
  city: "Coimbatore",
  rating: 4.5,
  reviewCount: 150,
  socialLinks: ["https://facebook.com/test", "https://instagram.com/test"],
  source: "Google Maps (Mock)",
  scrapedAt: "2025-01-15T10:30:00Z",
  ...overrides,
});

const validRequest: QualificationRequest = {
  leads: [createMockLead()],
  mode: "mock",
};

describe("Qualification Agent", () => {
  describe("validateRequest", () => {
    it("should accept valid request", () => {
      const result = validateRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.request).toEqual(validRequest);
    });

    it("should reject missing leads", () => {
      const { leads, ...rest } = validRequest;
      const result = validateRequest(rest);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("leads");
    });

    it("should reject empty leads array", () => {
      const result = validateRequest({ ...validRequest, leads: [] });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("cannot be empty");
    });

    it("should reject leads array > 100", () => {
      const leads = Array(101).fill(createMockLead());
      const result = validateRequest({ ...validRequest, leads });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("cannot exceed 100");
    });

    it("should reject lead missing id", () => {
      const leads = [{ ...createMockLead(), id: undefined }];
      const result = validateRequest({ ...validRequest, leads });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("id is required");
    });

    it("should reject lead missing businessName", () => {
      const leads = [{ ...createMockLead(), businessName: undefined }];
      const result = validateRequest({ ...validRequest, leads });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("businessName is required");
    });

    it("should default to mock mode", () => {
      const { mode, ...rest } = validRequest;
      const result = validateRequest(rest);
      expect(result.valid).toBe(true);
      expect(result.request?.mode).toBe("mock");
    });

    it("should accept ai mode", () => {
      const result = validateRequest({ ...validRequest, mode: "ai" });
      expect(result.valid).toBe(true);
      expect(result.request?.mode).toBe("ai");
    });

    it("should reject non-object body", () => {
      const result = validateRequest("not an object");
      expect(result.valid).toBe(false);
    });

    it("should reject null body", () => {
      const result = validateRequest(null);
      expect(result.valid).toBe(false);
    });
  });

  describe("calculateQualification", () => {
    it("should give high score for no-website high-rating high-reviews restaurant", () => {
      const lead = createMockLead({
        website: null,
        rating: 4.7,
        reviewCount: 200,
        category: "Restaurant",
      });
      const result = calculateQualification(lead);
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.priority).toBe("high");
      expect(result.websiteOpportunity).toBe(true);
    });

    it("should give lower score when website exists", () => {
      const leadWithWebsite = createMockLead({
        website: "https://professional-site.com",
        rating: 4.5,
        reviewCount: 150,
      });
      const leadWithoutWebsite = createMockLead({
        website: null,
        rating: 4.5,
        reviewCount: 150,
      });
      const resultWith = calculateQualification(leadWithWebsite);
      const resultWithout = calculateQualification(leadWithoutWebsite);
      expect(resultWith.score).toBeLessThan(resultWithout.score);
      expect(resultWith.websiteOpportunity).toBe(false);
      expect(resultWithout.websiteOpportunity).toBe(true);
    });

    it("should give low score for low rating", () => {
      const lead = createMockLead({
        rating: 2.5,
        reviewCount: 5,
        website: null,
      });
      const result = calculateQualification(lead);
      expect(result.score).toBeLessThan(50);
      expect(result.priority).toBe("low");
    });

    it("should give high score for medium rating and reviews with no website", () => {
      const lead = createMockLead({
        rating: 4.0,
        reviewCount: 50,
        website: null,
      });
      const result = calculateQualification(lead);
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.priority).toBe("high");
    });

    it("should include evidence in result", () => {
      const lead = createMockLead();
      const result = calculateQualification(lead);
      expect(result.evidence).toBeDefined();
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it("should include factors in result", () => {
      const lead = createMockLead();
      const result = calculateQualification(lead);
      expect(result.factors).toBeDefined();
      expect(typeof result.factors.hasWebsite).toBe("boolean");
      expect(typeof result.factors.websiteQuality).toBe("number");
      expect(typeof result.factors.rating).toBe("number");
      expect(typeof result.factors.reviewCount).toBe("number");
      expect(typeof result.factors.category).toBe("string");
      expect(typeof result.factors.socialPresence).toBe("boolean");
      expect(typeof result.factors.businessTypeNeedsWebsite).toBe("boolean");
    });

    it("should handle missing social links", () => {
      const lead = createMockLead({ socialLinks: [] });
      const result = calculateQualification(lead);
      expect(result.factors.socialPresence).toBe(false);
    });

    it("should handle missing website", () => {
      const lead = createMockLead({ website: null });
      const result = calculateQualification(lead);
      expect(result.factors.hasWebsite).toBe(false);
      expect(result.factors.websiteQuality).toBe(0);
    });

    it("should clamp rating to 0-5 range", () => {
      const leadHigh = createMockLead({ rating: 10 });
      const resultHigh = calculateQualification(leadHigh);
      expect(resultHigh.factors.rating).toBe(5);

      const leadLow = createMockLead({ rating: -1 });
      const resultLow = calculateQualification(leadLow);
      expect(resultLow.factors.rating).toBe(0);
    });

    it("should detect high website need categories", () => {
      const restaurant = createMockLead({ category: "Restaurant", website: null });
      const salon = createMockLead({ category: "Salon", website: null });
      const gym = createMockLead({ category: "Gym", website: null });
      const clinic = createMockLead({ category: "Clinic", website: null });

      expect(calculateQualification(restaurant).factors.businessTypeNeedsWebsite).toBe(true);
      expect(calculateQualification(salon).factors.businessTypeNeedsWebsite).toBe(true);
      expect(calculateQualification(gym).factors.businessTypeNeedsWebsite).toBe(true);
      expect(calculateQualification(clinic).factors.businessTypeNeedsWebsite).toBe(true);
    });

    it("should detect low website need categories", () => {
      const lead = createMockLead({ category: "Manufacturing", website: null });
      expect(calculateQualification(lead).factors.businessTypeNeedsWebsite).toBe(false);
    });
  });

  describe("calculateQualifications", () => {
    it("should process multiple leads", () => {
      const leads = [
        createMockLead({ id: "1", businessName: "Biz 1" }),
        createMockLead({ id: "2", businessName: "Biz 2" }),
      ];
      const results = calculateQualifications(leads);
      expect(results).toHaveLength(2);
      expect(results[0].leadId).toBe("1");
      expect(results[1].leadId).toBe("2");
    });

    it("should handle empty array", () => {
      const results = calculateQualifications([]);
      expect(results).toEqual([]);
    });
  });

  describe("MockProvider", () => {
    it("should return qualifications for valid request", async () => {
      const provider = new MockProvider();
      const results = await provider.qualify(validRequest);
      expect(results.length).toBe(1);
      expect(results[0].leadId).toBe("test-lead-1");
      expect(results[0].score).toBeGreaterThanOrEqual(0);
      expect(results[0].score).toBeLessThanOrEqual(100);
    });

    it("should return deterministic results", async () => {
      const provider = new MockProvider();
      const results1 = await provider.qualify(validRequest);
      const results2 = await provider.qualify(validRequest);
      expect(results1[0].score).toBe(results2[0].score);
      expect(results1[0].priority).toBe(results2[0].priority);
    });

    it("should process multiple leads", async () => {
      const provider = new MockProvider();
      const leads = [
        createMockLead({ id: "1", businessName: "Biz 1" }),
        createMockLead({ id: "2", businessName: "Biz 2" }),
      ];
      const results = await provider.qualify({ leads, mode: "mock" });
      expect(results.length).toBe(2);
    });
  });

  describe("getProvider", () => {
    it("should return MockProvider for mock mode", () => {
      const provider = getProvider("mock");
      expect(provider).toBeInstanceOf(MockProvider);
    });

    it("should return AIProvider for ai mode", () => {
      const provider = getProvider("ai");
      expect(provider).toBeInstanceOf(AIProvider);
    });
  });

  describe("runQualificationAgent", () => {
    it("should return successful response in mock mode", async () => {
      const result = await runQualificationAgent(validRequest);
      expect(result.success).toBe(true);
      expect(result.agent).toBe("qualification");
      expect(result.mode).toBe("mock");
      expect(result.count).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toHaveProperty("leadId");
      expect(result.results[0]).toHaveProperty("score");
      expect(result.results[0]).toHaveProperty("priority");
      expect(result.results[0]).toHaveProperty("websiteOpportunity");
      expect(result.results[0]).toHaveProperty("reason");
      expect(result.results[0]).toHaveProperty("confidence");
      expect(result.results[0]).toHaveProperty("factors");
      expect(result.results[0]).toHaveProperty("evidence");
    });

    it("should return error response when AI provider fails (no credentials)", async () => {
      const result = await runQualificationAgent({
        ...validRequest,
        mode: "ai",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.count).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe("qualifyLeadsSync", () => {
    it("should synchronously qualify leads", () => {
      const leads = [createMockLead(), createMockLead({ id: "2" })];
      const results = qualifyLeadsSync(leads);
      expect(results.length).toBe(2);
      expect(results[0].leadId).toBe("test-lead-1");
      expect(results[1].leadId).toBe("2");
    });
  });
});