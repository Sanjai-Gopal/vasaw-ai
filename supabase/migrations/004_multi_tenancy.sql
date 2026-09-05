-- VASAW AI — MULTI-TENANCY & ROW LEVEL SECURITY SCHEMA
-- Migration: 004_multi_tenancy.sql

-- 1. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 2. ORGANIZATION MEMBERSHIPS
CREATE TABLE IF NOT EXISTS organization_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;

-- 3. ADD ORGANIZATION_ID TO TENANT ENTITIES
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 4. RLS POLICIES FOR TENANT ISOLATION

-- Helper function to retrieve authenticated user's organization IDs
CREATE OR REPLACE FUNCTION get_user_organization_ids(p_user_id UUID)
RETURNS TABLE (organization_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT om.organization_id
  FROM organization_memberships om
  WHERE om.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organization Memberships Policy
DROP POLICY IF EXISTS "Users can view their organization memberships" ON organization_memberships;
CREATE POLICY "Users can view their organization memberships"
ON organization_memberships FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Campaigns Tenant Isolation Policy
DROP POLICY IF EXISTS "Tenant isolation for campaigns" ON campaigns;
CREATE POLICY "Tenant isolation for campaigns"
ON campaigns FOR ALL TO authenticated
USING (
  organization_id IS NULL OR
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
)
WITH CHECK (
  organization_id IS NULL OR
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
);

-- Leads Tenant Isolation Policy
DROP POLICY IF EXISTS "Tenant isolation for leads" ON leads;
CREATE POLICY "Tenant isolation for leads"
ON leads FOR ALL TO authenticated
USING (
  organization_id IS NULL OR
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
)
WITH CHECK (
  organization_id IS NULL OR
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
);

-- Websites Tenant Isolation Policy
DROP POLICY IF EXISTS "Tenant isolation for websites" ON websites;
CREATE POLICY "Tenant isolation for websites"
ON websites FOR ALL TO authenticated
USING (
  organization_id IS NULL OR
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
)
WITH CHECK (
  organization_id IS NULL OR
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
);

-- Messages Tenant Isolation Policy
DROP POLICY IF EXISTS "Tenant isolation for messages" ON messages;
CREATE POLICY "Tenant isolation for messages"
ON messages FOR ALL TO authenticated
USING (
  organization_id IS NULL OR
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
)
WITH CHECK (
  organization_id IS NULL OR
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
);
