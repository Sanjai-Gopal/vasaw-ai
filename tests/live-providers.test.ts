import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ApifyProvider } from "@/lib/agents/scraping/providers";
import { VercelDeploymentProvider } from "@/lib/agents/deployment/providers/vercel";
import { GoogleSheetsApiProvider } from "@/lib/integrations/google-sheets/api-provider";

describe("Live Provider Implementations", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Apify Scraping Provider", () => {
    it("should throw explicit configuration error when APIFY_API_TOKEN is missing", async () => {
      delete process.env.APIFY_API_TOKEN;
      const provider = new ApifyProvider("test-actor", "");

      await expect(
        provider.scrape({
          campaignId: "camp-live-test",
          category: "Restaurant",
          location: "RS Puram",
          limit: 10,
          mode: "apify",
        })
      ).rejects.toThrow("APIFY_API_TOKEN is not configured on the server");
    });
  });

  describe("Vercel Deployment Provider", () => {
    it("should fail gracefully with clear error when VERCEL_TOKEN is not configured", async () => {
      delete process.env.VERCEL_TOKEN;
      const provider = new VercelDeploymentProvider({ token: "" });

      const result = await provider.deploy({
        websiteId: "web-live-test",
        leadId: "lead-live-test",
        businessName: "Test Live Business",
        environment: "production",
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("FAILED");
      expect(result.error).toContain("VERCEL_TOKEN not configured");
    });
  });

  describe("Google Sheets Live Provider", () => {
    it("should fail gracefully when Google Sheets credentials are not configured", async () => {
      delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      delete process.env.GOOGLE_PRIVATE_KEY;
      delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

      const provider = new GoogleSheetsApiProvider();
      const result = await provider.exportLeads([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Google Sheets credentials not configured");
    });
  });
});
