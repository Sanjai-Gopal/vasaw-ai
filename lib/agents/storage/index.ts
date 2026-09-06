import { getSupabaseAdmin } from "@/lib/supabase/server";
import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult } from "@/lib/agents/qualification/types";
import { createJob } from "@/lib/queue/job-queue";
import {
  Campaign,
  LeadRecord,
  SaveLeadsRequest,
  SaveLeadsResponse,
  SaveQualificationRequest,
  SaveQualificationResponse,
  UpdateLeadStatusRequest,
  UpdateLeadStatusResponse,
  AgentRun,
  RecordAgentRunRequest,
  RecordAgentRunResponse,
  GetLeadsRequest,
  GetLeadsResponse,
  GetCampaignsResponse,
  SavedLead,
  SavedWebsite,
  SaveWebsiteRequest,
  GetWebsitesRequest,
  SavedDeployment,
  SaveDeploymentRequest,
  GetDeploymentsRequest,
  SavedMessage,
  SaveMessageRequest,
  GetMessagesRequest,
  UpdateMessageStatusRequest,
} from "./types";

function mapLeadRow(row: Record<string, unknown>): SavedLead {
  return {
    id: row.id as string,
    campaignId: (row.campaign_id as string) || "",
    businessName: row.business_name as string,
    category: row.category as string,
    location: row.location as string,
    rating: row.rating as number,
    reviewCount: row.reviews as number,
    phone: row.phone as string,
    website: row.website as string | null,
    address: row.address as string,
    city: row.location as string,
    socialLinks: row.social_links as string[] || [],
    source: row.source as string,
    scrapedAt: row.scraped_at as string,
    externalId: row.source_record_id as string | undefined,
    aiScore: row.ai_score as number,
    priority: row.priority as "high" | "medium" | "low",
    status: row.status as SavedLead["status"],
    email: row.email as string | null,
    aiScoreJson: row.ai_score_json as Record<string, unknown>,
    qualificationJson: row.qualification_json as Record<string, unknown>,
    opportunityJson: row.opportunity_json as Record<string, unknown>,
    websiteStatus: row.website_status as string,
    qualityStatus: row.quality_status as string,
    deploymentStatus: row.deployment_status as string,
    outreachStatus: row.outreach_status as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function saveCampaign(campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt">): Promise<Campaign> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("campaigns")
    .insert({
      name: campaign.name,
      category: campaign.category,
      location: campaign.location,
      lead_target: campaign.leadTarget,
      status: campaign.status,
      progress: campaign.progress,
      leads_collected: campaign.leadsCollected,
      leads_qualified: campaign.leadsQualified,
      websites_built: campaign.websitesBuilt,
      websites_deployed: campaign.websitesDeployed,
      messages_sent: campaign.messagesSent,
      minimum_rating: campaign.minimumRating,
      minimum_reviews: campaign.minimumReviews,
      website_opportunity_requirement: campaign.websiteOpportunityRequirement,
      social_presence_requirement: campaign.socialPresenceRequirement,
      automation_mode: campaign.automationMode,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save campaign: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    category: data.category,
    location: data.location,
    leadTarget: data.lead_target,
    status: data.status,
    progress: data.progress,
    leadsCollected: data.leads_collected,
    leadsQualified: data.leads_qualified,
    websitesBuilt: data.websites_built,
    websitesDeployed: data.websites_deployed,
    messagesSent: data.messages_sent,
    minimumRating: data.minimum_rating,
    minimumReviews: data.minimum_reviews,
    websiteOpportunityRequirement: data.website_opportunity_requirement,
    socialPresenceRequirement: data.social_presence_requirement,
    automationMode: data.automation_mode,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getCampaigns(): Promise<Campaign[]> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get campaigns: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    location: row.location,
    leadTarget: row.lead_target,
    status: row.status,
    progress: row.progress,
    leadsCollected: row.leads_collected,
    leadsQualified: row.leads_qualified,
    websitesBuilt: row.websites_built,
    websitesDeployed: row.websites_deployed,
    messagesSent: row.messages_sent,
    minimumRating: row.minimum_rating,
    minimumReviews: row.minimum_reviews,
    websiteOpportunityRequirement: row.website_opportunity_requirement,
    socialPresenceRequirement: row.social_presence_requirement,
    automationMode: row.automation_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get campaign: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    category: data.category,
    location: data.location,
    leadTarget: data.lead_target,
    status: data.status,
    progress: data.progress,
    leadsCollected: data.leads_collected,
    leadsQualified: data.leads_qualified,
    websitesBuilt: data.websites_built,
    websitesDeployed: data.websites_deployed,
    messagesSent: data.messages_sent,
    minimumRating: data.minimum_rating,
    minimumReviews: data.minimum_reviews,
    websiteOpportunityRequirement: data.website_opportunity_requirement,
    socialPresenceRequirement: data.social_presence_requirement,
    automationMode: data.automation_mode,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeWebsite(website: string | null): string | null {
  if (!website) return null;
  return website.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
}

function leadToDbFormat(lead: Lead, campaignId: string, apifyRunId?: string, apifyDatasetId?: string): Record<string, unknown> {
  const hasWebsite = !!lead.website;
  const websiteQuality = hasWebsite ? 50 : 0;
  const businessTypeNeedsWebsite = ["restaurant", "cafe", "salon", "gym", "clinic", "tattoo", "barbershop", "spa", "fitness", "dental", "medical", "bakery", "catering", "hotel", "photography", "event", "wedding", "real estate", "insurance", "lawyer", "accountant", "consultant", "agency", "studio", "workshop", "repair", "automotive", "plumber", "electrician", "hvac", "landscaping", "cleaning", "pest control"].some(cat => lead.category.toLowerCase().includes(cat));

  return {
    campaign_id: campaignId,
    business_name: lead.businessName,
    category: lead.category,
    location: lead.city,
    rating: lead.rating,
    reviews: lead.reviewCount,
    phone: lead.phone,
    email: null,
    website: lead.website,
    ai_score: 0,
    priority: "medium",
    status: "scraped",
    source: lead.source,
    source_record_id: lead.externalId,
    apify_run_id: apifyRunId,
    apify_dataset_id: apifyDatasetId,
    ai_score_json: {
      score: 0,
      priority: "medium",
      websiteOpportunity: !hasWebsite,
      confidence: 0.5,
      factors: [],
      reason: "Pending qualification",
    },
    qualification_json: {
      hasWebsite,
      websiteQuality,
      hasWhatsApp: !!lead.phone,
      hasReviews: lead.reviewCount > 0,
      responseLikelihood: "medium",
      notes: `Business identified from ${lead.source} with ${lead.reviewCount} reviews, rating ${lead.rating}/5`,
    },
    opportunity_json: {
      score: 0,
      priority: "medium",
      websiteOpportunity: !hasWebsite,
      confidence: 0.5,
      factors: [],
      reason: "Pending qualification",
    },
    website_status: "not_started",
    quality_status: "not_started",
    deployment_status: "not_started",
    outreach_status: "not_ready",
  };
}

export async function saveLeads(request: SaveLeadsRequest): Promise<SaveLeadsResponse> {
  const admin = getSupabaseAdmin();
  const result: SaveLeadsResponse = {
    success: true,
    totalProcessed: request.leads.length,
    inserted: 0,
    updated: 0,
    duplicates: 0,
    leadIds: [],
    errors: [],
  };

  for (const lead of request.leads) {
    try {
      const dbData = leadToDbFormat(lead, request.campaignId, request.apifyRunId, request.apifyDatasetId);

      // Use the database upsert_lead function for idempotent deduplication
      const { data, error } = await admin.rpc("upsert_lead", {
        p_campaign_id: request.campaignId,
        p_business_name: lead.businessName,
        p_category: lead.category,
        p_location: lead.city,
        p_rating: lead.rating,
        p_reviews: lead.reviewCount,
        p_phone: lead.phone,
        p_email: null,
        p_website: lead.website,
        p_address: lead.address,
        p_source: lead.source,
        p_source_record_id: lead.externalId,
        p_apify_run_id: request.apifyRunId,
        p_apify_dataset_id: request.apifyDatasetId,
        p_raw_data: dbData,
      });

      if (error) {
        throw new Error(error.message);
      }

      const leadId = data as string;
      result.leadIds.push(leadId);

      // Check if it was an insert or update by checking the lead's created_at
      const { data: leadData } = await admin
        .from("leads")
        .select("created_at, updated_at")
        .eq("id", leadId)
        .single();

      if (leadData && leadData.created_at === leadData.updated_at) {
        result.inserted++;
      } else {
        result.updated++;
        result.duplicates++;
      }
    } catch (err) {
      result.errors.push({
        leadId: lead.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return result;
}

export async function getLeads(request: GetLeadsRequest = {}): Promise<GetLeadsResponse> {
  const admin = getSupabaseAdmin();
  const limit = request.limit ?? 50;
  const offset = request.offset ?? 0;

  let query = admin.from("leads").select("*", { count: "exact" });

  if (request.campaignId) {
    query = query.eq("campaign_id", request.campaignId);
  }
  if (request.status) {
    query = query.eq("status", request.status);
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get leads: ${error.message}`);
  }

  return {
    success: true,
    leads: (data ?? []).map(mapLeadRow),
    total: count ?? 0,
  };
}

export async function getLead(id: string): Promise<SavedLead | null> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get lead: ${error.message}`);
  }

  return mapLeadRow(data);
}

export async function saveQualification(request: SaveQualificationRequest): Promise<SaveQualificationResponse> {
  const admin = getSupabaseAdmin();
  const result: SaveQualificationResponse = {
    success: true,
    updated: 0,
    errors: [],
  };

  for (const qualification of request.results) {
    try {
      const { error } = await admin
        .from("leads")
        .update({
          ai_score: qualification.score,
          priority: qualification.priority,
          status: qualification.websiteOpportunity ? "qualified" : "rejected",
          ai_score_json: qualification,
          updated_at: new Date().toISOString(),
        })
        .eq("id", qualification.leadId);

      if (error) {
        throw new Error(error.message);
      }

      result.updated++;
    } catch (err) {
      result.errors.push({
        leadId: qualification.leadId,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return result;
}

export async function updateLeadStatus(request: UpdateLeadStatusRequest): Promise<UpdateLeadStatusResponse> {
  const admin = getSupabaseAdmin();

  // Get current status first
  const { data: currentLead, error: fetchError } = await admin
    .from("leads")
    .select("status")
    .eq("id", request.leadId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to get lead: ${fetchError.message}`);
  }

  // Use database function for validated transition
  const { data, error } = await admin.rpc("update_lead_status", {
    p_lead_id: request.leadId,
    p_new_status: request.status,
    p_actor: "storage-agent",
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
    leadId: request.leadId,
    previousStatus: currentLead.status,
    newStatus: request.status,
  };
}

export async function recordAgentRun(request: RecordAgentRunRequest): Promise<RecordAgentRunResponse> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("agent_runs")
    .insert({
      agent_id: request.agentId,
      status: request.status,
      started_at: request.startedAt,
      completed_at: request.completedAt,
      duration_ms: request.durationMs ?? 0,
      success: request.success ?? false,
      error: request.error,
      detail: request.detail,
      metadata: request.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to record agent run: ${error.message}`);
  }

  return {
    success: true,
    runId: data.id,
  };
}

export async function getAgentRuns(agentId?: string, limit = 50): Promise<AgentRun[]> {
  const admin = getSupabaseAdmin();

  let query = admin.from("agent_runs").select("*").order("created_at", { ascending: false }).limit(limit);

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get agent runs: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    agentId: row.agent_id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
    success: row.success,
    error: row.error,
    detail: row.detail,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  }));
}

export interface NormalizedLead {
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
}

export interface StorageResult {
  totalProcessed: number;
  inserted: number;
  updated: number;
  duplicates: number;
  errors: Array<{ leadId: string; error: string }>;
  leadIds: string[];
}

export async function runStorageAgent(
  campaignId: string,
  leads: NormalizedLead[],
  options?: {
    jobId?: string;
    apifyRunId?: string;
    apifyDatasetId?: string;
  }
): Promise<StorageResult> {
  const result = await saveLeads({
    campaignId,
    leads: leads.map((lead) => ({
      id: lead.id,
      externalId: lead.source_record_id ?? undefined,
      businessName: lead.business_name,
      category: lead.category,
      phone: lead.phone,
      website: lead.website,
      address: lead.location,
      city: lead.location,
      rating: lead.rating,
      reviewCount: lead.reviews,
      socialLinks: [],
      source: lead.source,
      scrapedAt: lead.updated_at,
    })),
    apifyRunId: options?.apifyRunId,
    apifyDatasetId: options?.apifyDatasetId,
  });

  return {
    totalProcessed: result.totalProcessed,
    inserted: result.inserted,
    updated: result.updated,
    duplicates: result.duplicates,
    errors: result.errors,
    leadIds: result.leadIds,
  };
}

export async function createStorageJob(
  campaignId: string,
  leadCount: number
): Promise<string> {
  const job = await createJob("store_leads", {
    campaignId,
    metadata: { leadCount },
  });
  return job.id;
}

function mapWebsiteRow(row: Record<string, unknown>): SavedWebsite {
  return {
    id: row.id as string,
    leadId: (row.lead_id as string) || "",
    businessName: (row.business_name as string) || "",
    category: (row.category as string) || "",
    location: (row.location as string) || "",
    status: (row.status as SavedWebsite["status"]) || "queued",
    template: (row.template as string) || "generic",
    pages: (row.pages as number) ?? 1,
    sections: (row.sections as number) ?? 0,
    buildProgress: (row.build_progress as number) ?? 0,
    previewUrl: (row.preview_url as string) || undefined,
    liveUrl: (row.live_url as string) || undefined,
    repoUrl: (row.repo_url as string) || undefined,
    commitHash: (row.commit_hash as string) || undefined,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    builtAt: (row.built_at as string) || undefined,
  };
}

function isValidUuid(id?: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function saveWebsite(request: SaveWebsiteRequest): Promise<SavedWebsite> {
  const admin = getSupabaseAdmin();
  const insertPayload: Record<string, unknown> = {
    business_name: request.businessName,
    category: request.category,
    location: request.location,
    status: request.status ?? "built",
    template: request.template,
    pages: request.pages ?? 1,
    sections: request.sections ?? 0,
    build_progress: request.buildProgress ?? 100,
    preview_url: request.previewUrl,
    live_url: request.liveUrl,
    repo_url: request.repoUrl,
    commit_hash: request.commitHash,
    built_at: request.builtAt ?? new Date().toISOString(),
  };

  if (isValidUuid(request.leadId)) {
    insertPayload.lead_id = request.leadId;
  }

  if (request.id && isValidUuid(request.id)) {
    insertPayload.id = request.id;
  }

  const { data, error } = await admin
    .from("websites")
    .upsert(insertPayload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save website: ${error.message}`);
  }

  return mapWebsiteRow(data);
}

export async function getWebsite(id: string): Promise<SavedWebsite | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("websites")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get website: ${error.message}`);
  }

  return mapWebsiteRow(data);
}

export async function getWebsites(request: GetWebsitesRequest = {}): Promise<SavedWebsite[]> {
  const admin = getSupabaseAdmin();
  let query = admin.from("websites").select("*").order("created_at", { ascending: false });

  if (request.leadId) {
    query = query.eq("lead_id", request.leadId);
  }
  if (request.status) {
    query = query.eq("status", request.status);
  }
  if (request.limit) {
    query = query.limit(request.limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to get websites: ${error.message}`);
  }

  return (data ?? []).map(mapWebsiteRow);
}

function mapDeploymentRow(row: Record<string, unknown>): SavedDeployment {
  return {
    id: row.id as string,
    websiteId: (row.website_id as string) || "",
    leadId: (row.lead_id as string) || "",
    businessName: (row.business_name as string) || "",
    status: (row.status as SavedDeployment["status"]) || "queued",
    provider: (row.provider as SavedDeployment["provider"]) || "vercel",
    environment: (row.environment as SavedDeployment["environment"]) || "production",
    liveUrl: (row.live_url as string) || undefined,
    commitHash: (row.commit_hash as string) || undefined,
    durationSec: (row.duration_sec as number) ?? 0,
    deployedAt: (row.deployed_at as string) || undefined,
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

export async function saveDeployment(request: SaveDeploymentRequest): Promise<SavedDeployment> {
  const admin = getSupabaseAdmin();
  const insertPayload: Record<string, unknown> = {
    business_name: request.businessName,
    status: request.status ?? "deployed",
    provider: request.provider ?? "vercel",
    environment: request.environment ?? "production",
    live_url: request.liveUrl,
    commit_hash: request.commitHash,
    duration_sec: request.durationSec ?? 0,
    deployed_at: request.deployedAt ?? new Date().toISOString(),
  };

  if (isValidUuid(request.websiteId)) {
    insertPayload.website_id = request.websiteId;
  }
  if (isValidUuid(request.leadId)) {
    insertPayload.lead_id = request.leadId;
  }

  if (request.id && isValidUuid(request.id)) {
    insertPayload.id = request.id;
  }

  const { data, error } = await admin
    .from("deployments")
    .upsert(insertPayload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save deployment: ${error.message}`);
  }

  return mapDeploymentRow(data);
}

export async function getDeployment(id: string): Promise<SavedDeployment | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("deployments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get deployment: ${error.message}`);
  }

  return mapDeploymentRow(data);
}

export async function getDeployments(request: GetDeploymentsRequest = {}): Promise<SavedDeployment[]> {
  const admin = getSupabaseAdmin();
  let query = admin.from("deployments").select("*").order("created_at", { ascending: false });

  if (request.websiteId) {
    query = query.eq("website_id", request.websiteId);
  }
  if (request.leadId) {
    query = query.eq("lead_id", request.leadId);
  }
  if (request.status) {
    query = query.eq("status", request.status);
  }
  if (request.provider) {
    query = query.eq("provider", request.provider);
  }
  if (request.limit) {
    query = query.limit(request.limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to get deployments: ${error.message}`);
  }

  return (data ?? []).map(mapDeploymentRow);
}

function mapMessageRow(row: Record<string, unknown>): SavedMessage {
  return {
    id: row.id as string,
    leadId: (row.lead_id as string) || "",
    businessName: (row.business_name as string) || "",
    direction: (row.direction as SavedMessage["direction"]) || "outbound",
    channel: (row.channel as SavedMessage["channel"]) || "whatsapp",
    content: (row.content as string) || "",
    status: (row.status as SavedMessage["status"]) || "prepared",
    replyClassification: (row.reply_classification as SavedMessage["replyClassification"]) || undefined,
    sentAt: (row.sent_at as string) || undefined,
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

export async function saveMessage(request: SaveMessageRequest): Promise<SavedMessage> {
  const admin = getSupabaseAdmin();
  const insertPayload: Record<string, unknown> = {
    business_name: request.businessName,
    direction: request.direction ?? "outbound",
    channel: request.channel ?? "whatsapp",
    content: request.content,
    status: request.status ?? "sent",
    reply_classification: request.replyClassification,
    sent_at: request.sentAt ?? new Date().toISOString(),
  };

  if (isValidUuid(request.leadId)) {
    insertPayload.lead_id = request.leadId;
  }

  if (request.id && isValidUuid(request.id)) {
    insertPayload.id = request.id;
  }

  const { data, error } = await admin
    .from("messages")
    .upsert(insertPayload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save message: ${error.message}`);
  }

  return mapMessageRow(data);
}

export async function getMessage(id: string): Promise<SavedMessage | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("messages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get message: ${error.message}`);
  }

  return mapMessageRow(data);
}

export async function getMessages(request: GetMessagesRequest = {}): Promise<SavedMessage[]> {
  const admin = getSupabaseAdmin();
  let query = admin.from("messages").select("*");

  const queryObj = query as unknown as Record<string, (...args: unknown[]) => unknown>;

  if (request.leadId && typeof queryObj.eq === "function") {
    query = query.eq("lead_id", request.leadId);
  }
  if (request.status && typeof queryObj.eq === "function") {
    query = query.eq("status", request.status);
  }
  if (request.direction && typeof queryObj.eq === "function") {
    query = query.eq("direction", request.direction);
  }
  if (typeof queryObj.order === "function") {
    query = (query as unknown as { order: (col: string, opt: { ascending: boolean }) => typeof query }).order("created_at", { ascending: false });
  }
  if (request.limit && typeof queryObj.limit === "function") {
    query = (query as unknown as { limit: (n: number) => typeof query }).limit(request.limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return (data ?? []).map(mapMessageRow);
}

export async function updateMessageStatus(request: UpdateMessageStatusRequest): Promise<SavedMessage> {
  const admin = getSupabaseAdmin();
  const updatePayload: Record<string, unknown> = {
    status: request.status,
  };

  if (request.replyClassification) {
    updatePayload.reply_classification = request.replyClassification;
  }
  if (request.sentAt) {
    updatePayload.sent_at = request.sentAt;
  }

  const { data, error } = await admin
    .from("messages")
    .update(updatePayload)
    .eq("id", request.messageId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update message status: ${error.message}`);
  }

  return mapMessageRow(data);
}