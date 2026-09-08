import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as path from "path";
import * as fs from "fs";
import {
  deployWebsite,
  runDeploymentAgent,
  validateBuildResult,
  validateProjectDirectory,
  collectAndScanProjectFiles,
  getDeploymentProvider,
  MockDeploymentProvider,
  VercelDeploymentProvider,
} from "@/lib/agents/deployment";
import { WebsiteBuildResult } from "@/lib/agents/website/types";
import { POST as deploymentApiHandler } from "@/app/api/agents/deployment/route";
import { NextRequest } from "next/server";

// Mock Storage Agent
vi.mock("@/lib/agents/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/agents/storage")>();
  return {
    ...actual,
    saveDeployment: vi.fn().mockResolvedValue({
      id: "dep-uuid-1",
      websiteId: "web-test-123",
      leadId: "lead-test-456",
      businessName: "Saravana Bhavan",
      status: "deployed",
      provider: "mock",
      environment: "production",
      liveUrl: "https://mock-saravana-bhavan.vasaw.app",
      durationSec: 1,
      createdAt: new Date().toISOString(),
    }),
    getDeployments: vi.fn().mockResolvedValue([]),
    getWebsite: vi.fn().mockResolvedValue({
      id: "web-test-123",
      leadId: "lead-test-456",
      businessName: "Saravana Bhavan",
      category: "restaurant",
      location: "Coimbatore",
      status: "built",
      template: "restaurant",
      pages: 2,
      sections: 8,
      buildProgress: 100,
      createdAt: new Date().toISOString(),
    }),
    saveWebsite: vi.fn().mockResolvedValue({}),
    updateLeadStatus: vi.fn().mockResolvedValue({}),
    recordAgentRun: vi.fn().mockResolvedValue({ success: true, runId: "run-1" }),
  };
});

