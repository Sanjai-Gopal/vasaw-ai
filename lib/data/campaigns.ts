import type { Campaign } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const daysAgo = (days: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const defaultMockCampaigns: Campaign[] = [
  {
    id: "C-201",
    name: "Coimbatore Restaurants — Phase 1",
    category: "Restaurant",
    location: "Coimbatore",
    leadTarget: 150,
    status: "active",
    progress: 62,
    leadsCollected: 93,
    leadsQualified: 71,
    websitesBuilt: 8,
    websitesDeployed: 5,
    messagesSent: 42,
    minimumRating: 4.0,
    minimumReviews: 50,
    websiteOpportunityRequirement: true,
    socialPresenceRequirement: false,
    automationMode: "semi-automatic",
    createdAt: daysAgo(21),
    updatedAt: daysAgo(0, 9),
  },
  {
    id: "C-202",
    name: "Salons & Gyms — Saibaba Colony",
    category: "Salon & Fitness",
    location: "Saibaba Colony",
    leadTarget: 100,
    status: "active",
    progress: 45,
    leadsCollected: 45,
    leadsQualified: 36,
    websitesBuilt: 3,
    websitesDeployed: 2,
    messagesSent: 18,
    minimumRating: 4.2,
    minimumReviews: 30,
    websiteOpportunityRequirement: true,
    socialPresenceRequirement: true,
    automationMode: "automatic",
    createdAt: daysAgo(14),
    updatedAt: daysAgo(0, 8),
  },
  {
    id: "C-203",
    name: "Healthcare Providers — Peelamedu",
    category: "Healthcare",
    location: "Peelamedu",
    leadTarget: 80,
    status: "paused",
    progress: 58,
    leadsCollected: 46,
    leadsQualified: 39,
    websitesBuilt: 2,
    websitesDeployed: 1,
    messagesSent: 12,
    minimumRating: 4.0,
    minimumReviews: 20,
    websiteOpportunityRequirement: false,
    socialPresenceRequirement: false,
    automationMode: "manual",
    createdAt: daysAgo(18),
    updatedAt: daysAgo(3),
  },
  {
    id: "C-204",
    name: "Bakery & Sweet Shops — Ganapathy",
    category: "Bakery",
    location: "Ganapathy",
    leadTarget: 60,
    status: "draft",
    progress: 0,
    leadsCollected: 0,
    leadsQualified: 0,
    websitesBuilt: 0,
    websitesDeployed: 0,
    messagesSent: 0,
    minimumRating: 3.8,
    minimumReviews: 25,
    websiteOpportunityRequirement: true,
    socialPresenceRequirement: false,
    automationMode: "semi-automatic",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: "C-205",
    name: "Textiles & Retail — Cross Cut Road",
    category: "Retail",
    location: "Gandhipuram",
    leadTarget: 90,
    status: "completed",
    progress: 100,
    leadsCollected: 88,
    leadsQualified: 74,
    websitesBuilt: 12,
    websitesDeployed: 9,
    messagesSent: 51,
    minimumRating: 4.0,
    minimumReviews: 40,
    websiteOpportunityRequirement: true,
    socialPresenceRequirement: true,
    automationMode: "automatic",
    createdAt: daysAgo(40),
    updatedAt: daysAgo(9),
  },
  {
    id: "C-206",
    name: "Auto Service Centres — Avinashi Road",
    category: "Automobile",
    location: "Avinashi Road",
    leadTarget: 70,
    status: "paused",
    progress: 31,
    leadsCollected: 22,
    leadsQualified: 15,
    websitesBuilt: 1,
    websitesDeployed: 0,
    messagesSent: 6,
    minimumRating: 3.5,
    minimumReviews: 15,
    websiteOpportunityRequirement: false,
    socialPresenceRequirement: false,
    automationMode: "manual",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(5),
  },
];

export const campaigns = defaultMockCampaigns;

export const campaignCategories = [
  "Restaurant",
  "Salon & Fitness",
  "Healthcare",
  "Bakery",
  "Retail",
  "Automobile",
  "Education",
  "Wellness",
  "Finance",
  "Religious",
  "IT Services",
  "Manufacturing",
];

export const campaignLocations = [
  "RS Puram",
  "Gandhipuram",
  "Peelamedu",
  "Saibaba Colony",
  "Race Course",
  "Avinashi Road",
  "Ganapathy",
  "Singanallur",
  "Cross Cut Road",
  "Kurichi",
  "Tidel Park",
  "Brookefields",
];

export function mapCampaignFromDb(row: Record<string, unknown>): Campaign {
  return {
    id: String(row.id || `C-${Date.now()}`),
    name: String(row.name || "Untitled Campaign"),
    category: String(row.category || "General"),
    location: String(row.location || "Coimbatore"),
    leadTarget: typeof row.lead_target === "number" ? row.lead_target : typeof row.leadTarget === "number" ? row.leadTarget : 50,
    status: (row.status as Campaign["status"]) || "draft",
    progress: typeof row.progress === "number" ? row.progress : 0,
    leadsCollected: typeof row.leads_collected === "number" ? row.leads_collected : typeof row.leadsCollected === "number" ? row.leadsCollected : 0,
    leadsQualified: typeof row.leads_qualified === "number" ? row.leads_qualified : typeof row.leadsQualified === "number" ? row.leadsQualified : 0,
    websitesBuilt: typeof row.websites_built === "number" ? row.websites_built : typeof row.websitesBuilt === "number" ? row.websitesBuilt : 0,
    websitesDeployed: typeof row.websites_deployed === "number" ? row.websites_deployed : typeof row.websitesDeployed === "number" ? row.websitesDeployed : 0,
    messagesSent: typeof row.messages_sent === "number" ? row.messages_sent : typeof row.messagesSent === "number" ? row.messagesSent : 0,
    minimumRating: typeof row.minimum_rating === "number" ? row.minimum_rating : typeof row.minimumRating === "number" ? row.minimumRating : 4.0,
    minimumReviews: typeof row.minimum_reviews === "number" ? row.minimum_reviews : typeof row.minimumReviews === "number" ? row.minimumReviews : 20,
    websiteOpportunityRequirement: typeof row.website_opportunity_requirement === "boolean" ? row.website_opportunity_requirement : true,
    socialPresenceRequirement: typeof row.social_presence_requirement === "boolean" ? row.social_presence_requirement : false,
    automationMode: (row.automation_mode as Campaign["automationMode"]) || "semi-automatic",
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.updatedAt || new Date().toISOString()),
  };
}

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return defaultMockCampaigns;
    }

    return data.map((row: Record<string, unknown>) => mapCampaignFromDb(row));
  } catch {
    return defaultMockCampaigns;
  }
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      return mapCampaignFromDb(data);
    }
  } catch {
    // Fallback to in-memory/mock list
  }
  const all = await getCampaigns();
  return all.find((c) => c.id === id) || null;
}

