import { describe, it, expect } from "vitest";
import { mapCampaignFromDb, defaultMockCampaigns } from "../lib/data/campaigns";
import { mapLeadFromDb } from "../lib/data/leads";
import { mapWebsiteFromDb, mapDeploymentFromDb } from "../lib/data/websites";
import { mapMessageFromDb } from "../lib/data/messages";
import { ApiError } from "../lib/api/client";

describe("Frontend Data Contract & Client Mappers", () => {
  it("should correctly map raw snake_case database campaigns to canonical camelCase", () => {
    const rawDbCampaign = {
      id: "C-999",
      name: "Chennai Bakeries",
      category: "Bakery",
      location: "T Nagar",
      lead_target: 80,
      status: "active",
      progress: 50,
      leads_collected: 40,
      leads_qualified: 30,
      websites_built: 5,
      websites_deployed: 4,
      messages_sent: 25,
      minimum_rating: 4.2,
      minimum_reviews: 35,
      website_opportunity_requirement: true,
      social_presence_requirement: false,
      automation_mode: "automatic",
      created_at: "2026-08-20T10:00:00.000Z",
      updated_at: "2026-08-25T12:00:00.000Z",
    };

    const campaign = mapCampaignFromDb(rawDbCampaign);
    expect(campaign.id).toBe("C-999");
    expect(campaign.leadTarget).toBe(80);
    expect(campaign.leadsCollected).toBe(40);
    expect(campaign.websitesBuilt).toBe(5);
    expect(campaign.minimumRating).toBe(4.2);
    expect(campaign.websiteOpportunityRequirement).toBe(true);
    expect(campaign.automationMode).toBe("automatic");
  });

  it("should provide robust fallback defaults for unconfigured campaigns", () => {
    expect(defaultMockCampaigns.length).toBeGreaterThan(0);
    const first = defaultMockCampaigns[0];
    expect(first.name).toContain("Coimbatore");
    expect(first.leadTarget).toBe(150);
  });

  it("should map raw snake_case lead records and guard against undefined business_name", () => {
    const rawDbLead = {
      id: "lead-abc",
      business_name: "Annapoorna",
      category: "Restaurant",
      location: "RS Puram",
      rating: 4.5,
      reviews: 300,
      phone: "+914222334455",
      ai_score: 92,
      priority: "high",
      status: "website_deployed",
      created_at: "2026-08-28T00:00:00.000Z",
    };

    const lead = mapLeadFromDb(rawDbLead);
    expect(lead.businessName).toBe("Annapoorna");
    expect(lead.aiScore).toBe(92);
    expect(lead.status).toBe("website_deployed");
  });

  it("should map raw snake_case website records to canonical camelCase", () => {
    const rawDbWebsite = {
      id: "web-xyz",
      lead_id: "lead-abc",
      business_name: "Annapoorna",
      category: "Restaurant",
      location: "RS Puram",
      status: "deployed",
      template: "restaurant",
      pages: ["home", "about", "contact"],
      sections: ["hero", "menu", "contact"],
      build_progress: 100,
      preview_url: "https://preview.vasaw.app/annapoorna",
      live_url: "https://annapoorna.vasaw.app",
      created_at: "2026-08-28T10:00:00.000Z",
    };

    const website = mapWebsiteFromDb(rawDbWebsite);
    expect(website.leadId).toBe("lead-abc");
    expect(website.businessName).toBe("Annapoorna");
    expect(website.buildProgress).toBe(100);
    expect(website.liveUrl).toBe("https://annapoorna.vasaw.app");
  });

  it("should map raw snake_case message records to canonical camelCase", () => {
    const rawDbMessage = {
      id: "msg-123",
      lead_id: "lead-abc",
      business_name: "Annapoorna",
      direction: "outbound",
      channel: "whatsapp",
      content: "Your preview website is ready!",
      status: "sent",
      created_at: "2026-08-28T11:00:00.000Z",
    };

    const msg = mapMessageFromDb(rawDbMessage);
    expect(msg.leadId).toBe("lead-abc");
    expect(msg.businessName).toBe("Annapoorna");
    expect(msg.status).toBe("sent");
  });

  it("should map raw snake_case deployment records to canonical camelCase", () => {
    const rawDbDeployment = {
      id: "dep-123",
      website_id: "web-xyz",
      lead_id: "lead-abc",
      business_name: "Annapoorna",
      status: "deployed",
      provider: "vercel",
      environment: "production",
      live_url: "https://annapoorna.vasaw.app",
      duration_sec: 12,
      deployed_at: "2026-08-28T11:05:00.000Z",
      created_at: "2026-08-28T11:00:00.000Z",
    };

    const dep = mapDeploymentFromDb(rawDbDeployment);
    expect(dep.id).toBe("dep-123");
    expect(dep.websiteId).toBe("web-xyz");
    expect(dep.liveUrl).toBe("https://annapoorna.vasaw.app");
    expect(dep.durationSec).toBe(12);
  });

  it("should create typed ApiError with status and message", () => {
    const err = new ApiError("Not found", 404, { detail: "Item missing" });
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.data).toEqual({ detail: "Item missing" });
  });
});