describe("Agent 5 — Deployment Agent", () => {
  let testProjectDir: string;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a temporary project directory for testing
    testProjectDir = path.join(process.cwd(), `.tmp-test-deploy-${Date.now()}`);
    fs.mkdirSync(path.join(testProjectDir, "src", "app"), { recursive: true });

    // Populate minimal valid Next.js project
    fs.writeFileSync(
      path.join(testProjectDir, "package.json"),
      JSON.stringify({ name: "test-site", scripts: { build: "next build" } })
    );
    fs.writeFileSync(
      path.join(testProjectDir, "src", "app", "page.tsx"),
      "export default function Page() { return <h1>Saravana Bhavan</h1>; }"
    );
  });

  afterEach(() => {
    try {
      if (fs.existsSync(testProjectDir)) {
        fs.rmSync(testProjectDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error
    }
  });

  function createMockBuildResult(overrides?: Partial<WebsiteBuildResult>): WebsiteBuildResult {
    return {
      websiteId: "web-test-123",
      leadId: "lead-test-456",
      businessName: "Saravana Bhavan",
      template: "restaurant",
      pages: ["index", "contact"],
      buildOutput: "Next.js static export build successful",
      previewUrl: undefined,
      status: "READY",
      buildStatus: "SUCCESS",
      buildErrors: [],
      generatedAt: new Date().toISOString(),
      artifact: {
        projectName: "saravana-bhavan-site",
        projectDir: testProjectDir,
        files: ["package.json", "src/app/page.tsx"],
        pages: ["index", "contact"],
      },
      ...overrides,
    };
  }

  // ==========================================
  // 1. Artifact & Readiness Validation
  // ==========================================
  describe("Artifact & Readiness Validation", () => {
    it("should validate a READY and SUCCESS build result", () => {
      const buildResult = createMockBuildResult();
      const validation = validateBuildResult(buildResult);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should reject build result when website status is not READY", () => {
      const buildResult = createMockBuildResult({ status: "FAILED" });
      const validation = validateBuildResult(buildResult);
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain("Website is not READY");
    });

    it("should reject build result when buildStatus is FAILED", () => {
      const buildResult = createMockBuildResult({ buildStatus: "FAILED" });
      const validation = validateBuildResult(buildResult);
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain("Website build did not succeed");
    });

    it("should reject when artifact projectDir is missing", () => {
      const buildResult = createMockBuildResult({
        artifact: { projectName: "test", projectDir: "", files: [], pages: [] },
      });
      const validation = validateBuildResult(buildResult);
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain("does not contain an artifact project directory");
    });

    it("should validate that project directory exists on disk", () => {
      const validation = validateProjectDirectory(testProjectDir);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should reject non-existent project directory", () => {
      const validation = validateProjectDirectory("/non/existent/path/9999");
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain("does not exist");
    });

    it("should reject project directory missing required files", () => {
      const emptyDir = path.join(process.cwd(), `.tmp-empty-${Date.now()}`);
      fs.mkdirSync(emptyDir, { recursive: true });

      try {
        const validation = validateProjectDirectory(emptyDir);
        expect(validation.valid).toBe(false);
        expect(validation.errors.some((e) => e.includes("package.json"))).toBe(true);
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it("should detect secret tokens during file scanning", () => {
      fs.writeFileSync(
        path.join(testProjectDir, "src", "app", "secret.ts"),
        "export const key = 'sk-123456789012345678901234567890';"
      );

      const scan = collectAndScanProjectFiles(testProjectDir);
      expect(scan.valid).toBe(false);
      expect(scan.errors.some((e) => e.includes("OpenAI API Key"))).toBe(true);
    });
  });

  // ==========================================
  // 2. Mock Deployment Provider
  // ==========================================
  describe("Mock Deployment Provider", () => {
    it("should execute deterministic mock deployment without external APIs", async () => {
      const provider = new MockDeploymentProvider();
      const buildResult = createMockBuildResult();

      const result = await provider.deploy({
        websiteId: buildResult.websiteId,
        buildResult,
        businessName: buildResult.businessName,
        leadId: buildResult.leadId,
        mode: "mock",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("READY");
      expect(result.provider).toBe("mock");
      expect(result.deploymentId).toContain("mock-dep-saravana-bhavan");
      expect(result.url).toMatch(/^https:\/\/mock-saravana-bhavan.*\.vasaw\.app$/);
      expect(result.error).toBeNull();
    });

    it("should fail mock deployment if website build result failed", async () => {
      const provider = new MockDeploymentProvider();
      const buildResult = createMockBuildResult({ status: "FAILED", buildStatus: "FAILED" });

      const result = await provider.deploy({
        websiteId: buildResult.websiteId,
        buildResult,
        businessName: buildResult.businessName,
        mode: "mock",
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("FAILED");
      expect(result.error).toContain("Website is not READY");
    });

    it("should fail mock deployment if project directory is missing", async () => {
      const provider = new MockDeploymentProvider();

      const result = await provider.deploy({
        websiteId: "web-no-dir",
        businessName: "No Dir Biz",
        projectDir: "/non/existent/dir",
        mode: "mock",
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("FAILED");
      expect(result.error).toContain("does not exist");
    });

    it("should return status and handle delete in mock provider", async () => {
      const provider = new MockDeploymentProvider();
      const status = await provider.getStatus("dep-123");
      expect(status.success).toBe(true);
      expect(status.status).toBe("READY");

      const deleted = await provider.delete("dep-123");
      expect(deleted).toBe(true);
    });
  });

  // ==========================================
  // 3. Vercel Deployment Provider
  // ==========================================
  describe("Vercel Deployment Provider", () => {
    it("should safely fail if VERCEL_TOKEN is not configured", async () => {
      const provider = new VercelDeploymentProvider({ token: "" });
      const buildResult = createMockBuildResult();

      const result = await provider.deploy({
        websiteId: buildResult.websiteId,
        buildResult,
        businessName: buildResult.businessName,
        mode: "vercel",
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("FAILED");
      expect(result.error).toContain("VERCEL_TOKEN not configured");
    });

    it("should deploy and poll successfully with mocked Vercel API", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        const urlStr = url.toString();

        // 1. Check/create project
        if (urlStr.includes("/v9/projects")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ id: "prj_test123", name: "saravana-bhavan-site" }),
          };
        }

        // 2. Create deployment
        if (urlStr.includes("/v13/deployments") && init?.method === "POST") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              id: "dpl_test123",
              url: "saravana-bhavan-site.vercel.app",
              readyState: "INITIALIZING",
            }),
          };
        }

        // 3. Poll deployment
        if (urlStr.includes("/v13/deployments/dpl_test123") && init?.method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              id: "dpl_test123",
              url: "saravana-bhavan-site.vercel.app",
              readyState: "READY",
            }),
          };
        }

        return { ok: false, status: 404, text: async () => "Not found" };
      }) as unknown as typeof fetch;

      try {
        const provider = new VercelDeploymentProvider({
          token: "vcp_mock_test_token_1234567890",
          pollIntervalMs: 10,
          maxWaitMs: 1000,
        });

        const buildResult = createMockBuildResult();
        const result = await provider.deploy({
          websiteId: buildResult.websiteId,
          buildResult,
          businessName: buildResult.businessName,
          mode: "vercel",
        });

        expect(result.success).toBe(true);
        expect(result.status).toBe("READY");
        expect(result.provider).toBe("vercel");
        expect(result.url).toBe("https://saravana-bhavan-site.vercel.app");
        expect(result.deploymentId).toBe("dpl_test123");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("should handle Vercel API error when project creation fails", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.toString().includes("/v9/projects")) {
          return {
            ok: false,
            status: 403,
            text: async () => "Forbidden: invalid token scope",
          };
        }
        return { ok: false, status: 500, text: async () => "Server error" };
      }) as unknown as typeof fetch;

      try {
        const provider = new VercelDeploymentProvider({
          token: "vcp_mock_invalid_token_123",
        });

        const buildResult = createMockBuildResult();
        const result = await provider.deploy({
          websiteId: buildResult.websiteId,
          buildResult,
          businessName: buildResult.businessName,
          mode: "vercel",
        });

        expect(result.success).toBe(false);
        expect(result.status).toBe("FAILED");
        expect(result.error).toContain("Failed to create Vercel project");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("should handle Vercel deployment timeout during polling", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.includes("/v9/projects")) {
          return { ok: true, status: 200, json: async () => ({ id: "prj_timeout" }) };
        }
        if (urlStr.includes("/v13/deployments") && init?.method === "POST") {
          return { ok: true, status: 200, json: async () => ({ id: "dpl_timeout", readyState: "BUILDING" }) };
        }
        if (urlStr.includes("/v13/deployments/dpl_timeout")) {
          return { ok: true, status: 200, json: async () => ({ id: "dpl_timeout", readyState: "BUILDING" }) };
        }
        return { ok: false, status: 400, text: async () => "Error" };
      }) as unknown as typeof fetch;

      try {
        const provider = new VercelDeploymentProvider({
          token: "vcp_mock_timeout_token_123",
          pollIntervalMs: 10,
          maxWaitMs: 30, // 30ms timeout
        });

        const buildResult = createMockBuildResult();
        const result = await provider.deploy({
          websiteId: buildResult.websiteId,
          buildResult,
          businessName: buildResult.businessName,
          mode: "vercel",
        });

        expect(result.success).toBe(false);
        expect(result.status).toBe("FAILED");
        expect(result.error).toContain("timed out");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("should sanitize tokens from error messages", async () => {
      const token = "vcp_super_secret_token_123456789";
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 401,
          text: async () => `Invalid token ${token} provided`,
        };
      }) as unknown as typeof fetch;

      try {
        const provider = new VercelDeploymentProvider({ token });
        const buildResult = createMockBuildResult();
        const result = await provider.deploy({
          websiteId: buildResult.websiteId,
          buildResult,
          businessName: buildResult.businessName,
          mode: "vercel",
        });

        expect(result.success).toBe(false);
        expect(result.error).not.toContain(token);
        expect(result.error).toContain("[REDACTED]");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // ==========================================
  // 4. Provider Factory & Selection
  // ==========================================
  describe("Provider Selection", () => {
    it("should select MockDeploymentProvider for 'mock' mode", () => {
      const provider = getDeploymentProvider("mock");
      expect(provider.id).toBe("mock");
      expect(provider).toBeInstanceOf(MockDeploymentProvider);
    });

    it("should select VercelDeploymentProvider for 'vercel' mode", () => {
      const provider = getDeploymentProvider("vercel");
      expect(provider.id).toBe("vercel");
      expect(provider).toBeInstanceOf(VercelDeploymentProvider);
    });
  });

  // ==========================================
  // 5. Idempotency & Storage Integration
  // ==========================================
  describe("Idempotency & Storage Integration", () => {
    it("should perform full deployment and update storage", async () => {
      const buildResult = createMockBuildResult();
      const result = await deployWebsite({
        websiteId: buildResult.websiteId,
        buildResult,
        businessName: buildResult.businessName,
        leadId: buildResult.leadId,
        mode: "mock",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("READY");
      expect(result.url).toBeDefined();
    });

    it("should reuse existing deployment when already deployed without forceRedeploy", async () => {
      const { getDeployments } = await import("@/lib/agents/storage");
      vi.mocked(getDeployments).mockResolvedValueOnce([
        {
          id: "existing-dep-id",
          websiteId: "web-test-123",
          leadId: "lead-test-456",
          businessName: "Saravana Bhavan",
          status: "deployed",
          provider: "mock",
          environment: "production",
          liveUrl: "https://mock-existing-url.vasaw.app",
          durationSec: 2,
          createdAt: new Date().toISOString(),
        },
      ]);

      const result = await deployWebsite({
        websiteId: "web-test-123",
        mode: "mock",
      });

      expect(result.success).toBe(true);
      expect(result.deploymentId).toBe("existing-dep-id");
      expect(result.url).toBe("https://mock-existing-url.vasaw.app");
      expect(result.metadata?.idempotentReused).toBe(true);
    });

    it("should force redeploy when forceRedeploy is true even if existing deployment exists", async () => {
      const { getDeployments, saveDeployment } = await import("@/lib/agents/storage");
      vi.mocked(getDeployments).mockResolvedValueOnce([
        {
          id: "old-dep-id",
          websiteId: "web-test-123",
          leadId: "lead-test-456",
          businessName: "Saravana Bhavan",
          status: "deployed",
          provider: "mock",
          environment: "production",
          liveUrl: "https://old-url.vasaw.app",
          durationSec: 1,
          createdAt: new Date().toISOString(),
        },
      ]);

      const buildResult = createMockBuildResult();
      const result = await deployWebsite({
        websiteId: "web-test-123",
        buildResult,
        businessName: "Saravana Bhavan",
        leadId: "lead-test-456",
        forceRedeploy: true,
        mode: "mock",
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.idempotentReused).toBeUndefined();
      expect(saveDeployment).toHaveBeenCalled();
    });

    it("should allow string websiteId as direct argument to deployWebsite and runDeploymentAgent", async () => {
      const buildResult = createMockBuildResult();
      const response = await runDeploymentAgent({
        websiteId: buildResult.websiteId,
        buildResult,
        mode: "mock",
      });

      expect(response.success).toBe(true);
      expect(response.agent).toBe("deployment");
      expect(response.result?.status).toBe("READY");
    });
  });

  // ==========================================
  // 6. Security Checks
  // ==========================================
  describe("Security Checks", () => {
    it("should reject path traversal attempts in projectDir", () => {
      const validation = validateProjectDirectory("../../../etc/passwd");
      expect(validation.valid).toBe(false);
    });

    it("should block secret leakage before upload", () => {
      fs.writeFileSync(
        path.join(testProjectDir, "src", "app", "config.ts"),
        "export const token = 'ghp_123456789012345678901234567890123456';"
      );

      const scan = collectAndScanProjectFiles(testProjectDir);
      expect(scan.valid).toBe(false);
      expect(scan.errors.some((e) => e.includes("GitHub Token"))).toBe(true);
    });

    it("should block Bearer token leakage in files", () => {
      fs.writeFileSync(
        path.join(testProjectDir, "src", "app", "auth.ts"),
        "const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.supersecrettoken123456789';"
      );

      const scan = collectAndScanProjectFiles(testProjectDir);
      expect(scan.valid).toBe(false);
      expect(scan.errors.some((e) => e.includes("Bearer Token") || e.includes("Supabase Service Key"))).toBe(true);
    });
  });

  // ==========================================
  // 7. API Route (POST /api/agents/deployment)
  // ==========================================
  describe("API Route (POST /api/agents/deployment)", () => {
    it("should reject invalid request body with 400", async () => {
      const request = new NextRequest("http://localhost:3000/api/agents/deployment", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await deploymentApiHandler(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Request must include at least one of");
    });

    it("should accept valid deployment request and return 200 with DeploymentResponse", async () => {
      const buildResult = createMockBuildResult();
      const request = new NextRequest("http://localhost:3000/api/agents/deployment", {
        method: "POST",
        body: JSON.stringify({
          websiteId: buildResult.websiteId,
          buildResult,
          mode: "mock",
        }),
      });

      const response = await deploymentApiHandler(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.agent).toBe("deployment");
      expect(data.mode).toBe("mock");
      expect(data.result.status).toBe("READY");
      expect(data.result.url).toContain("mock-saravana-bhavan");
    });
  });

  // ==========================================
  // 8. Regression: Kumar Mess Deployment Verification Flow
  // ==========================================
  describe("Kumar Mess Deployment Flow", () => {
    it("should successfully deploy and verify Kumar Mess website artifact", async () => {
      const kumarProjectDir = path.join(process.cwd(), `.tmp-test-kumar-${Date.now()}`);
      fs.mkdirSync(path.join(kumarProjectDir, "src", "app"), { recursive: true });

      try {
        fs.writeFileSync(
          path.join(kumarProjectDir, "package.json"),
          JSON.stringify({ name: "kumar-mess", scripts: { build: "next build" } })
        );
        fs.writeFileSync(
          path.join(kumarProjectDir, "src", "app", "page.tsx"),
          "export default function Page() { return <div><h1>Kumar Mess</h1><p>Authentic South Indian Mess</p><button>Order on WhatsApp</button></div>; }"
        );

        const buildResult: WebsiteBuildResult = {
          websiteId: "web-kumar-mess-001",
          leadId: "lead-kumar-mess-001",
          businessName: "Kumar Mess",
          template: "restaurant",
          pages: ["index"],
          buildOutput: "Build successful",
          status: "READY",
          buildStatus: "SUCCESS",
          buildErrors: [],
          generatedAt: new Date().toISOString(),
          artifact: {
            projectName: "kumar-mess-site",
            projectDir: kumarProjectDir,
            files: ["package.json", "src/app/page.tsx"],
            pages: ["index"],
          },
        };

        const result = await deployWebsite({
          websiteId: buildResult.websiteId,
          buildResult,
          businessName: "Kumar Mess",
          leadId: "lead-kumar-mess-001",
          mode: "mock",
        });

        expect(result.success).toBe(true);
        expect(result.status).toBe("READY");
        expect(result.businessName).toBe("Kumar Mess");
        expect(result.url).toMatch(/mock-kumar-mess.*\.vasaw\.app/);
      } finally {
        fs.rmSync(kumarProjectDir, { recursive: true, force: true });
      }
    });
  });
});
