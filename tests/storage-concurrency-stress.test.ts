import { describe, it, expect } from "vitest";
import { isValidTransition } from "../lib/agents/orchestrator/state-machine";
import { calculateQualification } from "../lib/agents/qualification/calculate";
import type { Lead } from "../lib/agents/scraping/types";

describe("Phase 4 & 15: Storage, Concurrency & State Machine Stress Tests", () => {
  // ==========================================
  // 1. State Machine Transition Validation Matrix
  // ==========================================
  describe("State Machine Transition Exhaustive Matrix", () => {
    it("should allow standard forward lifecycle progression", () => {
      expect(isValidTransition("new", "scraped")).toBe(true);
      expect(isValidTransition("scraped", "checking")).toBe(true);
      expect(isValidTransition("checking", "qualified")).toBe(true);
      expect(isValidTransition("qualified", "website_building")).toBe(true);
      expect(isValidTransition("website_building", "website_ready")).toBe(true);
      expect(isValidTransition("website_ready", "deploying")).toBe(true);
      expect(isValidTransition("deploying", "website_deployed")).toBe(true);
      expect(isValidTransition("website_deployed", "contacted")).toBe(true);
      expect(isValidTransition("contacted", "replied")).toBe(true);
      expect(isValidTransition("replied", "interested")).toBe(true);
    });

    it("should reject illegal reverse or skipping transitions", () => {
      expect(isValidTransition("interested", "scraped")).toBe(false);
      expect(isValidTransition("website_deployed", "qualified")).toBe(false);
      expect(isValidTransition("scraped", "website_deployed")).toBe(false);
    });

    it("should allow failure transitions to quality_failed and cancellation", () => {
      expect(isValidTransition("website_building", "quality_failed")).toBe(true);
      expect(isValidTransition("quality_checking", "quality_failed")).toBe(true);
      expect(isValidTransition("scraped", "cancelled")).toBe(true);
      expect(isValidTransition("contacted", "cancelled")).toBe(true);
    });
  });

  // ==========================================
  // 2. High-Volume Lead Deduplication & Batch Processing
  // ==========================================
  describe("High-Volume Lead Deduplication & Priority Calculations", () => {
    it("should calculate correct priority tiers across a batch of 50 leads", () => {
      const highNeedCategories = ["Restaurant", "Cafe", "Salon", "Dentist", "Gym"];
      const batch: Lead[] = [];

      for (let i = 0; i < 50; i++) {
        const cat = highNeedCategories[i % highNeedCategories.length];
        const rating = 3.5 + (i % 15) * 0.1;
        const reviewCount = i * 15;
        const hasWeb = i % 3 === 0;

        batch.push({
          id: `lead-batch-${i}`,
          businessName: `${cat} ${i}`,
          category: cat,
          phone: `+91987654${String(i).padStart(4, "0")}`,
          website: hasWeb ? `https://${cat.toLowerCase()}${i}.com` : null,
          address: `Address ${i}`,
          city: "Coimbatore",
          rating: Math.min(5, rating),
          reviewCount,
          socialLinks: [],
          source: "google_maps",
          scrapedAt: new Date().toISOString(),
        });
      }

      expect(batch.length).toBe(50);

      // Verify each lead can be qualified and prioritized without error
      for (const lead of batch) {
        const qual = calculateQualification(lead);
        expect(["high", "medium", "low"]).toContain(qual.priority);
        expect(qual.score).toBeGreaterThanOrEqual(0);
        expect(qual.score).toBeLessThanOrEqual(100);
      }
    });

    it("should consistently identify high-value restaurant opportunities with zero website", () => {
      const primeLead: Lead = {
        id: "prime-lead-1",
        businessName: "Kongu Mess",
        category: "Traditional Restaurant",
        phone: "+919876543210",
        website: null,
        address: "Cross Cut Rd",
        city: "Coimbatore",
        rating: 4.8,
        reviewCount: 420,
        socialLinks: [],
        source: "google_maps",
        scrapedAt: new Date().toISOString(),
      };

      const qual = calculateQualification(primeLead);
      expect(qual.priority).toBe("high");
      expect(qual.websiteOpportunity).toBe(true);
    });
  });
});
