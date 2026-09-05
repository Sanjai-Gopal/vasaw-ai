import { ScrapingRequest, ScrapingResponse } from "./types";
import { getProvider } from "./providers";

export async function runScrapingAgent(request: ScrapingRequest): Promise<ScrapingResponse> {
  try {
    const provider = getProvider(request.mode);
    const leads = await provider.scrape(request);

    return {
      success: true,
      agent: "scraping",
      mode: request.mode,
      count: leads.length,
      leads,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      agent: "scraping",
      mode: request.mode,
      count: 0,
      leads: [],
      error: message,
    };
  }
}

export function validateRequest(body: unknown): { valid: boolean; request?: ScrapingRequest; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (!b.campaignId || typeof b.campaignId !== "string") {
    return { valid: false, error: "campaignId is required and must be a string" };
  }

  if (!b.category || typeof b.category !== "string") {
    return { valid: false, error: "category is required and must be a string" };
  }

  if (!b.location || typeof b.location !== "string") {
    return { valid: false, error: "location is required and must be a string" };
  }

  const limit = typeof b.limit === "number" ? b.limit : 10;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return { valid: false, error: "limit must be an integer between 1 and 100" };
  }

  const mode = b.mode === "apify" ? "apify" : "mock";
  const offset = typeof b.offset === "number" && b.offset >= 0 ? b.offset : undefined;
  const excludeExternalIds = Array.isArray(b.excludeExternalIds) ? b.excludeExternalIds.map(String) : undefined;
  const minimumRating = typeof b.minimumRating === "number" ? b.minimumRating : undefined;
  const minimumReviews = typeof b.minimumReviews === "number" ? b.minimumReviews : undefined;

  return {
    valid: true,
    request: {
      campaignId: b.campaignId,
      category: b.category,
      location: b.location,
      limit,
      offset,
      excludeExternalIds,
      minimumRating,
      minimumReviews,
      mode,
    },
  };
}