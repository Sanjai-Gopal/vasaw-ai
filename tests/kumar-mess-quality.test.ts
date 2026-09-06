import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { generateDeterministicContent } from "@/lib/agents/website/content/fallback";
import { renderWebsiteProject } from "@/lib/agents/website/renderer";
import { getTemplate, selectTemplate } from "@/lib/agents/website/templates/registry";
import { getTheme } from "@/lib/agents/website/themes";
import { validateWebsiteStatic } from "@/lib/agents/website/validator";
import { createPublicBusinessProfile, PublicBusinessProfile } from "@/lib/agents/website/types";
import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult } from "@/lib/agents/qualification/types";

describe("Agent 4 Website Builder Hardening & Kumar Mess Regression", () => {
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

  const FORBIDDEN_INTERNAL_TERMS = [
    "opportunity score",
    "qualification score",
    "qualification",
    "lead score",
    "ai reasoning",
    "confidence",
    "internal evidence",
    "website opportunity",
    "no website",
    "clear opportunity",
    "sales analysis",
    "lead qualification",
    "outstanding restaurant solutions",
    "tailored to your needs",
  ];

  it("1. Public Data Boundary: createPublicBusinessProfile strips all internal lead & qualification metadata", () => {
    const profile = createPublicBusinessProfile(mockKumarMessLead);

    // Verify allowed fields are properly mapped
    expect(profile.id).toBe("lead-kumar-mess-445");
    expect(profile.businessName).toBe("Kumar Mess");
    expect(profile.category).toBe("South Indian Restaurant");
    expect(profile.city).toBe("Coimbatore");
    expect(profile.address).toBe("124 Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu");
    expect(profile.phone).toBe("+91 98422 12345");
    expect(profile.rating).toBe(4.2);
    expect(profile.reviewCount).toBe(445);
    expect(profile.website).toBeNull();

    // Verify strictly NO internal fields exist on PublicBusinessProfile
    const profileKeys = Object.keys(profile);
    expect(profileKeys).not.toContain("score");
    expect(profileKeys).not.toContain("opportunityScore");
    expect(profileKeys).not.toContain("priority");
    expect(profileKeys).not.toContain("reason");
    expect(profileKeys).not.toContain("evidence");
    expect(profileKeys).not.toContain("factors");
    expect(profileKeys).not.toContain("confidence");
    expect(profileKeys).not.toContain("websiteOpportunity");
    expect(profileKeys).not.toContain("source");
  });

  it("2. Internal Data Leak Test: Customer-facing website copy NEVER contains internal sales or AI reasoning", () => {
    const profile = createPublicBusinessProfile(mockKumarMessLead);
    const template = getTemplate("restaurant");
    const content = generateDeterministicContent(profile, mockQualification, template);

    const serializedContent = JSON.stringify(content).toLowerCase();

    for (const term of FORBIDDEN_INTERNAL_TERMS) {
      expect(serializedContent).not.toContain(term.toLowerCase());
    }
  });

  it("3. Kumar Mess Quality & Regression Test: authentic culinary identity, verified badges, menu & CTAs", () => {
    const profile = createPublicBusinessProfile(mockKumarMessLead);
    const template = getTemplate("restaurant");
    const content = generateDeterministicContent(profile, mockQualification, template);

    // Verified Hero Facts
    expect(content.hero.headline).toBe("Kumar Mess");
    expect(content.hero.badge).toContain("4.2");
    expect(content.hero.badge).toContain("445");
    expect(content.hero.badge).toContain("Coimbatore");
    expect(content.hero.ctaText).toBe("Explore Menu");
    expect(content.hero.ctaLink).toBe("#menu");
    expect(content.hero.subheadline).toContain("Traditional recipes");
    expect(content.hero.subheadline).toContain("Coimbatore");

    // Verified Authentic Menu (NO fabricated prices/fake awards)
    expect(content.menu).toBeDefined();
    expect(content.menu?.categories?.length).toBeGreaterThanOrEqual(3);

    const categoryNames = content.menu?.categories.map((c) => c.name);
    expect(categoryNames).toContain("Traditional Meals & Thali");
    expect(categoryNames).toContain("Tiffin & Fresh Dosa");

    const allDishes = content.menu?.categories.flatMap((c) => c.items) ?? [];
    expect(allDishes.length).toBeGreaterThanOrEqual(6);
    expect(allDishes.some((d) => d.name.includes("Meals") || d.name.includes("Thali"))).toBe(true);
    expect(allDishes.some((d) => d.name.includes("Dosa"))).toBe(true);

    // Realistic Restaurant Services
    expect(content.services).toBeDefined();
    const serviceTitles = content.services?.items.map((s) => s.title) ?? [];
    expect(serviceTitles).toContain("Dine-In Experience");
    expect(serviceTitles).toContain("Takeaway & Parcel Service");
    expect(serviceTitles).toContain("Doorstep WhatsApp Ordering");
    expect(serviceTitles).toContain("Bulk & Catering Orders");

    // Zero Corporate Clichés
    const serviceDescriptions = content.services?.items.map((s) => s.description).join(" ").toLowerCase() ?? "";
    expect(serviceDescriptions).not.toContain("solutions tailored to your needs");
    expect(serviceDescriptions).not.toContain("clients");
  });

  it("4. Full Next.js Project Render & Static Validation for Kumar Mess", () => {
    const profile = createPublicBusinessProfile(mockKumarMessLead);
    const template = getTemplate("restaurant");
    const theme = getTheme("restaurant");
    const content = generateDeterministicContent(profile, mockQualification, template);

    const result = renderWebsiteProject({
      profile,
      template,
      theme,
      content,
      outputBaseDir: testOutputDir,
    });

    expect(result.projectName).toBe("kumar-mess-leadkuma");
    expect(fs.existsSync(result.projectDir)).toBe(true);

    const staticCheck = validateWebsiteStatic(result.projectDir);
    expect(staticCheck.valid).toBe(true);
    expect(staticCheck.errors).toHaveLength(0);

    // Read page.tsx
    const pageTsx = fs.readFileSync(path.join(result.projectDir, "src", "app", "page.tsx"), "utf8");

    // Verify Sticky Navigation, Brand, and Mobile Drawer
    expect(pageTsx).toContain("Kumar Mess");
    expect(pageTsx).toContain("About");
    expect(pageTsx).toContain("Menu");
    expect(pageTsx).toContain("Services");
    expect(pageTsx).toContain("Gallery");
    expect(pageTsx).toContain("Reviews");
    expect(pageTsx).toContain("isMobileMenuOpen");
    expect(pageTsx).toContain("isBookingOpen");

    // Verify Google Reviews Presentation
    expect(pageTsx).toContain("Google Maps Reviews");
    expect(pageTsx).toContain("reviewCountValue = 445");
    expect(pageTsx).toContain("ratingValue = 4.2");

    // Verify Google Map Embed and WhatsApp Ordering
    expect(pageTsx).toContain("maps.google.com/maps?q=");
    expect(pageTsx).toContain('const whatsappUrl = cleanPhone ? "https://wa.me/" + cleanPhone : "#contact"');

    // Verify ZERO leaked internal fields in the generated page source code
    for (const term of FORBIDDEN_INTERNAL_TERMS) {
      expect(pageTsx.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });

  it("5. Graceful Degradation: Missing optional fields (phone, reviews, hours, address)", () => {
    const minimalLead: Lead = {
      id: "lead-minimal-001",
      businessName: "Green Leaf Cafe",
      category: "Cafe",
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

    const profile = createPublicBusinessProfile(minimalLead);
    expect(profile.phone).toBeUndefined();
    expect(profile.rating).toBe(0);
    expect(profile.reviewCount).toBe(0);

    const template = getTemplate("cafe");
    const theme = getTheme("cafe");
    const content = generateDeterministicContent(profile, null, template);

    // When review count is 0, hero badge should not display fake review counts
    expect(content.hero.badge).not.toContain("0 Reviews");
    expect(content.hero.badge).toContain("Cafe");

    // Render should succeed without throwing
    const result = renderWebsiteProject({
      profile,
      template,
      theme,
      content,
      outputBaseDir: testOutputDir,
    });

    expect(fs.existsSync(result.projectDir)).toBe(true);
    const staticCheck = validateWebsiteStatic(result.projectDir);
    expect(staticCheck.valid).toBe(true);

    const pageTsx = fs.readFileSync(path.join(result.projectDir, "src", "app", "page.tsx"), "utf8");
    expect(pageTsx).toContain("Green Leaf Cafe");
    expect(pageTsx).not.toContain('undefined');
    expect(content.contact.phone).toBe("");
  });

  it("6. Category-Aware Websites: Appropriate themes & content structures for different business categories", () => {
    const categories = [
      { name: "Saffron Spices", category: "Restaurant", expectedTemplate: "restaurant", primaryColor: "#ea580c" },
      { name: "Bean & Brew", category: "Coffee Cafe", expectedTemplate: "cafe", primaryColor: "#d97706" },
      { name: "Velvet Glow", category: "Hair Salon", expectedTemplate: "salon", primaryColor: "#f43f5e" },
      { name: "Iron Peak", category: "Fitness Gym", expectedTemplate: "gym", primaryColor: "#10b981" },
      { name: "Apex Dental", category: "Dental Clinic", expectedTemplate: "clinic", primaryColor: "#0284c7" },
    ];

    for (const item of categories) {
      const selectedTpl = selectTemplate(item.category);
      expect(selectedTpl).toBe(item.expectedTemplate);

      const theme = getTheme(selectedTpl);
      expect(theme.primaryColor).toBe(item.primaryColor);

      const template = getTemplate(selectedTpl);
      const lead: Lead = {
        id: `lead-${item.expectedTemplate}-test`,
        businessName: item.name,
        category: item.category,
        phone: "+91 90000 11111",
        website: null,
        address: "7th Avenue, Coimbatore",
        city: "Coimbatore",
        rating: 4.7,
        reviewCount: 150,
        socialLinks: [],
        source: "Google Maps",
        scrapedAt: new Date().toISOString(),
      };

      const profile = createPublicBusinessProfile(lead);
      const content = generateDeterministicContent(profile, null, template);
      expect(content.hero.headline).toBe(item.name);
      expect(content.services?.items.length).toBeGreaterThanOrEqual(3);

      const result = renderWebsiteProject({
        profile,
        template,
        theme,
        content,
        outputBaseDir: testOutputDir,
      });

      expect(fs.existsSync(result.projectDir)).toBe(true);
      const staticCheck = validateWebsiteStatic(result.projectDir);
      expect(staticCheck.valid).toBe(true);
    }
  });
});
