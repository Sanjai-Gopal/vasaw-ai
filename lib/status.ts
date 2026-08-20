import type {
  AgentStatus,
  CampaignStatus,
  LeadStatus,
  MessageStatus,
  WebsiteStatus,
  DeploymentStatus,
} from "@/lib/types";

export const leadStatusMeta: Record<LeadStatus, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info" | "muted" }> = {
  new: { label: "New", variant: "info" },
  scraped: { label: "Scraped", variant: "muted" },
  qualified: { label: "Qualified", variant: "secondary" },
  contacted: { label: "Contacted", variant: "warning" },
  interested: { label: "Interested", variant: "info" },
  website_building: { label: "Building Site", variant: "default" },
  website_deployed: { label: "Site Deployed", variant: "success" },
  won: { label: "Won", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export const campaignStatusMeta: Record<CampaignStatus, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info" | "muted" }> = {
  draft: { label: "Draft", variant: "muted" },
  active: { label: "Active", variant: "success" },
  paused: { label: "Paused", variant: "warning" },
  completed: { label: "Completed", variant: "info" },
};

export const agentStatusMeta: Record<AgentStatus, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info" | "muted" }> = {
  healthy: { label: "Healthy", variant: "success" },
  running: { label: "Running", variant: "info" },
  idle: { label: "Idle", variant: "muted" },
  error: { label: "Attention", variant: "destructive" },
  paused: { label: "Paused", variant: "warning" },
};

export const websiteStatusMeta: Record<WebsiteStatus, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info" | "muted" }> = {
  queued: { label: "Queued", variant: "muted" },
  building: { label: "Building", variant: "info" },
  built: { label: "Built", variant: "secondary" },
  deployed: { label: "Deployed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
};

export const deploymentStatusMeta: Record<DeploymentStatus, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info" | "muted" }> = {
  queued: { label: "Queued", variant: "muted" },
  building: { label: "Building", variant: "info" },
  deployed: { label: "Deployed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
};

export const messageStatusMeta: Record<MessageStatus, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info" | "muted" }> = {
  prepared: { label: "Prepared", variant: "muted" },
  sent: { label: "Sent", variant: "info" },
  delivered: { label: "Delivered", variant: "secondary" },
  read: { label: "Read", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

export const replyClassMeta = {
  interested: { label: "Interested", variant: "success" as const },
  not_interested: { label: "Not Interested", variant: "destructive" as const },
  asking_questions: { label: "Asking Questions", variant: "info" as const },
  no_reply: { label: "No Reply", variant: "muted" as const },
};