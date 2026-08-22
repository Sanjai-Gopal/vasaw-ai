import { randomUUID } from "crypto";

/**
 * Apify Actor Integration
 * 
 * Provides safe inspection of Apify Actor output and normalization mapping
 * for Google Maps business data.
 * 
 * REQUIRES: APIFY_API_TOKEN and APIFY_ACTOR_ID environment variables
 * 
 * To use with actual Apify credentials:
 * 1. Set APIFY_API_TOKEN and APIFY_ACTOR_ID environment variables
 * 2. Use the startApifyRun() function with a campaign input
 * 3. Poll for completion with pollApifyRun()
 * 4. Retrieve dataset with getApifyDataset()
 */

interface ApifyRunInput {
  start_urls: Array<{ url: string }>;
  max_pages?: number;
  [key: string]: unknown;
}

interface ApifyRunResponse {
  id: string;
  actId: string;
  status: "READY" | "RUNNING" | "SUCCEEDED" | "FAILED" | "ABORTED" | "TIMED-OUT";
  startedAt: string;
  finishedAt: string | null;
  defaultDatasetId: string | null;
  stats: Record<string, unknown>;
}

interface ApifyDatasetItem {
  business_name: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  phone: string;
  email?: string;
  address: string;
  website?: string;
  hours?: string;
  sub_category?: string;
  source?: string;
  scraped_at?: string;
  place_id?: string;
  gmap_url?: string;
  services?: string[] | Record<string, unknown>;
  phone_raw?: string;
  [key: string]: unknown;
}

export interface NormalizedLeadFromApify {
  id: string;
  campaign_id: string;
  business_name: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  website: string | null;
  phone: string;
  email: string | null;
  ai_score: number;
  priority: "high" | "medium" | "low";
  status: "new";
  source: string;
  source_record_id: string | null;
  apify_run_id: string | null;
  apify_dataset_id: string | null;
  ai_score_json: Record<string, unknown>;
  qualification_json: Record<string, unknown>;
  opportunity_json: Record<string, unknown>;
  website_status: "not_started";
  quality_status: "not_started";
  deployment_status: "not_started";
  outreach_status: "not_ready";
  updated_at: string;
}

