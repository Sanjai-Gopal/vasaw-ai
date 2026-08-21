-- VASAW AI — Initial Database Schema
-- Run via: supabase db reset or migrate up

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- campaigns table
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  lead_target INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'draft',
  progress INTEGER NOT NULL DEFAULT 0,
  leads_collected INTEGER NOT NULL DEFAULT 0,
  leads_qualified INTEGER NOT NULL DEFAULT 0,
  websites_built INTEGER NOT NULL DEFAULT 0,
  websites_deployed INTEGER NOT NULL DEFAULT 0,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  minimum_rating NUMERIC NOT NULL DEFAULT 4.0,
  minimum_reviews INTEGER NOT NULL DEFAULT 25,
  website_opportunity_requirement BOOLEAN NOT NULL DEFAULT true,
  social_presence_requirement BOOLEAN NOT NULL DEFAULT false,
  automation_mode TEXT NOT NULL DEFAULT 'semi-automatic',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable row-level security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read campaigns
CREATE POLICY "Allow read access to campaigns" ON campaigns
  FOR SELECT TO authenticated USING (true);

-- Create policy for service role to manage campaigns
CREATE POLICY "Allow full access to campaigns via service role" ON campaigns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- leads table
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  rating NUMERIC NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0,
  website TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  ai_score INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT,
  source_record_id TEXT,
  apify_run_id TEXT,
  apify_dataset_id TEXT,
  ai_score_json JSONB DEFAULT '{"score": 0, "priority": "medium", "websiteOpportunity": false, "confidence": 0, "factors": [], "reason": ""}',
  qualification_json JSONB DEFAULT '{"hasWebsite": false, "websiteQuality": 0, "hasWhatsApp": true, "hasReviews": true, "responseLikelihood": "medium", "notes": ""}',
  opportunity_json JSONB DEFAULT '{"score": 0, "priority": "medium", "websiteOpportunity": false, "confidence": 0, "factors": [], "reason": ""}',
  website_status TEXT NOT NULL DEFAULT 'not_started',
  quality_status TEXT NOT NULL DEFAULT 'not_started',
  deployment_status TEXT NOT NULL DEFAULT 'not_started',
  outreach_status TEXT NOT NULL DEFAULT 'not_ready',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to leads" ON leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to leads via service role" ON leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- agent_runs table
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT false,
  error TEXT,
  detail TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to agent_runs" ON agent_runs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to agent_runs via service role" ON agent_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- websites table
-- ============================================================
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  template TEXT NOT NULL DEFAULT 'default',
  pages INTEGER NOT NULL DEFAULT 1,
  sections INTEGER NOT NULL DEFAULT 0,
  build_progress INTEGER NOT NULL DEFAULT 0,
  preview_url TEXT,
  live_url TEXT,
  repo_url TEXT,
  commit_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  built_at TIMESTAMPTZ
);

ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to websites" ON websites
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to websites via service role" ON websites
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- deployments table
-- ============================================================
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  provider TEXT NOT NULL DEFAULT 'vercel',
  environment TEXT NOT NULL DEFAULT 'production',
  live_url TEXT,
  commit_hash TEXT,
  duration_sec INTEGER DEFAULT 0,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to deployments" ON deployments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to deployments via service role" ON deployments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- messages table
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound',
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'prepared',
  reply_classification TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to messages" ON messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to messages via service role" ON messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- conversations table
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to conversations" ON conversations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to conversations via service role" ON conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- automations table
-- ============================================================
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'scheduled',
  schedule TEXT,
  cron TEXT,
  active BOOLEAN NOT NULL DEFAULT false,
  last_run TIMESTAMPTZ,
  last_status TEXT,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to automations" ON automations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to automations via service role" ON automations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- automation_runs table
-- ============================================================
CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT false,
  error TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to automation_runs" ON automation_runs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to automation_runs via service role" ON automation_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- activities table
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  type TEXT NOT NULL DEFAULT 'system',
  status TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to activities" ON activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to activities via service role" ON activities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- provider_attempts table
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT,
  task TEXT NOT NULL DEFAULT 'general',
  success BOOLEAN NOT NULL DEFAULT false,
  latency_ms INTEGER DEFAULT 0,
  error_kind TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE provider_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to provider_attempts" ON provider_attempts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to provider_attempts via service role" ON provider_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- jobs table (resumable job queue)
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  current_step TEXT NOT NULL DEFAULT 'step_1',
  attempt INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  provider TEXT,
  model TEXT,
  last_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to jobs" ON jobs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to jobs via service role" ON jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_websites_lead_id ON websites(lead_id);
CREATE INDEX IF NOT EXISTS idx_deployments_website_id ON deployments(website_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_lead_id ON jobs(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id ON agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_activities_campaign_id ON activities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_provider_attempts_job_id ON provider_attempts(job_id);

-- ==========================================================--
-- View: campaign_leads_summary
-- ============================================================
CREATE OR REPLACE VIEW campaign_leads_summary AS
SELECT
  c.id AS campaign_id,
  c.name AS campaign_name,
  c.status AS campaign_status,
  c.lead_target,
  c.leads_collected,
  c.leads_qualified,
  c.websites_built,
  c.websites_deployed,
  COUNT(l.id) AS total_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'qualified') AS qualified_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'website_building') AS website_building_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'website_deployed') AS deployed_leads
FROM campaigns c
LEFT JOIN leads l ON c.id = l.campaign_id
GROUP BY c.id, c.name, c.status, c.lead_target, c.leads_collected, c.leads_qualified, c.websites_built, c.websites_deployed;

-- Create view: lead_pipeline_status
CREATE OR REPLACE VIEW lead_pipeline_status AS
SELECT
  l.id AS lead_id,
  l.business_name,
  l.category,
  l.location,
  l.status,
  l.ai_score,
  l.priority,
  l.website_status,
  l.quality_status,
  l.deployment_status,
  l.outreach_status,
  w.live_url,
  w.status AS website_status,
  w.build_progress,
  m.content AS latest_message,
  m.status AS message_status,
  m.reply_classification
FROM leads l
LEFT JOIN websites w ON l.id = w.lead_id
LEFT JOIN (
  SELECT lead_id, content, status, reply_classification,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY lead_id ORDER BY created_at DESC) AS rn
  FROM messages
) m ON l.id = m.lead_id AND m.rn = 1
ORDER BY l.ai_score DESC NULLS LAST;