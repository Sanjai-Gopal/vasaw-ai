import {
  CampaignWorkflowRequest,
  WorkflowExecutionResult,
} from "./types";
import {
  sanitizeOrchestrationError,
} from "./state-machine";

// Import Agent Public Contracts
import { runScrapingAgent } from "../scraping/index";
import { runQualificationAgent } from "../qualification/index";
import {
  saveLeads,
  saveQualification,
  getDeployments,
  getMessages,
  updateLeadStatus,
  recordAgentRun,
} from "../storage/index";
import { buildWebsite } from "../website/index";
import { deployWebsite } from "../deployment/index";
import { sendWhatsAppMessage } from "../whatsapp/index";
import { Lead } from "../scraping/types";
import { QualificationResult } from "../qualification/types";
import { WebsiteBuildResult } from "../website/types";
import { isLiveMode } from "@/lib/config/modes";
import { refreshCampaignCounters } from "@/lib/data/campaigns";

// In-memory workflow state cache for cancellation & active tracking
const activeWorkflows = new Map<string, WorkflowExecutionResult>();
const cancelledWorkflows = new Set<string>();

export function isWorkflowCancelled(workflowId: string): boolean {
  return cancelledWorkflows.has(workflowId);
}

export function cancelWorkflow(workflowId: string): boolean {
  cancelledWorkflows.add(workflowId);
  const active = activeWorkflows.get(workflowId);
  if (active) {
    active.status = "CANCELLED";
    active.completedAt = new Date().toISOString();
  }
  return true;
}

export function getWorkflowStatus(workflowId: string): WorkflowExecutionResult | null {
  return activeWorkflows.get(workflowId) ?? null;
}

/**
 * Main Orchestration Runner coordinating Agents 1-6.
 */