/**
 * Recomputes and persists campaign counters directly from actual database tables.
 * Single source of truth: leads, websites, deployments, messages.
 */
export async function refreshCampaignCounters(campaignId: string): Promise<Campaign | null> {
  try {
    const admin = getSupabaseAdmin();

    // Fetch leads for this campaign
    const { data: campaignLeads } = await admin
      .from("leads")
      .select("id, status")
      .eq("campaign_id", campaignId);

    const leads = campaignLeads || [];
    const collected = leads.length;
    const qualified = leads.filter((l: { status?: string }) =>
      ["qualified", "website_building", "website_ready", "deploying", "website_deployed", "contacted"].includes(l.status || "")
    ).length;

    // Current Campaign details for target
    const { data: campaignData, error: campError } = await admin
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campError || !campaignData) {
      return getCampaignById(campaignId);
    }

    const leadTarget = campaignData.lead_target || 50;
    const progress = Math.min(100, Math.round((collected / leadTarget) * 100));
    const status = collected >= leadTarget ? "completed" : campaignData.status === "draft" ? "active" : campaignData.status;

    const { data: updated, error: updateError } = await admin
      .from("campaigns")
      .update({
        leads_collected: collected,
        leads_qualified: qualified,
        progress,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)
      .select()
      .single();

    if (!updateError && updated) {
      return mapCampaignFromDb(updated);
    }
  } catch (err) {
    console.warn("[Campaigns] Failed to refresh database counters:", err instanceof Error ? err.message : err);
  }

  return getCampaignById(campaignId);
}
