import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as crypto from "crypto";
import {
  sendWhatsAppMessage,
  runWhatsAppAgent,
  normalizePhoneNumber,
  validateWhatsAppRequest,
  getWhatsAppProvider,
  MockWhatsAppProvider,
  MetaWhatsAppProvider,
  verifyWebhookChallenge,
  verifyMetaSignature,
  parseWhatsAppWebhookPayload,
  handleWebhookEventStorage,
} from "@/lib/agents/whatsapp";
import { POST as whatsappApiHandler } from "@/app/api/agents/whatsapp/route";
import { GET as webhookGetHandler, POST as webhookPostHandler } from "@/app/api/webhooks/whatsapp/route";
import { NextRequest } from "next/server";

// Mock Storage Agent
vi.mock("@/lib/agents/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/agents/storage")>();
  return {
    ...actual,
    saveMessage: vi.fn().mockImplementation(async (req) => ({
      id: "mock-saved-msg-uuid",
      leadId: req.leadId,
      businessName: req.businessName,
      direction: req.direction || "outbound",
      channel: req.channel || "whatsapp",
      content: req.content,
      status: req.status || "sent",
      createdAt: new Date().toISOString(),
    })),
    getMessage: vi.fn().mockResolvedValue(null),
    getMessages: vi.fn().mockResolvedValue([]),
    updateMessageStatus: vi.fn().mockImplementation(async (req) => ({
      id: req.messageId,
      leadId: "mock-lead",
      businessName: "Test Lead",
      direction: "outbound",
      channel: "whatsapp",
      content: "Test content",
      status: req.status,
      createdAt: new Date().toISOString(),
    })),
    updateLeadStatus: vi.fn().mockResolvedValue({}),
    recordAgentRun: vi.fn().mockResolvedValue({ success: true, runId: "run-1" }),
  };
});

// Mock Supabase
vi.mock("@/lib/supabase/server", () => {
  return {
    getSupabaseAdmin: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }),
  };
});