export async function executeWorkflow(
  request: CampaignWorkflowRequest
): Promise<WorkflowExecutionResult> {
  const startTime = Date.now();
  const workflowId = request.workflowId || `wf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const mode = request.mode || (isLiveMode() ? "real" : "mock");
  const campaignId = request.campaignId;

  // Validation
  if (!campaignId || typeof campaignId !== "string" || campaignId.trim() === "") {
    throw new Error("Invalid campaignId: must be a non-empty string");
  }
  if (!request.locations || !Array.isArray(request.locations) || request.locations.length === 0) {
    throw new Error("Invalid locations: must provide at least one location");
  }
  if (!request.categories || !Array.isArray(request.categories) || request.categories.length === 0) {
    throw new Error("Invalid categories: must provide at least one category");
  }

  const result: WorkflowExecutionResult = {
    success: true,
    workflowId,
    campaignId,
    status: "RUNNING",
    mode,
    currentStage: "SCRAPING",
    resumable: true,
    stages: {
      scraping: "PENDING",
      qualifying: "PENDING",
      storing: "PENDING",
      website: "PENDING",
      deployment: "PENDING",
      whatsapp: "PENDING",
    },
    stats: {
      scraped: 0,
      qualified: 0,
      stored: 0,
      websitesBuilt: 0,
      websitesDeployed: 0,
      messagesSent: 0,
      failedLeads: 0,
      durationMs: 0,
    },
    leadResults: [],
    errors: [],
    startedAt: new Date().toISOString(),
  };

  activeWorkflows.set(workflowId, result);

  let scrapedLeads: Lead[] = [];
  let qualificationResults: QualificationResult[] = [];
  const storedLeadMap = new Map<string, Lead>();
  const buildResultsMap = new Map<string, WebsiteBuildResult>();

  try {
    // -------------------------------------------------------------
    // STAGE 1: SCRAPING (Agent 1)
    // -------------------------------------------------------------
    if (isWorkflowCancelled(workflowId)) {
      result.status = "CANCELLED";
      return finalizeResult(result, startTime);
    }

    result.currentStage = "SCRAPING";
    result.stages.scraping = "RUNNING";

    try {
      const scrapeResponse = await runScrapingAgent({
        campaignId,
        location: request.locations[0] || "Coimbatore",
        category: request.categories[0] || "restaurant",
        limit: request.maxItems ?? 10,
        offset: request.offset,
        excludeExternalIds: request.excludeExternalIds,
        mode: mode === "real" ? "apify" : "mock",
      });

      if (!scrapeResponse.success) {
        throw new Error(scrapeResponse.error || "Scraping failed");
      }

      scrapedLeads = scrapeResponse.leads;
      result.stats.scraped = scrapedLeads.length;
      result.stages.scraping = "COMPLETED";
    } catch (err: unknown) {
      const sanitized = sanitizeOrchestrationError(err);
      result.stages.scraping = "FAILED";
      result.failedStage = "SCRAPING";
      result.status = "FAILED";
      result.success = false;
      result.errors.push({ stage: "SCRAPING", message: sanitized });
      return finalizeResult(result, startTime);
    }

    // -------------------------------------------------------------
    // STAGE 2: QUALIFICATION (Agent 2)
    // -------------------------------------------------------------
    if (isWorkflowCancelled(workflowId)) {
      result.status = "CANCELLED";
      return finalizeResult(result, startTime);
    }

    result.currentStage = "QUALIFYING";
    result.stages.qualifying = "RUNNING";

    try {
      const qualResponse = await runQualificationAgent({
        leads: scrapedLeads,
        mode: mode === "real" ? "ai" : "mock",
      });

      if (!qualResponse.success) {
        throw new Error(qualResponse.error || "Qualification failed");
      }

      qualificationResults = qualResponse.results;
      const qualifiedCount = qualificationResults.filter((q) => q.priority === "high" || q.priority === "medium").length;
      result.stats.qualified = qualifiedCount;
      result.stages.qualifying = "COMPLETED";
    } catch (err: unknown) {
      const sanitized = sanitizeOrchestrationError(err);
      result.stages.qualifying = "FAILED";
      result.failedStage = "QUALIFYING";
      result.status = "FAILED";
      result.success = false;
      result.errors.push({ stage: "QUALIFYING", message: sanitized });
      return finalizeResult(result, startTime);
    }

    // -------------------------------------------------------------
    // STAGE 3: STORAGE (Agent 3)
    // -------------------------------------------------------------
    if (isWorkflowCancelled(workflowId)) {
      result.status = "CANCELLED";
      return finalizeResult(result, startTime);
    }

    result.currentStage = "STORING";
    result.stages.storing = "RUNNING";

    try {
      await saveLeads({
        campaignId,
        leads: scrapedLeads,
      }).catch((err) => {
        // In offline mock mode or when Supabase is unconfigured, non-blocking warning
        console.warn("[Orchestrator] Lead storage non-blocking notice:", err.message);
      });

      await saveQualification({
        campaignId,
        results: qualificationResults,
      }).catch((err) => {
        console.warn("[Orchestrator] Qualification storage non-blocking notice:", err.message);
      });

      // Populate lead map
      for (const lead of scrapedLeads) {
        storedLeadMap.set(lead.id, lead);
      }

      result.stats.stored = storedLeadMap.size;
      result.stages.storing = "COMPLETED";
    } catch (err: unknown) {
      const sanitized = sanitizeOrchestrationError(err);
      result.stages.storing = "FAILED";
      result.failedStage = "STORING";
      result.status = "FAILED";
      result.success = false;
      result.errors.push({ stage: "STORING", message: sanitized });
      return finalizeResult(result, startTime);
    }

    // Initialize Lead Workflow Results
    for (const lead of scrapedLeads) {
      const qual = qualificationResults.find((q) => q.leadId === lead.id);
      const isQualified = qual ? (qual.priority === "high" || qual.priority === "medium") : false;
      const isWebsiteEligible = qual ? qual.websiteOpportunity : !lead.website;

      result.leadResults.push({
        leadId: lead.id,
        businessName: lead.businessName,
        phone: lead.phone,
        qualified: isQualified,
        websiteEligible: isWebsiteEligible,
        currentLifecycleStatus: isQualified ? "qualified" : "rejected",
      });
    }

    // Filter leads eligible for website building
    const eligibleLeads = scrapedLeads.filter((lead) => {
      const qual = qualificationResults.find((q) => q.leadId === lead.id);
      return qual?.websiteOpportunity ?? !lead.website;
    });

    // -------------------------------------------------------------
    // STAGE 4: WEBSITE GENERATION & BUILDING (Agent 4)
    // -------------------------------------------------------------
    if (isWorkflowCancelled(workflowId)) {
      result.status = "CANCELLED";
      return finalizeResult(result, startTime);
    }

    result.currentStage = "BUILDING_WEBSITE";
    result.stages.website = "RUNNING";

    for (const lead of eligibleLeads) {
      if (isWorkflowCancelled(workflowId)) break;

      const leadResult = result.leadResults.find((lr) => lr.leadId === lead.id);
      const qual = qualificationResults.find((q) => q.leadId === lead.id) || {
        leadId: lead.id,
        score: 80,
        priority: "high" as const,
        websiteOpportunity: true,
        reason: "High opportunity",
        confidence: 0.9,
        factors: {
          hasWebsite: false,
          websiteQuality: 0,
          rating: lead.rating,
          reviewCount: lead.reviewCount,
          category: lead.category,
          socialPresence: false,
          businessTypeNeedsWebsite: true,
        },
        evidence: [],
      };

      try {
        if (leadResult) {
          leadResult.currentLifecycleStatus = "website_building";
        }
        await updateLeadStatus({ leadId: lead.id, status: "website_building" }).catch(() => {});

        const buildResult = await buildWebsite({
          lead,
          qualification: qual,
          mode: mode === "real" ? "ai" : "mock",
        });

        if (buildResult.status === "READY" && buildResult.buildStatus === "SUCCESS") {
          buildResultsMap.set(lead.id, buildResult);
          result.stats.websitesBuilt++;
          if (leadResult) {
            leadResult.websiteId = buildResult.websiteId;
            leadResult.websiteStatus = "READY";
            leadResult.currentLifecycleStatus = "website_ready";
          }
        } else {
          result.stats.failedLeads++;
          if (leadResult) {
            leadResult.websiteStatus = "FAILED";
            leadResult.error = buildResult.buildErrors?.join("; ") || "Website build failed";
            leadResult.currentLifecycleStatus = "quality_failed";
          }
          result.errors.push({
            stage: "BUILDING_WEBSITE",
            leadId: lead.id,
            message: `Website build failed for ${lead.businessName}`,
          });
        }
      } catch (buildErr: unknown) {
        result.stats.failedLeads++;
        const sanitized = sanitizeOrchestrationError(buildErr);
        if (leadResult) {
          leadResult.websiteStatus = "FAILED";
          leadResult.error = sanitized;
          leadResult.currentLifecycleStatus = "quality_failed";
        }
        result.errors.push({
          stage: "BUILDING_WEBSITE",
          leadId: lead.id,
          message: sanitized,
        });
      }
    }

    result.stages.website = buildResultsMap.size > 0 || eligibleLeads.length === 0 ? "COMPLETED" : "FAILED";
    if (result.stages.website === "FAILED") {
      result.failedStage = "BUILDING_WEBSITE";
      result.status = "FAILED";
      result.success = false;
      return finalizeResult(result, startTime);
    }

    // -------------------------------------------------------------
    // STAGE 5: DEPLOYMENT (Agent 5)
    // -------------------------------------------------------------
    if (isWorkflowCancelled(workflowId)) {
      result.status = "CANCELLED";
      return finalizeResult(result, startTime);
    }

    result.currentStage = "DEPLOYING";
    result.stages.deployment = "RUNNING";

    const deployedBuildResults: Array<{ leadId: string; url: string; websiteId: string }> = [];

    for (const [leadId, buildResult] of buildResultsMap.entries()) {
      if (isWorkflowCancelled(workflowId)) break;

      const lead = storedLeadMap.get(leadId);
      const leadResult = result.leadResults.find((lr) => lr.leadId === leadId);

      try {
        // Idempotency check: see if deployment already exists
        const existingDeployments = await getDeployments({
          websiteId: buildResult.websiteId,
          status: "deployed",
        }).catch(() => []);

        let deployResult;
        if (existingDeployments.length > 0 && existingDeployments[0].liveUrl) {
          deployResult = {
            success: true,
            deploymentId: existingDeployments[0].id,
            status: "READY" as const,
            url: existingDeployments[0].liveUrl,
            provider: mode === "real" ? "vercel" : "mock",
            metadata: { idempotentReused: true },
          };
        } else {
          if (leadResult) {
            leadResult.currentLifecycleStatus = "deploying";
          }

          deployResult = await deployWebsite({
            websiteId: buildResult.websiteId,
            buildResult,
            businessName: lead?.businessName || buildResult.businessName,
            leadId,
            mode: mode === "real" ? "vercel" : "mock",
          });
        }

        if (deployResult.success && deployResult.status === "READY" && deployResult.url) {
          result.stats.websitesDeployed++;
          deployedBuildResults.push({
            leadId,
            url: deployResult.url,
            websiteId: buildResult.websiteId,
          });

          if (leadResult) {
            leadResult.deploymentId = deployResult.deploymentId;
            leadResult.deploymentStatus = "READY";
            leadResult.liveUrl = deployResult.url;
            // Agent 5 owns website_deployed transition
            leadResult.currentLifecycleStatus = "website_deployed";
          }
          await updateLeadStatus({ leadId, status: "website_deployed" }).catch(() => {});
        } else {
          result.stats.failedLeads++;
          if (leadResult) {
            leadResult.deploymentStatus = "FAILED";
            leadResult.error = deployResult.error || "Deployment failed";
          }
          result.errors.push({
            stage: "DEPLOYING",
            leadId,
            message: `Deployment failed for ${lead?.businessName || leadId}: ${deployResult.error}`,
          });
        }
      } catch (deployErr: unknown) {
        result.stats.failedLeads++;
        const sanitized = sanitizeOrchestrationError(deployErr);
        if (leadResult) {
          leadResult.deploymentStatus = "FAILED";
          leadResult.error = sanitized;
        }
        result.errors.push({
          stage: "DEPLOYING",
          leadId,
          message: sanitized,
        });
      }
    }

    result.stages.deployment = deployedBuildResults.length > 0 || buildResultsMap.size === 0 ? "COMPLETED" : "FAILED";
    if (result.stages.deployment === "FAILED") {
      result.failedStage = "DEPLOYING";
      result.status = "FAILED";
      result.success = false;
      return finalizeResult(result, startTime);
    }

    // -------------------------------------------------------------
    // STAGE 6: WHATSAPP OUTREACH (Agent 6)
    // -------------------------------------------------------------
    if (isWorkflowCancelled(workflowId)) {
      result.status = "CANCELLED";
      return finalizeResult(result, startTime);
    }

    if (request.skipOutreach) {
      result.stages.whatsapp = "SKIPPED";
    } else {
      result.currentStage = "CONTACTING";
      result.stages.whatsapp = "RUNNING";

      for (const item of deployedBuildResults) {
        if (isWorkflowCancelled(workflowId)) break;

        const lead = storedLeadMap.get(item.leadId);
        const leadResult = result.leadResults.find((lr) => lr.leadId === item.leadId);

        if (!lead || !lead.phone) {
          if (leadResult) {
            leadResult.messageStatus = "SKIPPED";
          }
          continue;
        }

        try {
          // Idempotency: check if message was already sent
          const existingMessages = await getMessages({
            leadId: lead.id,
            direction: "outbound",
            status: "sent",
          }).catch(() => []);

          let msgResult;
          if (existingMessages.length > 0) {
            msgResult = {
              success: true,
              messageId: existingMessages[0].id,
              status: "SENT" as const,
              provider: mode === "real" ? "meta" : "mock",
              metadata: { idempotentReused: true },
            };
          } else {
            msgResult = await sendWhatsAppMessage({
              leadId: lead.id,
              phone: lead.phone,
              businessName: lead.businessName,
              message: {
                type: "text",
                body: `Hello ${lead.businessName}! We have built and published a custom website preview for your business: ${item.url}. Check it out!`,
              },
              mode: mode === "real" ? "meta" : "mock",
            });
          }

          if (msgResult.success && (msgResult.status === "SENT" || msgResult.status === "PENDING")) {
            result.stats.messagesSent++;
            if (leadResult) {
              leadResult.messageId = msgResult.messageId;
              leadResult.messageStatus = msgResult.status;
              // Agent 6 owns contacted transition
              leadResult.currentLifecycleStatus = "contacted";
            }
            await updateLeadStatus({ leadId: lead.id, status: "contacted" }).catch(() => {});
          } else {
            if (leadResult) {
              leadResult.messageStatus = "FAILED";
              leadResult.error = msgResult.error || "WhatsApp message failed";
            }
            result.errors.push({
              stage: "CONTACTING",
              leadId: lead.id,
              message: `WhatsApp outreach failed for ${lead.businessName}: ${msgResult.error}`,
            });
          }
        } catch (msgErr: unknown) {
          const sanitized = sanitizeOrchestrationError(msgErr);
          if (leadResult) {
            leadResult.messageStatus = "FAILED";
            leadResult.error = sanitized;
          }
          result.errors.push({
            stage: "CONTACTING",
            leadId: lead.id,
            message: sanitized,
          });
        }
      }

      result.stages.whatsapp = "COMPLETED";
    }

    result.currentStage = "COMPLETED";
    result.status = "COMPLETED";
    result.success = true;
  } catch (unexpectedErr: unknown) {
    const sanitized = sanitizeOrchestrationError(unexpectedErr);
    result.status = "FAILED";
    result.success = false;
    result.errors.push({ stage: result.currentStage, message: sanitized });
  }

  return finalizeResult(result, startTime);
}

/**
 * Resumes a previously paused or failed workflow.
 */
export async function resumeWorkflow(
  workflowId: string,
  request?: Partial<CampaignWorkflowRequest>
): Promise<WorkflowExecutionResult> {
  const existing = activeWorkflows.get(workflowId);
  if (existing && existing.status === "COMPLETED") {
    return existing;
  }

  // Restart execution with the existing workflowId and campaignId
  const campaignId = request?.campaignId || existing?.campaignId || "resumed-campaign";
  const locations = request?.locations || ["Coimbatore"];
  const categories = request?.categories || ["restaurant"];

  return executeWorkflow({
    campaignId,
    locations,
    categories,
    workflowId,
    mode: request?.mode || existing?.mode || "mock",
    ...request,
  });
}

function finalizeResult(
  result: WorkflowExecutionResult,
  startTime: number
): WorkflowExecutionResult {
  result.stats.durationMs = Date.now() - startTime;
  result.completedAt = new Date().toISOString();
  activeWorkflows.set(result.workflowId, result);

  // Refresh accurate campaign counters directly from DB
  if (result.campaignId) {
    refreshCampaignCounters(result.campaignId).catch(() => {});
  }

  // Record agent run in storage
  recordAgentRun({
    agentId: "orchestrator",
    status: result.success ? "success" : "failed",
    success: result.success,
    durationMs: result.stats.durationMs,
    error: result.errors[0]?.message || undefined,
    metadata: {
      workflowId: result.workflowId,
      campaignId: result.campaignId,
      stats: result.stats,
      stages: result.stages,
    },
  }).catch(() => {});

  return result;
}
