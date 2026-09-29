-- Persistent workflow definitions and execution traces for the Automation Studio.
-- This migration is additive; legacy automations keep their existing metadata.

ALTER TABLE automations
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workflow_data JSONB,
  ADD COLUMN IF NOT EXISTS execution_mode TEXT NOT NULL DEFAULT 'dry_run',
  ADD COLUMN IF NOT EXISTS webhook_secret_hash TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE automations
  DROP CONSTRAINT IF EXISTS automations_execution_mode_check;
ALTER TABLE automations
  ADD CONSTRAINT automations_execution_mode_check
    CHECK (execution_mode IN ('dry_run', 'live'));

ALTER TABLE automation_runs
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS trigger_source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS execution_mode TEXT NOT NULL DEFAULT 'dry_run',
  ADD COLUMN IF NOT EXISTS input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS output_data JSONB,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS cancel_requested_at TIMESTAMPTZ;
ALTER TABLE automation_runs
  ADD COLUMN IF NOT EXISTS steps_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE automation_runs
  DROP CONSTRAINT IF EXISTS automation_runs_execution_mode_check;
ALTER TABLE automation_runs
  ADD CONSTRAINT automation_runs_execution_mode_check
    CHECK (execution_mode IN ('dry_run', 'live'));

CREATE UNIQUE INDEX IF NOT EXISTS automation_runs_idempotency_key_idx
  ON automation_runs (automation_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS automation_runs_owner_created_idx
  ON automation_runs (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS automations_owner_updated_idx
  ON automations (owner_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS automation_run_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  node_name TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'preview', 'skipped', 'error', 'cancelled')),
  attempt INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  message TEXT,
  input_data JSONB,
  output_data JSONB,
  error TEXT,
  UNIQUE (run_id, node_id)
);

CREATE INDEX IF NOT EXISTS automation_run_steps_run_idx
  ON automation_run_steps (run_id, step_index);
CREATE INDEX IF NOT EXISTS automation_run_steps_owner_idx
  ON automation_run_steps (owner_user_id, started_at DESC);

ALTER TABLE automation_run_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_run_steps_read_own" ON automation_run_steps;
CREATE POLICY "automation_run_steps_read_own"
  ON automation_run_steps FOR SELECT TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "automation_run_steps_service_role" ON automation_run_steps;
CREATE POLICY "automation_run_steps_service_role"
  ON automation_run_steps FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "automations_read_own_or_org" ON automations;
DROP POLICY IF EXISTS "Allow read access to automations" ON automations;
CREATE POLICY "automations_read_own_or_org"
  ON automations FOR SELECT TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "automations_write_own_or_org" ON automations;
CREATE POLICY "automations_write_own_or_org"
  ON automations FOR ALL TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "automation_runs_read_own_or_org" ON automation_runs;
DROP POLICY IF EXISTS "Allow read access to automation_runs" ON automation_runs;
CREATE POLICY "automation_runs_read_own_or_org"
  ON automation_runs FOR SELECT TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "automation_runs_write_own_or_org" ON automation_runs;
CREATE POLICY "automation_runs_write_own_or_org"
  ON automation_runs FOR ALL TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
  );

COMMENT ON COLUMN automations.workflow_data IS 'Versioned visual workflow graph stored by Automation Studio.';
COMMENT ON COLUMN automations.execution_mode IS 'dry_run previews only; live requires an explicitly enabled adapter.';

-- Serialize run creation per workflow so overlapping requests cannot execute the
-- same workflow concurrently. The caller uses the service role and still applies
-- owner/organization checks before invoking this function.
CREATE OR REPLACE FUNCTION start_automation_run(
  p_automation_id UUID,
  p_owner_user_id UUID,
  p_organization_id UUID,
  p_trigger_source TEXT,
  p_execution_mode TEXT,
  p_input_data JSONB,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id UUID;
  new_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_automation_id::TEXT, 0));

  SELECT id INTO existing_id
  FROM automation_runs
  WHERE automation_id = p_automation_id
    AND idempotency_key = p_idempotency_key;
  IF existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', existing_id, 'reused', TRUE);
  END IF;

  IF EXISTS (
    SELECT 1 FROM automation_runs
    WHERE automation_id = p_automation_id AND status = 'running'
  ) THEN
    RAISE EXCEPTION 'Workflow already has a run in progress' USING ERRCODE = '55P03';
  END IF;

  INSERT INTO automation_runs (
    automation_id, owner_user_id, organization_id, status, started_at,
    success, trigger_source, execution_mode, input_data, idempotency_key
  ) VALUES (
    p_automation_id, p_owner_user_id, p_organization_id, 'running', now(),
    FALSE, p_trigger_source, p_execution_mode, COALESCE(p_input_data, '{}'::jsonb), p_idempotency_key
  ) RETURNING id INTO new_id;

  RETURN jsonb_build_object('id', new_id, 'reused', FALSE);
END;
$$;

REVOKE ALL ON FUNCTION start_automation_run(UUID, UUID, UUID, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION start_automation_run(UUID, UUID, UUID, TEXT, TEXT, JSONB, TEXT) TO service_role;
