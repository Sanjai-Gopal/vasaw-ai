/**
 * Apify Scraping Agent
 * 
 * Runs the configured Apify Actor to scrape Google Maps business data.
 * Handles actor execution, polling, dataset retrieval, and normalization.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createJob, updateJob, completeJob, failJob, getStepsForJobType, isDryRun } from "@/lib/queue/job-queue";
import { runApifyScrape } from "@/lib/utils/apify";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID ?? "nwua9Gu5YrADL7ZDj";

interface ScrapeCampaignOptions {
  maxPages?: number;
  maxItems?: number;
}

export interface ScrapingResult {
  runId: string;
  datasetId: string;
  totalRecords: number;
  normalizedLeads: Array<{
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
    priority: string;
    status: string;
    source: string;
    source_record_id: string | null;
    apify_run_id: string | null;
    apify_dataset_id: string | null;
    ai_score_json: Record<string, unknown>;
    qualification_json: Record<string, unknown>;
    opportunity_json: Record<string, unknown>;
    website_status: string;
    quality_status: string;
    deployment_status: string;
    outreach_status: string;
    updated_at: string;
  }>;
  errors: Array<{ record: unknown; error: string }>;
}

export async function runScrapingAgent(
  campaignId: string,
  locations: string[],
  categories: string[],
  options?: ScrapeCampaignOptions
): Promise<ScrapingResult> {
  const jobId = await createJob("scrape_campaign", {
    campaignId,
    metadata: { locations, categories, maxPages: options?.maxPages, maxItems: options?.maxItems },
  }).then((j) => j.id);

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

    // Step 2-5: Run Apify scrape (includes run, poll, dataset retrieval, normalization)
    await updateStep(steps[currentStepIndex++]);
    let result;
    if (isDryRun()) {
      console.log("[Apify] DRY_RUN: Simulating scrape");
      result = {
        runId: `dry-run-${Date.now()}`,
        datasetId: `dataset-dry-run-${Date.now()}`,
        totalRecords: 0,
        normalizedLeads: [],
        errors: [],
      };
    } else {
      result = await runApifyScrape(APIFY_ACTOR_ID, {
        start_urls: locations.map((loc) => ({
          url: `https://www.google.com/maps/search/${encodeURIComponent(`${categories.join(" ")} in ${loc}`)}`,
        })),
        max_pages: options?.maxPages ?? 3,
        max_items: options?.maxItems ?? 50,
      });
    }

    // Update steps for the combined operation
    currentStepIndex += 3; // Skip the individual steps since runApifyScrape handles them

    // Step 6: Store leads (will be done by Storage Agent)
    await updateStep(steps[currentStepIndex++]);

    await completeJob(jobId);

    return {
      runId: result.runId,
      datasetId: result.datasetId,
      totalRecords: result.totalRecords,
      normalizedLeads: result.normalizedLeads,
      errors: result.errors,
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