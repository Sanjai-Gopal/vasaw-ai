import { WorkflowExecutionResult } from "./types";
import { executeWorkflow } from "./runner";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export * from "./types";
export {
  VALID_LEAD_TRANSITIONS,
  isValidTransition,
  transitionLead,
  WORKFLOW_STAGE_ORDER,
  getNextStage,
  sanitizeOrchestrationError,
  type LeadLifecycleStatus,
} from "./state-machine";
export {
  executeWorkflow,
  resumeWorkflow,
  cancelWorkflow,
  getWorkflowStatus,
  isWorkflowCancelled,
} from "./runner";

/**
 * Executes a full 6-agent campaign workflow with backwards compatibility.
 */
export async function executeCampaign(
  campaignId: string,
  locations: string[],
  categories: string[],
  options?: {
    maxPages?: number;
    maxItems?: number;
    offset?: number;
    excludeExternalIds?: string[];
    concurrency?: number;
    mode?: "mock" | "real";
    skipOutreach?: boolean;
  }
): Promise<WorkflowExecutionResult> {
  return executeWorkflow({
    campaignId,
    locations,
    categories,
    maxItems: options?.maxItems ?? (options?.maxPages ? options.maxPages * 10 : 10),
    offset: options?.offset,
    excludeExternalIds: options?.excludeExternalIds,
    concurrency: options?.concurrency,
    mode: options?.mode || "mock",
    skipOutreach: options?.skipOutreach,
  });
}

/**
 * Backwards compatibility helper to get campaign progress stats from Supabase.
 */
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

/**
 * Backwards compatibility helper to retry rejected leads.
 */
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
      await admin
        .from("leads")
        .update({ status: "scraped", updated_at: new Date().toISOString() })
        .eq("id", lead.id);
      retried++;
    } catch {
      // Skip invalid transitions
    }
  }

  return retried;
}

/**
 * Backwards compatibility helper to process qualified leads for website building.
 */
export async function processQualifiedLeads(
  campaignId: string,
  options?: { limit?: number; mode?: "mock" | "real" }
): Promise<void> {
  const admin = getSupabaseAdmin();

  const { data: leads } = await admin
    .from("leads")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("status", "qualified")
    .limit(options?.limit ?? 10);

  if (!leads || leads.length === 0) {
    return;
  }

  for (const lead of leads) {
    try {
      await admin
        .from("leads")
        .update({ status: "website_building", updated_at: new Date().toISOString() })
        .eq("id", lead.id);
    } catch (err) {
      console.error(`[Orchestrator] Failed to transition lead ${lead.id}:`, err);
    }
  }
}
