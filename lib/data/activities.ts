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
  return [
    {
      id: "apify",
      name: "Apify",
      description: "Business data scraping from Google Maps.",
      status: "connected",
      lastSync: new Date().toISOString(),
      config: [
        { key: "Actor", value: "nwua9Gu5YrADL7ZDj" },
      ],
      plan: "Pay-as-you-go",
    },
    {
      id: "supabase",
      name: "Supabase",
      description: "Postgres database, storage and auth for leads.",
      status: "connected",
      lastSync: new Date().toISOString(),
      config: [
        { key: "Project", value: "vumaeodrcxylyrtgpeep" },
        { key: "Region", value: "ap-south-1" },
      ],
      plan: "Pro",
    },
    {
      id: "github",
      name: "GitHub",
      description: "Repository hosting for generated websites.",
      status: process.env.GITHUB_TOKEN ? "connected" : "not_connected",
      config: [
        { key: "Owner", value: "Sanjai-Gopal" },
      ],
      plan: "Free",
    },
    {
      id: "vercel",
      name: "Vercel",
      description: "Builds and deploys websites to production.",
      status: process.env.VERCEL_TOKEN ? "connected" : "not_connected",
      config: [
        { key: "Team", value: process.env.VERCEL_TEAM_ID || "personal" },
      ],
      plan: "Pro",
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      description: "Message sending, delivery tracking and reply classification.",
      status: process.env.WHATSAPP_ACCESS_TOKEN ? "connected" : "not_connected",
      config: [
        { key: "Phone Number ID", value: process.env.WHATSAPP_PHONE_NUMBER_ID || "not configured" },
      ],
      plan: "Cloud API",
    },
  ];
}