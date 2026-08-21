import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { JobRow, JobStatus } from "@/lib/supabase/database-types";

export { type JobStatus };

export type JobType =
  | "scrape_campaign"
  | "check_lead"
  | "qualify_lead"
  | "store_leads"
  | "build_website"
  | "quality_check"
  | "deploy_website"
  | "send_whatsapp"
  | "process_webhook";

export interface JobPayload {
  campaignId?: string;
  leadId?: string;
  websiteId?: string;
  deploymentId?: string;
  metadata?: Record<string, unknown>;
}

export interface JobData {
  id: string;
  type: JobType;
  leadId: string | null;
  campaignId: string | null;
  status: JobStatus;
  currentStep: string;
  attempt: number;
  maxRetries: number;
  provider: string | null;
  model: string | null;
  lastError: string | null;
  payload: JobPayload;
  createdAt: string;
  updatedAt: string;
}

function mapJobRow(row: JobRow): JobData {
  return {
    id: row.id,
    type: row.type as JobType,
    leadId: row.lead_id,
    campaignId: row.campaign_id,
    status: row.status as JobStatus,
    currentStep: row.current_step,
    attempt: row.attempt,
    maxRetries: row.max_retries,
    provider: row.provider,
    model: row.model,
    lastError: row.last_error,
    payload: row.metadata as JobPayload,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createJob(
  type: JobType,
  payload: JobPayload,
  options?: {
    leadId?: string;
    campaignId?: string;
    maxRetries?: number;
    provider?: string;
    model?: string;
  }
): Promise<JobData> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("jobs")
    .insert({
      type,
      lead_id: options?.leadId ?? payload.leadId ?? null,
      campaign_id: options?.campaignId ?? payload.campaignId ?? null,
      status: "QUEUED",
      current_step: "step_1",
      attempt: 0,
      max_retries: options?.maxRetries ?? 3,
      provider: options?.provider ?? null,
      model: options?.model ?? null,
      last_error: null,
      metadata: payload,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create job: ${error.message}`);
  return mapJobRow(data);
}

export async function getJob(id: string): Promise<JobData | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("jobs").select("*").eq("id", id).single();
  if (error) return null;
  return mapJobRow(data);
}

export async function updateJob(
  id: string,
  updates: Partial<Pick<JobData, "status" | "currentStep" | "attempt" | "lastError" | "provider" | "model">>
): Promise<JobData> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("jobs")
    .update({
      status: updates.status,
      current_step: updates.currentStep,
      attempt: updates.attempt,
      last_error: updates.lastError,
      provider: updates.provider,
      model: updates.model,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update job: ${error.message}`);
  return mapJobRow(data);
}

export async function claimNextJob(
  types: JobType[],
  workerId: string
): Promise<JobData | null> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin.rpc("claim_next_job", {
    p_types: types,
    p_worker_id: workerId,
  });

  if (error) {
    console.error("[JobQueue] claimNextJob error:", error.message);
    return null;
  }

  if (!data || data.length === 0) return null;
  return mapJobRow(data[0]);
}

export async function getJobsByStatus(
  status: JobStatus,
  limit = 50
): Promise<JobData[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("jobs")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to get jobs: ${error.message}`);
  return (data ?? []).map(mapJobRow);
}

export async function getJobsByLead(leadId: string): Promise<JobData[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("jobs")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to get jobs: ${error.message}`);
  return (data ?? []).map(mapJobRow);
}

export async function getJobsByCampaign(campaignId: string): Promise<JobData[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("jobs")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to get jobs: ${error.message}`);
  return (data ?? []).map(mapJobRow);
}

export async function requeueJob(id: string, reason: string): Promise<JobData> {
  const job = await getJob(id);
  if (!job) throw new Error(`Job ${id} not found`);

  if (job.attempt >= job.maxRetries) {
    return updateJob(id, {
      status: "FAILED",
      lastError: `Max retries exceeded: ${reason}`,
    });
  }

  return updateJob(id, {
    status: "RETRY_PENDING",
    attempt: job.attempt + 1,
    lastError: reason,
    currentStep: "step_1",
  });
}

export async function completeJob(id: string): Promise<JobData> {
  return updateJob(id, { status: "COMPLETED", currentStep: "completed" });
}

export async function failJob(id: string, error: string): Promise<JobData> {
  return updateJob(id, { status: "FAILED", lastError: error });
}

export async function cancelJob(id: string): Promise<JobData> {
  return updateJob(id, { status: "CANCELLED", currentStep: "cancelled" });
}

export async function pauseJob(id: string): Promise<JobData> {
  return updateJob(id, { status: "PAUSED" });
}

export async function resumeJob(id: string): Promise<JobData> {
  const job = await getJob(id);
  if (!job) throw new Error(`Job ${id} not found`);
  if (job.status !== "PAUSED") throw new Error(`Job ${id} is not paused`);
  return updateJob(id, { status: "QUEUED", currentStep: "step_1" });
}

export const JOB_STEPS = {
  scrape_campaign: ["validate_config", "start_actor", "poll_completion", "retrieve_dataset", "normalize_records", "store_leads"],
  check_lead: ["fetch_lead", "ai_qualify", "update_lead"],
  qualify_lead: ["fetch_lead", "ai_qualify", "update_lead"],
  store_leads: ["validate_records", "deduplicate", "upsert_leads", "log_activity"],
  build_website: ["select_template", "generate_content", "build_project", "quality_check"],
  quality_check: ["build_check", "typescript_check", "content_check", "security_check"],
  deploy_website: ["create_github_repo", "push_code", "create_vercel_project", "deploy", "verify"],
  send_whatsapp: ["prepare_message", "send_message", "track_delivery"],
  process_webhook: ["validate_payload", "process_event", "update_state"],
} as const;

export function getStepsForJobType(type: JobType): readonly string[] {
  return JOB_STEPS[type] ?? ["step_1"];
}

export function isDryRun(): boolean {
  return process.env.DRY_RUN === "true";
}