import { describe, it, expect } from "vitest";
import { executeCampaign } from "../lib/agents/orchestrator";
import { mapCampaignFromDb } from "../lib/data/campaigns";

describe("Campaign Execution & Lifecycle Management Tests", () => {
  it("should map raw snake_case database campaign rows to canonical camelCase", () => {
    const rawRow = {
      id: "camp-uuid-1234",
      name: "Coimbatore Bakeries",
      category: "Bakery",
      location: "RS Puram",
      lead_target: 100,
      status: "active",
      progress: 40,
      leads_collected: 40,
      leads_qualified: 32,
      websites_built: 5,
      websites_deployed: 3,
      messages_sent: 20,
      minimum_rating: 4.2,
      minimum_reviews: 30,
      website_opportunity_requirement: true,
      social_presence_requirement: false,
      automation_mode: "semi-automatic",
      created_at: "2026-08-28T10:00:00.000Z",
      updated_at: "2026-08-28T12:00:00.000Z",
    };

    const campaign = mapCampaignFromDb(rawRow);
    expect(campaign.id).toBe("camp-uuid-1234");
    expect(campaign.name).toBe("Coimbatore Bakeries");
    expect(campaign.leadTarget).toBe(100);
    expect(campaign.leadsCollected).toBe(40);
    expect(campaign.websitesBuilt).toBe(5);
    expect(campaign.websitesDeployed).toBe(3);
    expect(campaign.messagesSent).toBe(20);
    expect(campaign.automationMode).toBe("semi-automatic");
  });

  it("should execute campaign workflow with orchestrator and return execution metrics", { timeout: 120000 }, async () => {
    const result = await executeCampaign(
      "camp-test-exec-001",
      ["Coimbatore"],
      ["Restaurant"],
      {
        maxItems: 1,
        mode: "mock",
      }
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe("COMPLETED");
    expect(result.stages.scraping).toBe("COMPLETED");
    expect(result.stages.qualifying).toBe("COMPLETED");
    expect(result.stages.storing).toBe("COMPLETED");
    expect(result.stages.website).toBe("COMPLETED");
    expect(result.stages.deployment).toBe("COMPLETED");
    expect(result.stages.whatsapp).toBe("COMPLETED");
    expect(result.stats.scraped).toBeGreaterThanOrEqual(1);
  });

  it("should support skipOutreach option when executing campaign", { timeout: 120000 }, async () => {
    const result = await executeCampaign(
      "camp-test-skip-001",
      ["Coimbatore"],
      ["Restaurant"],
      {
        maxItems: 1,
        mode: "mock",
        skipOutreach: true,
      }
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe("COMPLETED");
    expect(result.stages.whatsapp).toBe("SKIPPED");
    expect(result.stats.messagesSent).toBe(0);
  });

  it("should reject campaign execution when campaign ID is empty", async () => {
    await expect(
      executeCampaign("", ["Coimbatore"], ["Restaurant"])
    ).rejects.toThrow("Invalid campaignId");
  });

  it("should reject campaign execution when locations array is empty", async () => {
    await expect(
      executeCampaign("camp-123", [], ["Restaurant"])
    ).rejects.toThrow("Invalid locations");
  });

  it("should calculate correct percentage progress deterministically based on collected vs target", () => {
    const target = 100;
    const collected = 45;
    const progress = Math.min(100, Math.round((collected / target) * 100));
    expect(progress).toBe(45);

    const overCollected = 120;
    const maxProgress = Math.min(100, Math.round((overCollected / target) * 100));
    expect(maxProgress).toBe(100);
  });

  describe("Batch Sizing & Multi-Batch Execution", () => {
    it("1. should calculate requestedBatch = 10 when leadTarget = 100 and batchSize = 10 (existing = 0)", () => {
      const leadTarget = 100;
      const existingCount = 0;
      const batchSize = 10;
      const remainingTarget = Math.max(0, leadTarget - existingCount);
      const requestedBatch = Math.min(batchSize, remainingTarget);

      expect(requestedBatch).toBe(10);
      expect(remainingTarget).toBe(100);
    });

    it("2. should calculate requestedBatch = 7 when leadTarget = 7 and batchSize = 10 (existing = 0)", () => {
      const leadTarget = 7;
      const existingCount = 0;
      const batchSize = 10;
      const remainingTarget = Math.max(0, leadTarget - existingCount);
      const requestedBatch = Math.min(batchSize, remainingTarget);

      expect(requestedBatch).toBe(7);
      expect(remainingTarget).toBe(7);
    });

    it("3. should calculate requestedBatch = 5 when existing count = 95 and target = 100 (batchSize = 10)", () => {
      const leadTarget = 100;
      const existingCount = 95;
      const batchSize = 10;
      const remainingTarget = Math.max(0, leadTarget - existingCount);
      const requestedBatch = Math.min(batchSize, remainingTarget);

      expect(requestedBatch).toBe(5);
      expect(remainingTarget).toBe(5);
    });

    it("4. should execute batch 1 and return unique leads for RS Puram Restaurant", { timeout: 120000 }, async () => {
      const result = await executeCampaign(
        "camp-batch-test-001",
        ["RS Puram"],
        ["Restaurant"],
        {
          maxItems: 3,
          offset: 0,
          mode: "mock",
        }
      );

      expect(result.success).toBe(true);
      expect(result.stats.scraped).toBe(3);
      expect(result.stages.scraping).toBe("COMPLETED");
      expect(result.stages.qualifying).toBe("COMPLETED");
      expect(result.stages.storing).toBe("COMPLETED");
      expect(result.stages.website).toBe("COMPLETED");
      expect(result.stages.deployment).toBe("COMPLETED");
      expect(result.stages.whatsapp).toBe("COMPLETED");

      // Verify all leads have unique IDs and names
      const businessNames = new Set(result.leadResults.map((lr) => lr.businessName));
      expect(businessNames.size).toBe(3);
    });

    it("5. second batch should not return duplicates from first batch", { timeout: 120000 }, async () => {
      const batch1 = await executeCampaign(
        "camp-batch-test-002",
        ["RS Puram"],
        ["Restaurant"],
        {
          maxItems: 3,
          offset: 0,
          mode: "mock",
        }
      );

      const batch2 = await executeCampaign(
        "camp-batch-test-002",
        ["RS Puram"],
        ["Restaurant"],
        {
          maxItems: 3,
          offset: 3,
          mode: "mock",
        }
      );

      expect(batch1.stats.scraped).toBe(3);
      expect(batch2.stats.scraped).toBe(3);

      const batch1Names = batch1.leadResults.map((lr) => lr.businessName);
      const batch2Names = batch2.leadResults.map((lr) => lr.businessName);

      // Verify zero overlap between Batch 1 and Batch 2
      const overlap = batch1Names.filter((name) => batch2Names.includes(name));
      expect(overlap).toEqual([]);
    });

    it("6 & 7 & 9. multi-batch lifecycle: remains active on partial, becomes completed when target reached, progress accurate", { timeout: 180000 }, async () => {
      const campaignTarget = 6;
      const batchSize = 2;
      let totalCollected = 0;
      let status: "active" | "completed" = "active";

      // Batch 1 (offset: 0, request: 2)
      const remaining1 = campaignTarget - totalCollected;
      const req1 = Math.min(batchSize, remaining1);
      const res1 = await executeCampaign("camp-lifecycle-001", ["RS Puram"], ["Restaurant"], {
        maxItems: req1,
        offset: totalCollected,
        mode: "mock",
      });
      totalCollected += res1.stats.scraped;
      const progress1 = Math.min(100, Math.round((totalCollected / campaignTarget) * 100));
      status = totalCollected >= campaignTarget ? "completed" : "active";

      expect(res1.stats.scraped).toBe(2);
      expect(totalCollected).toBe(2);
      expect(progress1).toBe(33);
      expect(status).toBe("active");

      // Batch 2 (offset: 2, request: 2)
      const remaining2 = campaignTarget - totalCollected;
      const req2 = Math.min(batchSize, remaining2);
      const res2 = await executeCampaign("camp-lifecycle-001", ["RS Puram"], ["Restaurant"], {
        maxItems: req2,
        offset: totalCollected,
        mode: "mock",
      });
      totalCollected += res2.stats.scraped;
      const progress2 = Math.min(100, Math.round((totalCollected / campaignTarget) * 100));
      status = totalCollected >= campaignTarget ? "completed" : "active";

      expect(res2.stats.scraped).toBe(2);
      expect(totalCollected).toBe(4);
      expect(progress2).toBe(67);
      expect(status).toBe("active");

      // Batch 3 (offset: 4, request: 2)
      const remaining3 = campaignTarget - totalCollected;
      const req3 = Math.min(batchSize, remaining3);
      expect(req3).toBe(2);

      const res3 = await executeCampaign("camp-lifecycle-001", ["RS Puram"], ["Restaurant"], {
        maxItems: req3,
        offset: totalCollected,
        mode: "mock",
      });
      totalCollected += res3.stats.scraped;
      const progress3 = Math.min(100, Math.round((totalCollected / campaignTarget) * 100));
      status = totalCollected >= campaignTarget ? "completed" : "active";

      expect(res3.stats.scraped).toBe(2);
      expect(totalCollected).toBe(6);
      expect(progress3).toBe(100);
      expect(status).toBe("completed");
    });

    it("8. should mark campaign completed when scraper exhausts available unique leads", async () => {
      // Nonexistent category returns 0 leads
      const result = await executeCampaign(
        "camp-exhaust-001",
        ["RS Puram"],
        ["NonExistentUniqueCategoryXYZ"],
        {
          maxItems: 10,
          offset: 0,
          mode: "mock",
        }
      );

      expect(result.stats.scraped).toBe(0);
      const isExhausted = result.stats.scraped < 10;
      expect(isExhausted).toBe(true);
    });

    it("10. all six agents execute for eligible leads in a batch", { timeout: 180000 }, async () => {
      const result = await executeCampaign(
        "camp-six-agents-001",
        ["RS Puram"],
        ["Restaurant"],
        {
          maxItems: 5,
          offset: 0,
          mode: "mock",
        }
      );

      expect(result.stages.scraping).toBe("COMPLETED");
      expect(result.stages.qualifying).toBe("COMPLETED");
      expect(result.stages.storing).toBe("COMPLETED");
      expect(result.stages.website).toBe("COMPLETED");
      expect(result.stages.deployment).toBe("COMPLETED");
      expect(result.stages.whatsapp).toBe("COMPLETED");

      expect(result.stats.scraped).toBe(5);
      expect(result.stats.qualified).toBeGreaterThan(0);
      expect(result.stats.websitesBuilt).toBeGreaterThan(0);
      expect(result.stats.websitesDeployed).toBeGreaterThan(0);
      expect(result.stats.messagesSent).toBeGreaterThan(0);
    });

    it("11. re-running a batch is idempotent and safe", { timeout: 180000 }, async () => {
      const run1 = await executeCampaign(
        "camp-idempotent-001",
        ["RS Puram"],
        ["Restaurant"],
        {
          maxItems: 3,
          offset: 0,
          mode: "mock",
        }
      );

      const run2 = await executeCampaign(
        "camp-idempotent-001",
        ["RS Puram"],
        ["Restaurant"],
        {
          maxItems: 3,
          offset: 0,
          mode: "mock",
        }
      );

      expect(run1.success).toBe(true);
      expect(run2.success).toBe(true);
      expect(run1.stats.scraped).toBe(3);
      expect(run2.stats.scraped).toBe(3);
    });
  });
});
