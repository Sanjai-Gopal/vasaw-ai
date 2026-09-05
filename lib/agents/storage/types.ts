import { Lead } from "@/lib/agents/scraping/types";
import { QualificationResult } from "@/lib/agents/qualification/types";

export interface Campaign {
  id: string;
  name: string;
  category: string;
  location: string;
  leadTarget: number;
  status: "draft" | "active" | "paused" | "completed";
  progress: number;
  leadsCollected: number;
  leadsQualified: number;
  websitesBuilt: number;
  websitesDeployed: number;
  messagesSent: number;
  minimumRating: number;
  minimumReviews: number;
  websiteOpportunityRequirement: boolean;
  socialPresenceRequirement: boolean;
  automationMode: "manual" | "semi-automatic" | "automatic";
  createdAt: string;
  updatedAt: string;
}

export interface LeadRecord extends Omit<Lead, "city"> {
  campaignId: string;
  location: string;
  aiScore: number;
  priority: "high" | "medium" | "low";
  status: "new" | "scraped" | "checking" | "qualified" | "rejected" | "website_building" | "website_deployed" | "won" | "rejected";
  email: string | null;
  aiScoreJson: Record<string, unknown>;
  qualificationJson: Record<string, unknown>;
  opportunityJson: Record<string, unknown>;
  websiteStatus: string;
  qualityStatus: string;
  deploymentStatus: string;
  outreachStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedLead {
  id: string;
  campaignId: string;
  businessName: string;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  phone: string;
  website: string | null;
  address: string;
  city: string;
  socialLinks: string[];
  source: string;
  scrapedAt: string;
  externalId?: string;
  aiScore: number;
  priority: "high" | "medium" | "low";
  status: "new" | "scraped" | "checking" | "qualified" | "contacted" | "interested" | "website_building" | "website_deployed" | "won" | "rejected";
  email: string | null;
  aiScoreJson: Record<string, unknown>;
  qualificationJson: Record<string, unknown>;
  opportunityJson: Record<string, unknown>;
  websiteStatus: string;
  qualityStatus: string;
  deploymentStatus: string;
  outreachStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveLeadsRequest {
  campaignId: string;
  leads: Lead[];
  apifyRunId?: string;
  apifyDatasetId?: string;
}

export interface SaveLeadsResponse {
  success: boolean;
  totalProcessed: number;
  inserted: number;
  updated: number;
  duplicates: number;
  leadIds: string[];
  errors: Array<{ leadId: string; error: string }>;
}

export interface SaveQualificationRequest {
  campaignId: string;
  results: QualificationResult[];
}

export interface SaveQualificationResponse {
  success: boolean;
  updated: number;
  errors: Array<{ leadId: string; error: string }>;
}

export interface UpdateLeadStatusRequest {
  leadId: string;
  status: SavedLead["status"];
}

export interface UpdateLeadStatusResponse {
  success: boolean;
  leadId: string;
  previousStatus: string;
  newStatus: string;
}

export interface AgentRun {
  id: string;
  agentId: string;
  status: "idle" | "running" | "success" | "failed" | "paused";
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number;
  success: boolean;
  error: string | null;
  detail: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RecordAgentRunRequest {
  agentId: string;
  status: AgentRun["status"];
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  success?: boolean;
  error?: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}

export interface RecordAgentRunResponse {
  success: boolean;
  runId: string;
}

export interface GetLeadsRequest {
  campaignId?: string;
  status?: SavedLead["status"];
  limit?: number;
  offset?: number;
}

export interface GetLeadsResponse {
  success: boolean;
  leads: SavedLead[];
  total: number;
}

export interface GetCampaignsResponse {
  success: boolean;
  campaigns: Campaign[];
}

export interface SavedWebsite {
  id: string;
  leadId: string;
  businessName: string;
  category: string;
  location: string;
  status: "queued" | "building" | "built" | "deployed" | "failed";
  template: string;
  pages: number;
  sections: number;
  buildProgress: number;
  previewUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  commitHash?: string;
  createdAt: string;
  builtAt?: string;
}

export interface SaveWebsiteRequest {
  id?: string;
  leadId: string;
  businessName: string;
  category: string;
  location: string;
  status?: "queued" | "building" | "built" | "deployed" | "failed";
  template: string;
  pages?: number;
  sections?: number;
  buildProgress?: number;
  previewUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  commitHash?: string;
  builtAt?: string;
}

export interface SaveWebsiteResponse {
  success: boolean;
  website: SavedWebsite;
}

export interface GetWebsitesRequest {
  leadId?: string;
  status?: SavedWebsite["status"];
  limit?: number;
}

export interface GetWebsitesResponse {
  success: boolean;
  websites: SavedWebsite[];
  total: number;
}

export interface SavedDeployment {
  id: string;
  websiteId: string;
  leadId: string;
  businessName: string;
  status: "queued" | "building" | "deployed" | "failed" | "canceled";
  provider: "mock" | "vercel" | "github";
  environment: "production" | "preview";
  liveUrl?: string;
  commitHash?: string;
  durationSec: number;
  deployedAt?: string;
  createdAt: string;
}

export interface SaveDeploymentRequest {
  id?: string;
  websiteId: string;
  leadId: string;
  businessName: string;
  status?: "queued" | "building" | "deployed" | "failed" | "canceled";
  provider?: "mock" | "vercel" | "github";
  environment?: "production" | "preview";
  liveUrl?: string;
  commitHash?: string;
  durationSec?: number;
  deployedAt?: string;
}

export interface SaveDeploymentResponse {
  success: boolean;
  deployment: SavedDeployment;
}

export interface GetDeploymentsRequest {
  websiteId?: string;
  leadId?: string;
  status?: SavedDeployment["status"];
  provider?: string;
  limit?: number;
}

export interface GetDeploymentsResponse {
  success: boolean;
  deployments: SavedDeployment[];
  total: number;
}

export interface SavedMessage {
  id: string;
  leadId: string;
  businessName: string;
  direction: "outbound" | "inbound";
  channel: "whatsapp" | "email" | "sms";
  content: string;
  status: "prepared" | "sent" | "delivered" | "read" | "failed";
  replyClassification?: "interested" | "price_request" | "call_request" | "follow_up" | "not_interested" | "stop" | "unknown";
  sentAt?: string;
  createdAt: string;
}

export interface SaveMessageRequest {
  id?: string;
  leadId: string;
  businessName: string;
  direction?: "outbound" | "inbound";
  channel?: "whatsapp" | "email" | "sms";
  content: string;
  status?: "prepared" | "sent" | "delivered" | "read" | "failed";
  replyClassification?: SavedMessage["replyClassification"];
  sentAt?: string;
}

export interface SaveMessageResponse {
  success: boolean;
  message: SavedMessage;
}

export interface GetMessagesRequest {
  leadId?: string;
  status?: SavedMessage["status"];
  direction?: SavedMessage["direction"];
  limit?: number;
}

export interface GetMessagesResponse {
  success: boolean;
  messages: SavedMessage[];
  total: number;
}

export interface UpdateMessageStatusRequest {
  messageId: string;
  status: SavedMessage["status"];
  replyClassification?: SavedMessage["replyClassification"];
  sentAt?: string;
}

export interface UpdateMessageStatusResponse {
  success: boolean;
  messageId: string;
  status: SavedMessage["status"];
}

export interface StorageError {
  code: string;
  message: string;
  details?: unknown;
}