import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Lead } from "@/lib/agents/scraping/types";
import type { QualificationResult } from "@/lib/agents/qualification/types";
import type { Campaign, SavedLead, SaveLeadsResponse } from "@/lib/agents/storage/types";

// Create mock functions
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockLimit = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();

// Mock the Supabase server module
vi.mock("@/lib/supabase/server", () => {
  const chainable = {
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    single: mockSingle,
    order: mockOrder.mockReturnThis(),
    range: mockRange,
    limit: mockLimit,
    insert: mockInsert.mockReturnThis(),
    update: mockUpdate.mockReturnThis(),
  };
  mockSelect.mockReturnValue(chainable);
  mockEq.mockReturnValue(chainable);
  mockOrder.mockReturnValue(chainable);
  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({ single: mockSingle }),
  });
  mockUpdate.mockReturnValue({
    eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }),
  });
  mockFrom.mockReturnValue(chainable);

  const mockAdmin = {
    from: mockFrom,
    rpc: mockRpc,
  };
  return {
    getSupabaseAdmin: () => mockAdmin,
  };
});

// Import the module after mocking
const storageModule = await import("@/lib/agents/storage");

const createMockLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: "test-lead-1",
  externalId: "ext-1",
  businessName: "Test Restaurant",
  category: "Restaurant",
  phone: "+91 422 123 4567",
  website: null,
  address: "123 Test St, Coimbatore, Tamil Nadu",
  city: "Coimbatore",
  rating: 4.5,
  reviewCount: 150,
  socialLinks: ["https://facebook.com/test", "https://instagram.com/test"],
  source: "Google Maps (Mock)",
  scrapedAt: "2025-01-15T10:30:00Z",
  ...overrides,
});

const createMockQualification = (overrides: Partial<QualificationResult> = {}): QualificationResult => ({
  leadId: "test-lead-1",
  score: 85,
  priority: "high",
  websiteOpportunity: true,
  reason: "Strong website opportunity",
  confidence: 0.9,
  factors: {
    hasWebsite: false,
    websiteQuality: 0,
    rating: 4.5,
    reviewCount: 150,
    category: "Restaurant",
    socialPresence: true,
    businessTypeNeedsWebsite: true,
  },
  evidence: ["Excellent rating", "High reviews", "No website"],
  ...overrides,
});

