import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { generateDeterministicContent } from "@/lib/agents/website/content/fallback";
import { renderWebsiteProject } from "@/lib/agents/website/renderer";
import { getTemplate } from "@/lib/agents/website/templates/registry";
import { getTheme } from "@/lib/agents/website/themes";
import { validateWebsiteStatic } from "@/lib/agents/website/validator";
import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult } from "@/lib/agents/qualification/types";

describe("Kumar Mess & Local Business Website Quality Upgrade", () => {
  let testOutputDir: string;

  beforeEach(() => {
    testOutputDir = path.join(
      process.cwd(),
      ".tmp-test-kumar-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6)
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

  const mockKumarMessLead: Lead = {
    id: "lead-kumar-mess-445",
    externalId: "gmaps-km-001",
    businessName: "Kumar Mess",
    category: "South Indian Restaurant",
    phone: "+91 98422 12345",
    address: "124 Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu",
    city: "Coimbatore",
    rating: 4.2,
    reviewCount: 445,
    website: null,
    socialLinks: [],
    source: "Google Maps",
    scrapedAt: "2026-09-06T10:00:00.000Z",
  };

  const mockQualification: QualificationResult = {
    leadId: "lead-kumar-mess-445",
    score: 95,
    priority: "high",
    websiteOpportunity: true,
    reason: "Strong website opportunity: no website - clear opportunity to build local presence and increase delivery orders",
    confidence: 0.98,
    factors: {
      hasWebsite: false,
      websiteQuality: 0,
      rating: 4.2,
      reviewCount: 445,
      category: "South Indian Restaurant",
      socialPresence: false,
      businessTypeNeedsWebsite: true,
    },
    evidence: ["4.2 star rating", "445 reviews", "No official website found"],
  };

  it("1. should NEVER leak internal AI qualification or sales language onto the customer website", () => {
    const template = getTemplate("restaurant");
    const content = generateDeterministicContent(mockKumarMessLead, mockQualification, template);

    const serializedContent = JSON.stringify(content).toLowerCase();

    // Verify forbidden internal keywords are absent
    expect(serializedContent).not.toContain("strong website opportunity");
    expect(serializedContent).not.toContain("no website");
    expect(serializedContent).not.toContain("clear opportunity");
    expect(serializedContent).not.toContain("lead score");
    expect(serializedContent).not.toContain("qualification");
    expect(serializedContent).not.toContain("sales analysis");
    expect(serializedContent).not.toContain("confidence:");
    expect(serializedContent).not.toContain("solutions tailored to your needs");
  });

  it("2. should generate authentic customer-facing hero content and verified ratings", () => {
    const template = getTemplate("restaurant");
    const content = generateDeterministicContent(mockKumarMessLead, mockQualification, template);

    expect(content.hero.headline).toBe("Kumar Mess");
    expect(content.hero.badge).toContain("4.2");
    expect(content.hero.badge).toContain("445");
    expect(content.hero.badge).toContain("Coimbatore");
    expect(content.hero.ctaText).toBe("Explore Menu");
    expect(content.hero.ctaLink).toBe("#menu");
    expect(content.hero.subheadline).toContain("Traditional recipes");
    expect(content.hero.subheadline).toContain("Coimbatore");
  });

  it("3. should generate authentic culinary menu categories with dish details and WhatsApp ordering", () => {
    const template = getTemplate("restaurant");
    const content = generateDeterministicContent(mockKumarMessLead, mockQualification, template);

    expect(content.menu).toBeDefined();
    expect(content.menu?.categories?.length).toBeGreaterThanOrEqual(3);

    const categoryNames = content.menu?.categories.map((c) => c.name);
    expect(categoryNames).toContain("Traditional Meals & Thali");
    expect(categoryNames).toContain("Tiffin & Fresh Dosa");

    const allDishes = content.menu?.categories.flatMap((c) => c.items) ?? [];
    expect(allDishes.length).toBeGreaterThanOrEqual(6);
    expect(allDishes.some((d) => d.name.includes("Meals") || d.name.includes("Thali"))).toBe(true);
    expect(allDishes.some((d) => d.name.includes("Dosa"))).toBe(true);
  });

  it("4. should generate genuine restaurant services without corporate consulting clichés", () => {
    const template = getTemplate("restaurant");
    const content = generateDeterministicContent(mockKumarMessLead, mockQualification, template);

    expect(content.services).toBeDefined();
    const serviceTitles = content.services?.items.map((s) => s.title) ?? [];
    expect(serviceTitles).toContain("Dine-In Experience");
    expect(serviceTitles).toContain("Takeaway & Parcel Service");
    expect(serviceTitles).toContain("Doorstep WhatsApp Ordering");
    expect(serviceTitles).toContain("Bulk & Catering Orders");

    // Ensure zero corporate clichés
    const serviceDescriptions = content.services?.items.map((s) => s.description).join(" ").toLowerCase() ?? "";
    expect(serviceDescriptions).not.toContain("solutions tailored to your needs");
    expect(serviceDescriptions).not.toContain("clients");
  });

  it("5. should render complete Next.js website files with mobile navigation, gallery lightbox, and Google map embed", () => {
    const template = getTemplate("restaurant");
    const theme = getTheme("restaurant");
    const content = generateDeterministicContent(mockKumarMessLead, mockQualification, template);

    const result = renderWebsiteProject({
      lead: mockKumarMessLead,
      qualification: mockQualification,
      template,
      theme,
      content,
      outputBaseDir: testOutputDir,
    });

    expect(result.projectName).toBe("kumar-mess-leadkuma");
    expect(fs.existsSync(result.projectDir)).toBe(true);

    const staticCheck = validateWebsiteStatic(result.projectDir);
    expect(staticCheck.valid).toBe(true);

    // Read page.tsx
    const pageTsx = fs.readFileSync(path.join(result.projectDir, "src", "app", "page.tsx"), "utf8");

    // Check sticky header, navigation, and mobile drawer
    expect(pageTsx).toContain("Kumar Mess");
    expect(pageTsx).toContain("About");
    expect(pageTsx).toContain("Menu");
    expect(pageTsx).toContain("Services");
    expect(pageTsx).toContain("Gallery");
    expect(pageTsx).toContain("Reviews");
    expect(pageTsx).toContain("isMobileMenuOpen");
    expect(pageTsx).toContain("isBookingOpen");

    // Check verified Google Reviews presentation
    expect(pageTsx).toContain("Google Maps Reviews");
    expect(pageTsx).toContain("reviewCountValue = 445");
    expect(pageTsx).toContain("Based on {reviewCountValue");

    // Check Google Map embed
    expect(pageTsx).toContain("maps.google.com/maps?q=");

    // Check WhatsApp Floating widget
    expect(pageTsx).toContain('const whatsappUrl = cleanPhone ? "https://wa.me/" + cleanPhone : "#contact"');

    // Check that NO internal qualification language exists in page.tsx
    expect(pageTsx).not.toContain("Strong website opportunity");
    expect(pageTsx).not.toContain("no website - clear opportunity");
  });
});
