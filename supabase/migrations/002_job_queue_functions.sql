-- VASAW AI — Job Queue Functions
-- Run via Supabase Dashboard SQL Editor after initial schema

-- Fix uuid extension name
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Function: claim_next_job
-- Atomically claims the next QUEUED job for a worker
-- ============================================================
CREATE OR REPLACE FUNCTION claim_next_job(
  p_types TEXT[],
  p_worker_id TEXT
)
RETURNS SETOF jobs
LANGUAGE plpgsql
AS $$
DECLARE
  job_record jobs%ROWTYPE;
BEGIN
  -- Use FOR UPDATE SKIP LOCKED to atomically claim a job
  FOR job_record IN
    SELECT * FROM jobs
    WHERE status = 'QUEUED'
      AND type = ANY(p_types)
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Update the job to RUNNING
    UPDATE jobs
    SET status = 'RUNNING',
        current_step = 'step_1',
        attempt = attempt + 1,
        updated_at = now()
    WHERE id = job_record.id;

    RETURN NEXT job_record;
    EXIT; -- Only claim one job
  END LOOP;

  RETURN;
END;
$$;

-- ============================================================
-- Function: update_lead_status
-- Validates and updates lead status with proper transitions
-- ============================================================
CREATE OR REPLACE FUNCTION update_lead_status(
  p_lead_id UUID,
  p_new_status TEXT,
  p_actor TEXT DEFAULT 'system'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  valid_transition BOOLEAN := FALSE;
  old_status TEXT;
BEGIN
  -- Get current status
  SELECT status INTO old_status FROM leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead % not found', p_lead_id;
  END IF;

  -- Validate transition
  valid_transition := CASE
    -- NEW -> SCRAPED
    WHEN old_status = 'new' AND p_new_status = 'scraped' THEN TRUE
    -- SCRAPED -> CHECKING
    WHEN old_status = 'scraped' AND p_new_status = 'checking' THEN TRUE
    -- CHECKING -> QUALIFIED / REJECTED
    WHEN old_status = 'checking' AND p_new_status IN ('qualified', 'rejected') THEN TRUE
    -- QUALIFIED -> WEBSITE_BUILDING
    WHEN old_status = 'qualified' AND p_new_status = 'website_building' THEN TRUE
    -- WEBSITE_BUILDING -> WEBSITE_READY (mapped to website_deployed in schema)
    WHEN old_status = 'website_building' AND p_new_status = 'website_deployed' THEN TRUE
    -- WEBSITE_DEPLOYED -> QUALITY_CHECKING (quality_status column)
    WHEN old_status = 'website_deployed' AND p_new_status = 'quality_checking' THEN TRUE
    -- QUALITY_CHECKING -> QUALITY_PASSED / QUALITY_FAILED
    WHEN old_status = 'quality_checking' AND p_new_status IN ('quality_passed', 'quality_failed') THEN TRUE
    -- QUALITY_PASSED -> DEPLOYING
    WHEN old_status = 'quality_passed' AND p_new_status = 'deploying' THEN TRUE
    -- DEPLOYING -> DEPLOYED
    WHEN old_status = 'deploying' AND p_new_status = 'deployed' THEN TRUE
    -- DEPLOYED -> READY_FOR_OUTREACH
    WHEN old_status = 'deployed' AND p_new_status = 'ready_for_outreach' THEN TRUE
    -- READY_FOR_OUTREACH -> CONTACTED
    WHEN old_status = 'ready_for_outreach' AND p_new_status = 'contacted' THEN TRUE
    -- CONTACTED -> REPLIED
    WHEN old_status = 'contacted' AND p_new_status = 'replied' THEN TRUE
    -- REPLIED -> INTERESTED / NOT_INTERESTED / STOPPED
    WHEN old_status = 'replied' AND p_new_status IN ('interested', 'not_interested', 'stopped') THEN TRUE
    -- Any status -> REJECTED (rejection is always valid)
    WHEN p_new_status = 'rejected' THEN TRUE
    -- Any status -> CANCELLED (cancellation is always valid)
    WHEN p_new_status = 'cancelled' THEN TRUE
    ELSE FALSE
  END;

  IF NOT valid_transition THEN
    RAISE EXCEPTION 'Invalid status transition: % -> %', old_status, p_new_status;
  END IF;

  -- Update lead
  UPDATE leads
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_lead_id;

  -- Log activity
  INSERT INTO activities (lead_id, actor, type, status, title, description)
  VALUES (p_lead_id, p_actor, 'lead', 'info', 'Status changed', format('%s -> %s', old_status, p_new_status));

  RETURN TRUE;
END;
$$;

-- ============================================================
-- Function: upsert_lead
-- Idempotent upsert for leads with deduplication
-- Priority: phone > normalized_website > source/place_id > normalized_name+address
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_lead(
  p_campaign_id UUID,
  p_business_name TEXT,
  p_category TEXT,
  p_location TEXT,
  p_rating NUMERIC,
  p_reviews INTEGER,
  p_phone TEXT,
  p_email TEXT,
  p_website TEXT,
  p_address TEXT,
  p_source TEXT,
  p_source_record_id TEXT,
  p_apify_run_id TEXT,
  p_apify_dataset_id TEXT,
  p_raw_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  lead_id UUID;
  normalized_website TEXT;
  normalized_phone TEXT;
  normalized_name TEXT;
BEGIN
  -- Normalize phone (remove non-digits)
  normalized_phone := regexp_replace(p_phone, '\D', '', 'g');
  
  -- Normalize website (lowercase, remove protocol/www)
  normalized_website := CASE
    WHEN p_website IS NOT NULL AND p_website != '' THEN
      lower(regexp_replace(p_website, '^https?://(www\.)?', ''))
    ELSE NULL
  END;
  
  -- Normalize business name (lowercase, trim)
  normalized_name := lower(trim(p_business_name));

  -- Try to find existing lead by phone (highest priority)
  IF normalized_phone != '' THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE regexp_replace(phone, '\D', '', 'g') = normalized_phone
    LIMIT 1;
  END IF;

  -- Try by normalized website
  IF lead_id IS NULL AND normalized_website IS NOT NULL THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE lower(regexp_replace(website, '^https?://(www\.)?', '')) = normalized_website
    LIMIT 1;
  END IF;

  -- Try by source record ID
  IF lead_id IS NULL AND p_source_record_id IS NOT NULL THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE source_record_id = p_source_record_id
    LIMIT 1;
  END IF;

  -- Try by normalized name + address
  IF lead_id IS NULL AND p_address IS NOT NULL THEN
    SELECT id INTO lead_id
    FROM leads
    WHERE lower(trim(business_name)) = normalized_name
      AND lower(address) = lower(p_address)
    LIMIT 1;
  END IF;

  -- Upsert
  IF lead_id IS NOT NULL THEN
    -- Update existing
    UPDATE leads
    SET campaign_id = COALESCE(p_campaign_id, campaign_id),
        business_name = p_business_name,
        category = p_category,
        location = p_location,
        rating = p_rating,
        reviews = p_reviews,
        phone = p_phone,
        email = COALESCE(p_email, email),
        website = p_website,
        source = COALESCE(p_source, source),
        source_record_id = COALESCE(p_source_record_id, source_record_id),
        apify_run_id = COALESCE(p_apify_run_id, apify_run_id),
        apify_dataset_id = COALESCE(p_apify_dataset_id, apify_dataset_id),
        updated_at = now()
    WHERE id = lead_id;
  ELSE
    -- Insert new
    INSERT INTO leads (
      campaign_id, business_name, category, location, rating, reviews,
      phone, email, website, source, source_record_id,
      apify_run_id, apify_dataset_id
    ) VALUES (
      p_campaign_id, p_business_name, p_category, p_location, p_rating, p_reviews,
      p_phone, p_email, p_website, p_source, p_source_record_id,
      p_apify_run_id, p_apify_dataset_id
    )
    RETURNING id INTO lead_id;
  END IF;

  -- Log activity
  INSERT INTO activities (lead_id, campaign_id, actor, type, status, title, description)
  VALUES (lead_id, p_campaign_id, 'storage-agent', 'lead', 'info', 'Lead upserted', format('Lead %s upserted from %s', p_business_name, p_source));

  RETURN lead_id;
END;
$$;

-- ============================================================
-- Function: log_provider_attempt
-- Records AI provider attempt for observability
-- ============================================================
CREATE OR REPLACE FUNCTION log_provider_attempt(
  p_job_id UUID,
  p_provider TEXT,
  p_model TEXT,
  p_task TEXT,
  p_success BOOLEAN,
  p_latency_ms INTEGER,
  p_error_kind TEXT,
  p_error_message TEXT,
  p_retry_count INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  attempt_id UUID;
BEGIN
  INSERT INTO provider_attempts (
    job_id, provider, model, task, success, latency_ms,
    error_kind, error_message, retry_count
  ) VALUES (
    p_job_id, p_provider, p_model, p_task, p_success, p_latency_ms,
    p_error_kind, p_error_message, p_retry_count
  ) RETURNING id INTO attempt_id;

  RETURN attempt_id;
END;
$$;

-- ============================================================
-- Index for claim_next_job performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_jobs_status_type_created ON jobs(status, type, created_at)
WHERE status = 'QUEUED';

-- ============================================================
-- View: job_status_summary
-- ============================================================
CREATE OR REPLACE VIEW job_status_summary AS
SELECT
  type,
  status,
  COUNT(*) AS count,
  AVG(attempt) AS avg_attempt,
  MAX(attempt) AS max_attempt,
  COUNT(*) FILTER (WHERE last_error IS NOT NULL) AS with_errors
FROM jobs
GROUP BY type, status
ORDER BY type, status;