describe("Storage Agent", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Reset all mock functions
    mockSelect.mockReset();
    mockEq.mockReset();
    mockSingle.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockOrder.mockReset();
    mockRange.mockReset();
    mockLimit.mockReset();
    mockRpc.mockReset();
    mockFrom.mockReset();

    // Default chain setup
    const chainable = {
      select: mockSelect.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      single: mockSingle,
      order: mockOrder.mockReturnThis(),
      range: mockRange,
      limit: mockLimit,
      insert: mockInsert.mockReturnThis(),
      update: mockUpdate.mockReturnThis(),
    };

    mockSelect.mockReturnValue(chainable);
    mockEq.mockReturnValue(chainable);
    mockOrder.mockReturnValue(chainable);
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({ single: mockSingle }),
    });
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }),
    });
    mockFrom.mockReturnValue(chainable);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("saveCampaign", () => {
    it("should save campaign and return created campaign", async () => {
      const mockCampaign = {
        id: "camp-1",
        name: "Test Campaign",
        category: "Restaurant",
        location: "Coimbatore",
        lead_target: 100,
        status: "draft",
        progress: 0,
        leads_collected: 0,
        leads_qualified: 0,
        websites_built: 0,
        websites_deployed: 0,
        messages_sent: 0,
        minimum_rating: 4.0,
        minimum_reviews: 25,
        website_opportunity_requirement: true,
        social_presence_requirement: false,
        automation_mode: "semi-automatic",
        created_at: "2025-01-15T10:30:00Z",
        updated_at: "2025-01-15T10:30:00Z",
      };

      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          single: vi.fn().mockResolvedValueOnce({ data: mockCampaign, error: null }),
        }),
      });

      const result = await storageModule.saveCampaign({
        name: "Test Campaign",
        category: "Restaurant",
        location: "Coimbatore",
        leadTarget: 100,
        status: "draft",
        progress: 0,
        leadsCollected: 0,
        leadsQualified: 0,
        websitesBuilt: 0,
        websitesDeployed: 0,
        messagesSent: 0,
        minimumRating: 4.0,
        minimumReviews: 25,
        websiteOpportunityRequirement: true,
        socialPresenceRequirement: false,
        automationMode: "semi-automatic",
      });

      expect(result).toMatchObject({
        id: "camp-1",
        name: "Test Campaign",
        category: "Restaurant",
        location: "Coimbatore",
      });
    });

    it("should throw on database error", async () => {
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          single: vi.fn().mockResolvedValueOnce({ data: null, error: { message: "DB error" } }),
        }),
      });

      await expect(
        storageModule.saveCampaign({
          name: "Test",
          category: "Restaurant",
          location: "Coimbatore",
          leadTarget: 100,
          status: "draft",
          progress: 0,
          leadsCollected: 0,
          leadsQualified: 0,
          websitesBuilt: 0,
          websitesDeployed: 0,
          messagesSent: 0,
          minimumRating: 4.0,
          minimumReviews: 25,
          websiteOpportunityRequirement: true,
          socialPresenceRequirement: false,
          automationMode: "semi-automatic",
        })
      ).rejects.toThrow("Failed to save campaign: DB error");
    });
  });

  describe("getCampaigns", () => {
    it("should return list of campaigns", async () => {
      const mockCampaigns = [
        {
          id: "camp-1",
          name: "Campaign 1",
          category: "Restaurant",
          location: "Coimbatore",
          lead_target: 100,
          status: "active",
          progress: 50,
          leads_collected: 50,
          leads_qualified: 30,
          websites_built: 10,
          websites_deployed: 5,
          messages_sent: 20,
          minimum_rating: 4.0,
          minimum_reviews: 25,
          website_opportunity_requirement: true,
          social_presence_requirement: false,
          automation_mode: "semi-automatic",
          created_at: "2025-01-15T10:30:00Z",
          updated_at: "2025-01-15T10:30:00Z",
        },
      ];

      mockSelect.mockReturnValueOnce({
        order: vi.fn().mockResolvedValueOnce({ data: mockCampaigns, error: null }),
      });

      const result = await storageModule.getCampaigns();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Campaign 1");
    });
  });

  describe("getCampaign", () => {
    it("should return campaign by id", async () => {
      const mockCampaign = {
        id: "camp-1",
        name: "Test Campaign",
        category: "Restaurant",
        location: "Coimbatore",
        lead_target: 100,
        status: "active",
        progress: 50,
        leads_collected: 50,
        leads_qualified: 30,
        websites_built: 10,
        websites_deployed: 5,
        messages_sent: 20,
        minimum_rating: 4.0,
        minimum_reviews: 25,
        website_opportunity_requirement: true,
        social_presence_requirement: false,
        automation_mode: "semi-automatic",
        created_at: "2025-01-15T10:30:00Z",
        updated_at: "2025-01-15T10:30:00Z",
      };

      mockSingle.mockResolvedValueOnce({ data: mockCampaign, error: null });

      const result = await storageModule.getCampaign("camp-1");

      expect(result).toMatchObject({ id: "camp-1", name: "Test Campaign" });
    });

    it("should return null for not found", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

      const result = await storageModule.getCampaign("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("saveLeads", () => {
    it("should save leads using upsert_lead RPC", async () => {
      const leads = [createMockLead(), createMockLead({ id: "lead-2", externalId: "ext-2" })];

      mockRpc
        .mockResolvedValueOnce({ data: "lead-id-1", error: null })
        .mockResolvedValueOnce({ data: "lead-id-2", error: null });

      mockSingle
        .mockResolvedValueOnce({ data: { created_at: "2025-01-15T10:30:00Z", updated_at: "2025-01-15T10:30:00Z" }, error: null })
        .mockResolvedValueOnce({ data: { created_at: "2025-01-15T10:30:00Z", updated_at: "2025-01-15T10:31:00Z" }, error: null });

      const result = await storageModule.saveLeads({
        campaignId: "camp-1",
        leads,
        apifyRunId: "run-1",
        apifyDatasetId: "dataset-1",
      });

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(2);
      expect(result.inserted).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.duplicates).toBe(1);
      expect(result.leadIds).toHaveLength(2);
    });

    it("should handle database errors gracefully", async () => {
      const leads = [createMockLead()];

      mockRpc.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });

      const result = await storageModule.saveLeads({
        campaignId: "camp-1",
        leads,
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe("DB error");
    });
  });

  describe("getLeads", () => {
    it("should return leads with pagination", async () => {
      const mockLeads = [
        {
          id: "lead-1",
          campaign_id: "camp-1",
          business_name: "Test Restaurant",
          category: "Restaurant",
          location: "Coimbatore",
          rating: 4.5,
          reviews: 150,
          phone: "+91 422 123 4567",
          email: null,
          website: null,
          ai_score: 0,
          priority: "medium",
          status: "scraped",
          source: "Google Maps (Mock)",
          source_record_id: "ext-1",
          apify_run_id: null,
          apify_dataset_id: null,
          ai_score_json: {},
          qualification_json: {},
          opportunity_json: {},
          website_status: "not_started",
          quality_status: "not_started",
          deployment_status: "not_started",
          outreach_status: "not_ready",
          created_at: "2025-01-15T10:30:00Z",
          updated_at: "2025-01-15T10:30:00Z",
        },
      ];

      mockRange.mockResolvedValueOnce({ data: mockLeads, error: null, count: 1 });

      const result = await storageModule.getLeads({ campaignId: "camp-1", limit: 10, offset: 0 });

      expect(result.success).toBe(true);
      expect(result.leads).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter by status", async () => {
      mockRange.mockResolvedValueOnce({ data: [], error: null, count: 0 });

      const result = await storageModule.getLeads({ status: "qualified" });

      expect(mockEq).toHaveBeenCalledWith("status", "qualified");
    });
  });

  describe("getLead", () => {
    it("should return lead by id", async () => {
      const mockLead = {
        id: "lead-1",
        campaign_id: "camp-1",
        business_name: "Test Restaurant",
        category: "Restaurant",
        location: "Coimbatore",
        rating: 4.5,
        reviews: 150,
        phone: "+91 422 123 4567",
        email: null,
        website: null,
        ai_score: 0,
        priority: "medium",
        status: "scraped",
        source: "Google Maps (Mock)",
        source_record_id: "ext-1",
        apify_run_id: null,
        apify_dataset_id: null,
        ai_score_json: {},
        qualification_json: {},
        opportunity_json: {},
        website_status: "not_started",
        quality_status: "not_started",
        deployment_status: "not_started",
        outreach_status: "not_ready",
        created_at: "2025-01-15T10:30:00Z",
        updated_at: "2025-01-15T10:30:00Z",
      };

      // Set up the mock chain for getLead
      mockSingle.mockResolvedValueOnce({ data: mockLead, error: null });

      const result = await storageModule.getLead("lead-1");

      expect(result).toMatchObject({ id: "lead-1", businessName: "Test Restaurant" });
    });
  });

  describe("saveQualification", () => {
    it("should update leads with qualification results", async () => {
      const qualifications = [createMockQualification(), createMockQualification({ leadId: "lead-2", score: 60 })];

      mockUpdate.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      });
      mockUpdate.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      });

      const result = await storageModule.saveQualification({
        campaignId: "camp-1",
        results: qualifications,
      });

      expect(result.success).toBe(true);
      expect(result.updated).toBe(2);
    });

    it("should handle partial failures", async () => {
      const qualifications = [createMockQualification()];

      mockUpdate.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({ error: { message: "DB error" } }),
      });

      const result = await storageModule.saveQualification({
        campaignId: "camp-1",
        results: qualifications,
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("updateLeadStatus", () => {
    it("should update lead status using database function", async () => {
      const mockLead = { status: "scraped" };

      mockSingle.mockResolvedValueOnce({ data: mockLead, error: null });
      mockRpc.mockResolvedValueOnce({ data: true, error: null });

      const result = await storageModule.updateLeadStatus({
        leadId: "lead-1",
        status: "qualified",
      });

      expect(result.success).toBe(true);
      expect(result.leadId).toBe("lead-1");
      expect(result.previousStatus).toBe("scraped");
      expect(result.newStatus).toBe("qualified");
    });
  });

  describe("recordAgentRun", () => {
    it("should record agent run", async () => {
      const mockRun = { id: "run-1" };

      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          single: vi.fn().mockResolvedValueOnce({ data: mockRun, error: null }),
        }),
      });

      const result = await storageModule.recordAgentRun({
        agentId: "scraping",
        status: "success",
        durationMs: 5000,
        success: true,
      });

      expect(result.success).toBe(true);
      expect(result.runId).toBe("run-1");
    });
  });

describe("getAgentRuns", () => {
    it("should return agent runs", async () => {
      const mockRuns = [
        {
          id: "run-1",
          agent_id: "scraping",
          status: "success",
          started_at: "2025-01-15T10:30:00Z",
          completed_at: "2025-01-15T10:30:05Z",
          duration_ms: 5000,
          success: true,
          error: null,
          detail: "Completed",
          metadata: {},
          created_at: "2025-01-15T10:30:00Z",
        },
      ];

      // Set up mock chain for getAgentRuns
      const promise = Promise.resolve({ data: mockRuns, error: null });
      const chainable = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(promise),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };
      mockFrom.mockReturnValueOnce(chainable);
      mockSelect.mockReturnValueOnce(chainable);
      mockOrder.mockReturnValueOnce(chainable);
      mockLimit.mockReturnValueOnce(chainable);

      const result = await storageModule.getAgentRuns("scraping", 10);

      expect(result).toHaveLength(1);
      expect(result[0].agentId).toBe("scraping");
    });
  });
});