export async function startApifyRun(
  actorId: string,
  input: ApifyRunInput
): Promise<ApifyRunResponse> {
  const apiKey = process.env.APIFY_API_TOKEN;
  
  if (!apiKey) {
    throw new Error("APIFY_API_TOKEN environment variable is required but not set");
  }

  const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Apify API error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function pollApifyRun(
  runId: string,
  options?: { maxWaitMs?: number; pollIntervalMs?: number }
): Promise<ApifyRunResponse> {
  const apiKey = process.env.APIFY_API_TOKEN;
  
  if (!apiKey) {
    throw new Error("APIFY_API_TOKEN environment variable is required but not set");
  }

  const maxWaitMs = options?.maxWaitMs ?? 600000;
  const pollIntervalMs = options?.pollIntervalMs ?? 10000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`);
    
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Apify API error ${response.status}: ${text}`);
    }

    const run = await response.json() as ApifyRunResponse;
    
    if (run.status === "SUCCEEDED" || run.status === "FAILED" || run.status === "ABORTED" || run.status === "TIMED-OUT") {
      return run;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Apify run timed out after ${maxWaitMs}ms`);
}

export async function getApifyDataset(datasetId: string): Promise<ApifyDatasetItem[]> {
  const apiKey = process.env.APIFY_API_TOKEN;
  
  if (!apiKey) {
    throw new Error("APIFY_API_TOKEN environment variable is required but not set");
  }

  const response = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}&clean=true`);
  
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Apify API error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function runApifyScrape(
  actorId: string,
  input: ApifyRunInput
): Promise<{
  runId: string;
  datasetId: string;
  totalRecords: number;
  normalizedLeads: NormalizedLeadFromApify[];
  errors: Array<{ record: unknown; error: string }>;
}> {
  const run = await startApifyRun(actorId, input);
  const completedRun = await pollApifyRun(run.id);
  
  if (completedRun.status !== "SUCCEEDED") {
    throw new Error(`Apify run failed with status: ${completedRun.status}`);
  }

  if (!completedRun.defaultDatasetId) {
    throw new Error("Apify run succeeded but no dataset ID returned");
  }

  const rawRecords = await getApifyDataset(completedRun.defaultDatasetId);
  
  const normalizedLeads: NormalizedLeadFromApify[] = [];
  const errors: Array<{ record: unknown; error: string }> = [];

  for (const record of rawRecords) {
    try {
      const normalized = normalizeApifyRecord(record, "unknown");
      normalizedLeads.push(normalized);
    } catch (err) {
      errors.push({ record, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return {
    runId: run.id,
    datasetId: completedRun.defaultDatasetId ?? "",
    totalRecords: rawRecords.length,
    normalizedLeads,
    errors,
  };
}

function extractServices(rawRecord: ApifyDatasetItem): string[] {
  const services: string[] = [];
  const possibleServices = [
    rawRecord.services,
    rawRecord.service_categories,
    rawRecord.offered_services,
  ];

  for (const serviceList of possibleServices) {
    if (serviceList && Array.isArray(serviceList)) {
      serviceList.forEach((s: unknown) => {
        if (typeof s === "string" && s.trim()) {
          services.push(s.trim());
        }
      });
    } else if (serviceList && typeof serviceList === "object") {
      Object.values(serviceList).forEach((s: unknown) => {
        if (typeof s === "string" && s.trim()) {
          services.push(s.trim());
        }
      });
    }
  }

  if (services.length === 0) {
    const category = (rawRecord.category as string || "").toLowerCase();
    if (category.includes("restaurant")) services.push("Dining");
    if (category.includes("salon")) services.push("Hair", "Facial");
    if (category.includes("gym") || category.includes("fitness")) services.push("Training", "Cardio");
    if (category.includes("clinic") || category.includes("health")) services.push("Consultation", "Treatment");
    if (category.includes("restaurant") && !services.includes("Dining")) services.push("Food");
  }

  return services.length > 0 ? services : ["Not specified"];
}

function determineResponseLikelihood(rating: number, reviews: number): "high" | "medium" | "low" {
  if (reviews >= 100 && rating >= 4.5) return "high";
  if (reviews >= 50 && rating >= 4.0) return "medium";
  return "low";
}

function generateReasons(rating: number, reviews: number, website: string | null, subCategory: string): string[] {
  const reasons: string[] = [];
  
  if (reviews >= 100) reasons.push("High review volume indicates strong reputation");
  if (rating >= 4.5) reasons.push("Excellent customer rating");
  if (website === null) reasons.push("No website - clear digital opportunity");
  if (reviews >= 500) reasons.push("Very high review count");
  if (subCategory && (subCategory.toLowerCase().includes("restaurant") || subCategory.toLowerCase().includes("cafe"))) {
    reasons.push("High-demand category (food & beverage)");
  }
  
  return reasons.length > 0 ? reasons : ["Standard opportunity"];
}

export function normalizeApifyRecord(
  rawRecord: ApifyDatasetItem,
  campaignId: string
): NormalizedLeadFromApify {
  const businessName = (rawRecord.business_name as string) || (rawRecord.name as string) || "Unknown Business";
  const category = (rawRecord.category as string) || (rawRecord.categoryName as string) || "Unknown";
  const location = (rawRecord.location as string) || (rawRecord.address as string) || "Unknown Location";
  const rating = Number(rawRecord.rating) || 0;
  const reviews = Number(rawRecord.reviews) || 0;
  const phone = (rawRecord.phone as string) || (rawRecord.phone_raw as string) || "";
  const email = (rawRecord.email as string) || null;
  const address = (rawRecord.address as string) || "";
  const website = (rawRecord.website as string) || null;
  const hours = (rawRecord.hours as string) || null;
  const subCategory = (rawRecord.sub_category as string) || (rawRecord.subCategory as string) || null;
  const source = (rawRecord.source as string) || "Google Maps";
  const scrapedAt = (rawRecord.scraped_at as string) || new Date().toISOString();
  const placeId = (rawRecord.place_id as string) || null;

  const sourceRecordId = source === "Google Maps" && placeId
    ? `gmaps-${placeId}`
    : source === "Google Maps"
      ? `gmaps-${scrapedAt}-${randomUUID().slice(0, 8)}`
      : null;

  const extractedServices = extractServices(rawRecord);
  const responseLikelihood = determineResponseLikelihood(rating, reviews);
  const aiScore = Math.max(0, Math.min(100, Math.round((rating * 0.4) + (reviews * 0.1) + (website !== null ? 20 : 0))));
  const priority = rating >= 4.5 && website === null ? "high" : rating >= 4.0 ? "medium" : "low";
  const reasons = generateReasons(rating, reviews, website, subCategory as string);
  const estimatedValue = Math.max(5000, Math.min(50000, rating * 5000 + reviews * 100));

  return {
    id: randomUUID(),
    campaign_id: campaignId,
    business_name: businessName,
    category,
    location,
    rating,
    reviews,
    website,
    phone,
    email,
    ai_score: aiScore,
    priority,
    status: "new",
    source,
    source_record_id: sourceRecordId,
    apify_run_id: null,
    apify_dataset_id: null,
    ai_score_json: {
      score: aiScore,
      priority,
      websiteOpportunity: website === null,
      confidence: 0.8,
      factors: reasons,
      reason: reasons.join("; "),
    },
    qualification_json: {
      hasWebsite: !!website,
      websiteQuality: 0,
      hasWhatsApp: !!phone,
      hasReviews: reviews > 0,
      responseLikelihood,
      notes: `Business identified from Google Maps with ${reviews} reviews, rating ${rating}/5`,
    },
    opportunity_json: {
      score: aiScore,
      priority,
      websiteOpportunity: website === null,
      confidence: 0.8,
      factors: reasons,
      reason: reasons.join("; "),
    },
    website_status: "not_started",
    quality_status: "not_started",
    deployment_status: "not_started",
    outreach_status: "not_ready",
    updated_at: new Date().toISOString(),
  };
}