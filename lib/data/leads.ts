import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";

export async function getLeads(): Promise<Lead[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return (data ?? []).map(mapLeadFromDb);
  } catch {
    return [];
  }
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapLeadFromDb(data);
}

export async function getLeadsByStatus(status: string): Promise<Lead[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch leads by status: ${error.message}`);
  }

  return (data ?? []).map(mapLeadFromDb);
}

export async function getLeadsByCampaign(campaignId: string): Promise<Lead[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch leads by campaign: ${error.message}`);
  }

  return (data ?? []).map(mapLeadFromDb);
}

export function mapLeadFromDb(row: Record<string, unknown>): Lead {
  return {
    id: (row.id as string) || "",
    businessName: (row.business_name as string) || (row.businessName as string) || (row.name as string) || "Unknown Business",
    category: (row.category as string) || "General",
    location: (row.location as string) || (row.city as string) || "",
    rating: typeof row.rating === "number" ? row.rating : Number(row.rating) || 0,
    reviews: typeof row.reviews === "number" ? row.reviews : Number(row.reviews) || 0,
    website: (row.website as string | null) || null,
    phone: (row.phone as string) || "",
    email: (row.email as string | undefined) || undefined,
    aiScore: typeof row.ai_score === "number" ? row.ai_score : typeof row.aiScore === "number" ? row.aiScore : Number(row.ai_score ?? row.aiScore) || 0,
    priority: (row.priority as Lead["priority"]) || "medium",
    status: (row.status as Lead["status"]) || "new",
    createdAt: (row.created_at as string) || (row.createdAt as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || (row.updatedAt as string) || new Date().toISOString(),
    scraped: (row.scraped_json as Lead["scraped"]) || (row.scraped as Lead["scraped"]) || {
      address: (row.address as string) || (row.location as string) || "",
      phone: (row.phone as string) || "",
      rating: Number(row.rating) || 0,
      reviews: Number(row.reviews) || 0,
      category: (row.category as string) || "",
      services: [],
      source: (row.source as string) || "google_maps",
      scrapedAt: (row.created_at as string) || new Date().toISOString(),
    },
    qualification: (row.qualification_json as Lead["qualification"]) || (row.qualification as Lead["qualification"]) || {
      hasWebsite: Boolean(row.website),
      websiteQuality: 0,
      hasWhatsApp: false,
      hasReviews: Number(row.reviews) > 0,
      responseLikelihood: "low",
      notes: "",
    },
    opportunity: (row.opportunity_json as Lead["opportunity"]) || (row.opportunity as Lead["opportunity"]) || {
      score: Number(row.ai_score ?? row.aiScore) || 0,
      priority: (row.priority as Lead["priority"]) || "medium",
      reasons: [],
      estimatedValue: 0,
    },
    source_mode: ((row.qualification_json as Record<string, unknown>)?.source_mode as ("mock" | "live")) || ((row.source as string)?.toLowerCase().includes("mock") ? "mock" : "live"),
    is_synthetic: ((row.qualification_json as Record<string, unknown>)?.is_synthetic as boolean) ?? ((row.source as string)?.toLowerCase().includes("mock") ? true : false),
    campaignLocation: ((row.qualification_json as Record<string, unknown>)?.campaignLocation as string) || (row.location as string) || undefined,
    normalizedLocation: ((row.qualification_json as Record<string, unknown>)?.normalizedLocation as string) || undefined,
  };
}