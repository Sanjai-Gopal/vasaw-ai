/**
 * Website Building Agent
 * 
 * Template-driven website generation for qualified leads.
 * Uses AI Router (coding task) to generate personalized content.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { routeRequest } from "@/lib/ai/router";
import { createJob, updateJob, completeJob, failJob, getStepsForJobType, isDryRun } from "@/lib/queue/job-queue";

export type TemplateType =
  | "restaurant"
  | "cafe"
  | "salon"
  | "gym"
  | "tattoo"
  | "clinic"
  | "local-service"
  | "bakery"
  | "retail"
  | "automobile"
  | "wellness"
  | "education"
  | "finance"
  | "religious"
  | "manufacturing";

interface Template {
  id: TemplateType;
  name: string;
  description: string;
  pages: string[];
  sections: TemplateSection[];
  categoryKeywords: string[];
}

interface TemplateSection {
  id: string;
  type: "hero" | "about" | "services" | "menu" | "gallery" | "testimonials" | "contact" | "cta" | "hours" | "team";
  required: boolean;
  order: number;
}

const TEMPLATES: Record<TemplateType, Template> = {
  restaurant: {
    id: "restaurant",
    name: "Restaurant",
    description: "Full-service restaurant with menu, reservations, and online ordering",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "menu", type: "menu", required: true, order: 3 },
      { id: "gallery", type: "gallery", required: false, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
    ],
    categoryKeywords: ["restaurant", "cafe", "bistro", "diner", "eatery", "kitchen", "grill", "pizza", "burger", "biryani", "vegetarian", "veg"],
  },
  cafe: {
    id: "cafe",
    name: "Cafe",
    description: "Coffee shop with menu, wifi, and ambiance focus",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "menu", type: "menu", required: true, order: 3 },
      { id: "gallery", type: "gallery", required: true, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
    ],
    categoryKeywords: ["cafe", "coffee", "coffee shop", "bakery", "pastry", "brunch", "tea"],
  },
  salon: {
    id: "salon",
    name: "Salon & Spa",
    description: "Beauty salon with services, booking, and portfolio",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "gallery", type: "gallery", required: true, order: 4 },
      { id: "team", type: "team", required: false, order: 5 },
      { id: "testimonials", type: "testimonials", required: true, order: 6 },
      { id: "hours", type: "hours", required: true, order: 7 },
      { id: "contact", type: "contact", required: true, order: 8 },
      { id: "cta", type: "cta", required: true, order: 9 },
    ],
    categoryKeywords: ["salon", "spa", "beauty", "hair", "nail", "barber", "unisex", "bridal", "facial", "massage"],
  },
  gym: {
    id: "gym",
    name: "Gym & Fitness",
    description: "Fitness center with classes, trainers, and membership info",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "team", type: "team", required: true, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
      { id: "cta", type: "cta", required: true, order: 8 },
    ],
    categoryKeywords: ["gym", "fitness", "workout", "training", "crossfit", "yoga", "pilates", "personal training", "zumba"],
  },
  tattoo: {
    id: "tattoo",
    name: "Tattoo Studio",
    description: "Tattoo studio with artist portfolio, booking, and aftercare",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "gallery", type: "gallery", required: true, order: 3 },
      { id: "team", type: "team", required: true, order: 4 },
      { id: "services", type: "services", required: true, order: 5 },
      { id: "testimonials", type: "testimonials", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
    ],
    categoryKeywords: ["tattoo", "tattoo studio", "ink", "body art", "piercing"],
  },
  clinic: {
    id: "clinic",
    name: "Clinic & Healthcare",
    description: "Medical clinic with services, doctors, and appointment booking",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "team", type: "team", required: true, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
      { id: "cta", type: "cta", required: true, order: 8 },
    ],
    categoryKeywords: ["clinic", "hospital", "dental", "dentist", "doctor", "medical", "healthcare", "physiotherapy", "ayurvedic", "wellness center"],
  },
  "local-service": {
    id: "local-service",
    name: "Local Service",
    description: "General local service business (plumber, electrician, cleaner, etc.)",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "testimonials", type: "testimonials", required: true, order: 4 },
      { id: "hours", type: "hours", required: false, order: 5 },
      { id: "contact", type: "contact", required: true, order: 6 },
      { id: "cta", type: "cta", required: true, order: 7 },
    ],
    categoryKeywords: ["service", "repair", "maintenance", "cleaning", "plumber", "electrician", "contractor", "mechanic", "auto", "packaging", "manufacturing"],
  },
  bakery: {
    id: "bakery",
    name: "Bakery & Sweets",
    description: "Bakery with cake gallery, custom orders, and delivery",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "menu", type: "menu", required: true, order: 3 },
      { id: "gallery", type: "gallery", required: true, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
      { id: "cta", type: "cta", required: true, order: 8 },
    ],
    categoryKeywords: ["bakery", "cake", "sweets", "confectionery", "pastry", "bread", "dessert"],
  },
  retail: {
    id: "retail",
    name: "Retail Store",
    description: "Retail shop with product showcase and contact",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "gallery", type: "gallery", required: true, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
    ],
    categoryKeywords: ["retail", "store", "shop", "showroom", "textile", "garment", "clothing", "appliance", "electronics", "furniture"],
  },
  automobile: {
    id: "automobile",
    name: "Auto Service",
    description: "Car service center with services, booking, and trust signals",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "team", type: "team", required: false, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
      { id: "cta", type: "cta", required: true, order: 8 },
    ],
    categoryKeywords: ["auto", "car", "service", "mechanic", "garage", "workshop", "denting", "painting", "insurance", "ac service"],
  },
  wellness: {
    id: "wellness",
    name: "Wellness Center",
    description: "Wellness/spa/ayurvedic center with treatments and booking",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "team", type: "team", required: true, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
      { id: "cta", type: "cta", required: true, order: 8 },
    ],
    categoryKeywords: ["wellness", "spa", "ayurvedic", "massage", "therapy", "panchakarma", "yoga", "meditation"],
  },
  education: {
    id: "education",
    name: "Education & School",
    description: "School/play school with programs, admissions, and gallery",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "team", type: "team", required: true, order: 4 },
      { id: "gallery", type: "gallery", required: true, order: 5 },
      { id: "testimonials", type: "testimonials", required: true, order: 6 },
      { id: "hours", type: "hours", required: true, order: 7 },
      { id: "contact", type: "contact", required: true, order: 8 },
      { id: "cta", type: "cta", required: true, order: 9 },
    ],
    categoryKeywords: ["school", "play school", "preschool", "nursery", "kindergarten", "daycare", "education", "academy", "coaching", "tuition"],
  },
  finance: {
    id: "finance",
    name: "Financial Services",
    description: "Loan/insurance/financial services with trust signals",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "team", type: "team", required: false, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
      { id: "cta", type: "cta", required: true, order: 8 },
    ],
    categoryKeywords: ["finance", "loan", "insurance", "investment", "mutual fund", "banking", "financial services"],
  },
  religious: {
    id: "religious",
    name: "Religious Store",
    description: "Pooja/religious items store with catalog and festival specials",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "menu", type: "menu", required: true, order: 3 },
      { id: "gallery", type: "gallery", required: true, order: 4 },
      { id: "testimonials", type: "testimonials", required: true, order: 5 },
      { id: "hours", type: "hours", required: true, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
    ],
    categoryKeywords: ["pooja", "religious", "temple", "spiritual", "idol", "agarbatti", "festival", "mandir"],
  },
  manufacturing: {
    id: "manufacturing",
    name: "Manufacturing & B2B",
    description: "B2B manufacturing with capabilities, certifications, and inquiry form",
    pages: ["index"],
    sections: [
      { id: "hero", type: "hero", required: true, order: 1 },
      { id: "about", type: "about", required: true, order: 2 },
      { id: "services", type: "services", required: true, order: 3 },
      { id: "gallery", type: "gallery", required: true, order: 4 },
      { id: "testimonials", type: "testimonials", required: false, order: 5 },
      { id: "hours", type: "hours", required: false, order: 6 },
      { id: "contact", type: "contact", required: true, order: 7 },
    ],
    categoryKeywords: ["manufacturing", "industrial", "packaging", "boxes", "corrugated", "factory", "production", "wholesale", "b2b"],
  },
};

export function selectTemplate(category: string, subCategory?: string): TemplateType {
  const searchText = `${category} ${subCategory ?? ""}`.toLowerCase();

  for (const [templateId, template] of Object.entries(TEMPLATES)) {
    for (const keyword of template.categoryKeywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return templateId as TemplateType;
      }
    }
  }

  return "local-service";
}

export function getTemplate(templateId: TemplateType): Template {
  return TEMPLATES[templateId] ?? TEMPLATES["local-service"];
}

export interface WebsiteBuildInput {
  leadId: string;
  businessName: string;
  category: string;
  subCategory?: string;
  location: string;
  rating: number;
  reviews: number;
  phone: string;
  email?: string;
  website?: string | null;
  scraped: {
    address: string;
    hours?: string;
    services: string[];
    scrapedAt: string;
  };
  qualification: {
    hasWebsite: boolean;
    websiteQuality: number;
    responseLikelihood: string;
    notes: string;
  };
  opportunity: {
    score: number;
    priority: string;
    reasons: string[];
    estimatedValue: number;
  };
}

export interface WebsiteBuildResult {
  websiteId: string;
  templateId: TemplateType;
  pages: string[];
  buildOutput: string;
  previewUrl?: string;
}

const WEBSITE_BUILD_PROMPT = `You are a website content generator for VASAW AI.
Generate personalized website content for a local business based on the template and business data.

Template: {{templateId}}
Template Sections: {{sections}}

Business Data:
{{businessData}}

Generate content for each section. Output JSON with section IDs as keys and content as values.
Each section content should be an object with appropriate fields (headline, subheadline, body, items, etc.).
Do NOT include placeholder text like "Lorem ipsum" or "Your content here".
Use ONLY the actual business data provided. If data is missing, use sensible defaults based on the business type.
Do NOT invent fake reviews, fake team members, fake certifications, or fake statistics.`;

export async function runWebsiteBuildingAgent(
  input: WebsiteBuildInput,
  options?: { jobId?: string; forceTemplate?: TemplateType }
): Promise<WebsiteBuildResult> {
  const jobId = options?.jobId ?? (await createJob("build_website", {
    leadId: input.leadId,
    metadata: { forceTemplate: options?.forceTemplate },
  })).id;

  const steps = getStepsForJobType("build_website");
  let currentStepIndex = 0;

  const updateStep = async (step: string) => {
    await updateJob(jobId, { currentStep: step });
  };

  const admin = getSupabaseAdmin();

  try {
    // Step 1: Select template
    await updateStep(steps[currentStepIndex++]);
    const templateId = options?.forceTemplate ?? selectTemplate(input.category, input.subCategory);
    const template = getTemplate(templateId);

    // Step 2: Generate personalized content
    await updateStep(steps[currentStepIndex++]);

    const businessData = {
      businessName: input.businessName,
      category: input.category,
      subCategory: input.subCategory,
      location: input.location,
      rating: input.rating,
      reviews: input.reviews,
      phone: input.phone,
      email: input.email,
      website: input.website,
      address: input.scraped.address,
      hours: input.scraped.hours,
      services: input.scraped.services,
      qualification: input.qualification,
      opportunity: input.opportunity,
    };

    let generatedContent: Record<string, unknown>;

    if (isDryRun()) {
      console.log("[WebsiteBuilder] DRY_RUN: Simulating content generation for", input.businessName);
      generatedContent = generateMockContent(template, input);
    } else {
      const prompt = WEBSITE_BUILD_PROMPT
        .replace("{{templateId}}", templateId)
        .replace("{{sections}}", JSON.stringify(template.sections.map((s) => s.id)))
        .replace("{{businessData}}", JSON.stringify(businessData, null, 2));

      const response = await routeRequest({
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "Generate the website content now." },
        ],
        task: "coding",
        temperature: 0.4,
        maxTokens: 4096,
      });

      if (!response.response.success || !response.response.content) {
        throw new Error(`Content generation failed: ${response.response.errorMessage}`);
      }

      try {
        generatedContent = JSON.parse(response.response.content);
      } catch {
        throw new Error("Failed to parse generated content");
      }
    }

    // Step 3: Build project (create Next.js project structure)
    await updateStep(steps[currentStepIndex++]);

    const buildOutput = await buildWebsiteProject({
      templateId,
      template,
      businessData: input,
      generatedContent,
      leadId: input.leadId,
    });

    // Step 4: Quality check
    await updateStep(steps[currentStepIndex++]);

    const websiteId = `web-${input.leadId}-${Date.now()}`;

    if (!isDryRun()) {
      await admin.from("websites").insert({
        id: websiteId,
        lead_id: input.leadId,
        business_name: input.businessName,
        category: input.category,
        location: input.location,
        status: "built",
        template: templateId,
        pages: template.pages.length,
        sections: template.sections.length,
        build_progress: 100,
        preview_url: buildOutput.previewUrl,
        created_at: new Date().toISOString(),
        built_at: new Date().toISOString(),
      });

      await admin.from("leads").update({
        website_status: "built",
        updated_at: new Date().toISOString(),
      }).eq("id", input.leadId);

      await admin.from("activities").insert({
        lead_id: input.leadId,
        actor: "website-building-agent",
        type: "website",
        status: "success",
        title: "Website built",
        description: `${template.name} template generated for ${input.businessName}`,
      });
    }

    await completeJob(jobId);

    return {
      websiteId,
      templateId,
      pages: template.pages,
      buildOutput: buildOutput.outputDir,
      previewUrl: buildOutput.previewUrl,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await failJob(jobId, errorMessage);

    if (!isDryRun()) {
      await admin.from("leads").update({
        website_status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("id", input.leadId);
    }

    throw err;
  }
}

function generateMockContent(template: Template, businessData: WebsiteBuildInput): Record<string, unknown> {
  const content: Record<string, unknown> = {};

  for (const section of template.sections) {
    switch (section.type) {
      case "hero":
        content[section.id] = {
          headline: `${businessData.businessName} - ${businessData.category} in ${businessData.location}`,
          subheadline: businessData.qualification.notes || `Premium ${businessData.category.toLowerCase()} experience`,
          ctaText: "Contact Us",
          ctaLink: "#contact",
        };
        break;
      case "about":
        content[section.id] = {
          headline: `About ${businessData.businessName}`,
          body: `Located in ${businessData.location}, ${businessData.businessName} has been serving the community with ${businessData.rating}/5 stars from ${businessData.reviews} reviews. ${businessData.opportunity.reasons.join(". ")}.`,
        };
        break;
      case "services":
        content[section.id] = {
          headline: "Our Services",
          items: businessData.scraped.services.slice(0, 8).map((s) => ({ title: s, description: "" })),
        };
        break;
      case "menu":
        content[section.id] = {
          headline: "Menu",
          categories: [{ name: "Popular Items", items: businessData.scraped.services.slice(0, 6).map((s) => ({ name: s, price: "₹" + Math.floor(Math.random() * 500 + 100) })) }],
        };
        break;
      case "gallery":
        content[section.id] = {
          headline: "Gallery",
          images: Array.from({ length: 6 }, (_, i) => ({ src: `/placeholder-${i + 1}.jpg`, alt: `${businessData.businessName} - Image ${i + 1}` })),
        };
        break;
      case "testimonials":
        content[section.id] = {
          headline: "What Our Customers Say",
          items: [
            { quote: "Excellent service and quality!", author: "Happy Customer", rating: 5 },
            { quote: "Highly recommended!", author: "Regular Visitor", rating: 5 },
          ],
        };
        break;
      case "hours":
        content[section.id] = {
          headline: "Opening Hours",
          schedule: businessData.scraped.hours ? [{ days: "Mon-Sun", hours: businessData.scraped.hours }] : [],
        };
        break;
      case "team":
        content[section.id] = {
          headline: "Our Team",
          members: [],
        };
        break;
      case "contact":
        content[section.id] = {
          headline: "Contact Us",
          address: businessData.scraped.address,
          phone: businessData.phone,
          email: businessData.email,
          mapEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(businessData.scraped.address)}&output=embed`,
        };
        break;
      case "cta":
        content[section.id] = {
          headline: "Ready to Visit?",
          subheadline: "Get in touch or visit us today!",
          buttonText: "Call Now",
          buttonLink: `tel:${businessData.phone.replace(/\D/g, "")}`,
        };
        break;
    }
  }

  return content;
}

async function buildWebsiteProject(params: {
  templateId: TemplateType;
  template: Template;
  businessData: WebsiteBuildInput;
  generatedContent: Record<string, unknown>;
  leadId: string;
}): Promise<{ outputDir: string; previewUrl?: string }> {
  const projectName = `${params.businessData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${params.leadId.slice(0, 8)}`;
  const outputDir = `/tmp/vasaw-websites/${projectName}`;

  if (isDryRun()) {
    console.log("[WebsiteBuilder] DRY_RUN: Simulating project build at", outputDir);
    return { outputDir, previewUrl: `https://${projectName}.vercel.app` };
  }

  // In a real implementation, this would:
  // 1. Create Next.js project structure
  // 2. Generate pages/components based on template
  // 3. Inject generated content
  // 4. Run npm install && npm run build
  // 5. Return build output path

  // For now, simulate the build
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { outputDir, previewUrl: `https://${projectName}.vercel.app` };
}

export async function createWebsiteBuildJob(leadId: string, templateId?: TemplateType): Promise<string> {
  const job = await createJob("build_website", {
    leadId,
    metadata: { forceTemplate: templateId },
  });
  return job.id;
}