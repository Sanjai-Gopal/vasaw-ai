export type LeadStatus =
  | "new"
  | "scraped"
  | "qualified"
  | "contacted"
  | "interested"
  | "website_building"
  | "website_deployed"
  | "won"
  | "rejected";

export type LeadPriority = "high" | "medium" | "low";

export type ActivityStatus = "success" | "error" | "info" | "pending";

export type ActivityType =
  | "lead"
  | "campaign"
  | "website"
  | "deployment"
  | "message"
  | "agent"
  | "system";

export interface ActivityItem {
  id: string;
  timestamp: string;
  actor: string;
  type: ActivityType;
  status: ActivityStatus;
  title: string;
  description?: string;
}

export interface ScrapedInfo {
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
}

export interface Qualification {
  hasWebsite: boolean;
  websiteQuality: number;
  hasWhatsApp: boolean;
  hasReviews: boolean;
  responseLikelihood: "high" | "medium" | "low";
  notes: string;
}

export interface Opportunity {
  score: number;
  priority: LeadPriority;
  reasons: string[];
  estimatedValue: number;
}

export interface Lead {
  id: string;
  businessName: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  website: string | null;
  phone: string;
  email?: string;
  aiScore: number;
  priority: LeadPriority;
  status: LeadStatus;
  scraped: ScrapedInfo;
  qualification: Qualification;
  opportunity: Opportunity;
  createdAt: string;
  updatedAt: string;
}

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export type AutomationMode = "manual" | "semi-automatic" | "automatic";

export interface Campaign {
  id: string;
  name: string;
  category: string;
  location: string;
  leadTarget: number;
  status: CampaignStatus;
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
  automationMode: AutomationMode;
  createdAt: string;
  updatedAt: string;
}

export type AgentId =
  | "scraping"
  | "checking"
  | "storage"
  | "website-building"
  | "deployment"
  | "whatsapp";

export type AgentStatus = "idle" | "running" | "healthy" | "error" | "paused" | "online" | "offline";

export interface AgentRun {
  id: string;
  timestamp: string;
  status: "success" | "failed" | "running";
  durationMs: number;
  detail: string;
}

export interface Agent {
  id: AgentId;
  name: string;
  shortName: string;
  description: string;
  status: AgentStatus;
  lastRun: string;
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  avgDurationMs: number;
  recentActivity: ActivityItem[];
  runs: AgentRun[];
}

export type WebsiteStatus = "queued" | "building" | "built" | "deployed" | "failed";

export interface Website {
  id: string;
  leadId: string;
  businessName: string;
  category: string;
  location: string;
  status: WebsiteStatus;
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

export type DeploymentStatus = "queued" | "building" | "deployed" | "failed";

export interface Deployment {
  id: string;
  websiteId: string;
  leadId: string;
  businessName: string;
  status: DeploymentStatus;
  provider: "vercel";
  environment: "production";
  liveUrl?: string;
  commitHash?: string;
  durationSec: number;
  deployedAt?: string;
  createdAt: string;
}

export type MessageDirection = "outbound" | "inbound";

export type MessageStatus = "prepared" | "sent" | "delivered" | "read" | "failed";

export type ReplyClassification =
  | "interested"
  | "price_request"
  | "call_request"
  | "follow_up"
  | "not_interested"
  | "stop"
  | "unknown";

export interface Message {
  id: string;
  leadId: string;
  businessName: string;
  direction: MessageDirection;
  channel: "whatsapp";
  content: string;
  status: MessageStatus;
  replyClassification?: ReplyClassification;
  sentAt?: string;
  createdAt: string;
}

export interface JobRun {
  id: string;
  timestamp: string;
  status: "success" | "failed" | "skipped";
  durationMs: number;
  detail?: string;
}

export type JobType =
  | "scrape_daily"
  | "check_leads"
  | "qualify_leads"
  | "build_websites"
  | "deploy_websites"
  | "send_messages"
  | "sync_storage";

export interface ScheduledJob {
  id: string;
  name: string;
  description: string;
  type: JobType;
  schedule: string;
  cron: string;
  active: boolean;
  lastRun?: string;
  lastStatus?: JobRun["status"];
  nextRun: string;
  runHistory: JobRun[];
}

export type ConnectionStatus = "connected" | "not_connected" | "connecting" | "error";

export type ConnectionId = "apify" | "supabase" | "openai" | "github" | "vercel" | "whatsapp";

export interface Connection {
  id: ConnectionId;
  name: string;
  description: string;
  status: ConnectionStatus;
  lastSync?: string;
  config: Array<{ key: string; value: string }>;
  plan: string;
}

export interface PipelineStage {
  id: AgentId;
  label: string;
  agentName: string;
  description: string;
  status: AgentStatus;
  completed: number;
}

export interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  websitesGenerated: number;
  websitesDeployed: number;
  messagesSent: number;
  interestedLeads: number;
  weeklyLeads: Array<{ label: string; leads: number }>;
  categoryDistribution: Array<{ name: string; value: number }>;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: ActivityType;
}
