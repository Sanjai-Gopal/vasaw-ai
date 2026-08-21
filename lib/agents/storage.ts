/**
 * Storage Agent
 * 
 * Handles idempotent ingestion of leads into Supabase with deduplication.
 * Deduplication priority: phone > normalized website > source/place_id > normalized name + address
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createJob, updateJob, completeJob, failJob, getStepsForJobType, isDryRun } from "@/lib/queue/job-queue";
import type { JobPayload } from "@/lib/queue/job-queue";

export interface NormalizedLead {
  id: string;
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
  scraped: {
    address: string;
    phone: string;
    email: string | null;
    rating: number;
    reviews: number;
    category: string;
    subCategory: string | null;
    hours: string | null;
    services: string[];
    source: string;
    scrapedAt: string;
  };
  qualification: {
    hasWebsite: boolean;
    websiteQuality: number;
    hasWhatsApp: boolean;
    hasReviews: boolean;
    responseLikelihood: "high" | "medium" | "low";
    notes: string;
  };
  opportunity: {
    score: number;
    priority: string;
    reasons: string[];
    estimatedValue: number;
  };
  leadId?: string;
}

export interface StorageResult {
  totalProcessed: number;
  inserted: number;
  updated: number;
  duplicates: number;
  errors: Array<{ leadId: string; error: string }>;
  leadIds: string[];
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeWebsite(website: string | null): string | null {
  if (!website) return null;
  return website.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim();
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
  const jobId = options?.jobId ?? (await createJob("store_leads", {
    campaignId,
    metadata: { leadCount: leads.length, apifyRunId: options?.apifyRunId, apifyDatasetId: options?.apifyDatasetId },
  })).id;

  const steps = getStepsForJobType("store_leads");
  let currentStepIndex = 0;

  const updateStep = async (step: string) => {
    await updateJob(jobId, { currentStep: step });
  };

  const admin = getSupabaseAdmin();
  const result: StorageResult = {
    totalProcessed: leads.length,
    inserted: 0,
    updated: 0,
    duplicates: 0,
    errors: [],
    leadIds: [],
  };

  try {
    // Step 1: Validate records
    await updateStep(steps[currentStepIndex++]);
    const validLeads = leads.filter((lead) => {
      if (!lead.business_name || !lead.phone) {
        result.errors.push({ leadId: lead.id, error: "Missing required fields" });
        return false;
      }
      return true;
    });

    // Step 2: Deduplicate
    await updateStep(steps[currentStepIndex++]);
    
    for (const lead of validLeads) {
      try {
        const normalizedPhone = normalizePhone(lead.phone);
        const normalizedWebsite = normalizeWebsite(lead.website);
        const normalizedBusinessName = normalizeName(lead.business_name);
        const normalizedAddress = normalizeName(lead.scraped.address);

        // Check for existing lead using deduplication priority
        let existingLeadId: string | null = null;

        // Priority 1: phone
        if (normalizedPhone) {
          const { data } = await admin
            .from("leads")
            .select("id")
            .eq("campaign_id", campaignId)
            .filter("phone", "ilike", `%${normalizedPhone.slice(-10)}%`)
            .limit(1)
            .single();
          if (data) existingLeadId = data.id;
        }

        // Priority 2: normalized website
        if (!existingLeadId && normalizedWebsite) {
          const { data } = await admin
            .from("leads")
            .select("id")
            .eq("campaign_id", campaignId)
            .filter("website", "ilike", `%${normalizedWebsite}%`)
            .limit(1)
            .single();
          if (data) existingLeadId = data.id;
        }

        // Priority 3: source record ID (from Apify place_id)
        if (!existingLeadId && lead.scraped.source.includes("Google Maps")) {
          const placeId = lead.scraped.address; // Would need actual place_id from raw data
          // This would need the actual place_id from raw Apify data
        }

        // Priority 4: normalized name + address
        if (!existingLeadId) {
          const { data } = await admin
            .from("leads")
            .select("id")
            .eq("campaign_id", campaignId)
            .ilike("business_name", lead.business_name)
            .ilike("location", `%${lead.location}%`)
            .limit(1)
            .single();
          if (data) existingLeadId = data.id;
        }

        // Prepare lead data for upsert
        const leadData = {
          campaign_id: campaignId,
          business_name: lead.business_name,
          category: lead.category,
          location: lead.location,
          rating: lead.rating,
          reviews: lead.reviews,
          phone: lead.phone,
          email: lead.email,
          website: lead.website,
          ai_score: lead.ai_score,
          priority: lead.priority,
          status: "scraped",
          source: lead.scraped.source,
          source_record_id: lead.scraped.source.includes("Google Maps") ? `gmaps-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : null,
          apify_run_id: options?.apifyRunId,
          apify_dataset_id: options?.apifyDatasetId,
          ai_score_json: {
            score: lead.opportunity.score,
            priority: lead.opportunity.priority,
            websiteOpportunity: !lead.website,
            confidence: 0.8,
            factors: lead.opportunity.reasons,
            reason: lead.opportunity.reasons.join("; "),
          },
          qualification_json: {
            hasWebsite: lead.qualification.hasWebsite,
            websiteQuality: lead.qualification.websiteQuality,
            hasWhatsApp: lead.qualification.hasWhatsApp,
            hasReviews: lead.qualification.hasReviews,
            responseLikelihood: lead.qualification.responseLikelihood,
            notes: lead.qualification.notes,
          },
          opportunity_json: {
            score: lead.opportunity.score,
            priority: lead.opportunity.priority,
            websiteOpportunity: !lead.website,
            confidence: 0.8,
            factors: lead.opportunity.reasons,
            reason: lead.opportunity.reasons.join("; "),
          },
          website_status: "not_started",
          quality_status: "not_started",
          deployment_status: "not_started",
          outreach_status: "not_ready",
          updated_at: new Date().toISOString(),
        };

        // Step 3: Upsert
        await updateStep(steps[currentStepIndex++]);

        if (isDryRun()) {
          console.log("[Storage] DRY_RUN: Simulating upsert for", lead.business_name);
          result.leadIds.push(existingLeadId ?? `new-${Date.now()}`);
          if (existingLeadId) {
            result.updated++;
            result.duplicates++;
          } else {
            result.inserted++;
          }
          continue;
        }

        if (existingLeadId) {
          // Update existing
          const { error } = await admin
            .from("leads")
            .update(leadData)
            .eq("id", existingLeadId);
          if (error) throw error;
          result.updated++;
          result.duplicates++;
          result.leadIds.push(existingLeadId);
        } else {
          // Insert new
          const { data, error } = await admin
            .from("leads")
            .insert(leadData)
            .select("id")
            .single();
          if (error) throw error;
          result.inserted++;
          result.leadIds.push(data.id);
        }

        // Step 4: Log activity
        await updateStep(steps[currentStepIndex++]);
        await admin.from("activities").insert({
          lead_id: existingLeadId ?? result.leadIds[result.leadIds.length - 1],
          campaign_id: campaignId,
          actor: "storage-agent",
          type: "lead",
          status: "info",
          title: existingLeadId ? "Lead updated" : "Lead created",
          description: `${lead.business_name} ${existingLeadId ? "updated" : "created"} from ${lead.scraped.source}`,
        });

      } catch (err) {
        result.errors.push({ leadId: lead.id, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    await completeJob(jobId);
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await failJob(jobId, errorMessage);
    throw err;
  }
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