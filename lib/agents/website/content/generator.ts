import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult } from "@/lib/agents/qualification/types";
import { routeRequest } from "@/lib/ai/router";
import { TemplateDefinition, WebsiteContent } from "../types";
import { generateDeterministicContent } from "./fallback";

export async function generateWebsiteContent(params: {
  lead: Lead;
  qualification: QualificationResult;
  template: TemplateDefinition;
  mode?: "mock" | "ai";
}): Promise<WebsiteContent> {
  const { lead, qualification, template, mode = "mock" } = params;

  if (mode === "mock") {
    return generateDeterministicContent(lead, qualification, template);
  }

  try {
    const businessFacts = {
      businessName: lead.businessName,
      category: lead.category,
      city: lead.city || lead.address,
      address: lead.address,
      phone: lead.phone,
      rating: lead.rating,
      reviewCount: lead.reviewCount,
      website: lead.website,
      services: (lead as unknown as { scraped?: { services?: string[] } }).scraped?.services ?? [],
      qualificationNotes: qualification.reason,
      evidence: qualification.evidence,
      template: template.id,
      sections: template.sections.map((s) => s.id),
    };

    const systemPrompt = `You are an expert website copywriter for local businesses.
Generate structured website copy in JSON for a "${template.name}" website.
CRITICAL RULES:
1. Output valid JSON ONLY. No markdown code blocks, no backticks, no explanatory text.
2. Use ONLY the provided business facts. Do NOT invent fake doctor names, fake reviews, fake statistics, or fake awards.
3. Keep the tone professional, persuasive, and localized.
4. The JSON must match the following structure:
{
  "metaTitle": "Title for SEO",
  "metaDescription": "Description for SEO (150-160 chars)",
  "hero": {
    "headline": "Business Name or Catchy Hero Title",
    "subheadline": "Compelling value proposition for this local business",
    "ctaText": "Call to action text",
    "ctaLink": "#contact",
    "badge": "Badge text (e.g. ★ 4.8/5 Rating)"
  },
  "about": {
    "headline": "About Business Name",
    "body": "2-3 paragraphs highlighting experience, commitment to quality, and local service.",
    "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
  },
  "services": {
    "headline": "Our Services",
    "items": [{"title": "Service Name", "description": "Short description"}]
  },
  "contact": {
    "headline": "Contact Us",
    "address": "Actual business address",
    "phone": "Actual phone number"
  },
  "cta": {
    "headline": "Action headline",
    "subheadline": "Action subheadline",
    "buttonText": "Action button text",
    "buttonLink": "tel:..."
  },
  "footer": {
    "copyrightText": "© 2026 Business Name. All rights reserved."
  }
}`;

    const userPrompt = `Generate website content for:
${JSON.stringify(businessFacts, null, 2)}`;

    const aiResult = await routeRequest({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      task: "coding",
      temperature: 0.3,
      maxTokens: 4096,
    });

    if (!aiResult?.response?.success || !aiResult.response.content) {
      console.warn("[WebsiteContent] AI generation failed or empty, using fallback:", aiResult?.response?.errorMessage);
      return generateDeterministicContent(lead, qualification, template);
    }

    const rawContent = aiResult.response.content.trim();
    const cleanJson = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleanJson) as Partial<WebsiteContent>;

    // Validate essential sections
    if (!parsed.hero?.headline || !parsed.about?.body || !parsed.contact?.headline) {
      console.warn("[WebsiteContent] AI output missing mandatory sections, using fallback");
      return generateDeterministicContent(lead, qualification, template);
    }

    // Merge fallback with parsed AI content to guarantee complete structure
    const fallback = generateDeterministicContent(lead, qualification, template);

    return {
      metaTitle: parsed.metaTitle || fallback.metaTitle,
      metaDescription: parsed.metaDescription || fallback.metaDescription,
      hero: {
        headline: parsed.hero.headline || fallback.hero.headline,
        subheadline: parsed.hero.subheadline || fallback.hero.subheadline,
        ctaText: parsed.hero.ctaText || fallback.hero.ctaText,
        ctaLink: parsed.hero.ctaLink || fallback.hero.ctaLink,
        badge: parsed.hero.badge || fallback.hero.badge,
      },
      about: {
        headline: parsed.about.headline || fallback.about.headline,
        body: parsed.about.body || fallback.about.body,
        highlights: parsed.about.highlights || fallback.about.highlights,
      },
      services: parsed.services?.items?.length
        ? parsed.services
        : fallback.services,
      menu: parsed.menu || fallback.menu,
      gallery: parsed.gallery || fallback.gallery,
      testimonials: parsed.testimonials || fallback.testimonials,
      hours: parsed.hours || fallback.hours,
      team: parsed.team || fallback.team,
      contact: {
        headline: parsed.contact.headline || fallback.contact.headline,
        address: lead.address || parsed.contact.address || fallback.contact.address,
        phone: lead.phone || parsed.contact.phone || fallback.contact.phone,
        email: (lead as unknown as { email?: string }).email || parsed.contact.email,
        mapQuery: lead.address || fallback.contact.mapQuery,
      },
      cta: {
        headline: parsed.cta?.headline || fallback.cta.headline,
        subheadline: parsed.cta?.subheadline || fallback.cta.subheadline,
        buttonText: parsed.cta?.buttonText || fallback.cta.buttonText,
        buttonLink: parsed.cta?.buttonLink || fallback.cta.buttonLink,
      },
      footer: {
        copyrightText: parsed.footer?.copyrightText || fallback.footer.copyrightText,
        tagline: parsed.footer?.tagline || fallback.footer.tagline,
      },
    };
  } catch (err) {
    console.warn("[WebsiteContent] Error during AI content generation, using fallback:", err);
    return generateDeterministicContent(lead, qualification, template);
  }
}
