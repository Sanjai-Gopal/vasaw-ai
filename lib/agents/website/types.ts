import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult } from "@/lib/agents/qualification/types";

export interface PublicBusinessProfile {
  id: string;
  businessName: string;
  category: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string | null;
  rating: number;
  reviewCount: number;
  socialLinks: string[];
  services: string[];
  hours?: Array<{ days: string; hours: string }>;
}

export function createPublicBusinessProfile(lead: Lead): PublicBusinessProfile {
  const rawRating = typeof lead.rating === "number" ? lead.rating : 4.5;
  const rating = Number(rawRating.toFixed(1));
  const reviewCount = typeof lead.reviewCount === "number" ? lead.reviewCount : 0;
  const city = (lead.city || lead.address || "Coimbatore").trim();
  const rawServices = (lead as unknown as { scraped?: { services?: string[] } }).scraped?.services ?? [];

  return {
    id: lead.id,
    businessName: (lead.businessName || "Local Business").trim(),
    category: (lead.category || "Local Business").trim(),
    city: city || "Coimbatore",
    address: lead.address ? lead.address.trim() : `${(lead.businessName || "Local Business").trim()}, ${city}`,
    phone: lead.phone ? lead.phone.trim() : undefined,
    email: (lead as unknown as { email?: string }).email?.trim() || undefined,
    website: lead.website ? lead.website.trim() : null,
    rating,
    reviewCount,
    socialLinks: Array.isArray(lead.socialLinks) ? lead.socialLinks : [],
    services: Array.isArray(rawServices) ? rawServices : [],
  };
}

export type TemplateType =
  | "restaurant"
  | "cafe"
  | "hotel"
  | "salon"
  | "spa"
  | "gym"
  | "tattoo"
  | "clinic"
  | "retail"
  | "professional"
  | "generic"
  | "local-service";

export type SectionType =
  | "hero"
  | "about"
  | "services"
  | "menu"
  | "gallery"
  | "testimonials"
  | "hours"
  | "team"
  | "contact"
  | "cta"
  | "benefits"
  | "location"
  | "footer";

export interface TemplateSection {
  id: string;
  type: SectionType;
  required: boolean;
  order: number;
  title?: string;
}

export interface WebsiteTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontPairing: string;
  heroPattern: string;
  borderRadius: string;
}

export interface TemplateDefinition {
  id: TemplateType;
  name: string;
  description: string;
  pages: string[];
  sections: TemplateSection[];
  categoryKeywords: string[];
  defaultTheme: WebsiteTheme;
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  badge?: string;
}

export interface AboutContent {
  headline: string;
  body: string;
  highlights?: string[];
}

export interface ServiceItem {
  title: string;
  description: string;
  price?: string;
}

export interface MenuItem {
  name: string;
  description?: string;
  price?: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface GalleryItem {
  url: string;
  alt: string;
  caption?: string;
}

export interface TestimonialItem {
  name: string;
  comment: string;
  rating: number;
  date?: string;
}

export interface HoursSchedule {
  days: string;
  hours: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
}

export interface ContactContent {
  headline: string;
  address: string;
  phone: string;
  email?: string;
  mapQuery?: string;
}

export interface CtaContent {
  headline: string;
  subheadline: string;
  buttonText: string;
  buttonLink: string;
}

export interface FooterContent {
  copyrightText: string;
  tagline?: string;
  links?: Array<{ label: string; href: string }>;
}

export interface WebsiteContent {
  metaTitle: string;
  metaDescription: string;
  hero: HeroContent;
  about: AboutContent;
  services?: { headline: string; items: ServiceItem[] };
  menu?: { headline: string; categories: MenuCategory[] };
  gallery?: { headline: string; images: GalleryItem[] };
  testimonials?: { headline: string; items: TestimonialItem[] };
  hours?: { headline: string; schedule: HoursSchedule[] };
  team?: { headline: string; members: TeamMember[] };
  contact: ContactContent;
  cta: CtaContent;
  footer: FooterContent;
  [key: string]: unknown;
}

export interface WebsiteBuildArtifact {
  projectDir: string;
  projectName: string;
  files: string[];
  pages: string[];
  previewUrl?: string;
}

export interface WebsiteBuildResult {
  websiteId: string;
  leadId: string;
  businessName: string;
  template: TemplateType;
  status: "READY" | "FAILED";
  buildStatus: "SUCCESS" | "FAILED";
  artifact: WebsiteBuildArtifact;
  pages: string[];
  buildOutput: string;
  buildErrors: string[];
  previewUrl?: string;
  generatedAt: string;
}

export interface WebsiteBuildInput {
  lead: Lead;
  qualification: QualificationResult;
  mode?: "mock" | "ai";
  forceTemplate?: TemplateType;
  outputBaseDir?: string;
  jobId?: string;
}

export interface WebsiteRequest {
  lead: Lead;
  qualification: QualificationResult;
  mode?: "mock" | "ai";
  forceTemplate?: TemplateType;
  outputBaseDir?: string;
}

export interface WebsiteResponse {
  success: boolean;
  agent: "website-building";
  mode: "mock" | "ai";
  count: number;
  result?: WebsiteBuildResult;
  error?: string;
}

export interface WebsiteProvider {
  build(input: WebsiteBuildInput): Promise<WebsiteBuildResult>;
}
