import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getAppIntegrationMode,
  getOutreachMode,
  isLiveMode,
  isOutreachPermitted,
  validateModeCredentials,
} from "@/lib/config/modes";
import { MetaWhatsAppProvider } from "@/lib/agents/whatsapp/providers/meta";

describe("Safety & Operational Modes", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Mode Detection", () => {
    it("should default to mock app mode and disabled outreach mode", () => {
      delete process.env.APP_INTEGRATION_MODE;
      delete process.env.OUTREACH_MODE;

      expect(getAppIntegrationMode()).toBe("mock");
      expect(isLiveMode()).toBe(false);
      expect(getOutreachMode()).toBe("disabled");
      expect(isOutreachPermitted()).toBe(false);
    });

    it("should detect live integration mode when APP_INTEGRATION_MODE=live", () => {
      process.env.APP_INTEGRATION_MODE = "live";
      expect(getAppIntegrationMode()).toBe("live");
      expect(isLiveMode()).toBe(true);
    });

    it("should detect outreach modes accurately", () => {
      process.env.OUTREACH_MODE = "mock";
      expect(getOutreachMode()).toBe("mock");
      expect(isOutreachPermitted()).toBe(false);

      process.env.OUTREACH_MODE = "live";
      expect(getOutreachMode()).toBe("live");
      expect(isOutreachPermitted()).toBe(true);

      process.env.OUTREACH_MODE = "disabled";
      expect(getOutreachMode()).toBe("disabled");
      expect(isOutreachPermitted()).toBe(false);
    });
  });

  describe("WhatsApp Outreach Safety Guardrails", () => {
    it("should NOT dispatch network calls when OUTREACH_MODE=disabled", async () => {
      process.env.OUTREACH_MODE = "disabled";
      process.env.WHATSAPP_ACCESS_TOKEN = "fake-token";
      process.env.WHATSAPP_PHONE_NUMBER_ID = "fake-id";

      const provider = new MetaWhatsAppProvider();
      const result = await provider.sendMessage(
        {
          leadId: "lead-safety-1",
          phone: "+91 98765 43210",
          businessName: "Safety Test Restaurant",
          message: { type: "text", body: "Hello" },
        },
        "+919876543210"
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe("PENDING");
      expect(result.metadata?.outreachMode).toBe("disabled");
      expect(result.messageId.startsWith("prep-")).toBe(true);
    });

    it("should safely simulate sending when OUTREACH_MODE=mock", async () => {
      process.env.OUTREACH_MODE = "mock";

      const provider = new MetaWhatsAppProvider();
      const result = await provider.sendMessage(
        {
          leadId: "lead-safety-2",
          phone: "+91 98765 43210",
          businessName: "Safety Test Restaurant",
          message: { type: "text", body: "Hello" },
        },
        "+919876543210"
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe("SENT");
      expect(result.metadata?.outreachMode).toBe("mock");
      expect(result.messageId.startsWith("mock-wa-")).toBe(true);
    });

    it("should fail clearly when OUTREACH_MODE=live but credentials are missing", async () => {
      process.env.OUTREACH_MODE = "live";
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_PHONE_NUMBER_ID;

      const provider = new MetaWhatsAppProvider();
      const result = await provider.sendMessage(
        {
          leadId: "lead-safety-3",
          phone: "+91 98765 43210",
          businessName: "Safety Test Restaurant",
          message: { type: "text", body: "Hello" },
        },
        "+919876543210"
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe("FAILED");
      expect(result.error).toContain("Meta WhatsApp Cloud API credentials missing");
    });
  });

  describe("Credential Validation", () => {
    it("should validate live mode requirements and flag missing tokens", () => {
      process.env.APP_INTEGRATION_MODE = "live";
      delete process.env.APIFY_API_TOKEN;
      delete process.env.VERCEL_TOKEN;

      const validation = validateModeCredentials("live");
      expect(validation.valid).toBe(false);
      expect(validation.missingRequired).toContain("APIFY_API_TOKEN");
      expect(validation.missingRequired).toContain("VERCEL_TOKEN");
    });
  });
});