describe("Agent 6 — WhatsApp Agent", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ==========================================
  // 1. Phone Normalization & Validation
  // ==========================================
  describe("Phone Normalization & Validation", () => {
    it("should normalize 10-digit Indian numbers with +91 prefix", () => {
      const result = normalizePhoneNumber("9876543210");
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe("+919876543210");
    });

    it("should normalize 11-digit numbers starting with 0 to +91", () => {
      const result = normalizePhoneNumber("09876543210");
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe("+919876543210");
    });

    it("should handle already formatted +91 numbers with spaces and hyphens", () => {
      const result = normalizePhoneNumber("+91 98765-43210");
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe("+919876543210");
    });

    it("should handle international numbers formatted with +", () => {
      const result = normalizePhoneNumber("+1 (415) 555-2671");
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe("+14155552671");
    });

    it("should reject non-numeric phone strings", () => {
      const result = normalizePhoneNumber("invalid-phone");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject numbers that are too short (< 7 digits)", () => {
      const result = normalizePhoneNumber("12345");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("length");
    });

    it("should reject numbers that are too long (> 15 digits)", () => {
      const result = normalizePhoneNumber("+1234567890123456789");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("length");
    });
  });

  // ==========================================
  // 2. Request & Message Validation
  // ==========================================
  describe("Request Validation", () => {
    it("should validate a complete and valid text request", () => {
      const result = validateWhatsAppRequest({
        leadId: "lead-001",
        phone: "+919876543210",
        message: "Hello, this is a test message.",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.normalizedPhone).toBe("+919876543210");
      expect(result.parsedMessage).toEqual({ type: "text", body: "Hello, this is a test message." });
    });

    it("should reject when leadId is missing", () => {
      const result = validateWhatsAppRequest({
        leadId: "",
        phone: "+919876543210",
        message: "Hello!",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("leadId"))).toBe(true);
    });

    it("should reject when phone is missing", () => {
      const result = validateWhatsAppRequest({
        leadId: "lead-001",
        phone: "",
        message: "Hello!",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("phone"))).toBe(true);
    });

    it("should reject when message is empty string", () => {
      const result = validateWhatsAppRequest({
        leadId: "lead-001",
        phone: "+919876543210",
        message: "   ",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("empty"))).toBe(true);
    });

    it("should validate a structured template message", () => {
      const result = validateWhatsAppRequest({
        leadId: "lead-001",
        phone: "+919876543210",
        message: {
          type: "template",
          templateName: "website_ready_notification",
          languageCode: "en_US",
          parameters: [{ type: "text", text: "Saravana Bhavan" }],
        },
      });
      expect(result.valid).toBe(true);
      expect(result.parsedMessage?.type).toBe("template");
    });

    it("should validate a structured media message", () => {
      const result = validateWhatsAppRequest({
        leadId: "lead-001",
        phone: "+919876543210",
        message: {
          type: "media",
          mediaType: "image",
          url: "https://example.com/preview.png",
          caption: "Your website is ready!",
        },
      });
      expect(result.valid).toBe(true);
      expect(result.parsedMessage?.type).toBe("media");
    });
  });

  // ==========================================
  // 3. Provider Factory & Mock Provider
  // ==========================================
  describe("Provider Factory & Mock Provider", () => {
    it("should return MockWhatsAppProvider for mode='mock' or undefined", () => {
      const mockProv = getWhatsAppProvider("mock");
      expect(mockProv).toBeInstanceOf(MockWhatsAppProvider);
      expect(mockProv.id).toBe("mock");

      const defaultProv = getWhatsAppProvider();
      expect(defaultProv).toBeInstanceOf(MockWhatsAppProvider);
    });

    it("should return MetaWhatsAppProvider for mode='meta'", () => {
      const metaProv = getWhatsAppProvider("meta");
      expect(metaProv).toBeInstanceOf(MetaWhatsAppProvider);
      expect(metaProv.id).toBe("meta");
    });

    it("should successfully send message in mock mode with zero external credentials", async () => {
      const provider = new MockWhatsAppProvider();
      const result = await provider.sendMessage(
        {
          leadId: "lead-001",
          phone: "+919876543210",
          businessName: "Saravana Bhavan",
          message: "Hello from mock test!",
          mode: "mock",
        },
        "+919876543210"
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe("mock");
      expect(result.status).toBe("SENT");
      expect(result.messageId).toContain("mock-wa-");
      expect(result.sentAt).toBeDefined();
    });
  });

  // ==========================================
  // 4. Meta WhatsApp Cloud API Provider
  // ==========================================
  describe("Meta WhatsApp Cloud API Provider", () => {
    it("should fail gracefully when Meta credentials are not configured", async () => {
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_PHONE_NUMBER_ID;

      const provider = new MetaWhatsAppProvider();
      const result = await provider.sendMessage(
        {
          leadId: "lead-001",
          phone: "+919876543210",
          message: "Hello Meta",
          mode: "meta",
        },
        "+919876543210"
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe("FAILED");
      expect(result.error).toContain("credentials missing");
    });

    it("should send message via Meta Cloud API successfully when response is 200", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          messaging_product: "whatsapp",
          contacts: [{ input: "919876543210", wa_id: "919876543210" }],
          messages: [{ id: "wamid.HBgLMTIzNDU2Nzg5MA==" }],
        }),
      });
      global.fetch = mockFetch;

      const provider = new MetaWhatsAppProvider({
        accessToken: "EAAG_TEST_TOKEN",
        phoneNumberId: "10987654321",
      });

      const result = await provider.sendMessage(
        {
          leadId: "lead-001",
          phone: "+919876543210",
          businessName: "Saravana Bhavan",
          message: "Hello from Meta!",
          mode: "meta",
        },
        "+919876543210"
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe("meta");
      expect(result.status).toBe("SENT");
      expect(result.messageId).toBe("wamid.HBgLMTIzNDU2Nzg5MA==");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should handle authentication failure (401) without retrying and redact tokens", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({
          error: {
            message: "Invalid OAuth access token - Cannot parse access token: EAAG_SECRET_TOKEN_XYZ",
            type: "OAuthException",
            code: 190,
          },
        }),
      });
      global.fetch = mockFetch;

      const provider = new MetaWhatsAppProvider({
        accessToken: "EAAG_SECRET_TOKEN_XYZ",
        phoneNumberId: "10987654321",
      });

      const result = await provider.sendMessage(
        {
          leadId: "lead-001",
          phone: "+919876543210",
          message: "Hello!",
          mode: "meta",
        },
        "+919876543210"
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe("FAILED");
      expect(result.error).not.toContain("EAAG_SECRET_TOKEN_XYZ");
      expect(result.error).toContain("[REDACTED_ACCESS_TOKEN]");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should retry transient 429 rate limit errors with backoff", async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 429,
            statusText: "Too Many Requests",
            json: async () => ({ error: { message: "(#4) Application request limit reached" } }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            messages: [{ id: "wamid.RETRY_SUCCESS" }],
          }),
        };
      });
      global.fetch = mockFetch;

      const provider = new MetaWhatsAppProvider({
        accessToken: "EAAG_TEST",
        phoneNumberId: "10987654321",
      });

      const result = await provider.sendMessage(
        {
          leadId: "lead-001",
          phone: "+919876543210",
          message: "Rate limit test",
          mode: "meta",
        },
        "+919876543210"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("wamid.RETRY_SUCCESS");
      expect(callCount).toBe(2);
    });

    it("should retry transient 500/503 server errors and succeed on retry", async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 503,
            statusText: "Service Unavailable",
            json: async () => ({ error: { message: "Service temporarily unavailable" } }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            messages: [{ id: "wamid.SERVER_RETRY_SUCCESS" }],
          }),
        };
      });
      global.fetch = mockFetch;

      const provider = new MetaWhatsAppProvider({
        accessToken: "EAAG_TEST",
        phoneNumberId: "10987654321",
      });

      const result = await provider.sendMessage(
        {
          leadId: "lead-001",
          phone: "+919876543210",
          message: "503 test",
          mode: "meta",
        },
        "+919876543210"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("wamid.SERVER_RETRY_SUCCESS");
      expect(callCount).toBe(2);
    });

    it("should not retry permanent 400 bad request errors", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ error: { message: "(#100) Invalid parameter value" } }),
      });
      global.fetch = mockFetch;

      const provider = new MetaWhatsAppProvider({
        accessToken: "EAAG_TEST",
        phoneNumberId: "10987654321",
      });

      const result = await provider.sendMessage(
        {
          leadId: "lead-001",
          phone: "+919876543210",
          message: "Bad request test",
          mode: "meta",
        },
        "+919876543210"
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe("FAILED");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // 5. Webhook Handling & Security
  // ==========================================
  describe("Webhook Handling & Security", () => {
    it("should verify webhook challenge when token matches", () => {
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "test_verify_token_123";
      const params = new URLSearchParams({
        "hub.mode": "subscribe",
        "hub.verify_token": "test_verify_token_123",
        "hub.challenge": "1158201444",
      });

      const result = verifyWebhookChallenge(params);
      expect(result.status).toBe(200);
      expect(result.body).toBe("1158201444");
    });

    it("should reject webhook challenge when token does not match", () => {
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "test_verify_token_123";
      const params = new URLSearchParams({
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong_token",
        "hub.challenge": "1158201444",
      });

      const result = verifyWebhookChallenge(params);
      expect(result.status).toBe(403);
    });

    it("should verify valid HMAC-SHA256 signature when secret is configured", () => {
      const secret = "whatsapp_secret_key_456";
      const payload = JSON.stringify({ entry: [] });
      const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      const signatureHeader = `sha256=${hmac}`;

      const isValid = verifyMetaSignature(payload, signatureHeader, secret);
      expect(isValid).toBe(true);
    });

    it("should reject invalid HMAC-SHA256 signature", () => {
      const secret = "whatsapp_secret_key_456";
      const payload = JSON.stringify({ entry: [] });
      const signatureHeader = "sha256=invalid_signature_hex_value";

      const isValid = verifyMetaSignature(payload, signatureHeader, secret);
      expect(isValid).toBe(false);
    });

    it("should parse status updates: delivered, read, failed", () => {
      const webhookPayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  statuses: [
                    {
                      id: "wamid.DELIVERED_001",
                      status: "delivered",
                      timestamp: "1678900000",
                      recipient_id: "919876543210",
                    },
                    {
                      id: "wamid.READ_002",
                      status: "read",
                      timestamp: "1678900010",
                      recipient_id: "919876543210",
                    },
                    {
                      id: "wamid.FAILED_003",
                      status: "failed",
                      timestamp: "1678900020",
                      recipient_id: "919876543210",
                      errors: [{ code: 131026, title: "Message Undeliverable" }],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const events = parseWhatsAppWebhookPayload(webhookPayload);
      expect(events).toHaveLength(3);
      expect(events[0].canonicalStatus).toBe("DELIVERED");
      expect(events[1].canonicalStatus).toBe("READ");
      expect(events[2].canonicalStatus).toBe("FAILED");
    });

    it("should parse inbound message events", () => {
      const webhookPayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  messages: [
                    {
                      id: "wamid.INBOUND_001",
                      from: "919876543210",
                      timestamp: "1678900030",
                      type: "text",
                      text: { body: "Yes, I am interested in the website!" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const events = parseWhatsAppWebhookPayload(webhookPayload);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("message");
      expect(events[0].messageEvent?.text).toBe("Yes, I am interested in the website!");
    });

    it("should persist webhook events to storage", async () => {
      const { saveMessage } = await import("@/lib/agents/storage");

      const statusResult = await handleWebhookEventStorage({
        processed: true,
        eventType: "status",
        canonicalStatus: "DELIVERED",
        statusEvent: {
          messageId: "wamid.001",
          recipientId: "919876543210",
          status: "delivered",
          timestamp: 1678900000,
        },
      });
      expect(statusResult.success).toBe(true);

      const messageResult = await handleWebhookEventStorage({
        processed: true,
        eventType: "message",
        messageEvent: {
          messageId: "wamid.INBOUND",
          from: "919876543210",
          timestamp: 1678900000,
          type: "text",
          text: "Interested",
        },
      });
      expect(messageResult.success).toBe(true);
      expect(saveMessage).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 6. Facade & End-to-End Orchestration
  // ==========================================
  describe("Facade & End-to-End Orchestration", () => {
    it("should execute sendWhatsAppMessage in mock mode and persist to storage", async () => {
      const { saveMessage, recordAgentRun } = await import("@/lib/agents/storage");

      const result = await sendWhatsAppMessage({
        leadId: "lead-saravana-1",
        phone: "+91 98765 43210",
        businessName: "Saravana Bhavan",
        message: "Your new high-converting website is live!",
        mode: "mock",
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe("mock");
      expect(result.status).toBe("SENT");
      expect(result.messageId).toContain("mock-wa-");
      expect(saveMessage).toHaveBeenCalled();
      expect(recordAgentRun).toHaveBeenCalled();
    });

    it("should reuse previous sent message for idempotency", async () => {
      const { getMessages } = await import("@/lib/agents/storage");
      vi.mocked(getMessages).mockResolvedValueOnce([
        {
          id: "existing-msg-id-123",
          leadId: "lead-saravana-1",
          businessName: "Saravana Bhavan",
          direction: "outbound",
          channel: "whatsapp",
          content: "Hello again!",
          status: "sent",
          createdAt: new Date().toISOString(),
        },
      ]);

      const result = await sendWhatsAppMessage({
        leadId: "lead-saravana-1",
        phone: "+919876543210",
        message: "Hello again!",
        mode: "mock",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("existing-msg-id-123");
      expect(result.metadata?.idempotentReused).toBe(true);
    });

    it("should run runWhatsAppAgent and return canonical agent response", async () => {
      const response = await runWhatsAppAgent({
        leadId: "lead-001",
        phone: "9876543210",
        message: "Top-level invocation",
        mode: "mock",
      });

      expect(response.success).toBe(true);
      expect(response.agent).toBe("whatsapp");
      expect(response.provider).toBe("mock");
      expect(response.status).toBe("SENT");
      expect(response.result).toBeDefined();
    });
  });

  // ==========================================
  // 7. API Routes
  // ==========================================
  describe("API Routes", () => {
    it("should handle valid POST /api/agents/whatsapp with 200", async () => {
      const req = new NextRequest("http://localhost:3000/api/agents/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          leadId: "lead-001",
          phone: "+919876543210",
          message: "API test message",
          mode: "mock",
        }),
      });

      const res = await whatsappApiHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.agent).toBe("whatsapp");
    });

    it("should reject invalid POST /api/agents/whatsapp with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/agents/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          leadId: "",
          phone: "not-a-number",
          message: "",
        }),
      });

      const res = await whatsappApiHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
    });

    it("should handle GET /api/webhooks/whatsapp verification with 200", async () => {
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "verify_token_abc";
      const req = new NextRequest(
        "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify_token_abc&hub.challenge=test_challenge_code"
      );

      const res = await webhookGetHandler(req);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe("test_challenge_code");
    });

    it("should handle POST /api/webhooks/whatsapp event notifications with 200", async () => {
      const req = new NextRequest("http://localhost:3000/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry: [
            {
              changes: [
                {
                  value: {
                    messaging_product: "whatsapp",
                    statuses: [
                      {
                        id: "wamid.TEST_HOOK",
                        status: "delivered",
                        timestamp: "1678900000",
                        recipient_id: "919876543210",
                      },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      });

      const res = await webhookPostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.processed).toBe(1);
    });
  });
});
