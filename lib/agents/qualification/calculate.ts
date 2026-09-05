import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult, QualificationFactors } from "./types";

const HIGH_WEBSITE_NEED_CATEGORIES = [
  "restaurant",
  "cafe",
  "salon",
  "spa",
  "gym",
  "fitness",
  "clinic",
  "dental",
  "medical",
  "tattoo",
  "barbershop",
  "bakery",
  "catering",
  "food truck",
  "hotel",
  "motel",
  "bed and breakfast",
  "photography",
  "event",
  "wedding",
  "real estate",
  "insurance",
  "lawyer",
  "accountant",
  "consultant",
  "agency",
  "studio",
  "workshop",
  "repair",
  "automotive",
  "plumber",
  "electrician",
  "hvac",
  "landscaping",
  "cleaning",
  "pest control",
];

function normalizeCategory(category: string): string {
  return category.toLowerCase().trim();
}

function categoryNeedsWebsite(category: string): boolean {
  const normalized = normalizeCategory(category);
  return HIGH_WEBSITE_NEED_CATEGORIES.some((cat) => normalized.includes(cat));
}

function calculateWebsiteQuality(website: string | null): number {
  if (!website) return 0;
  const url = website.toLowerCase();
  let quality = 50;
  if (url.includes("facebook.com") || url.includes("instagram.com") || url.includes("linkedin.com")) {
    quality -= 30;
  }
  if (url.includes("google.com") || url.includes("maps.google") || url.includes("goo.gl")) {
    quality -= 20;
  }
  if (url.includes(".com") || url.includes(".in") || url.includes(".net") || url.includes(".org")) {
    quality += 20;
  }
  if (url.includes("wix") || url.includes("squarespace") || url.includes("wordpress") || url.includes("shopify")) {
    quality += 10;
  }
  return Math.max(0, Math.min(100, quality));
}

function calculateSocialPresence(socialLinks: string[]): boolean {
  if (!socialLinks || socialLinks.length === 0) return false;
  const platforms = new Set<string>();
  for (const link of socialLinks) {
    const url = link.toLowerCase();
    if (url.includes("facebook.com")) platforms.add("facebook");
    else if (url.includes("instagram.com")) platforms.add("instagram");
    else if (url.includes("linkedin.com")) platforms.add("linkedin");
    else if (url.includes("twitter.com") || url.includes("x.com")) platforms.add("twitter");
    else if (url.includes("youtube.com")) platforms.add("youtube");
    else if (url.includes("whatsapp")) platforms.add("whatsapp");
  }
  return platforms.size >= 2;
}

function getRatingTier(rating: number): { score: number; label: string } {
  if (rating >= 4.5) return { score: 15, label: "Excellent rating (4.5+)" };
  if (rating >= 4.0) return { score: 8, label: "Good rating (4.0-4.4)" };
  if (rating >= 3.5) return { score: 2, label: "Average rating (3.5-3.9)" };
  return { score: -10, label: "Below average rating (<3.5)" };
}

function getReviewTier(reviewCount: number): { score: number; label: string } {
  if (reviewCount >= 500) return { score: 12, label: "Very high review volume (500+)" };
  if (reviewCount >= 100) return { score: 8, label: "High review volume (100-499)" };
  if (reviewCount >= 50) return { score: 5, label: "Growing review base (50-99)" };
  if (reviewCount >= 10) return { score: 2, label: "Some reviews (10-49)" };
  return { score: -5, label: "Few or no reviews (<10)" };
}

function getWebsiteTier(hasWebsite: boolean, websiteQuality: number): { score: number; label: string } {
  if (!hasWebsite) return { score: 20, label: "No website - clear opportunity" };
  if (websiteQuality < 30) return { score: 10, label: "Poor quality website - improvement opportunity" };
  if (websiteQuality < 60) return { score: 2, label: "Basic website - could be enhanced" };
  return { score: -15, label: "Professional website - lower opportunity" };
}

export function calculateQualification(lead: Lead): QualificationResult {
  const hasWebsite = !!lead.website;
  const websiteQuality = calculateWebsiteQuality(lead.website);
  const rating = Math.max(0, Math.min(5, lead.rating));
  const reviewCount = Math.max(0, lead.reviewCount);
  const socialPresence = calculateSocialPresence(lead.socialLinks);
  const businessTypeNeedsWebsite = categoryNeedsWebsite(lead.category);

  const ratingTier = getRatingTier(rating);
  const reviewTier = getReviewTier(reviewCount);
  const websiteTier = getWebsiteTier(hasWebsite, websiteQuality);

  let score = 35;
  score += ratingTier.score;
  score += reviewTier.score;
  score += websiteTier.score;
  if (socialPresence) score += 3;
  if (businessTypeNeedsWebsite) score += 5;

  score = Math.max(0, Math.min(100, score));

  const priority = score >= 75 ? "high" : score >= 50 ? "medium" : "low";
  const websiteOpportunity = !hasWebsite || websiteQuality < 50;

  const evidence: string[] = [
    ratingTier.label,
    reviewTier.label,
    websiteTier.label,
    socialPresence ? "Active social media presence" : "Limited social media presence",
    businessTypeNeedsWebsite ? `${lead.category} typically needs a website` : `${lead.category} may not need a website`,
  ];

  const reason = websiteOpportunity
    ? `Strong website opportunity: ${websiteTier.label.toLowerCase()}, ${ratingTier.label.toLowerCase()}, ${reviewTier.label.toLowerCase()}`
    : `Limited website opportunity: ${websiteTier.label.toLowerCase()}`;

  const factors: QualificationFactors = {
    hasWebsite,
    websiteQuality,
    rating,
    reviewCount,
    category: lead.category,
    socialPresence,
    businessTypeNeedsWebsite,
  };

  const confidence = hasWebsite ? 0.75 : 0.9;

  return {
    leadId: lead.id,
    score,
    priority,
    websiteOpportunity,
    reason,
    confidence,
    factors,
    evidence,
  };
}

export function calculateQualifications(leads: Lead[]): QualificationResult[] {
  return leads.map(calculateQualification);
}