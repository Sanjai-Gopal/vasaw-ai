import type { LeadLifecycleStatus } from "./state-machine";

export type WorkflowStage =
  | "SCRAPING"
  | "QUALIFYING"
  | "STORING"
  | "BUILDING_WEBSITE"
  | "DEPLOYING"
  | "CONTACTING"
  | "COMPLETED";

export type WorkflowStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "PAUSED";

export type StageExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED";

export interface CampaignWorkflowRequest {
  campaignId: string;
  locations: string[];
  categories: string[];
  maxItems?: number;
  offset?: number;
  excludeExternalIds?: string[];
  mode?: "mock" | "real";
  concurrency?: number;
  dryRun?: boolean;
  skipOutreach?: boolean;
  resumeFromStage?: WorkflowStage;
  workflowId?: string;
}

export interface LeadWorkflowResult {
  leadId: string;
  businessName: string;
  city?: string;
  location?: string;
  sourceMode?: string;
  phone: string;
  qualified: boolean;
  websiteEligible: boolean;
  websiteId?: string;
  websiteStatus?: "READY" | "FAILED" | "SKIPPED";
  deploymentId?: string;
  deploymentStatus?: "READY" | "FAILED" | "SKIPPED";
  liveUrl?: string;
  messageId?: string;
  messageStatus?: "SENT" | "PENDING" | "FAILED" | "SKIPPED";
  currentLifecycleStatus: LeadLifecycleStatus;
  error?: string;
}

export interface WorkflowStagesMap {
  scraping: StageExecutionStatus;
  qualifying: StageExecutionStatus;
  storing: StageExecutionStatus;
  website: StageExecutionStatus;
  deployment: StageExecutionStatus;
  whatsapp: StageExecutionStatus;
}

export interface WorkflowStats {
  scraped: number;
  qualified: number;
  stored: number;
  websitesBuilt: number;
  websitesDeployed: number;
  messagesSent: number;
  failedLeads: number;
  durationMs: number;
}

export interface WorkflowError {
  stage: WorkflowStage;
  message: string;
  leadId?: string;
  code?: string;
}

export interface WorkflowExecutionResult {
  success: boolean;
  workflowId: string;
  campaignId: string;
  status: WorkflowStatus;
  mode: "mock" | "real";
  currentStage: WorkflowStage;
  resumable: boolean;
  failedStage?: WorkflowStage;
  stages: WorkflowStagesMap;
  stats: WorkflowStats;
  leadResults: LeadWorkflowResult[];
  errors: WorkflowError[];
  startedAt: string;
  completedAt?: string;
}

export interface OrchestratorApiRequest {
  action?: "start" | "resume" | "cancel" | "status";
  workflowId?: string;
  campaignId?: string;
  locations?: string[];
  categories?: string[];
  maxItems?: number;
  offset?: number;
  excludeExternalIds?: string[];
  mode?: "mock" | "real";
  concurrency?: number;
  dryRun?: boolean;
  skipOutreach?: boolean;
}

export interface OrchestratorApiResponse {
  success: boolean;
  agent: "orchestrator";
  action: "start" | "resume" | "cancel" | "status";
  workflowId?: string;
  status?: WorkflowStatus;
  result?: WorkflowExecutionResult;
  error?: string;
}
