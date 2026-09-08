import { describe, it, expect, afterAll } from "vitest";
import { renderWebsiteProject } from "../lib/agents/website/renderer/index";
import { getTheme } from "../lib/agents/website/themes/index";
import { getTemplate } from "../lib/agents/website/templates/registry";
import { generateDeterministicContent } from "../lib/agents/website/content/fallback";
import { TemplateType, createPublicBusinessProfile } from "../lib/agents/website/types";
import type { Lead } from "../lib/agents/scraping/types";
import fs from "fs";
import path from "path";

describe("Category-Aware Professional Website Generation Across All 10 Categories", () => {
  const testOutputDir = path.join(
    process.cwd(),
    ".tmp-test-categories-" + Date.now()
  );

  afterAll(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  const categories: Array<{ category: string; template: TemplateType; name: string }> = [
    { category: "Restaurant", template: "restaurant", name: "Royal South Indian Dining" },
    { category: "Cafe", template: "cafe", name: "Artisan Roasters Cafe" },
    { category: "Hotel", template: "hotel", name: "Grand Residency Hotel" },
    { category: "Salon", template: "salon", name: "Luxe Glamour Salon" },
    { category: "Spa", template: "spa", name: "Serenity Ayurveda Spa" },
    { category: "Gym", template: "gym", name: "Apex Strength & Fitness" },
    { category: "Clinic", template: "clinic", name: "Care Multi-Specialty Clinic" },
    { category: "Retail", template: "retail", name: "Elegance Fashion Boutique" },
    { category: "Professional", template: "professional", name: "Apex Corporate Advisory" },
    { category: "Tattoo", template: "tattoo", name: "Obsidian Custom Ink" },
    { category: "Local Service", template: "local-service", name: "Precision Plumbing & Electrical" },
    { category: "Generic", template: "generic", name: "Summit Commercial Services" },
  ];

  for (const item of categories) {
    it(`should render complete high-converting Next.js project for category: ${item.category}`, () => {
      const lead: Lead = {
        id: `lead-cat-${item.template}`,
        businessName: item.name,
        category: item.category,
        phone: "+91 98765 43210",
        website: null,
        address: "100 Prime St, Cross Cut Road",
        city: "Coimbatore",
        rating: 4.8,
        reviewCount: 220,
        socialLinks: [],
        source: "google_maps",
        scrapedAt: new Date().toISOString(),
      };

      const theme = getTheme(item.template);
      expect(theme).toBeDefined();
      expect(theme.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);

      const template = getTemplate(item.template);
      const profile = createPublicBusinessProfile(lead);
      const content = generateDeterministicContent(profile, undefined, template);
      expect(content.hero.headline).toBe(item.name);
      expect(content.services?.items.length).toBeGreaterThanOrEqual(3);

      const result = renderWebsiteProject({
        profile,
        template,
        theme,
        content,
        outputBaseDir: testOutputDir,
      });

      expect(result.projectName).toBeDefined();
      expect(fs.existsSync(result.projectDir)).toBe(true);

      // Verify essential files
      const pageTsxPath = path.join(result.projectDir, "src/app/page.tsx");
      expect(fs.existsSync(pageTsxPath)).toBe(true);

      const pageContent = fs.readFileSync(pageTsxPath, "utf-8");
      expect(pageContent).toContain("use client");
      expect(pageContent).toContain(item.name);
      expect(pageContent).toContain("wa.me");
      expect(pageContent).toContain("isBookingOpen");
      expect(pageContent).toContain("WhatsApp");

      // Verify layout and globals.css
      const layoutTsxPath = path.join(result.projectDir, "src/app/layout.tsx");
      const globalsCssPath = path.join(result.projectDir, "src/app/globals.css");
      expect(fs.existsSync(layoutTsxPath)).toBe(true);
      expect(fs.existsSync(globalsCssPath)).toBe(true);
    });
  }
});
