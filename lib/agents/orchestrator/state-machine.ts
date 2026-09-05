import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isDryRun } from "@/lib/queue/job-queue";
import { WorkflowStage } from "./types";

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
  | "website_deployed"
  | "ready_for_outreach"
  | "contacted"
  | "replied"
  | "interested"
  | "not_interested"
  | "stopped"
  | "cancelled";

export const VALID_LEAD_TRANSITIONS: Record<LeadLifecycleStatus, LeadLifecycleStatus[]> = {
  new: ["scraped", "cancelled"],
  scraped: ["checking", "rejected", "cancelled"],
  checking: ["qualified", "rejected", "cancelled"],
  qualified: ["website_building", "rejected", "cancelled"],
  rejected: ["scraped", "cancelled"], // Allow retry of rejected leads
  website_building: ["website_ready", "quality_failed", "cancelled"],
  website_ready: ["quality_checking", "deploying", "cancelled"],
  quality_checking: ["quality_passed", "quality_failed", "cancelled"],
  quality_passed: ["deploying", "cancelled"],
  quality_failed: ["website_building", "cancelled"],
  deploying: ["deployed", "website_deployed", "cancelled"],
  deployed: ["ready_for_outreach", "contacted", "cancelled"],
  website_deployed: ["ready_for_outreach", "contacted", "cancelled"],
  ready_for_outreach: ["contacted", "cancelled"],
  contacted: ["replied", "cancelled"],
  replied: ["interested", "not_interested", "stopped", "cancelled"],
  interested: [],
  not_interested: [],
  stopped: [],
  cancelled: [],
};

export function isValidTransition(from: LeadLifecycleStatus, to: LeadLifecycleStatus): boolean {
  return VALID_LEAD_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function transitionLead(
  leadId: string,
  newStatus: LeadLifecycleStatus,
  actor = "orchestrator",
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

export const WORKFLOW_STAGE_ORDER: WorkflowStage[] = [
  "SCRAPING",
  "QUALIFYING",
  "STORING",
  "BUILDING_WEBSITE",
  "DEPLOYING",
  "CONTACTING",
  "COMPLETED",
];

export function getNextStage(current: WorkflowStage): WorkflowStage | null {
  const idx = WORKFLOW_STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= WORKFLOW_STAGE_ORDER.length - 1) return null;
  return WORKFLOW_STAGE_ORDER[idx + 1];
}

export function sanitizeOrchestrationError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message
    .replace(/(EAAG[a-zA-Z0-9_-]+)/g, "[REDACTED_TOKEN]")
    .replace(/(Bearer\s+)[a-zA-Z0-9._-]+/gi, "$1[REDACTED_TOKEN]")
    .replace(/(vcp_[a-zA-Z0-9]+)/gi, "[REDACTED_VERCEL_TOKEN]")
    .replace(/(apify_api_[a-zA-Z0-9]+)/gi, "[REDACTED_APIFY_TOKEN]")
    .replace(/(ghp_[a-zA-Z0-9]+)/gi, "[REDACTED_GITHUB_TOKEN]");
}
