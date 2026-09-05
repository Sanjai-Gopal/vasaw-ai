import { describe, it, expect } from "vitest";
import { MockGoogleSheetsProvider } from "../lib/integrations/google-sheets/mock-provider";
import { GoogleSheetsApiProvider } from "../lib/integrations/google-sheets/api-provider";
import { getGoogleSheetsProvider } from "../lib/integrations/google-sheets/index";
import type { Lead, Website, Message, Campaign } from "../lib/types";

describe("Google Sheets Integration Layer", () => {
  const sampleLead: Lead = {
    id: "lead-test-1",
    businessName: "Coimbatore Kitchen",
    category: "Restaurant",
    location: "RS Puram",
    rating: 4.6,
    reviews: 120,
    website: "https://coimbatorekitchen.in",
    phone: "+919876543210",
    aiScore: 85,
    priority: "high",
    status: "qualified",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scraped: {
      address: "RS Puram, Coimbatore",
      phone: "+919876543210",
      rating: 4.6,
      reviews: 120,
      category: "Restaurant",
      services: [],
      source: "google_maps",
      scrapedAt: new Date().toISOString(),
    },
    qualification: {
      hasWebsite: true,
      websiteQuality: 60,
      hasWhatsApp: true,
      hasReviews: true,
      responseLikelihood: "high",
      notes: "Established business",
    },
    opportunity: {
      score: 85,
      priority: "high",
      reasons: ["Active customer base"],
      estimatedValue: 1500,
    },
  };

  const sampleWebsite: Website = {
    id: "web-test-1",
    leadId: "lead-test-1",
    businessName: "Coimbatore Kitchen",
    category: "Restaurant",
    location: "RS Puram",
    status: "built",
    template: "restaurant",
    pages: 3,
    sections: 5,
    buildProgress: 100,
    previewUrl: "https://preview.vasaw.app/coimbatore-kitchen",
    createdAt: new Date().toISOString(),
  };

  const sampleMessage: Message = {
    id: "msg-test-1",
    leadId: "lead-test-1",
    businessName: "Coimbatore Kitchen",
    direction: "outbound",
    channel: "whatsapp",
    content: "Hello! Check out your website preview: https://preview.vasaw.app/coimbatore-kitchen",
    status: "sent",
    createdAt: new Date().toISOString(),
  };

  const sampleCampaign: Campaign = {
    id: "camp-test-1",
    name: "Coimbatore Restaurants",
    category: "Restaurant",
    location: "Coimbatore",
    leadTarget: 50,
    status: "active",
    progress: 40,
    leadsCollected: 20,
    leadsQualified: 15,
    websitesBuilt: 5,
    websitesDeployed: 3,
    messagesSent: 10,
    minimumRating: 4.0,
    minimumReviews: 20,
    websiteOpportunityRequirement: true,
    socialPresenceRequirement: false,
    automationMode: "semi-automatic",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("should export leads via MockGoogleSheetsProvider with idempotent deduplication", async () => {
    const provider = new MockGoogleSheetsProvider();
    const result1 = await provider.exportLeads([sampleLead]);

    expect(result1.success).toBe(true);
    expect(result1.sheetName).toBe("Leads");
    expect(result1.rowsWritten).toBe(1);
    expect(result1.mode).toBe("mock");

    // Re-exporting same lead should not duplicate rows
    const result2 = await provider.exportLeads([sampleLead]);
    expect(result2.success).toBe(true);
    expect(result2.rowsWritten).toBe(1);
  });

  it("should export websites via MockGoogleSheetsProvider", async () => {
    const provider = new MockGoogleSheetsProvider();
    const result = await provider.exportWebsites([sampleWebsite]);

    expect(result.success).toBe(true);
    expect(result.sheetName).toBe("Websites");
    expect(result.rowsWritten).toBe(1);
  });

  it("should export messages via MockGoogleSheetsProvider", async () => {
    const provider = new MockGoogleSheetsProvider();
    const result = await provider.exportMessages([sampleMessage]);

    expect(result.success).toBe(true);
    expect(result.sheetName).toBe("Outreach");
    expect(result.rowsWritten).toBe(1);
  });

  it("should export campaigns via MockGoogleSheetsProvider", async () => {
    const provider = new MockGoogleSheetsProvider();
    const result = await provider.exportCampaigns([sampleCampaign]);

    expect(result.success).toBe(true);
    expect(result.sheetName).toBe("Campaigns");
    expect(result.rowsWritten).toBe(1);
  });

  it("should support syncAll to export multiple entities simultaneously", async () => {
    const provider = new MockGoogleSheetsProvider();
    const syncResult = await provider.syncAll({
      includeLeads: true,
      includeWebsites: true,
      includeMessages: true,
      includeCampaigns: true,
      mode: "mock",
    });

    expect(syncResult.success).toBe(true);
    expect(syncResult.summary.leadsExported).toBe(10);
    expect(syncResult.summary.websitesExported).toBe(5);
    expect(syncResult.summary.messagesExported).toBe(3);
    expect(syncResult.summary.campaignsExported).toBe(1);
    expect(syncResult.summary.totalRows).toBe(19);
  });

  it("should return clean unconfigured response in GoogleSheetsApiProvider when env variables are missing", async () => {
    const provider = new GoogleSheetsApiProvider({});
    const res = await provider.exportLeads([sampleLead]);

    expect(res.success).toBe(false);
    expect(res.error).toContain("Google Sheets credentials not configured");
    expect(res.mode).toBe("real");
  });

  it("should instantiate correct provider via factory", () => {
    const mock = getGoogleSheetsProvider("mock");
    expect(mock).toBeInstanceOf(MockGoogleSheetsProvider);

    const real = getGoogleSheetsProvider("real");
    expect(real).toBeInstanceOf(GoogleSheetsApiProvider);
  });
});
