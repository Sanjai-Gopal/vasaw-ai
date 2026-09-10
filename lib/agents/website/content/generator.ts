import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult } from "@/lib/agents/qualification/types";
import { routeRequest } from "@/lib/ai/router";
import { TemplateDefinition, WebsiteContent, PublicBusinessProfile, createPublicBusinessProfile } from "../types";
import { generateDeterministicContent } from "./fallback";

export async function generateWebsiteContent(params: {
  lead?: Lead;
  profile?: PublicBusinessProfile;
  qualification?: QualificationResult | null;
  template: TemplateDefinition;
  mode?: "mock" | "ai";
}): Promise<WebsiteContent> {
  const { lead, profile: rawProfile, qualification, template, mode = "mock" } = params;
  const profile: PublicBusinessProfile = rawProfile || (lead ? createPublicBusinessProfile(lead) : {
    id: "site",
    businessName: "Local Business",
    category: "Local Business",
    city: "Worldwide",
    address: "Worldwide",
    rating: 4.5,
    reviewCount: 0,
    socialLinks: [],
    services: [],
  });

  if (mode === "mock") {
    return generateDeterministicContent(profile, qualification, template);
  }

  try {
    // Only pass factual, customer-facing business data.
    // NEVER pass internal qualification reasoning, sales opportunity scores, or "no website" notes.
    const businessFacts = {
      businessName: profile.businessName,
      category: profile.category,
      city: profile.city,
      address: profile.address,
      phone: profile.phone,
      rating: profile.rating,
      reviewCount: profile.reviewCount,
      services: profile.services,
      template: template.id,
    };

    const systemPrompt = `You are a world-class website copywriter crafting premium customer-facing copy for a real local business website.

CRITICAL INTEGRITY & TONE RULES:
1. Output valid JSON ONLY. No markdown code blocks, no backticks, no conversational text.
2. The audience is END CUSTOMERS (diners, clients, patients). NEVER mention internal AI analysis, opportunity scores, qualification notes, lead scores, or "no website" reasons.
3. Use ONLY provided business facts. Do NOT invent fake doctor names, fake reviews, fake statistics, or fake awards.
4. Tone must be warm, inviting, human, localized, and specific to the business category. Avoid corporate consulting clichés like "solutions tailored to your needs".
5. Structure:
{
  "metaTitle": "Title for SEO",
  "metaDescription": "Description for SEO (140-160 chars)",
  "hero": {
    "headline": "Exact Business Name",
    "subheadline": "Appetizing / Compelling value proposition for end customers",
    "ctaText": "Primary CTA text (e.g. View Menu / Book Table / Contact Us)",
    "ctaLink": "#menu or #contact",
    "badge": "★ 4.2 (445 Google Reviews) · City"
  },
  "about": {
    "headline": "Engaging Section Headline",
    "body": "Warm, authentic narrative highlighting hospitality, fresh preparation, and local heritage.",
    "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
  },
  "services": {
    "headline": "Our Services",
    "items": [{"title": "Service Title", "description": "Clear benefit description"}]
  },
  "contact": {
    "headline": "Location & Contact",
    "address": "Actual business address",
    "phone": "Actual phone number"
  },
  "cta": {
    "headline": "Inviting closing headline",
    "subheadline": "Encouraging visit or order description",
    "buttonText": "Action button text",
    "buttonLink": "tel:..."
  },
  "footer": {
    "copyrightText": "© 2026 Business Name. All rights reserved.",
    "tagline": "Warm closing tagline"
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
      return generateDeterministicContent(profile, qualification, template);
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
      return generateDeterministicContent(profile, qualification, template);
    }

    // Merge fallback with parsed AI content to guarantee complete structure
    const fallback = generateDeterministicContent(profile, qualification, template);

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
        address: profile.address || parsed.contact.address || fallback.contact.address,
        phone: profile.phone || parsed.contact.phone || fallback.contact.phone,
        email: profile.email || parsed.contact.email,
        mapQuery: profile.address || fallback.contact.mapQuery,
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
    return generateDeterministicContent(profile, qualification, template);
  }
}
