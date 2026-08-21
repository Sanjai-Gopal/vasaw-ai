/**
 * Apify Scraping Agent
 * 
 * Runs the configured Apify Actor to scrape Google Maps business data.
 * Handles actor execution, polling, dataset retrieval, and normalization.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createJob, updateJob, completeJob, failJob, getStepsForJobType, isDryRun } from "@/lib/queue/job-queue";
import { normalizeApifyRecord } from "@/lib/utils/apify";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID ?? "nwua9Gu5YrADL7ZDj";
const APIFY_BASE_URL = "https://api.apify.com/v2";

interface ApifyRunInput {
  start_urls: Array<{ url: string }>;
  max_pages?: number;
  max_items?: number;
  [key: string]: unknown;
}

interface ApifyRunResponse {
  data: {
    id: string;
    status: "READY" | "RUNNING" | "SUCCEEDED" | "FAILED" | "ABORTED" | "TIMED_OUT";
    statusMessage?: string;
    startedAt?: string;
    finishedAt?: string;
    defaultDatasetId?: string;
    [key: string]: unknown;
  };
}

interface ApifyDatasetResponse {
  data: {
    items: unknown[];
    total: number;
    offset: number;
    count: number;
    limit: number;
  };
}

async function apifyRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${APIFY_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${APIFY_API_TOKEN}`,
    ...(options?.headers as Record<string, string>),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Apify API error ${response.status}: ${text}`);
  }
  return response.json();
}

export async function startApifyActor(input: ApifyRunInput): Promise<string> {
  if (!APIFY_API_TOKEN) {
    throw new Error("APIFY_API_TOKEN not configured");
  }

  const result = await apifyRequest<ApifyRunResponse>(`/acts/${APIFY_ACTOR_ID}/runs`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return result.data.id;
}

export async function pollApifyRun(runId: string, maxWaitMs = 300000): Promise<ApifyRunResponse["data"]> {
  const startTime = Date.now();
  const pollIntervalMs = 5000;

  while (Date.now() - startTime < maxWaitMs) {
    const result = await apifyRequest<ApifyRunResponse>(`/acts/${APIFY_ACTOR_ID}/runs/${runId}`);
    const run = result.data;

    if (run.status === "SUCCEEDED") {
      return run;
    }

    if (run.status === "FAILED" || run.status === "ABORTED" || run.status === "TIMED_OUT") {
      throw new Error(`Apify run ${run.status}: ${run.statusMessage ?? "Unknown error"}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Apify run timed out after ${maxWaitMs}ms`);
}

export async function fetchApifyDataset(datasetId: string): Promise<unknown[]> {
  const result = await apifyRequest<ApifyDatasetResponse>(`/datasets/${datasetId}/items`);
  return result.data.items;
}

export interface ScrapingResult {
  runId: string;
  datasetId: string;
  totalRecords: number;
  normalizedLeads: ReturnType<typeof normalizeApifyRecord>[];
  errors: Array<{ record: unknown; error: string }>;
}

export async function runScrapingAgent(
  campaignId: string,
  locations: string[],
  categories: string[],
  options?: {
    maxPages?: number;
    maxItems?: number;
    jobId?: string;
  }
): Promise<ScrapingResult> {
  const jobId = options?.jobId ?? (await createJob("scrape_campaign", {
    campaignId,
    metadata: { locations, categories, maxPages: options?.maxPages, maxItems: options?.maxItems },
  })).id;

  const steps = getStepsForJobType("scrape_campaign");
  let currentStepIndex = 0;

  const updateStep = async (step: string) => {
    await updateJob(jobId, { currentStep: step });
  };

  try {
    // Step 1: Validate configuration
    await updateStep(steps[currentStepIndex++]);
    if (!APIFY_API_TOKEN) throw new Error("APIFY_API_TOKEN not configured");
    if (!APIFY_ACTOR_ID) throw new Error("APIFY_ACTOR_ID not configured");

    // Step 2: Start actor
    await updateStep(steps[currentStepIndex++]);
    const startUrls = locations.map((loc) => ({
      url: `https://www.google.com/maps/search/${encodeURIComponent(`${categories.join(" ")} in ${loc}`)}`,
    }));

    let runId: string;
    if (isDryRun()) {
      console.log("[Apify] DRY_RUN: Simulating actor start");
      runId = `dry-run-${Date.now()}`;
    } else {
      runId = await startApifyActor({
        start_urls: startUrls,
        max_pages: options?.maxPages ?? 3,
        max_items: options?.maxItems ?? 50,
      });
    }

    // Step 3: Poll for completion
    await updateStep(steps[currentStepIndex++]);
    let runData: ApifyRunResponse["data"];
    if (isDryRun()) {
      console.log("[Apify] DRY_RUN: Simulating poll completion");
      runData = { id: runId, status: "SUCCEEDED", defaultDatasetId: `dataset-${runId}` } as ApifyRunResponse["data"];
    } else {
      runData = await pollApifyRun(runId);
    }

    // Step 4: Retrieve dataset
    await updateStep(steps[currentStepIndex++]);
    let rawRecords: unknown[];
    if (isDryRun()) {
      console.log("[Apify] DRY_RUN: Using mock data");
      const { inspectApifyActor } = await import("@/lib/utils/apify");
      rawRecords = await inspectApifyActor(APIFY_ACTOR_ID, { start_urls: startUrls });
    } else {
      if (!runData.defaultDatasetId) throw new Error("No dataset ID returned");
      rawRecords = await fetchApifyDataset(runData.defaultDatasetId);
    }

    // Step 5: Normalize records
    await updateStep(steps[currentStepIndex++]);
    const normalizedLeads: ReturnType<typeof normalizeApifyRecord>[] = [];
    const errors: Array<{ record: unknown; error: string }> = [];

    for (const record of rawRecords) {
      try {
        const normalized = normalizeApifyRecord(record);
        normalizedLeads.push(normalized);
      } catch (err) {
        errors.push({ record, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    // Step 6: Store leads (will be done by Storage Agent)
    await updateStep(steps[currentStepIndex++]);

    await completeJob(jobId);

    return {
      runId,
      datasetId: runData.defaultDatasetId ?? `dataset-${runId}`,
      totalRecords: rawRecords.length,
      normalizedLeads,
      errors,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await failJob(jobId, errorMessage);
    throw err;
  }
}

export async function createScrapingJob(
  campaignId: string,
  locations: string[],
  categories: string[]
): Promise<string> {
  const job = await createJob("scrape_campaign", {
    campaignId,
    metadata: { locations, categories },
  });
  return job.id;
}