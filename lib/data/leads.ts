import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";

export async function getLeads(): Promise<Lead[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  return (data ?? []).map(mapLeadFromDb);
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

function mapLeadFromDb(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    businessName: row.business_name as string,
    category: row.category as string,
    location: row.location as string,
    rating: row.rating as number,
    reviews: row.reviews as number,
    website: row.website as string | null,
    phone: row.phone as string,
    email: row.email as string | undefined,
    aiScore: row.ai_score as number,
    priority: row.priority as Lead["priority"],
    status: row.status as Lead["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    scraped: row.scraped_json as Lead["scraped"] ?? {
      address: "",
      phone: "",
      rating: 0,
      reviews: 0,
      category: "",
      services: [],
      source: "",
      scrapedAt: "",
    },
    qualification: row.qualification_json as Lead["qualification"] ?? {
      hasWebsite: false,
      websiteQuality: 0,
      hasWhatsApp: false,
      hasReviews: false,
      responseLikelihood: "low",
      notes: "",
    },
    opportunity: row.opportunity_json as Lead["opportunity"] ?? {
      score: 0,
      priority: "low",
      reasons: [],
      estimatedValue: 0,
    },
  };
}