import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

import {
  runWebsiteAgent,
  buildWebsite,
  validateRequest,
  selectTemplate,
  getTemplate,
  listTemplates,
  getTheme,
  validateWebsiteProject,
  TemplateType,
  WebsiteRequest,
} from "@/lib/agents/website";
import { generateDeterministicContent } from "@/lib/agents/website/content/fallback";
import { generateWebsiteContent } from "@/lib/agents/website/content/generator";
import {
  renderWebsiteProject,
  sanitizeProjectName,
  safeSerialize,
} from "@/lib/agents/website/renderer";
import {
  validateWebsiteStatic,
  executeWebsiteBuild,
} from "@/lib/agents/website/validator";
import { MockWebsiteProvider, AIWebsiteProvider, getWebsiteProvider } from "@/lib/agents/website/providers";
import { runWebsiteBuildingAgent } from "@/lib/agents/website-building";
import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult } from "@/lib/agents/qualification/types";

// Mock router for AI testing
vi.mock("@/lib/ai/router", () => ({
  routeRequest: vi.fn(),
}));

// Mock Supabase server for storage calls using vi.hoisted
const {
  mockSelect,
  mockEq,
  mockSingle,
  mockInsert,
  mockUpdate,
  mockUpsert,
  mockFrom,
  mockRpc,
} = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockUpsert: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => {
  const chainable = {
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    single: mockSingle,
    insert: mockInsert.mockReturnThis(),
    update: mockUpdate.mockReturnThis(),
    upsert: mockUpsert.mockReturnThis(),
  };
  mockSelect.mockReturnValue(chainable);
  mockEq.mockReturnValue(chainable);
  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({ single: mockSingle }),
  });
  mockUpdate.mockReturnValue({
    eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }),
  });
  mockUpsert.mockReturnValue({
    select: vi.fn().mockReturnValue({ single: mockSingle }),
  });
  mockFrom.mockReturnValue(chainable);

  return {
    getSupabaseAdmin: () => ({
      from: mockFrom,
      rpc: mockRpc,
    }),
  };
});

const createMockLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: "lead-saravana-12345",
  externalId: "ext-101",
  businessName: "Saravana Bhavan",
  category: "Restaurant",
  phone: "+91 422 239 1234",
  website: null,
  address: "148 Brooke Fields Road, Coimbatore, Tamil Nadu",
  city: "Coimbatore",
  rating: 4.6,
  reviewCount: 420,
  socialLinks: ["https://facebook.com/saravanabhavan"],
  source: "Google Maps",
  scrapedAt: "2026-08-28T09:00:00.000Z",
  ...overrides,
});

const createMockQualification = (overrides: Partial<QualificationResult> = {}): QualificationResult => ({
  leadId: "lead-saravana-12345",
  score: 92,
  priority: "high",
  websiteOpportunity: true,
  reason: "High ratings and high reviews with no website in high-demand restaurant category",
  confidence: 0.95,
  factors: {
    hasWebsite: false,
    websiteQuality: 0,
    rating: 4.6,
    reviewCount: 420,
    category: "Restaurant",
    socialPresence: true,
    businessTypeNeedsWebsite: true,
  },
  evidence: ["4.6 star rating", "420 reviews", "No official website found"],
  ...overrides,
});

