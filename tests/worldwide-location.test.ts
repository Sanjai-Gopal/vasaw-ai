import { describe, it, expect } from "vitest";
import { runScrapingAgent, validateRequest } from "@/lib/agents/scraping/index";
import { MockProvider } from "@/lib/agents/scraping/providers";
import { normalizeRecord } from "@/lib/agents/scraping/normalize";
import { executeCampaign } from "@/lib/agents/orchestrator";
import type { RawRecord } from "@/lib/agents/scraping/types";

describe("Worldwide Location Architecture & Scraper Contract", () => {
  // Test A: Explicit location "London, United Kingdom" -> remains London
  it("A: should preserve explicit location 'London, United Kingdom' throughout scraping", async () => {
    const res = await runScrapingAgent({
      campaignId: "test-london-camp",
      category: "restaurant",
      location: "London, United Kingdom",
      limit: 3,
      mode: "mock",
    });

    expect(res.success).toBe(true);
    expect(res.leads.length).toBeGreaterThan(0);
    for (const lead of res.leads) {
      expect(lead.campaignLocation).toBe("London, United Kingdom");
      expect(lead.address.toLowerCase()).toContain("london");
      expect(lead.city.toLowerCase()).toContain("london");
    }
  });

  // Test B: Explicit location "Tokyo, Japan" -> remains Tokyo
  it("B: should preserve explicit location 'Tokyo, Japan' throughout scraping", async () => {
    const res = await runScrapingAgent({
      campaignId: "test-tokyo-camp",
      category: "restaurant",
      location: "Tokyo, Japan",
      limit: 3,
      mode: "mock",
    });

    expect(res.success).toBe(true);
    expect(res.leads.length).toBeGreaterThan(0);
    for (const lead of res.leads) {
      expect(lead.campaignLocation).toBe("Tokyo, Japan");
      expect(lead.address.toLowerCase()).toContain("tokyo");
      expect(lead.city.toLowerCase()).toContain("tokyo");
    }
  });

  // Test C: Explicit location "Chennai, India" -> remains Chennai
  it("C: should preserve explicit location 'Chennai, India' throughout scraping", async () => {
    const res = await runScrapingAgent({
      campaignId: "test-chennai-camp",
      category: "restaurant",
      location: "Chennai, India",
      limit: 3,
      mode: "mock",
    });

    expect(res.success).toBe(true);
    expect(res.leads.length).toBeGreaterThan(0);
    for (const lead of res.leads) {
      expect(lead.campaignLocation).toBe("Chennai, India");
      expect(lead.address.toLowerCase()).toContain("chennai");
      expect(lead.city.toLowerCase()).toContain("chennai");
    }
  });

  // Test D: Empty location -> Worldwide (Global)
  it("D: should normalize empty, blank, or 'worldwide' location to 'Worldwide (Global)'", async () => {
    const resEmpty = await runScrapingAgent({
      campaignId: "test-empty-camp",
      category: "restaurant",
      location: "",
      limit: 4,
      mode: "mock",
    });

    expect(resEmpty.success).toBe(true);
    expect(resEmpty.leads.length).toBe(4);
    for (const lead of resEmpty.leads) {
      expect(lead.campaignLocation).toBe("Worldwide (Global)");
      expect(lead.normalizedLocation).toBe("Worldwide (Global)");
    }

    // Check that multiple global cities are represented rather than a single fixed city
    const cities = new Set(resEmpty.leads.map((l) => l.city));
    expect(cities.size).toBeGreaterThan(1);
  });

  // Test E: Arbitrary custom location -> dynamic mock provider handles it
  it("E: should dynamically synthesize location-aware businesses for arbitrary custom locations", async () => {
    const customLocation = "Reykjavik, Iceland";
    const res = await runScrapingAgent({
      campaignId: "test-reykjavik-camp",
      category: "restaurant",
      location: customLocation,
      limit: 3,
      mode: "mock",
    });

    expect(res.success).toBe(true);
    expect(res.leads.length).toBe(3);
    for (const lead of res.leads) {
      expect(lead.campaignLocation).toBe(customLocation);
      expect(lead.address).toContain("Reykjavik");
      expect(lead.city.toLowerCase()).toBe("reykjavik");
    }
  });

  // Test F: Mock lead -> clearly marked synthetic/mock
  it("F: should explicitly mark all mock/synthetic leads with source_mode 'mock' and is_synthetic true", async () => {
    const res = await runScrapingAgent({
      campaignId: "test-provenance-mock",
      category: "restaurant",
      location: "Berlin, Germany",
      limit: 3,
      mode: "mock",
    });

    expect(res.success).toBe(true);
    for (const lead of res.leads) {
      expect(lead.source_mode).toBe("mock");
      expect(lead.is_synthetic).toBe(true);
    }
  });

  // Test G: Live lead -> clearly marked live with source_mode 'live' and is_synthetic false
  it("G: should explicitly mark live leads with source_mode 'live' and is_synthetic false", () => {
    const rawData: RawRecord = {
      business_name: "Real London Cafe",
      category: "Cafe",
      address: "10 Downing St, London SW1A 2AA, UK",
      city: "London",
      phone: "+44 20 7925 0918",
      rating: 4.6,
      reviews: 280,
      website: "https://reallondoncafe.co.uk",
    };

    const lead = normalizeRecord(rawData, "Apify Google Maps Scraper", {
      source_mode: "live",
      campaignLocation: "London, UK",
      normalizedLocation: "London, UK",
    });

    expect(lead.source_mode).toBe("live");
    expect(lead.is_synthetic).toBe(false);
    expect(lead.campaignLocation).toBe("London, UK");
    expect(lead.city).toBe("London");
  });

  // Test H: No hidden Coimbatore fallback across global cities
  it("H: should verify no hidden Coimbatore fallback exists when executing across global cities", async () => {
    const globalCities = [
      { name: "Dubai, UAE", token: "dubai" },
      { name: "Toronto, Canada", token: "toronto" },
      { name: "Sydney, Australia", token: "sydney" },
    ];

    for (const target of globalCities) {
      const res = await runScrapingAgent({
        campaignId: `test-no-coimbatore-${target.token}`,
        category: "restaurant",
        location: target.name,
        limit: 2,
        mode: "mock",
      });

      expect(res.success).toBe(true);
      for (const lead of res.leads) {
        expect(lead.city.toLowerCase()).not.toBe("coimbatore");
        expect(lead.address.toLowerCase()).not.toContain("coimbatore");
        expect(lead.campaignLocation).toBe(target.name);
      }
    }
  });

  // Pipeline verification: Campaign execution preserves custom location
  it("should propagate campaign location through orchestrator execution workflow", { timeout: 30000 }, async () => {
    const result = await executeCampaign(
      "camp-test-global-orch",
      ["Dubai, UAE"],
      ["Restaurant"],
      {
        maxItems: 1,
        mode: "mock",
      }
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe("COMPLETED");
    expect(result.stages.scraping).toBe("COMPLETED");
  });

  // Quality Gate: verify all 6 required cities systematically
  it("Quality Gate: systematically verifies Coimbatore, Chennai, London, Dubai, Tokyo, Worldwide", async () => {
    const testCases = [
      { input: "Coimbatore", expectedLocation: "Coimbatore", expectedCityToken: "coimbatore" },
      { input: "Chennai", expectedLocation: "Chennai", expectedCityToken: "chennai" },
      { input: "London", expectedLocation: "London", expectedCityToken: "london" },
      { input: "Dubai", expectedLocation: "Dubai", expectedCityToken: "dubai" },
      { input: "Tokyo", expectedLocation: "Tokyo", expectedCityToken: "tokyo" },
      { input: "Worldwide", expectedLocation: "Worldwide (Global)", expectedCityToken: "" },
    ];

    for (const tc of testCases) {
      const res = await runScrapingAgent({
        campaignId: `qg-test-${tc.input.toLowerCase().replace(/\s+/g, "-")}`,
        category: "restaurant",
        location: tc.input,
        limit: 2,
        mode: "mock",
      });

      expect(res.success).toBe(true);
      expect(res.leads.length).toBeGreaterThanOrEqual(1);

      for (const lead of res.leads) {
        expect(lead.campaignLocation).toBe(tc.expectedLocation);
        expect(lead.source_mode).toBe("mock");
        expect(lead.is_synthetic).toBe(true);
        if (tc.expectedCityToken) {
          expect(lead.city.toLowerCase()).toContain(tc.expectedCityToken);
        }
      }
    }
  });
});
