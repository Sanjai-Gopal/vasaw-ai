import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Website, Deployment } from "@/lib/types";

export async function getWebsites(): Promise<Website[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("websites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch websites: ${error.message}`);
  }

  return (data ?? []).map(mapWebsiteFromDb);
}

export async function getWebsiteById(id: string): Promise<Website | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("websites")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapWebsiteFromDb(data);
}

export async function getWebsitesByLead(leadId: string): Promise<Website[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("websites")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch websites by lead: ${error.message}`);
  }

  return (data ?? []).map(mapWebsiteFromDb);
}

export async function getWebsitesByStatus(status: string): Promise<Website[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("websites")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch websites by status: ${error.message}`);
  }

  return (data ?? []).map(mapWebsiteFromDb);
}

export async function getDeployments(): Promise<Deployment[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("deployments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch deployments: ${error.message}`);
  }

  return (data ?? []).map(mapDeploymentFromDb);
}

export async function getDeploymentsByLead(leadId: string): Promise<Deployment[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("deployments")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch deployments by lead: ${error.message}`);
  }

  return (data ?? []).map(mapDeploymentFromDb);
}

export async function getDeploymentById(id: string): Promise<Deployment | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("deployments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapDeploymentFromDb(data);
}

function mapWebsiteFromDb(row: Record<string, unknown>): Website {
  return {
    id: row.id as string,
    leadId: row.lead_id as string,
    businessName: row.business_name as string,
    category: row.category as string,
    location: row.location as string,
    status: row.status as Website["status"],
    template: row.template as string,
    pages: row.pages as number,
    sections: row.sections as number,
    buildProgress: row.build_progress as number,
    previewUrl: row.preview_url as string | undefined,
    liveUrl: row.live_url as string | undefined,
    repoUrl: row.repo_url as string | undefined,
    commitHash: row.commit_hash as string | undefined,
    createdAt: row.created_at as string,
    builtAt: row.built_at as string | undefined,
  };
}

function mapDeploymentFromDb(row: Record<string, unknown>): Deployment {
  return {
    id: row.id as string,
    websiteId: row.website_id as string,
    leadId: row.lead_id as string,
    businessName: row.business_name as string,
    status: row.status as Deployment["status"],
    provider: row.provider as "vercel",
    environment: row.environment as "production",
    liveUrl: row.live_url as string | undefined,
    commitHash: row.commit_hash as string | undefined,
    durationSec: row.duration_sec as number,
    deployedAt: row.deployed_at as string | undefined,
    createdAt: row.created_at as string,
  };
}