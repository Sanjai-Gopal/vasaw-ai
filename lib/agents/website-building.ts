/**
 * Website Building Agent Adapter / Facade
 * 
 * Provides unified interface and backward compatibility with queue jobs,
 * delegating generation to lib/agents/website and persistence to Storage Agent.
 */

import {
  buildWebsite,
  getTemplate,
  selectTemplate,
  TemplateType,
  WebsiteBuildResult as CoreWebsiteBuildResult,
} from "./website";
import { saveWebsite, updateLeadStatus, recordAgentRun } from "./storage";
import { createJob, updateJob, completeJob, failJob, getStepsForJobType, isDryRun } from "@/lib/queue/job-queue";
import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult } from "@/lib/agents/qualification/types";

export type { TemplateType };
export { selectTemplate, getTemplate };

export interface WebsiteBuildInput {
  leadId: string;
  businessName: string;
  category: string;
  subCategory?: string;
  location: string;
  rating: number;
  reviews: number;
  phone: string;
  email?: string;
  website: string | null;
  scraped?: {
    address: string;
    phone: string;
    email?: string;
    rating: number;
    reviews: number;
    category: string;
    subCategory?: string;
    hours?: string;
    services: string[];
    source: string;
    scrapedAt: string;
  };
  qualification?: {
    hasWebsite: boolean;
    websiteQuality: number;
    hasWhatsApp: boolean;
    hasReviews: boolean;
    responseLikelihood: "high" | "medium" | "low";
    notes: string;
  };
  opportunity?: {
    score: number;
    priority: "high" | "medium" | "low";
    reasons: string[];
    estimatedValue: number;
  };
}

export interface WebsiteBuildResult {
  websiteId: string;
  templateId: TemplateType;
  pages: string[];
  buildOutput: string;
  previewUrl?: string;
  buildStatus?: "SUCCESS" | "FAILED";
  buildErrors?: string[];
}

export async function runWebsiteBuildingAgent(
  input: WebsiteBuildInput,
  options?: { jobId?: string; forceTemplate?: TemplateType; mode?: "mock" | "ai" }
): Promise<WebsiteBuildResult> {
  const startTime = Date.now();
  const jobId = options?.jobId ?? (await createJob("build_website", {
    leadId: input.leadId,
    metadata: { forceTemplate: options?.forceTemplate },
  })).id;

  const steps = getStepsForJobType("build_website");
  let currentStepIndex = 0;

  const updateStep = async (step: string) => {
    await updateJob(jobId, { currentStep: step });
  };

  try {
    // Step 1: Select template
    if (steps.length > currentStepIndex) {
      await updateStep(steps[currentStepIndex++]);
    }
    const templateId = options?.forceTemplate ?? selectTemplate(input.category, input.subCategory);

    // Convert flat input to structured Lead & QualificationResult
    const lead: Lead = {
      id: input.leadId,
      businessName: input.businessName,
      category: input.category,
      phone: input.phone,
      website: input.website,
      address: input.scraped?.address || input.location,
      city: input.location,
      rating: input.rating,
      reviewCount: input.reviews,
      socialLinks: [],
      source: input.scraped?.source || "Google Maps",
      scrapedAt: input.scraped?.scrapedAt || new Date().toISOString(),
    };

    const qualification: QualificationResult = {
      leadId: input.leadId,
      score: input.opportunity?.score ?? 80,
      priority: input.opportunity?.priority ?? "high",
      websiteOpportunity: input.qualification ? !input.qualification.hasWebsite : true,
      reason: input.qualification?.notes || `${input.businessName} has strong potential`,
      confidence: 0.9,
      factors: {
        hasWebsite: input.qualification?.hasWebsite ?? false,
        websiteQuality: input.qualification?.websiteQuality ?? 0,
        rating: input.rating,
        reviewCount: input.reviews,
        category: input.category,
        socialPresence: false,
        businessTypeNeedsWebsite: true,
      },
      evidence: input.opportunity?.reasons || [],
    };

    // Step 2 & 3: Content Generation & Project Rendering
    if (steps.length > currentStepIndex) {
      await updateStep(steps[currentStepIndex++]);
    }

    const mode = options?.mode || (isDryRun() ? "mock" : "ai");

    const buildRes: CoreWebsiteBuildResult = await buildWebsite({
      lead,
      qualification,
      mode,
      forceTemplate: templateId,
    });

    if (buildRes.buildStatus === "FAILED") {
      throw new Error(`Website build validation failed: ${buildRes.buildErrors.join("; ")}`);
    }

    // Step 4: Quality & Storage Integration via Agent 3
    if (steps.length > currentStepIndex) {
      await updateStep(steps[currentStepIndex++]);
    }

    if (!isDryRun()) {
      await saveWebsite({
        id: buildRes.websiteId,
        leadId: input.leadId,
        businessName: input.businessName,
        category: input.category,
        location: input.location,
        status: "built",
        template: templateId,
        pages: buildRes.pages.length,
        sections: 8,
        buildProgress: 100,
        previewUrl: buildRes.previewUrl,
      });

      await updateLeadStatus({
        leadId: input.leadId,
        status: "website_building",
      });

      await recordAgentRun({
        agentId: "website-building",
        status: "success",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        success: true,
        detail: `Website built with ${templateId} template for ${input.businessName}`,
        metadata: {
          websiteId: buildRes.websiteId,
          template: templateId,
        },
      });
    }

    await completeJob(jobId);

    return {
      websiteId: buildRes.websiteId,
      templateId,
      pages: buildRes.pages,
      buildOutput: buildRes.buildOutput,
      previewUrl: buildRes.previewUrl,
      buildStatus: "SUCCESS",
      buildErrors: [],
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await failJob(jobId, errorMessage);

    if (!isDryRun()) {
      await recordAgentRun({
        agentId: "website-building",
        status: "failed",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        success: false,
        error: errorMessage,
        detail: `Failed website generation for ${input.businessName}`,
      }).catch(() => {});
    }

    throw err;
  }
}

export async function createWebsiteBuildJob(leadId: string, templateId?: TemplateType): Promise<string> {
  const job = await createJob("build_website", {
    leadId,
    metadata: { forceTemplate: templateId },
  });
  return job.id;
}