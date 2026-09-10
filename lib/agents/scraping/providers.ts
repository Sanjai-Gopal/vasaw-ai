import { ScrapingProvider, ScrapingRequest, Lead, RawRecord } from "./types";
import { normalizeRecords } from "./normalize";
import { MOCK_BUSINESSES, generateDynamicMockBusinesses } from "./mock-businesses";

export { MOCK_BUSINESSES };

export class MockProvider implements ScrapingProvider {
  async scrape(request: ScrapingRequest): Promise<Lead[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const reqCategory = (request.category || "").toLowerCase().trim();
    const rawLocation = (request.location || "").toLowerCase().trim();
    const isGlobal =
      !rawLocation ||
      rawLocation === "worldwide" ||
      rawLocation === "global" ||
      rawLocation === "worldwide (global)" ||
      rawLocation === "all";

    const isNonExistentCategory = reqCategory.includes("nonexistent") || reqCategory.includes("nowhere");
    const isNonExistentLocation = rawLocation === "nonexistent" || rawLocation === "nowhere";

    let filtered = MOCK_BUSINESSES.filter((b) => {
      const bCat = (b.category || "").toLowerCase();
      const bSubCat = (b.sub_category || "").toLowerCase();
      const matchCategory = !reqCategory || bCat.includes(reqCategory) || bSubCat.includes(reqCategory);

      if (isGlobal) {
        return matchCategory;
      }

      const bCity = (b.city || "").toLowerCase();
      const bAddress = (b.address || "").toLowerCase();
      const matchLocation =
        bCity.includes(rawLocation) ||
        bAddress.includes(rawLocation) ||
        rawLocation.includes(bCity);

      return matchCategory && matchLocation;
    });

    const offset = typeof request.offset === "number" && request.offset >= 0 ? request.offset : 0;
    const needed = offset + request.limit;

    // If static mock pool has fewer leads than needed, synthesize dynamic leads for that location or distributed globally
    if (filtered.length < needed && !isNonExistentCategory && !isNonExistentLocation) {
      const dynamicNeeded = needed - filtered.length + 5;
      const targetLocation = isGlobal ? "Worldwide (Global)" : (request.location || "Worldwide (Global)");
      const dynamicRecords = generateDynamicMockBusinesses(
        request.category || "General Business",
        targetLocation,
        dynamicNeeded,
        filtered.length
      );
      filtered = [...filtered, ...dynamicRecords];
    }

    const uncollected =
      request.excludeExternalIds && request.excludeExternalIds.length > 0
        ? filtered.filter((b) => !request.excludeExternalIds!.includes(String(b.place_id || b.placeId || "")))
        : filtered;

    const limited = uncollected.slice(offset, offset + request.limit);
    return normalizeRecords(limited, "Google Maps (Mock)", {
      source_mode: "mock",
      campaignLocation: request.location || "Worldwide (Global)",
    });
  }
}

export class ApifyProvider implements ScrapingProvider {
  private actorId: string;
  private apiToken: string;

  constructor(actorId?: string, apiToken?: string) {
    this.actorId = actorId ?? process.env.APIFY_ACTOR_ID ?? "nwua9Gu5YrADL7ZDj";
    this.apiToken = apiToken ?? process.env.APIFY_API_TOKEN ?? "";
  }

  async scrape(request: ScrapingRequest): Promise<Lead[]> {
    if (!this.apiToken || this.apiToken.trim() === "") {
      throw new Error("APIFY_API_TOKEN is not configured on the server. Please set APIFY_API_TOKEN in .env.local to execute live scraping.");
    }

    const isGlobal =
      !request.location ||
      request.location.toLowerCase() === "worldwide" ||
      request.location.toLowerCase() === "global" ||
      request.location.toLowerCase() === "worldwide (global)" ||
      request.location.toLowerCase() === "all";

    const searchQuery = isGlobal
      ? `${request.category}`
      : `${request.category} in ${request.location}`;

    const maxItems = Math.max(request.limit * 2, request.limit); // Fetch extra buffer for post-filtering

    const input = {
      searchStringsArray: [searchQuery],
      maxCrawledPlacesPerSearch: maxItems,
      maxItems,
    };

    const response = await fetch(`https://api.apify.com/v2/acts/${this.actorId}/runs?token=${this.apiToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Apify run dispatch failed (HTTP ${response.status}): ${text}`);
    }

    const rawJson = (await response.json()) as {
      data?: { id: string; defaultDatasetId: string | null; status: string };
      id?: string;
      defaultDatasetId?: string | null;
      status?: string;
    };
    const run = (rawJson.data ?? rawJson) as { id: string; defaultDatasetId: string | null; status: string };
    if (!run.id) {
      throw new Error("Apify run dispatch succeeded but no run ID was returned");
    }
    const completedRun = await this.pollRun(run.id);

    if (completedRun.status !== "SUCCEEDED") {
      throw new Error(`Apify scraping run failed with status: ${completedRun.status}`);
    }

    if (!completedRun.defaultDatasetId) {
      throw new Error("Apify run succeeded but no dataset ID was returned");
    }

    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${completedRun.defaultDatasetId}/items?token=${this.apiToken}&clean=true`
    );

    if (!datasetResponse.ok) {
      const text = await datasetResponse.text().catch(() => "");
      throw new Error(`Apify dataset fetch failed (HTTP ${datasetResponse.status}): ${text}`);
    }

    const rawRecords = (await datasetResponse.json()) as RawRecord[];
    const normalized = normalizeRecords(rawRecords, "Google Maps (Apify)", {
      source_mode: "live",
      campaignLocation: request.location || "Worldwide (Global)",
    });

    // Apply quality criteria filters
    const minRating = typeof request.minimumRating === "number" ? request.minimumRating : 0;
    const minReviews = typeof request.minimumReviews === "number" ? request.minimumReviews : 0;

    let filtered = normalized.filter((lead) => {
      if (lead.rating < minRating) return false;
      if (lead.reviewCount < minReviews) return false;
      return true;
    });

    // Deduplicate against excluded IDs
    if (request.excludeExternalIds && request.excludeExternalIds.length > 0) {
      const excludeSet = new Set(request.excludeExternalIds);
      filtered = filtered.filter((lead) => !lead.externalId || !excludeSet.has(lead.externalId));
    }

    const offset = typeof request.offset === "number" && request.offset >= 0 ? request.offset : 0;
    return filtered.slice(offset, offset + request.limit);
  }

  private async pollRun(runId: string, maxWaitMs = 300000, pollIntervalMs = 5000): Promise<{
    id: string;
    defaultDatasetId: string | null;
    status: string;
  }> {
    const startTime = Date.now();
    let attempt = 0;

    while (Date.now() - startTime < maxWaitMs) {
      attempt++;
      try {
        const response = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${this.apiToken}`);

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(`Apify poll error (HTTP ${response.status}): ${text}`);
        }

        const pollRaw = (await response.json()) as {
          data?: { id: string; defaultDatasetId: string | null; status: string };
          id?: string;
          defaultDatasetId?: string | null;
          status?: string;
        };
        const run = (pollRaw.data ?? pollRaw) as { id: string; defaultDatasetId: string | null; status: string };

        if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(run.status)) {
          return run;
        }
      } catch (err) {
        if (attempt > 5) {
          throw err;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Apify scraping run timed out after ${maxWaitMs}ms`);
  }
}

export function getProvider(mode: "mock" | "apify"): ScrapingProvider {
  if (mode === "mock") {
    return new MockProvider();
  }
  return new ApifyProvider();
}