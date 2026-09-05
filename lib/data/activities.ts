import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { ActivityItem, Connection } from "@/lib/types";

export async function getRecentActivity(limit = 50): Promise<ActivityItem[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch activities: ${error.message}`);
  }

  return (data ?? []).map(mapActivityFromDb);
}

export async function getActivityByLead(leadId: string): Promise<ActivityItem[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch activities by lead: ${error.message}`);
  }

  return (data ?? []).map(mapActivityFromDb);
}

function mapActivityFromDb(row: Record<string, unknown>): ActivityItem {
  return {
    id: row.id as string,
    timestamp: row.created_at as string,
    actor: row.actor as string,
    type: row.type as ActivityItem["type"],
    status: row.status as ActivityItem["status"],
    title: row.title as string,
    description: row.description as string | undefined,
  };
}

export async function getConnections(): Promise<Connection[]> {
  // Connections are configuration-based, not stored in DB
  // In production, these would come from a config table or env validation
  return getStaticConnections();
}

function getStaticConnections(): Connection[] {
  const outreachMode = (process.env.OUTREACH_MODE || "disabled").toLowerCase();
  const isApifyConfigured = Boolean(process.env.APIFY_API_TOKEN);
  const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const isVercelConfigured = Boolean(process.env.VERCEL_TOKEN);
  const isWhatsAppConfigured = Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  const isSheetsConfigured = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);

  return [
    {
      id: "apify",
      name: "Apify",
      description: "Business data scraping from Google Maps.",
      status: isApifyConfigured ? "connected" : "not_connected",
      lastSync: new Date().toISOString(),
      config: [
        { key: "Actor", value: process.env.APIFY_ACTOR_ID || "nwua9Gu5YrADL7ZDj" },
        { key: "Token", value: isApifyConfigured ? "Configured (Server-side)" : "Not Configured" },
      ],
      plan: "Pay-as-you-go",
    },
    {
      id: "supabase",
      name: "Supabase",
      description: "Postgres database, storage and auth for leads.",
      status: isSupabaseConfigured ? "connected" : "not_connected",
      lastSync: new Date().toISOString(),
      config: [
        { key: "Project", value: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured" : "Local / Offline" },
        { key: "Region", value: "ap-south-1" },
      ],
      plan: "Pro",
    },
    {
      id: "vercel",
      name: "Vercel",
      description: "Builds and deploys websites to production.",
      status: isVercelConfigured ? "connected" : "not_connected",
      config: [
        { key: "Team", value: process.env.VERCEL_TEAM_ID || "personal" },
        { key: "Token", value: isVercelConfigured ? "Configured (Server-side)" : "Not Configured" },
      ],
      plan: "Pro",
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      description: "Message sending, delivery tracking and reply classification.",
      status: outreachMode === "disabled" ? "not_connected" : isWhatsAppConfigured ? "connected" : "not_connected",
      config: [
        { key: "Outreach Mode", value: outreachMode.toUpperCase() },
        { key: "Phone Number ID", value: process.env.WHATSAPP_PHONE_NUMBER_ID || "Not Configured" },
      ],
      plan: "Cloud API",
    },
    {
      id: "google_sheets",
      name: "Google Sheets",
      description: "Operational spreadsheet synchronization and data export layer.",
      status: isSheetsConfigured ? "connected" : "not_connected",
      config: [
        { key: "Spreadsheet ID", value: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "Not Configured" },
        { key: "Service Account", value: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "Not Configured" },
      ],
      plan: "Google Cloud API",
    },
  ];
}