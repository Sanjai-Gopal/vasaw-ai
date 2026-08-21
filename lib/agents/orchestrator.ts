/**
 * Orchestrator - Lead Lifecycle State Machine
 * 
 * Manages the complete lead lifecycle from NEW to final state.
 * Every transition is validated and persisted.
 * A single failed lead does not stop the campaign.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runScrapingAgent } from "./scraping";
import { runStorageAgent } from "./storage";
import { runCheckingAgent, batchCheckLeads } from "./checking";
import { createJob, updateJob, completeJob, failJob, getJobsByCampaign, isDryRun } from "@/lib/queue/job-queue";

export type LeadLifecycleStatus =
  | "new"
  | "scraped"
  | "checking"
  | "qualified"
  | "rejected"
  | "website_building"
  | "website_ready"
  | "quality_checking"
  | "quality_passed"
  | "quality_failed"
  | "deploying"
  | "deployed"
  | "ready_for_outreach"
  | "contacted"
  | "replied"
  | "interested"
  | "not_interested"
  | "stopped"
  | "cancelled";

const VALID_TRANSITIONS: Record<LeadLifecycleStatus, LeadLifecycleStatus[]> = {
  new: ["scraped", "cancelled"],
  scraped: ["checking", "rejected", "cancelled"],
  checking: ["qualified", "rejected", "cancelled"],
  qualified: ["website_building", "rejected", "cancelled"],
  rejected: [],
  website_building: ["website_ready", "quality_failed", "cancelled"],
  website_ready: ["quality_checking", "cancelled"],
  quality_checking: ["quality_passed", "quality_failed", "cancelled"],
  quality_passed: ["deploying", "cancelled"],
  quality_failed: ["website_building", "cancelled"],
  deploying: ["deployed", "cancelled"],
  deployed: ["ready_for_outreach", "cancelled"],
  ready_for_outreach: ["contacted", "cancelled"],
  contacted: ["replied", "cancelled"],
  replied: ["interested", "not_interested", "stopped", "cancelled"],
  interested: [],
  not_interested: [],
  stopped: [],
  cancelled: [],
};

export function isValidTransition(from: LeadLifecycleStatus, to: LeadLifecycleStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function transitionLead(
  leadId: string,
  newStatus: LeadLifecycleStatus,
  actor: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const admin = getSupabaseAdmin();

  const { data: lead, error } = await admin
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .single();

  if (error || !lead) {
    throw new Error(`Lead ${leadId} not found`);
  }

  const currentStatus = lead.status as LeadLifecycleStatus;

  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(`Invalid transition: ${currentStatus} -> ${newStatus}`);
  }

  if (!isDryRun()) {
    await admin
      .from("leads")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", leadId);

    await admin.from("activities").insert({
      lead_id: leadId,
      actor,
      type: "lead",
      status: "info",
      title: `Status: ${currentStatus} -> ${newStatus}`,
      description: metadata ? JSON.stringify(metadata) : undefined,
    });
  }
}

export interface CampaignExecutionResult {
  campaignId: string;
  scrapingJobId: string;
  storageJobId: string;
  checkingResults: Array<{ leadId: string; status: string; score: number }>;
  qualifiedLeads: string[];
  errors: string[];
}

export async function executeCampaign(
  campaignId: string,
  locations: string[],
  categories: string[],
  options?: {
    maxPages?: number;
    maxItems?: number;
    concurrency?: number;
  }
): Promise<CampaignExecutionResult> {
  const result: CampaignExecutionResult = {
    campaignId,
    scrapingJobId: "",
    storageJobId: "",
    checkingResults: [],
    qualifiedLeads: [],
    errors: [],
  };

  try {
    // Step 1: Scraping
    console.log(`[Orchestrator] Starting scraping for campaign ${campaignId}`);
    const scrapingResult = await runScrapingAgent(campaignId, locations, categories, {
      maxPages: options?.maxPages,
      maxItems: options?.maxItems,
    });
    result.scrapingJobId = scrapingResult.runId;

    // Update campaign progress
    if (!isDryRun()) {
      await getSupabaseAdmin()
        .from("campaigns")
        .update({
          leads_collected: scrapingResult.totalRecords,
          progress: 20,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);
    }

    // Step 2: Storage
    console.log(`[Orchestrator] Storing ${scrapingResult.normalizedLeads.length} leads`);
    const storageResult = await runStorageAgent(campaignId, scrapingResult.normalizedLeads, {
      apifyRunId: scrapingResult.runId,
      apifyDatasetId: scrapingResult.datasetId,
    });
    result.storageJobId = storageResult.leadIds[0] ? "storage-complete" : "storage-failed";

    if (!isDryRun()) {
      await getSupabaseAdmin()
        .from("campaigns")
        .update({
          leads_collected: storageResult.leadIds.length,
          progress: 40,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);
    }

    // Step 3: Checking/Qualification
    console.log(`[Orchestrator] Qualifying ${storageResult.leadIds.length} leads`);
    const checkingResults = await batchCheckLeads(storageResult.leadIds, {
      concurrency: options?.concurrency ?? 3,
    });

    result.checkingResults = checkingResults.map((r) => ({
      leadId: r.leadId,
      status: r.newStatus,
      score: r.qualification.score,
    }));

    result.qualifiedLeads = checkingResults
      .filter((r) => r.newStatus === "qualified")
      .map((r) => r.leadId);

    if (!isDryRun()) {
      await getSupabaseAdmin()
        .from("campaigns")
        .update({
          leads_qualified: result.qualifiedLeads.length,
          progress: 60,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);
    }

    console.log(`[Orchestrator] Campaign ${campaignId} complete: ${result.qualifiedLeads.length} qualified leads`);
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    result.errors.push(errorMessage);
    console.error(`[Orchestrator] Campaign ${campaignId} failed:`, errorMessage);
    throw err;
  }
}

export async function processQualifiedLeads(
  campaignId: string,
  options?: { limit?: number }
): Promise<void> {
  const admin = getSupabaseAdmin();

  const { data: leads } = await admin
    .from("leads")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("status", "qualified")
    .limit(options?.limit ?? 10);

  if (!leads || leads.length === 0) {
    console.log(`[Orchestrator] No qualified leads to process for campaign ${campaignId}`);
    return;
  }

  for (const lead of leads) {
    try {
      // Transition to website_building
      await transitionLead(lead.id, "website_building", "orchestrator");
      // Website building will be handled by the Website Building Agent
      console.log(`[Orchestrator] Lead ${lead.id} queued for website building`);
    } catch (err) {
      console.error(`[Orchestrator] Failed to process lead ${lead.id}:`, err);
    }
  }
}

export async function getCampaignProgress(campaignId: string): Promise<{
  totalLeads: number;
  byStatus: Record<string, number>;
  websitesBuilt: number;
  websitesDeployed: number;
}> {
  const admin = getSupabaseAdmin();

  const { data: leads } = await admin
    .from("leads")
    .select("id, status")
    .eq("campaign_id", campaignId);

  const { data: websites } = await admin
    .from("websites")
    .select("status")
    .in("lead_id", leads?.map((l) => l.id) ?? []);

  const byStatus: Record<string, number> = {};
  for (const lead of leads ?? []) {
    byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
  }

  return {
    totalLeads: leads?.length ?? 0,
    byStatus,
    websitesBuilt: websites?.filter((w) => w.status === "built" || w.status === "deployed").length ?? 0,
    websitesDeployed: websites?.filter((w) => w.status === "deployed").length ?? 0,
  };
}

export async function retryFailedLeads(campaignId: string): Promise<number> {
  const admin = getSupabaseAdmin();

  const { data: failedLeads } = await admin
    .from("leads")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("status", "rejected")
    .limit(50);

  if (!failedLeads || failedLeads.length === 0) return 0;

  let retried = 0;
  for (const lead of failedLeads) {
    try {
      await transitionLead(lead.id, "scraped", "orchestrator", { reason: "retry" });
      retried++;
    } catch {
      // Skip invalid transitions
    }
  }

  return retried;
}