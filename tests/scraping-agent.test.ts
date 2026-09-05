import { describe, it, expect, beforeAll } from "vitest";
import { runScrapingAgent, validateRequest } from "@/lib/agents/scraping/index";
import { normalizeRecord, normalizeRecords } from "@/lib/agents/scraping/normalize";
import { MockProvider, ApifyProvider, getProvider } from "@/lib/agents/scraping/providers";
import type { Lead, ScrapingRequest, RawRecord } from "@/lib/agents/scraping/types";

describe("Scraping Agent", () => {
  const validRequest: ScrapingRequest = {
    campaignId: "test-campaign",
    category: "restaurant",
    location: "Coimbatore",
    limit: 5,
    mode: "mock",
  };

  describe("validateRequest", () => {
    it("should accept valid request", () => {
      const result = validateRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.request).toEqual(validRequest);
    });

    it("should reject missing campaignId", () => {
      const { campaignId, ...rest } = validRequest;
      const result = validateRequest(rest);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("campaignId");
    });

    it("should reject missing category", () => {
      const { category, ...rest } = validRequest;
      const result = validateRequest(rest);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("category");
    });

    it("should reject missing location", () => {
      const { location, ...rest } = validRequest;
      const result = validateRequest(rest);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("location");
    });

    it("should reject invalid limit (zero)", () => {
      const result = validateRequest({ ...validRequest, limit: 0 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("limit");
    });

    it("should reject invalid limit (negative)", () => {
      const result = validateRequest({ ...validRequest, limit: -1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("limit");
    });

    it("should reject invalid limit (>100)", () => {
      const result = validateRequest({ ...validRequest, limit: 101 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("limit");
    });

    it("should reject non-integer limit", () => {
      const result = validateRequest({ ...validRequest, limit: 5.5 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("limit");
    });

    it("should default to mock mode", () => {
      const { mode, ...rest } = validRequest;
      const result = validateRequest(rest);
      expect(result.valid).toBe(true);
      expect(result.request?.mode).toBe("mock");
    });

    it("should accept apify mode", () => {
      const result = validateRequest({ ...validRequest, mode: "apify" });
      expect(result.valid).toBe(true);
      expect(result.request?.mode).toBe("apify");
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

  describe("normalizeRecord", () => {
    it("should normalize complete record", () => {
      const raw: RawRecord = {
        business_name: "Test Restaurant",
        category: "Restaurant",
        phone: "+91 422 123 4567",
        website: "https://test.com",
        address: "123 Test St, Coimbatore, Tamil Nadu",
        city: "Coimbatore",
        rating: 4.5,
        reviews: 100,
        scraped_at: "2025-01-15T10:30:00Z",
        place_id: "ChIJ123",
        social_links: ["https://facebook.com/test"],
      };

      const lead = normalizeRecord(raw, "Test Source");

      expect(lead.businessName).toBe("Test Restaurant");
      expect(lead.category).toBe("Restaurant");
      expect(lead.phone).toBe("+91 422 123 4567");
      expect(lead.website).toBe("https://test.com");
      expect(lead.address).toBe("123 Test St, Coimbatore, Tamil Nadu");
      expect(lead.city).toBe("Coimbatore");
      expect(lead.rating).toBe(4.5);
      expect(lead.reviewCount).toBe(100);
      expect(lead.socialLinks).toEqual(["https://facebook.com/test"]);
      expect(lead.source).toBe("Test Source");
      expect(lead.scrapedAt).toBe("2025-01-15T10:30:00Z");
      expect(lead.externalId).toBe("ChIJ123");
      expect(lead.id).toBeDefined();
    });

    it("should handle missing phone", () => {
      const raw: RawRecord = { business_name: "Test" };
      const lead = normalizeRecord(raw, "Test");
      expect(lead.phone).toBe("");
    });

    it("should handle missing website", () => {
      const raw: RawRecord = { business_name: "Test" };
      const lead = normalizeRecord(raw, "Test");
      expect(lead.website).toBeNull();
    });

    it("should handle missing rating", () => {
      const raw: RawRecord = { business_name: "Test" };
      const lead = normalizeRecord(raw, "Test");
      expect(lead.rating).toBe(0);
    });

    it("should handle missing review count", () => {
      const raw: RawRecord = { business_name: "Test" };
      const lead = normalizeRecord(raw, "Test");
      expect(lead.reviewCount).toBe(0);
    });

    it("should handle missing address", () => {
      const raw: RawRecord = { business_name: "Test" };
      const lead = normalizeRecord(raw, "Test");
      expect(lead.address).toBe("Unknown Address");
    });

    it("should handle missing social links", () => {
      const raw: RawRecord = { business_name: "Test" };
      const lead = normalizeRecord(raw, "Test");
      expect(lead.socialLinks).toEqual([]);
    });

    it("should handle null values gracefully", () => {
      const raw: RawRecord = {
        business_name: "Test",
        phone: null,
        website: null,
        rating: null,
        reviews: null,
        address: null,
      };
      const lead = normalizeRecord(raw, "Test");
      expect(lead.phone).toBe("");
      expect(lead.website).toBeNull();
      expect(lead.rating).toBe(0);
      expect(lead.reviewCount).toBe(0);
      expect(lead.address).toBe("Unknown Address");
    });

    it("should clamp rating to 0-5 range", () => {
      const rawHigh: RawRecord = { business_name: "Test", rating: 10 };
      const leadHigh = normalizeRecord(rawHigh, "Test");
      expect(leadHigh.rating).toBe(5);

      const rawLow: RawRecord = { business_name: "Test", rating: -1 };
      const leadLow = normalizeRecord(rawLow, "Test");
      expect(leadLow.rating).toBe(0);
    });

    it("should extract city from address when city not provided", () => {
      const raw: RawRecord = {
        business_name: "Test",
        address: "123 Main St, Springfield, IL 62701",
      };
      const lead = normalizeRecord(raw, "Test");
      expect(lead.city).toBe("Springfield");
    });

    it("should use alternative field names", () => {
      const raw: RawRecord = {
        title: "Alt Name Biz",
        categoryName: "Alt Category",
        phone_raw: "+1234567890",
        site: "https://alt.com",
        full_address: "Alt Address",
        location_city: "Alt City",
        totalScore: 4.2,
        reviewsCount: 50,
        scrapedAt: "2025-01-15T10:30:00Z",
        placeId: "ALT123",
        socialLinks: ["https://alt.com/social"],
      };
      const lead = normalizeRecord(raw, "Test");
      expect(lead.businessName).toBe("Alt Name Biz");
      expect(lead.category).toBe("Alt Category");
      expect(lead.phone).toBe("+1234567890");
      expect(lead.website).toBe("https://alt.com");
      expect(lead.address).toBe("Alt Address");
      expect(lead.city).toBe("Alt City");
      expect(lead.rating).toBe(4.2);
      expect(lead.reviewCount).toBe(50);
      expect(lead.scrapedAt).toBe("2025-01-15T10:30:00Z");
      expect(lead.externalId).toBe("ALT123");
      expect(lead.socialLinks).toEqual(["https://alt.com/social"]);
    });
  });

  describe("normalizeRecords", () => {
    it("should normalize multiple records", () => {
      const records: RawRecord[] = [
        { business_name: "Biz 1", category: "Cat 1" },
        { business_name: "Biz 2", category: "Cat 2" },
      ];
      const leads = normalizeRecords(records, "Test");
      expect(leads).toHaveLength(2);
      expect(leads[0].businessName).toBe("Biz 1");
      expect(leads[1].businessName).toBe("Biz 2");
    });

    it("should handle empty array", () => {
      const leads = normalizeRecords([], "Test");
      expect(leads).toEqual([]);
    });
  });

  describe("MockProvider", () => {
    it("should return leads for valid request", async () => {
      const provider = new MockProvider();
      const leads = await provider.scrape(validRequest);
      expect(leads.length).toBe(5);
      expect(leads.every((l) => l.id)).toBe(true);
    });

    it("should return deterministic results", async () => {
      const provider = new MockProvider();
      const leads1 = await provider.scrape(validRequest);
      const leads2 = await provider.scrape(validRequest);
      expect(leads1.map((l) => l.businessName)).toEqual(leads2.map((l) => l.businessName));
    });

    it("should filter by category and location", async () => {
      const provider = new MockProvider();
      const leads = await provider.scrape({ ...validRequest, category: "cafe", limit: 10 });
      expect(leads.every((l) => l.category.toLowerCase().includes("cafe"))).toBe(true);
    });

    it("should respect limit", async () => {
      const provider = new MockProvider();
      const leads = await provider.scrape({ ...validRequest, limit: 3 });
      expect(leads.length).toBe(3);
    });

    it("should return up to 10 unique deterministic mock businesses for RS Puram Restaurant", async () => {
      const provider = new MockProvider();
      const leads = await provider.scrape({
        campaignId: "test-camp-batch",
        category: "Restaurant",
        location: "RS Puram",
        limit: 10,
        mode: "mock",
      });
      expect(leads.length).toBe(10);
      const uniqueNames = new Set(leads.map((l) => l.businessName));
      expect(uniqueNames.size).toBe(10);
    });

    it("should return batch 1 and batch 2 without duplicates using offset", async () => {
      const provider = new MockProvider();
      const batch1 = await provider.scrape({
        campaignId: "test-camp-batch",
        category: "Restaurant",
        location: "RS Puram",
        limit: 10,
        offset: 0,
        mode: "mock",
      });

      const batch2 = await provider.scrape({
        campaignId: "test-camp-batch",
        category: "Restaurant",
        location: "RS Puram",
        limit: 10,
        offset: 10,
        mode: "mock",
      });

      expect(batch1.length).toBe(10);
      expect(batch2.length).toBe(10);

      const batch1Ids = batch1.map((l) => l.externalId);
      const batch2Ids = batch2.map((l) => l.externalId);

      const overlap = batch1Ids.filter((id) => batch2Ids.includes(id));
      expect(overlap).toEqual([]);
    });

    it("should support excludeExternalIds to prevent duplicates", async () => {
      const provider = new MockProvider();
      const firstSet = await provider.scrape({
        campaignId: "test-camp-batch",
        category: "Restaurant",
        location: "RS Puram",
        limit: 5,
        offset: 0,
        mode: "mock",
      });

      const excludedIds = firstSet.map((l) => l.externalId!).filter(Boolean);

      const nextSet = await provider.scrape({
        campaignId: "test-camp-batch",
        category: "Restaurant",
        location: "RS Puram",
        limit: 5,
        excludeExternalIds: excludedIds,
        mode: "mock",
      });

      for (const lead of nextSet) {
        expect(excludedIds.includes(lead.externalId!)).toBe(false);
      }
    });

    it("should return empty array for non-matching category/location", async () => {
      const provider = new MockProvider();
      const leads = await provider.scrape({
        ...validRequest,
        category: "nonexistent",
        location: "nowhere",
      });
      expect(leads.length).toBe(0);
    });
  });

  describe("getProvider", () => {
    it("should return MockProvider for mock mode", () => {
      const provider = getProvider("mock");
      expect(provider).toBeInstanceOf(MockProvider);
    });

    it("should return ApifyProvider for apify mode", () => {
      const provider = getProvider("apify");
      expect(provider).toBeInstanceOf(ApifyProvider);
    });
  });

  describe("runScrapingAgent", () => {
    it("should return successful response in mock mode", async () => {
      const result = await runScrapingAgent(validRequest);
      expect(result.success).toBe(true);
      expect(result.agent).toBe("scraping");
      expect(result.mode).toBe("mock");
      expect(result.count).toBe(5);
      expect(result.leads).toHaveLength(5);
      expect(result.leads[0]).toHaveProperty("id");
      expect(result.leads[0]).toHaveProperty("businessName");
      expect(result.leads[0]).toHaveProperty("category");
      expect(result.leads[0]).toHaveProperty("phone");
      expect(result.leads[0]).toHaveProperty("website");
      expect(result.leads[0]).toHaveProperty("address");
      expect(result.leads[0]).toHaveProperty("city");
      expect(result.leads[0]).toHaveProperty("rating");
      expect(result.leads[0]).toHaveProperty("reviewCount");
      expect(result.leads[0]).toHaveProperty("socialLinks");
      expect(result.leads[0]).toHaveProperty("source");
      expect(result.leads[0]).toHaveProperty("scrapedAt");
    });

    it("should return error response when provider fails", async () => {
      const result = await runScrapingAgent({
        ...validRequest,
        mode: "apify",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.count).toBe(0);
      expect(result.leads).toEqual([]);
    });
  });
});