describe("Agent 4 — Website Building Agent", () => {
  let testOutputDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    testOutputDir = path.join(
      process.cwd(),
      ".tmp-test-websites-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6)
    );
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe("Template Registry & Selection", () => {
    it("should select 'restaurant' template for culinary categories", () => {
      expect(selectTemplate("Restaurant")).toBe("restaurant");
      expect(selectTemplate("South Indian Restaurant")).toBe("restaurant");
      expect(selectTemplate("Bistro & Kitchen")).toBe("restaurant");
      expect(selectTemplate("Pizza & Burger Diner")).toBe("restaurant");
      expect(selectTemplate("Biryani Center")).toBe("restaurant");
      expect(selectTemplate("Vegetarian Dining")).toBe("restaurant");
    });

    it("should select 'cafe' template for coffee & bakery categories", () => {
      expect(selectTemplate("Cafe")).toBe("cafe");
      expect(selectTemplate("Coffee Shop")).toBe("cafe");
      expect(selectTemplate("Bakery & Pastry")).toBe("cafe");
      expect(selectTemplate("Espresso Bar")).toBe("cafe");
      expect(selectTemplate("Tea Lounge")).toBe("cafe");
    });

    it("should select 'salon' template for beauty & grooming categories", () => {
      expect(selectTemplate("Hair Salon")).toBe("salon");
      expect(selectTemplate("Beauty Parlour")).toBe("salon");
      expect(selectTemplate("Barber Shop")).toBe("salon");
      expect(selectTemplate("Nail Spa")).toBe("salon");
      expect(selectTemplate("Skin Care Clinic & Spa")).toBe("salon");
    });

    it("should select 'gym' template for fitness categories", () => {
      expect(selectTemplate("Fitness Gym")).toBe("gym");
      expect(selectTemplate("CrossFit Box")).toBe("gym");
      expect(selectTemplate("Yoga Studio")).toBe("gym");
      expect(selectTemplate("Pilates Center")).toBe("gym");
      expect(selectTemplate("Martial Arts Dojo")).toBe("gym");
    });

    it("should select 'tattoo' template for tattoo & body art categories", () => {
      expect(selectTemplate("Tattoo Studio")).toBe("tattoo");
      expect(selectTemplate("Body Art & Piercing")).toBe("tattoo");
      expect(selectTemplate("Ink Lounge")).toBe("tattoo");
    });

    it("should select 'clinic' template for healthcare & medical categories", () => {
      expect(selectTemplate("Dental Clinic")).toBe("clinic");
      expect(selectTemplate("Physiotherapy Center")).toBe("clinic");
      expect(selectTemplate("Eye Care Hospital")).toBe("clinic");
      expect(selectTemplate("Veterinary Clinic")).toBe("clinic");
      expect(selectTemplate("Pediatric Medical Practice")).toBe("clinic");
    });

    it("should fallback to 'generic' template for unknown or miscellaneous categories", () => {
      expect(selectTemplate("Software Agency")).toBe("generic");
      expect(selectTemplate("Aerospace Consulting")).toBe("generic");
      expect(selectTemplate("Plumbing Services")).toBe("generic");
      expect(selectTemplate("Commercial Packaging")).toBe("generic");
    });

    it("should retrieve template definitions for all supported categories", () => {
      const templates: TemplateType[] = [
        "restaurant",
        "cafe",
        "hotel",
        "salon",
        "spa",
        "gym",
        "tattoo",
        "clinic",
        "retail",
        "professional",
        "generic",
        "local-service",
      ];

      for (const tId of templates) {
        const def = getTemplate(tId);
        expect(def).toBeDefined();
        expect(def.id).toBeDefined();
        expect(def.sections.length).toBeGreaterThan(0);
        expect(def.pages).toContain("index");
        expect(def.pages).toContain("contact");
        expect(def.defaultTheme).toBeDefined();
      }
    });

    it("should fallback to generic template definition for invalid template id", () => {
      const def = getTemplate("non-existent-template" as TemplateType);
      expect(def).toBeDefined();
      expect(def.id).toBe("generic");
    });

    it("should list all registered core templates", () => {
      const list = listTemplates();
      expect(list.length).toBeGreaterThanOrEqual(10);
      const ids = list.map((t) => t.id);
      expect(ids).toContain("restaurant");
      expect(ids).toContain("cafe");
      expect(ids).toContain("hotel");
      expect(ids).toContain("salon");
      expect(ids).toContain("spa");
      expect(ids).toContain("gym");
      expect(ids).toContain("clinic");
      expect(ids).toContain("retail");
      expect(ids).toContain("professional");
      expect(ids).toContain("generic");
    });
  });

  describe("Theme Engine", () => {
    it("should provide tailored themes with valid hex colors and fonts for all categories", () => {
      const categories: TemplateType[] = [
        "restaurant",
        "cafe",
        "hotel",
        "salon",
        "spa",
        "gym",
        "tattoo",
        "clinic",
        "retail",
        "professional",
        "generic",
      ];

      for (const cat of categories) {
        const theme = getTheme(cat);
        expect(theme.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.secondaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.textColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.fontPairing).toBeDefined();
        expect(theme.heroPattern).toBeDefined();
        expect(theme.borderRadius).toBeDefined();
      }
    });

    it("should fallback to generic theme for invalid theme key", () => {
      const theme = getTheme("unknown" as TemplateType);
      expect(theme).toBeDefined();
      expect(theme.primaryColor).toBe("#00f0ff");
    });
  });

  describe("Request Validation", () => {
    it("should accept valid website request", () => {
      const valid = validateRequest({
        lead: createMockLead(),
        qualification: createMockQualification(),
        mode: "mock",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject non-object body", () => {
      expect(validateRequest(null).valid).toBe(false);
      expect(validateRequest("string").valid).toBe(false);
      expect(validateRequest(123).valid).toBe(false);
    });

    it("should reject request missing lead", () => {
      const res = validateRequest({
        qualification: createMockQualification(),
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Missing required field: lead");
    });

    it("should reject request where lead is missing id or businessName", () => {
      const res1 = validateRequest({
        lead: { businessName: "No ID" },
        qualification: createMockQualification(),
      });
      expect(res1.valid).toBe(false);
      expect(res1.errors).toContain("Lead missing required 'id'");

      const res2 = validateRequest({
        lead: { id: "123" },
        qualification: createMockQualification(),
      });
      expect(res2.valid).toBe(false);
      expect(res2.errors).toContain("Lead missing required 'businessName'");
    });

    it("should reject request missing qualification or invalid fields", () => {
      const res = validateRequest({
        lead: createMockLead(),
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Missing required field: qualification");
    });

    it("should default mode to 'mock' when mode is omitted or not 'ai'", () => {
      const req: WebsiteRequest = {
        lead: createMockLead(),
        qualification: createMockQualification(),
      };
      const valid = validateRequest(req);
      expect(valid.valid).toBe(true);
      expect(req.mode).toBe("mock");
    });
  });

  describe("Content Generation & Deterministic Fallback", () => {
    it("should generate deterministic content with verified business facts only", () => {
      const lead = createMockLead({
        businessName: "Saravana Bhavan",
        city: "Coimbatore",
        rating: 4.8,
        reviewCount: 512,
        phone: "+91 422 239 1234",
      });
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");

      const content = generateDeterministicContent(lead, qualification, template);

      expect(content.metaTitle).toContain("Saravana Bhavan");
      expect(content.metaTitle).toContain("Coimbatore");
      expect(content.hero.headline).toBe("Saravana Bhavan");
      expect(content.hero.badge).toContain("4.8/5");
      expect(content.hero.badge).toContain("512 Reviews");
      expect(content.contact.phone).toBe("+91 422 239 1234");
      expect(content.contact.address).toContain("Coimbatore");
      expect(content.about.body).toContain("Saravana Bhavan");
      expect(content.about.body).toContain("Coimbatore");
      expect(content.services?.items.length).toBeGreaterThan(0);
      expect(content.menu?.categories.length).toBeGreaterThan(0);
    });

    it("should handle leads with missing optional fields without errors", () => {
      const minimalLead: Lead = {
        id: "min-1",
        businessName: "Minimal Bistro",
        category: "Restaurant",
        phone: "",
        website: null,
        address: "",
        city: "",
        rating: 0,
        reviewCount: 0,
        socialLinks: [],
        source: "Google Maps",
        scrapedAt: new Date().toISOString(),
      };
      const minimalQual: QualificationResult = {
        leadId: "min-1",
        score: 50,
        priority: "medium",
        websiteOpportunity: true,
        reason: "Opportunity exists",
        confidence: 0.8,
        factors: {
          hasWebsite: false,
          websiteQuality: 0,
          rating: 0,
          reviewCount: 0,
          category: "Restaurant",
          socialPresence: false,
          businessTypeNeedsWebsite: true,
        },
        evidence: [],
      };

      const template = getTemplate("restaurant");
      const content = generateDeterministicContent(minimalLead, minimalQual, template);

      expect(content).toBeDefined();
      expect(content.hero.headline).toBe("Minimal Bistro");
      expect(content.contact.phone).toBe("");
    });

    it("should fall back to deterministic content when AI router fails", async () => {
      const { routeRequest } = await import("@/lib/ai/router");
      vi.mocked(routeRequest).mockResolvedValueOnce({
        response: {
          success: false,
          content: null,
          provider: "gemini",
          model: "gemini-1.5-pro",
          latencyMs: 5000,
          errorKind: "timeout",
          errorMessage: "AI Service Timeout",
          retryCount: 2,
          fallbackUsed: false,
        },
        attempts: [],
        resumable: false,
      });

      const lead = createMockLead();
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");

      const content = await generateWebsiteContent({
        lead,
        qualification,
        template,
        mode: "ai",
      });

      expect(content).toBeDefined();
      expect(content.hero.headline).toBe(lead.businessName);
      expect(content.contact.phone).toBe(lead.phone);
    });

    it("should fall back to deterministic content when AI output is malformed JSON", async () => {
      const { routeRequest } = await import("@/lib/ai/router");
      vi.mocked(routeRequest).mockResolvedValueOnce({
        response: {
          success: true,
          content: "Here is your website JSON: { invalid json ...",
          provider: "gemini",
          model: "gemini-1.5-pro",
          latencyMs: 1200,
          errorKind: null,
          errorMessage: null,
          retryCount: 0,
          fallbackUsed: false,
        },
        attempts: [],
        resumable: false,
      });

      const lead = createMockLead();
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");

      const content = await generateWebsiteContent({
        lead,
        qualification,
        template,
        mode: "ai",
      });

      expect(content).toBeDefined();
      expect(content.hero.headline).toBe(lead.businessName);
      expect(content.metaTitle).toContain("Saravana Bhavan");
    });

    it("should parse and validate valid AI JSON output when AI succeeds", async () => {
      const mockAiOutput = {
        metaTitle: "Custom AI Title - Saravana Bhavan",
        metaDescription: "Custom AI Meta Description",
        hero: {
          headline: "AI Authentic Indian Taste",
          subheadline: "Handcrafted recipes from generation to generation",
          ctaText: "Explore Now",
          ctaLink: "#menu",
          badge: "Specialty Cuisine",
        },
        about: {
          headline: "Our Culinary Heritage",
          body: "Serving delicious vegetarian dishes with passion.",
          highlights: ["Authentic Recipes", "Pure Ingredients"],
        },
        services: {
          headline: "Our Offerings",
          items: [{ title: "South Indian Thali", description: "Complete traditional meal" }],
        },
        menu: {
          headline: "Menu Highlights",
          categories: [
            {
              name: "Tiffin",
              items: [{ name: "Ghee Roast Dosa", description: "Crispy and golden", price: "₹120" }],
            },
          ],
        },
        testimonials: {
          headline: "Customer Testimonials",
          items: [{ name: "Priya S.", comment: "Best dosa in town!", rating: 5 }],
        },
        contact: {
          headline: "Reach Out",
          address: "148 Brooke Fields Road, Coimbatore",
          phone: "+91 422 239 1234",
        },
        cta: {
          headline: "Visit Us Today",
          subheadline: "Delicious food is waiting for you",
          buttonText: "Reserve Table",
          buttonLink: "#contact",
        },
        footer: {
          copyrightText: "© 2026 Saravana Bhavan. All rights reserved.",
        },
      };

      const { routeRequest } = await import("@/lib/ai/router");
      vi.mocked(routeRequest).mockResolvedValueOnce({
        response: {
          success: true,
          content: JSON.stringify(mockAiOutput),
          provider: "gemini",
          model: "gemini-1.5-pro",
          latencyMs: 1500,
          errorKind: null,
          errorMessage: null,
          retryCount: 0,
          fallbackUsed: false,
        },
        attempts: [],
        resumable: false,
      });

      const lead = createMockLead();
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");

      const content = await generateWebsiteContent({
        lead,
        qualification,
        template,
        mode: "ai",
      });

      expect(content.metaTitle).toBe("Custom AI Title - Saravana Bhavan");
      expect(content.hero.headline).toBe("AI Authentic Indian Taste");
      expect(content.about.headline).toBe("Our Culinary Heritage");
      expect(content.menu?.categories[0].items[0].name).toBe("Ghee Roast Dosa");
    });
  });

  describe("Renderer & Security", () => {
    it("should sanitize project names to safe alphanumeric paths", () => {
      expect(sanitizeProjectName("Saravana Bhavan & Co.", "lead-12345")).toBe(
        "saravana-bhavan-co-lead1234"
      );
      expect(sanitizeProjectName("Cafe 100% Organic!", "abc-999")).toBe("cafe-100-organic-abc999");
      expect(sanitizeProjectName("../../../etc/passwd", "hack123")).toBe("etc-passwd-hack123");
      expect(sanitizeProjectName("", "")).toBe("business-site");
    });

    it("should escape unsafe HTML & script characters in safeSerialize", () => {
      const unsafe = {
        script: "<script>alert('xss')</script>",
        unicode: "line1\u2028line2\u2029line3",
        tag: "<img src=x onerror=alert(1)>",
      };
      const serialized = safeSerialize(unsafe);
      expect(serialized).not.toContain("<script>");
      expect(serialized).toContain("\\u003cscript\\u003e");
      expect(serialized).not.toContain("\u2028");
      expect(serialized).not.toContain("\u2029");
    });

    it("should render complete Next.js project files to disk", () => {
      const lead = createMockLead();
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");
      const theme = getTheme("restaurant");
      const content = generateDeterministicContent(lead, qualification, template);

      const renderResult = renderWebsiteProject({
        lead,
        qualification,
        template,
        theme,
        content,
        outputBaseDir: testOutputDir,
      });

      expect(renderResult.projectDir).toBeDefined();
      expect(fs.existsSync(renderResult.projectDir)).toBe(true);

      const expectedFiles = [
        "package.json",
        "tsconfig.json",
        "next.config.js",
        "tailwind.config.js",
        "postcss.config.js",
        "next-env.d.ts",
        ".gitignore",
        "README.md",
        "src/app/globals.css",
        "src/app/layout.tsx",
        "src/app/page.tsx",
        "src/app/contact/page.tsx",
        "public/placeholder-hero.svg",
        "public/placeholder-1.svg",
        "public/placeholder-2.svg",
        "public/placeholder-3.svg",
      ];

      for (const file of expectedFiles) {
        const fullPath = path.join(renderResult.projectDir, file);
        expect(fs.existsSync(fullPath)).toBe(true);
        const stat = fs.statSync(fullPath);
        expect(stat.size).toBeGreaterThan(0);
      }
    });

    it("should block path traversal attempts when rendering", () => {
      const lead = createMockLead({ businessName: "../../../../outside-dir" });
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");
      const theme = getTheme("restaurant");
      const content = generateDeterministicContent(lead, qualification, template);

      const renderResult = renderWebsiteProject({
        lead,
        qualification,
        template,
        theme,
        content,
        outputBaseDir: testOutputDir,
      });

      expect(renderResult.projectDir.startsWith(path.resolve(testOutputDir))).toBe(true);
    });
  });

  describe("Build Validation (Static & Real Production Build)", () => {
    it("should perform static validation on properly rendered project", () => {
      const lead = createMockLead();
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");
      const theme = getTheme("restaurant");
      const content = generateDeterministicContent(lead, qualification, template);

      const renderResult = renderWebsiteProject({
        lead,
        qualification,
        template,
        theme,
        content,
        outputBaseDir: testOutputDir,
      });

      const staticCheck = validateWebsiteStatic(renderResult.projectDir);
      expect(staticCheck.valid).toBe(true);
      expect(staticCheck.errors).toHaveLength(0);
    });

    it("should detect and report missing required project files", () => {
      const dummyDir = path.join(testOutputDir, "incomplete-project");
      fs.mkdirSync(dummyDir, { recursive: true });

      // Create only package.json
      fs.writeFileSync(
        path.join(dummyDir, "package.json"),
        JSON.stringify({ name: "test", scripts: { build: "next build" } })
      );

      const validation = validateWebsiteStatic(dummyDir);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some((e) => e.includes("tsconfig.json"))).toBe(true);
      expect(validation.errors.some((e) => e.includes("layout.tsx"))).toBe(true);
    });

    it("should detect corrupted or invalid JSON in package.json", () => {
      const lead = createMockLead();
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");
      const theme = getTheme("restaurant");
      const content = generateDeterministicContent(lead, qualification, template);

      const renderResult = renderWebsiteProject({
        lead,
        qualification,
        template,
        theme,
        content,
        outputBaseDir: testOutputDir,
      });

      fs.writeFileSync(path.join(renderResult.projectDir, "package.json"), "{ corrupted json ...", "utf8");

      const validation = validateWebsiteStatic(renderResult.projectDir);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes("package.json"))).toBe(true);
    });

    it("should detect dangerous command injection characters in package.json build script", () => {
      const lead = createMockLead();
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");
      const theme = getTheme("restaurant");
      const content = generateDeterministicContent(lead, qualification, template);

      const renderResult = renderWebsiteProject({
        lead,
        qualification,
        template,
        theme,
        content,
        outputBaseDir: testOutputDir,
      });

      const pkg = JSON.parse(fs.readFileSync(path.join(renderResult.projectDir, "package.json"), "utf8"));
      pkg.scripts.build = "next build && rm -rf /";
      fs.writeFileSync(path.join(renderResult.projectDir, "package.json"), JSON.stringify(pkg, null, 2));

      const validation = validateWebsiteStatic(renderResult.projectDir);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes("Unsafe characters"))).toBe(true);
    });

    it("should execute real production build successfully on rendered project", { timeout: 120000 }, () => {
      const lead = createMockLead();
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");
      const theme = getTheme("restaurant");
      const content = generateDeterministicContent(lead, qualification, template);

      const renderResult = renderWebsiteProject({
        lead,
        qualification,
        template,
        theme,
        content,
        outputBaseDir: testOutputDir,
      });

      const buildRes = executeWebsiteBuild(renderResult.projectDir);
      expect(buildRes.success).toBe(true);
      expect(buildRes.errors).toHaveLength(0);
      expect(buildRes.stdout).toContain("Compiled successfully");
    });

    it("should fail real production build and capture errors when source code contains syntax error", { timeout: 120000 }, () => {
      const lead = createMockLead();
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");
      const theme = getTheme("restaurant");
      const content = generateDeterministicContent(lead, qualification, template);

      const renderResult = renderWebsiteProject({
        lead,
        qualification,
        template,
        theme,
        content,
        outputBaseDir: testOutputDir,
      });

      // Inject a syntax error into page.tsx
      fs.writeFileSync(
        path.join(renderResult.projectDir, "src/app/page.tsx"),
        "export default function BrokenPage() { return <div unclosed_tag>; }",
        "utf8"
      );

      const buildRes = executeWebsiteBuild(renderResult.projectDir);
      expect(buildRes.success).toBe(false);
      expect(buildRes.errors.length).toBeGreaterThan(0);
      expect(buildRes.errors[0]).toContain("Production build failed");
    });

    it("should reject project and mark status FAILED when real build fails", () => {
      const lead = createMockLead();
      const qualification = createMockQualification();
      const template = getTemplate("restaurant");
      const theme = getTheme("restaurant");
      const content = generateDeterministicContent(lead, qualification, template);

      const renderResult = renderWebsiteProject({
        lead,
        qualification,
        template,
        theme,
        content,
        outputBaseDir: testOutputDir,
      });

      // Corrupt page.tsx
      fs.writeFileSync(
        path.join(renderResult.projectDir, "src/app/page.tsx"),
        "invalid typescript code here !!!",
        "utf8"
      );

      const validation = validateWebsiteProject(renderResult.projectDir);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Mock Mode & Status Gating", () => {
    it("should execute deterministic mock build with real production build and no fake preview URL", { timeout: 120000 }, async () => {
      const lead = createMockLead();
      const qualification = createMockQualification();

      const result = await buildWebsite({
        lead,
        qualification,
        mode: "mock",
        outputBaseDir: testOutputDir,
      });

      expect(result.status).toBe("READY");
      expect(result.buildStatus).toBe("SUCCESS");
      expect(result.template).toBe("restaurant");
      expect(result.businessName).toBe("Saravana Bhavan");
      expect(result.artifact).toBeDefined();
      expect(result.artifact.files.length).toBeGreaterThanOrEqual(10);
      expect(fs.existsSync(result.artifact.projectDir)).toBe(true);
      // Undeployed websites must NOT claim to be live
      expect(result.previewUrl).toBeUndefined();
      expect(result.artifact.previewUrl).toBeUndefined();
      expect(result.buildErrors).toHaveLength(0);
    });

    it("should return MockWebsiteProvider for mock mode and AIWebsiteProvider for ai mode", () => {
      expect(getWebsiteProvider("mock")).toBeInstanceOf(MockWebsiteProvider);
      expect(getWebsiteProvider("ai")).toBeInstanceOf(AIWebsiteProvider);
    });
  });

  describe("Website Agent Execution (runWebsiteAgent)", () => {
    it("should return successful response on valid request", { timeout: 30000 }, async () => {
      const request: WebsiteRequest = {
        lead: createMockLead(),
        qualification: createMockQualification(),
        mode: "mock",
        outputBaseDir: testOutputDir,
      };

      const response = await runWebsiteAgent(request);
      expect(response.success).toBe(true);
      expect(response.agent).toBe("website-building");
      expect(response.mode).toBe("mock");
      expect(response.count).toBe(1);
      expect(response.result).toBeDefined();
      expect(response.result?.status).toBe("READY");
      expect(response.result?.buildStatus).toBe("SUCCESS");
      expect(response.result?.businessName).toBe("Saravana Bhavan");
      expect(response.result?.previewUrl).toBeUndefined();
    });
  });

  describe("Agent 4 Storage Integration (runWebsiteBuildingAgent)", () => {
    it("should execute full build, call storage persistence, and complete job", { timeout: 120000 }, async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: "web-test-123",
          lead_id: "lead-saravana-12345",
          business_name: "Saravana Bhavan",
          category: "Restaurant",
          location: "Coimbatore",
          status: "built",
          template: "restaurant",
          pages: 2,
          sections: 8,
          build_progress: 100,
          created_at: new Date().toISOString(),
        },
        error: null,
      });
      mockRpc.mockResolvedValue({ data: true, error: null });

      const input = {
        leadId: "lead-saravana-12345",
        businessName: "Saravana Bhavan",
        category: "Restaurant",
        location: "Coimbatore",
        rating: 4.6,
        reviews: 420,
        phone: "+91 422 239 1234",
        website: null,
        scraped: {
          address: "148 Brooke Fields Road, Coimbatore",
          phone: "+91 422 239 1234",
          rating: 4.6,
          reviews: 420,
          category: "Restaurant",
          services: ["South Indian Thali", "Masala Dosa", "Filter Coffee"],
          source: "Google Maps",
          scrapedAt: new Date().toISOString(),
        },
        qualification: {
          hasWebsite: false,
          websiteQuality: 0,
          hasWhatsApp: true,
          hasReviews: true,
          responseLikelihood: "high" as const,
          notes: "Excellent lead",
        },
        opportunity: {
          score: 92,
          priority: "high" as const,
          reasons: ["Top rated restaurant"],
          estimatedValue: 5000,
        },
      };

      const result = await runWebsiteBuildingAgent(input, { mode: "mock" });

      expect(result).toBeDefined();
      expect(result.templateId).toBe("restaurant");
      expect(result.buildStatus).toBe("SUCCESS");
      expect(result.pages).toContain("index");
      expect(result.previewUrl).toBeUndefined();
    });
  });

  describe("API Route (POST /api/agents/website)", () => {
    it("should process valid POST request and return 200", { timeout: 120000 }, async () => {
      const { POST } = await import("@/app/api/agents/website/route");

      const req = new Request("http://localhost:3000/api/agents/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: createMockLead(),
          qualification: createMockQualification(),
          mode: "mock",
          outputBaseDir: testOutputDir,
        }),
      });

      const response = await POST(req as unknown as import("next/server").NextRequest);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.agent).toBe("website-building");
      expect(json.result).toBeDefined();
      expect(json.result.status).toBe("READY");
      expect(json.result.buildStatus).toBe("SUCCESS");
      expect(json.result.previewUrl).toBeUndefined();
    });

    it("should return 400 on invalid request body", async () => {
      const { POST } = await import("@/app/api/agents/website/route");

      const req = new Request("http://localhost:3000/api/agents/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalid: true }),
      });

      const response = await POST(req as unknown as import("next/server").NextRequest);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
    });
  });
});
