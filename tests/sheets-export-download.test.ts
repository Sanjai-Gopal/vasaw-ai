import { describe, it, expect } from "vitest";
import {
  generateCsv,
  generateLeadsCsv,
  generateWebsitesCsv,
  generateMessagesCsv,
  generateCampaignsCsv,
  escapeCsvValue,
} from "../lib/integrations/google-sheets/csv";
import { GET as getLeadsRoute, POST as postLeadsRoute } from "../app/api/sheets/export/leads/route";
import { GET as getWebsitesRoute, POST as postWebsitesRoute } from "../app/api/sheets/export/websites/route";
import { GET as getMessagesRoute, POST as postMessagesRoute } from "../app/api/sheets/export/messages/route";
import { GET as getCampaignsRoute, POST as postCampaignsRoute } from "../app/api/sheets/export/campaigns/route";
import type { Lead, Website, Message, Campaign } from "../lib/types";

describe("Google Sheets CSV Generator and File Download Layer", () => {
  it("should escape special characters in CSV values correctly", () => {
    expect(escapeCsvValue('Simple')).toBe("Simple");
    expect(escapeCsvValue('With, comma')).toBe('"With, comma"');
    expect(escapeCsvValue('With "quotes"')).toBe('"With ""quotes"""');
    expect(escapeCsvValue("Line1\nLine2")).toBe('"Line1\nLine2"');
    expect(escapeCsvValue(null)).toBe("");
    expect(escapeCsvValue(undefined)).toBe("");
  });

  it("should generate CSV with UTF-8 BOM and correct headers for leads", () => {
    const sampleLead: Lead = {
      id: "lead-csv-1",
      businessName: 'Sharma "Sweets", Delights',
      category: "Restaurant",
      location: "Delhi, India",
      rating: 4.8,
      reviews: 320,
      website: "https://sharmasweets.in",
      phone: "+919811122233",
      aiScore: 92,
      priority: "high",
      status: "qualified",
      createdAt: "2026-09-10T12:00:00Z",
      updatedAt: "2026-09-10T12:00:00Z",
      scraped: {
        address: "Delhi",
        phone: "+919811122233",
        rating: 4.8,
        reviews: 320,
        category: "Restaurant",
        services: [],
        source: "google_maps",
        scrapedAt: "2026-09-10T12:00:00Z",
      },
      qualification: {
        hasWebsite: true,
        websiteQuality: 70,
        hasWhatsApp: true,
        hasReviews: true,
        responseLikelihood: "high",
        notes: "Good candidate",
      },
      opportunity: {
        score: 92,
        priority: "high",
        reasons: ["Top rated"],
        estimatedValue: 2000,
      },
    };

    const csv = generateLeadsCsv([sampleLead]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Lead ID,Business Name,Category,Location,Rating,Reviews,Phone,Website,Email,AI Score,Priority,Status,Created At");
    expect(csv).toContain('"Sharma ""Sweets"", Delights"');
    expect(csv).toContain('"Delhi, India"');
  });

  describe("API Export Routes File Download and Content-Disposition", () => {
    it("POST /api/sheets/export/leads returns text/csv with Content-Disposition attachment", async () => {
      const req = new Request("http://localhost:3000/api/sheets/export/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId: "test-sheet", mode: "mock" }),
      });

      const res = await postLeadsRoute(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      const disposition = res.headers.get("Content-Disposition");
      expect(disposition).toContain("attachment; filename=");
      expect(disposition).toContain("vasaw-leads-");
      expect(res.headers.get("X-Sheet-Name")).toBe("Leads");

      const bodyText = await res.text();
      expect(bodyText).toContain("Lead ID,Business Name");
    });

    it("GET /api/sheets/export/leads supports browser navigation download", async () => {
      const req = new Request("http://localhost:3000/api/sheets/export/leads", {
        method: "GET",
      });

      const res = await getLeadsRoute(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");
    });

    it("POST /api/sheets/export/websites returns text/csv with Content-Disposition attachment", async () => {
      const req = new Request("http://localhost:3000/api/sheets/export/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "mock" }),
      });

      const res = await postWebsitesRoute(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(res.headers.get("Content-Disposition")).toContain("vasaw-websites-");
      expect(res.headers.get("X-Sheet-Name")).toBe("Websites");
    });

    it("POST /api/sheets/export/messages returns text/csv with Content-Disposition attachment", async () => {
      const req = new Request("http://localhost:3000/api/sheets/export/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "mock" }),
      });

      const res = await postMessagesRoute(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(res.headers.get("Content-Disposition")).toContain("vasaw-outreach-logs-");
      expect(res.headers.get("X-Sheet-Name")).toBe("Outreach");
    });

    it("POST /api/sheets/export/campaigns returns text/csv with Content-Disposition attachment", async () => {
      const req = new Request("http://localhost:3000/api/sheets/export/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "mock" }),
      });

      const res = await postCampaignsRoute(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(res.headers.get("Content-Disposition")).toContain("vasaw-campaigns-");
      expect(res.headers.get("X-Sheet-Name")).toBe("Campaigns");
    });

    it("supports format=json for programmatic API consumers", async () => {
      const req = new Request("http://localhost:3000/api/sheets/export/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "mock", format: "json" }),
      });

      const res = await postLeadsRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.sheetName).toBe("Leads");
      expect(typeof json.rowsWritten).toBe("number");
    });

    it("returns error cleanly without exposing server credentials when real mode is unconfigured", async () => {
      const req = new Request("http://localhost:3000/api/sheets/export/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "real" }),
      });

      const res = await postLeadsRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBeDefined();
      expect(JSON.stringify(json)).not.toContain("private_key");
    });
  });
});
