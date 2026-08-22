import type { Lead } from "@/lib/types";
import { randomUUID } from "crypto";

export interface ApifyPlaceRecord {
  title: string;
  subTitle: string | null;
  description: string | null;
  ownerDescription: string | null;
  price: string | null;
  categoryName: string;
  address: string;
  neighborhood: string | null;
  street: string | null;
  city: string;
  postalCode: string;
  state: string;
  countryCode: string;
  website: string | null;
  phone: string | null;
  phoneUnformatted: string | null;
  claimThisBusiness: boolean;
  location: { lat: number; lng: number } | null;
  locatedIn: string | null;
  floor: string | null;
  plusCode: string | null;
  menu: string | null;
  servicesLink: string | null;
  totalScore: number;
  permanentlyClosed: boolean;
  temporarilyClosed: boolean;
  placeId: string;
  categories: string[];
  fid: string;
  cid: string;
  reviewsCount: number;
  imagesCount: number;
  imageCategories: string[];
  scrapedAt: string;
  reserveTableUrl: string | null;
  googleFoodUrl: string | null;
  hotelStars: string | null;
  hotelDescription: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  hotelAds: unknown[];
  popularTimesLiveText: string | null;
  popularTimesLivePercent: number | null;
  popularTimesHistogram: Record<string, unknown>;
  openingHours: Array<{ day: string; hours: string }>;
  additionalOpeningHours?: Record<string, Array<{ day: string; hours: string }>>;
  wasOpenAtScrapeTime: boolean;
  peopleAlsoSearch: unknown[];
  placesTags: unknown[];
  reviewsTags: unknown[];
  additionalInfo: Record<string, unknown>;
  gasPrices: unknown[];
  url: string;
  searchPageUrl: string;
  searchString: string;
  language: string;
  rank: number;
  isAdvertisement: boolean;
  imageUrl: string;
  kgmid: string;
  businessProfileId: string;
}

export function normalizeApifyRecord(
  record: ApifyPlaceRecord,
  campaignId: string,
  apifyRunId: string,
  apifyDatasetId: string
): Lead {
  const phone = record.phoneUnformatted || record.phone || null;
  const website = record.website || null;
  const rating = record.totalScore || 0;
  const reviews = record.reviewsCount || 0;
  const hasWebsite = !!website;
  const websiteQuality = hasWebsite ? 50 : 0;
  const hasWhatsApp = !!phone;
  const hasReviews = reviews > 0;

  let responseLikelihood: "high" | "medium" | "low" = "low";
  if (reviews >= 100 && rating >= 4.5) responseLikelihood = "high";
  else if (reviews >= 50 && rating >= 4.0) responseLikelihood = "medium";

  const reasons: string[] = [];
  if (!hasWebsite) reasons.push("No website despite online presence");
  if (reviews >= 100) reasons.push("High review volume indicates strong reputation");
  if (rating >= 4.5) reasons.push("Excellent customer rating");
  if (reviews < 50 && rating >= 4.0) reasons.push("Strong rating with room to grow review base");

  const baseScore = Math.round(rating * 10 + Math.min(reviews / 10, 20) + (hasWebsite ? 10 : 20));
  const score = Math.max(0, Math.min(100, baseScore));
  const priority = score >= 75 ? "high" : score >= 50 ? "medium" : "low";

  const openingHoursStr = record.openingHours
    ?.map((oh) => `${oh.day}: ${oh.hours}`)
    .join("; ");

  const services = Object.entries(record.additionalInfo || {})
    .filter(([, value]) => value === true || (Array.isArray(value) && value.length > 0))
    .map(([key]) => key);

  const locationParts = [record.street, record.city, record.state, record.postalCode, record.countryCode]
    .filter(Boolean)
    .join(", ");

  return {
    id: "", // Will be assigned by database
    businessName: record.title,
    category: record.categoryName,
    location: record.city,
    rating,
    reviews,
    website,
    phone: phone || "",
    email: undefined,
    aiScore: score,
    priority,
    status: "scraped",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scraped: {
      address: locationParts,
      phone: phone || "",
email: undefined,
      rating,
      reviews,
      category: record.categoryName,
      subCategory: record.categories.join(", ") || undefined,
      hours: openingHoursStr,
      services,
      source: "Google Maps",
      scrapedAt: record.scrapedAt,
    },
    qualification: {
      hasWebsite,
      websiteQuality,
      hasWhatsApp,
      hasReviews,
      responseLikelihood,
      notes: `Business identified from Google Maps with ${reviews} reviews, rating ${rating}/5`,
    },
    opportunity: {
      score,
      priority,
      reasons,
      estimatedValue: Math.max(5000, Math.min(50000, rating * 5000 + reviews * 100)),
    },
  };
}

export function toSupabaseLead(lead: Lead, campaignId: string, apifyRunId: string, apifyDatasetId: string) {
  return {
    campaign_id: campaignId,
    business_name: lead.businessName,
    category: lead.category,
    location: lead.location,
    rating: lead.rating,
    reviews: lead.reviews,
    phone: lead.phone,
    email: lead.email,
    website: lead.website,
    ai_score: lead.aiScore,
    priority: lead.priority,
    status: lead.status,
    source: lead.scraped.source,
    source_record_id: lead.scraped.source === "Google Maps" && lead.scraped.placeId
      ? `gmaps-${lead.scraped.placeId}`
      : lead.scraped.source === "Google Maps"
        ? `gmaps-${lead.scraped.scrapedAt}-${randomUUID().slice(0, 8)}`
        : null,
    apify_run_id: apifyRunId,
    apify_dataset_id: apifyDatasetId,
    ai_score_json: {
      score: lead.opportunity.score,
      priority: lead.opportunity.priority,
      websiteOpportunity: !lead.website,
      confidence: 0.8,
      factors: lead.opportunity.reasons,
      reason: lead.opportunity.reasons.join("; "),
    },
    qualification_json: {
      hasWebsite: lead.qualification.hasWebsite,
      websiteQuality: lead.qualification.websiteQuality,
      hasWhatsApp: lead.qualification.hasWhatsApp,
      hasReviews: lead.qualification.hasReviews,
      responseLikelihood: lead.qualification.responseLikelihood,
      notes: lead.qualification.notes,
    },
    opportunity_json: {
      score: lead.opportunity.score,
      priority: lead.opportunity.priority,
      websiteOpportunity: !lead.website,
      confidence: 0.8,
      factors: lead.opportunity.reasons,
      reason: lead.opportunity.reasons.join("; "),
    },
    website_status: "not_started",
    quality_status: "not_started",
    deployment_status: "not_started",
    outreach_status: "not_ready",
    updated_at: new Date().toISOString(),
  };
}