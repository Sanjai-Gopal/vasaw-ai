import { describe, it, expect } from "vitest";
import { runScrapingAgent } from "@/lib/agents/scraping/index";
import { MockProvider } from "@/lib/agents/scraping/providers";
import { normalizeRecord } from "@/lib/agents/scraping/normalize";
import { executeWorkflow } from "@/lib/agents/orchestrator/runner";

describe("Global Location Architecture Tests", () => {
  describe("Requirement A: Explicit location 'London, United Kingdom' remains London", () => {
    it("should retain London, United Kingdom in scraping agent results", async () => {
      const response = await runScrapingAgent({
        campaignId: "test-london-camp",
        category: "Restaurant",
        location: "London, United Kingdom",
        limit: 3,
        mode: "mock",
      });

      expect(response.success).toBe(true);
      expect(response.leads.length).toBe(3);
      for (const lead of response.leads) {
        expect(lead.city.toLowerCase()).toContain("london");
        expect(lead.address.toLowerCase()).toContain("london");
        expect(lead.campaignLocation).toBe("London, United Kingdom");
        expect(lead.normalizedLocation).toBe("London, United Kingdom");
      }
    });
  });

  describe("Requirement B: Explicit location 'Tokyo, Japan' remains Tokyo", () => {
    it("should retain Tokyo, Japan in scraping agent results", async () => {
      const response = await runScrapingAgent({
        campaignId: "test-tokyo-camp",
        category: "Cafe",
        location: "Tokyo, Japan",
        limit: 2,
        mode: "mock",
      });

      expect(response.success).toBe(true);
      expect(response.leads.length).toBe(2);
      for (const lead of response.leads) {
        expect(lead.city.toLowerCase()).toContain("tokyo");
        expect(lead.campaignLocation).toBe("Tokyo, Japan");
      }
    });
  });

  describe("Requirement C: Explicit location 'Chennai, India' remains Chennai", () => {
    it("should retain Chennai, India in scraping agent results without defaulting to Coimbatore", async () => {
      const response = await runScrapingAgent({
        campaignId: "test-chennai-camp",
        category: "Restaurant",
        location: "Chennai, India",
        limit: 4,
        mode: "mock",
      });

      expect(response.success).toBe(true);
      expect(response.leads.length).toBe(4);
      for (const lead of response.leads) {
        expect(lead.city.toLowerCase()).toContain("chennai");
        expect(lead.city.toLowerCase()).not.toBe("coimbatore");
        expect(lead.campaignLocation).toBe("Chennai, India");
      }
    });
  });

  describe("Requirement D: Empty or Worldwide location -> Worldwide (Global)", () => {
    it("should normalize empty location to Worldwide (Global) and distribute globally", async () => {
      const provider = new MockProvider();
      const leads = await provider.scrape({
        campaignId: "test-worldwide-camp",
        category: "Restaurant",
        location: "",
        limit: 6,
        mode: "mock",
      });

      expect(leads.length).toBe(6);
      for (const lead of leads) {
        expect(lead.normalizedLocation).toBe("Worldwide (Global)");
      }
      // Verify geographic diversity across multiple cities
      const cities = new Set(leads.map((l) => l.city));
      expect(cities.size).toBeGreaterThan(1);
    });

    it("should handle explicit 'Worldwide' location string", async () => {
      const provider = new MockProvider();
      const leads = await provider.scrape({
        campaignId: "test-worldwide-explicit",
        category: "IT Services",
        location: "Worldwide",
        limit: 4,
        mode: "mock",
      });

      expect(leads.length).toBe(4);
      for (const lead of leads) {
        expect(lead.normalizedLocation).toBe("Worldwide (Global)");
      }
    });
  });

  describe("Requirement E: Arbitrary custom locations handled by dynamic mock provider", () => {
    it("should dynamically synthesize leads for 'Dubai, UAE'", async () => {
      const provider = new MockProvider();
      const leads = await provider.scrape({
        campaignId: "test-dubai-camp",
        category: "Restaurant",
        location: "Dubai, UAE",
        limit: 3,
        mode: "mock",
      });

      expect(leads.length).toBe(3);
      for (const lead of leads) {
        expect(lead.city.toLowerCase()).toContain("dubai");
        expect(lead.address.toLowerCase()).toContain("dubai");
      }
    });

    it("should dynamically synthesize leads for arbitrary regions like 'California' or 'Zurich, Switzerland'", async () => {
      const provider = new MockProvider();
      const leads = await provider.scrape({
        campaignId: "test-zurich-camp",
        category: "Bakery",
        location: "Zurich, Switzerland",
        limit: 3,
        mode: "mock",
      });

      expect(leads.length).toBe(3);
      for (const lead of leads) {
        expect(lead.city).toBe("Zurich");
        expect(lead.address).toContain("Zurich, Switzerland");
      }
    });
  });

  describe("Requirement F & G: Mock vs Live Lead Source Mode & Synthetic Distinguishability", () => {
    it("should mark mock leads as synthetic with source_mode 'mock'", () => {
      const raw = {
        business_name: "Synthetic Bistro",
        category: "Restaurant",
        address: "10 Main St, Sydney, Australia",
        city: "Sydney",
      };

      const lead = normalizeRecord(raw, "Google Maps (Mock)", {
        source_mode: "mock",
        campaignLocation: "Sydney, Australia",
      });

      expect(lead.source_mode).toBe("mock");
      expect(lead.is_synthetic).toBe(true);
      expect(lead.source).toContain("Mock");
    });

    it("should mark live Apify leads as non-synthetic with source_mode 'live'", () => {
      const raw = {
        business_name: "Real Apify Restaurant",
        category: "Restaurant",
        address: "50 Piccadilly, London, UK",
        city: "London",
        place_id: "ChIJ_REAL_APIFY_001",
      };

      const lead = normalizeRecord(raw, "Google Maps (Apify)", {
        source_mode: "live",
        campaignLocation: "London, UK",
      });

      expect(lead.source_mode).toBe("live");
      expect(lead.is_synthetic).toBe(false);
      expect(lead.source).toContain("Apify");
    });
  });

  describe("Requirement H: No hidden Coimbatore fallback through Orchestrator Pipeline", () => {
    it("should execute workflow with custom location 'Berlin, Germany' and propagate throughout", async () => {
      const result = await executeWorkflow({
        campaignId: "wf-berlin-test",
        locations: ["Berlin, Germany"],
        categories: ["Cafe"],
        maxItems: 2,
        mode: "mock",
        skipOutreach: true,
      });

      expect(result.success).toBe(true);
      expect(result.stats.scraped).toBe(2);
      for (const lead of result.leadResults) {
        expect((lead.city || "").toLowerCase()).toContain("berlin");
        expect((lead.city || "").toLowerCase()).not.toBe("coimbatore");
      }
    });
  });
});
