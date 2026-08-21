/**
 * Supabase Database Types - Standalone
 * 
 * Minimal types for VASAW AI database operations.
 * Avoids TypeScript duplicate identifier conflicts by using
 * standalone types rather than a monolithic Database type.
 */

// Standalone status types - each is independent to avoid conflicts
export type LeadStatus = 'new' | 'scraped' | 'checking' | 'qualified' | 'rejected' | 'website_building' | 'website_deployed' | 'won' | 'rejected';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export type WebsiteStatus = 'queued' | 'building' | 'built' | 'deployed' | 'failed';

export type DeploymentStatus = 'queued' | 'building' | 'deployed' | 'failed';

export type MessageStatus = 'prepared' | 'sent' | 'delivered' | 'read' | 'failed';

export type ReplyClassification = 'interested' | 'price_request' | 'call_request' | 'follow_up' | 'not_interested' | 'stop' | 'unknown';

export type AgentStatus = 'idle' | 'running' | 'healthy' | 'error' | 'paused' | 'online' | 'offline';

export type JobStatus = 'QUEUED' | 'RUNNING' | 'PAUSED' | 'RETRY_PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type ConnectionStatus = 'connected' | 'not_connected' | 'connecting' | 'error';

// Minimal table row types - only the fields needed for operations
export interface LeadRow {
  id: string;
  business_name: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  phone: string;
  ai_score: number;
  priority: string;
  status: string;
  website: string | null;
  email: string | null;
}

export interface CampaignRow {
  id: string;
  name: string;
  category: string;
  location: string;
  lead_target: number;
  status: string;
  progress: number;
  leads_collected: number;
  leads_qualified: number;
  websites_built: number;
  websites_deployed: number;
  messages_sent: number;
}

export interface WebsiteRow {
  id: string;
  lead_id: string;
  business_name: string;
  category: string;
  location: string;
  status: string;
  template: string;
  build_progress: number;
  live_url: string | null;
  repo_url: string | null;
}

export interface JobRow {
  id: string;
  type: string;
  lead_id: string | null;
  campaign_id: string | null;
  status: string;
  current_step: string;
  attempt: number;
  max_retries: number;
  provider: string | null;
  model: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}