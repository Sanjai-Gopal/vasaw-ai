import { describe, it, expect } from "vitest";
import { renderWebsiteProject } from "../lib/agents/website/renderer/index";
import { getTheme } from "../lib/agents/website/themes/index";
import { getTemplate } from "../lib/agents/website/templates/registry";
import { generateDeterministicContent } from "../lib/agents/website/content/fallback";
import { TemplateType } from "../lib/agents/website/types";
import type { Lead } from "../lib/agents/scraping/types";
import fs from "fs";
import path from "path";

describe("Phase 6 & 15: Multi-Category Luxury Website Generation Tests", () => {
  const categories: Array<{ category: string; template: TemplateType; name: string }> = [
    { category: "Restaurant", template: "restaurant", name: "Royal Dining" },
    { category: "Cafe", template: "cafe", name: "Artisan Brew Cafe" },
    { category: "Salon", template: "salon", name: "Luxe Glamour Salon" },
    { category: "Gym", template: "gym", name: "Apex Strength Gym" },
    { category: "Tattoo", template: "tattoo", name: "Obsidian Ink Studio" },
    { category: "Clinic", template: "clinic", name: "Care Dental Clinic" },
    { category: "Local Service", template: "local-service", name: "Precision Plumbing" },
    { category: "Generic", template: "generic", name: "Summit Consulting" },
  ];

  for (const item of categories) {
    it(`should render complete high-converting Next.js project for category: ${item.category}`, () => {
      const lead: Lead = {
        id: `lead-cat-${item.template}`,
        businessName: item.name,
        category: item.category,
        phone: "+919876543210",
        website: null,
        address: "100 Prime St",
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
      const content = generateDeterministicContent(lead, undefined, template);
      expect(content.hero.headline).toBe(item.name);
      expect(content.services?.items.length).toBeGreaterThanOrEqual(3);

      const result = renderWebsiteProject({
        lead,
        template,
        theme,
        content,
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
