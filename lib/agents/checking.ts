/**
 * Checking Agent
 * 
 * Uses the AI Router (reasoning task, NVIDIA reasoning model) to qualify leads.
 * Evaluates only available data - does not invent financial info, owner interviews, etc.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { routeRequest } from "@/lib/ai/router";
import { createJob, updateJob, completeJob, failJob, getStepsForJobType, isDryRun } from "@/lib/queue/job-queue";

export interface QualificationResult {
  score: number;
  priority: "high" | "medium" | "low";
  websiteOpportunity: boolean;
  reason: string;
  confidence: number;
  factors: string[];
}

export interface CheckResult {
  leadId: string;
  qualification: QualificationResult;
  previousStatus: string;
  newStatus: "qualified" | "rejected";
}

const QUALIFICATION_PROMPT = `You are a business qualification analyst for VASAW AI. 
Your task is to evaluate a local business lead and determine if they are a good candidate for website building services.

Evaluate ONLY the data provided. Do NOT invent or assume:
- Financial information
- Owner interviews or private business data
- Search volume or ad spend
- Information not explicitly in the data

Score factors to consider:
1. Website existence (no website = high opportunity)
2. Website quality (if exists, is it outdated/poor?)
3. Rating (4.5+ = strong reputation)
4. Review count (100+ = established, 50-99 = growing, <50 = new)
5. Social presence (WhatsApp, Instagram, Facebook)
6. Category (restaurant, salon, gym, clinic = high website need)
7. Online visibility (reviews, ratings, photos)
8. Website opportunity (does the business type benefit from a website?)

Output structured JSON only:
{
  "score": 0-100,
  "priority": "high" | "medium" | "low",
  "websiteOpportunity": boolean,
  "reason": "One sentence summary",
  "confidence": 0.0-1.0,
  "factors": ["factor1", "factor2", ...]
}`;

export async function runCheckingAgent(
  leadId: string,
  options?: { jobId?: string }
): Promise<CheckResult> {
  const jobId = options?.jobId ?? (await createJob("check_lead", {
    leadId,
    metadata: {},
  })).id;

  const steps = getStepsForJobType("check_lead");
  let currentStepIndex = 0;

  const updateStep = async (step: string) => {
    await updateJob(jobId, { currentStep: step });
  };

  const admin = getSupabaseAdmin();

  try {
    // Step 1: Fetch lead
    await updateStep(steps[currentStepIndex++]);
    const { data: lead, error: leadError } = await admin
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead ${leadId} not found: ${leadError?.message}`);
    }

    // Step 2: AI Qualify
    await updateStep(steps[currentStepIndex++]);

    const businessData = {
      businessName: lead.business_name,
      category: lead.category,
      location: lead.location,
      rating: lead.rating,
      reviews: lead.reviews,
      website: lead.website,
      phone: lead.phone,
      email: lead.email,
      scraped: lead.qualification_json,
    };

    let qualification: QualificationResult;

    if (isDryRun()) {
      console.log("[Checking] DRY_RUN: Simulating AI qualification for", lead.business_name);
      qualification = {
        score: lead.rating * 20 - (lead.website ? 20 : 0) + Math.min(lead.reviews / 10, 20),
        priority: lead.rating >= 4.5 && !lead.website ? "high" : lead.rating >= 4.0 ? "medium" : "low",
        websiteOpportunity: !lead.website,
        reason: lead.website ? "Has existing website" : "No website despite online presence",
        confidence: 0.85,
        factors: [
          lead.website ? "Has website" : "No website",
          `Rating: ${lead.rating}/5`,
          `${lead.reviews} reviews`,
          lead.category,
        ],
      };
    } else {
      const response = await routeRequest({
        messages: [
          { role: "system", content: QUALIFICATION_PROMPT },
          { role: "user", content: JSON.stringify(businessData, null, 2) },
        ],
        task: "reasoning",
        temperature: 0.3,
        maxTokens: 1024,
      });

      if (!response.response.success || !response.response.content) {
        throw new Error(`AI qualification failed: ${response.response.errorMessage}`);
      }

      try {
        qualification = JSON.parse(response.response.content);
      } catch {
        throw new Error("Failed to parse AI qualification response");
      }
    }

    // Validate qualification result
    if (
      typeof qualification.score !== "number" ||
      !["high", "medium", "low"].includes(qualification.priority) ||
      typeof qualification.websiteOpportunity !== "boolean"
    ) {
      throw new Error("Invalid qualification result structure");
    }

    // Step 3: Update lead
    await updateStep(steps[currentStepIndex++]);

    const newStatus = qualification.score >= 50 && qualification.websiteOpportunity ? "qualified" : "rejected";

    if (!isDryRun()) {
      await admin
        .from("leads")
        .update({
          status: newStatus,
          ai_score: qualification.score,
          priority: qualification.priority,
          ai_score_json: qualification,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);

      await admin.from("activities").insert({
        lead_id: leadId,
        actor: "checking-agent",
        type: "lead",
        status: newStatus === "qualified" ? "success" : "info",
        title: newStatus === "qualified" ? "Lead qualified" : "Lead rejected",
        description: `Score: ${qualification.score}/100, Priority: ${qualification.priority}, Reason: ${qualification.reason}`,
      });
    }

    await completeJob(jobId);

    return {
      leadId,
      qualification,
      previousStatus: lead.status,
      newStatus,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await failJob(jobId, errorMessage);
    throw err;
  }
}

export async function createCheckingJob(leadId: string): Promise<string> {
  const job = await createJob("check_lead", { leadId, metadata: {} });
  return job.id;
}

export async function batchCheckLeads(
  leadIds: string[],
  options?: { concurrency?: number }
): Promise<CheckResult[]> {
  const concurrency = options?.concurrency ?? 3;
  const results: CheckResult[] = [];

  for (let i = 0; i < leadIds.length; i += concurrency) {
    const batch = leadIds.slice(i, i + concurrency);
    const promises = batch.map((leadId) => runCheckingAgent(leadId).catch((err) => ({
      leadId,
      qualification: {
        score: 0,
        priority: "low" as const,
        websiteOpportunity: false,
        reason: err.message,
        confidence: 0,
        factors: [],
      },
      previousStatus: "unknown",
      newStatus: "rejected" as const,
    })));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }

  return results;
}