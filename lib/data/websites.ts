import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Website, Deployment } from "@/lib/types";

export async function getWebsites(): Promise<Website[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("websites")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return (data ?? []).map(mapWebsiteFromDb);
  } catch {
    return [];
  }
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

export function mapWebsiteFromDb(row: Record<string, unknown>): Website {
  return {
    id: (row.id as string) || "",
    leadId: (row.lead_id as string) || (row.leadId as string) || "",
    businessName: (row.business_name as string) || (row.businessName as string) || "Untitled Website",
    category: (row.category as string) || "General",
    location: (row.location as string) || "",
    status: (row.status as Website["status"]) || "queued",
    template: (row.template as string) || "default",
    pages: typeof row.pages === "number" ? row.pages : Number(row.pages) || 1,
    sections: typeof row.sections === "number" ? row.sections : Number(row.sections) || 0,
    buildProgress: typeof row.build_progress === "number" ? row.build_progress : typeof row.buildProgress === "number" ? row.buildProgress : Number(row.build_progress ?? row.buildProgress) || 0,
    previewUrl: (row.preview_url as string | undefined) || (row.previewUrl as string | undefined),
    liveUrl: (row.live_url as string | undefined) || (row.liveUrl as string | undefined),
    repoUrl: (row.repo_url as string | undefined) || (row.repoUrl as string | undefined),
    commitHash: (row.commit_hash as string | undefined) || (row.commitHash as string | undefined),
    createdAt: (row.created_at as string) || (row.createdAt as string) || new Date().toISOString(),
    builtAt: (row.built_at as string | undefined) || (row.builtAt as string | undefined),
  };
}

export function mapDeploymentFromDb(row: Record<string, unknown>): Deployment {
  return {
    id: (row.id as string) || "",
    websiteId: (row.website_id as string) || (row.websiteId as string) || "",
    leadId: (row.lead_id as string) || (row.leadId as string) || "",
    businessName: (row.business_name as string) || (row.businessName as string) || "Untitled Website",
    status: (row.status as Deployment["status"]) || "queued",
    provider: (row.provider as "vercel") || "vercel",
    environment: (row.environment as "production") || "production",
    liveUrl: (row.live_url as string | undefined) || (row.liveUrl as string | undefined),
    commitHash: (row.commit_hash as string | undefined) || (row.commitHash as string | undefined),
    durationSec: typeof row.duration_sec === "number" ? row.duration_sec : Number(row.duration_sec) || 0,
    deployedAt: (row.deployed_at as string | undefined) || (row.deployedAt as string | undefined),
    createdAt: (row.created_at as string) || (row.createdAt as string) || new Date().toISOString(),
  };
}