import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { PipelineStage, ActivityItem, AgentStatus } from "@/lib/types";

const agentDescriptions: Record<string, string> = {
  scraping: "Discovers businesses on Google Maps using Apify and extracts name, category, rating, reviews, contact and location data.",
  checking: "Validates scraped data, checks if the business already has a website and qualifies it against VASAW's target criteria.",
  storage: "Normalizes and persists leads, campaigns and activity records into Supabase tables with deduplication.",
  "website-building": "Generates tailored single-page websites per lead using AI — layout, copy, brand colors and sections.",
  deployment: "Pushes generated sites to a GitHub repository and deploys them to Vercel production.",
  whatsapp: "Drafts and sends personalized WhatsApp messages, tracks delivery and classifies replies.",
};

const agentStatusMap: Record<string, AgentStatus> = {
  scraping: "healthy",
  checking: "healthy",
  storage: "healthy",
  "website-building": "running",
  deployment: "healthy",
  whatsapp: "idle",
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    const [
      { data: campaigns, error: campaignsError },
      { data: leads, error: leadsError },
      { data: websites, error: websitesError },
      { data: deployments, error: deploymentsError },
      { data: messages, error: messagesError },
      { data: activities, error: activitiesError },
    ] = await Promise.all([
      admin.from("campaigns").select("*"),
      admin.from("leads").select("*"),
      admin.from("websites").select("*"),
      admin.from("deployments").select("*"),
      admin.from("messages").select("*"),
      admin.from("activities").select("*").order("timestamp", { ascending: false }).limit(20),
    ]);

    if (campaignsError) throw campaignsError;
    if (leadsError) throw leadsError;
    if (websitesError) throw websitesError;
    if (deploymentsError) throw deploymentsError;
    if (messagesError) throw messagesError;
    if (activitiesError) throw activitiesError;

    const totalLeads = leads?.length ?? 0;
    const qualifiedLeads = leads?.filter((l) => l.status === "qualified").length ?? 0;
    const websitesGenerated = websites?.filter((w) => w.status !== "queued").length ?? 0;
    const websitesDeployed = websites?.filter((w) => w.status === "deployed").length ?? 0;
    const messagesSent = messages?.filter((m) => m.status !== "prepared" && m.status !== "failed").length ?? 0;
    const interestedLeads = leads?.filter((l) => 
      l.status === "interested" || 
      l.status === "website_building" || 
      l.status === "website_deployed" || 
      l.status === "won"
    ).length ?? 0;

    const byDate: Record<string, number> = {};
    for (const lead of leads ?? []) {
      const createdAt = lead.created_at || lead.createdAt;
      const d = createdAt ? new Date(createdAt) : new Date();
      const date = isNaN(d.getTime())
        ? "Recent"
        : d.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          });
      byDate[date] = (byDate[date] ?? 0) + 1;
    }
    const weeklyLeads = Object.entries(byDate)
      .slice(0, 7)
      .reverse()
      .map(([label, count]) => ({ label, leads: count }));

    const catCount: Record<string, number> = {};
    for (const lead of leads ?? []) {
      const cat = lead.category || "General";
      catCount[cat] = (catCount[cat] ?? 0) + 1;
    }
    const categoryDistribution = Object.entries(catCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const pipelineStages: PipelineStage[] = [
      {
        id: "scraping",
        label: "Scraping",
        agentName: "Scraping Agent",
        description: agentDescriptions.scraping,
        status: agentStatusMap.scraping,
        completed: totalLeads > 0 ? Math.min(100, Math.round((leads?.filter((l) => l.status !== "new").length ?? 0) / totalLeads * 100)) : 0,
      },
      {
        id: "checking",
        label: "Checking",
        agentName: "Checking Agent",
        description: agentDescriptions.checking,
        status: agentStatusMap.checking,
        completed: totalLeads > 0 ? Math.min(100, Math.round((leads?.filter((l) => l.status === "qualified" || l.status === "rejected").length ?? 0) / totalLeads * 100)) : 0,
      },
      {
        id: "storage",
        label: "Storage",
        agentName: "Storage Agent",
        description: agentDescriptions.storage,
        status: agentStatusMap.storage,
        completed: totalLeads > 0 ? 100 : 0,
      },
      {
        id: "website-building",
        label: "Website Building",
        agentName: "Website Building Agent",
        description: agentDescriptions["website-building"],
        status: agentStatusMap["website-building"],
        completed: websitesGenerated > 0 ? Math.min(100, Math.round((websites?.filter((w) => w.status === "built" || w.status === "deployed").length ?? 0) / Math.max(1, qualifiedLeads) * 100)) : 0,
      },
      {
        id: "deployment",
        label: "Deployment",
        agentName: "Deployment Agent",
        description: agentDescriptions.deployment,
        status: agentStatusMap.deployment,
        completed: websitesDeployed > 0 ? Math.min(100, Math.round((deployments?.filter((d) => d.status === "deployed").length ?? 0) / Math.max(1, websitesGenerated) * 100)) : 0,
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        agentName: "WhatsApp Agent",
        description: agentDescriptions.whatsapp,
        status: agentStatusMap.whatsapp,
        completed: messagesSent > 0 ? 100 : 0,
      },
    ];

    const formattedActivities: ActivityItem[] = (activities ?? []).map((a) => ({
      id: a.id,
      timestamp: a.timestamp,
      actor: a.actor,
      type: a.type as ActivityItem["type"],
      status: a.status as ActivityItem["status"],
      title: a.title,
      description: a.description ?? undefined,
    }));

    return NextResponse.json({
      ok: true,
      stats: {
        totalLeads,
        qualifiedLeads,
        websitesGenerated,
        websitesDeployed,
        messagesSent,
        interestedLeads,
        weeklyLeads,
        categoryDistribution,
        pipeline: pipelineStages,
        campaigns: campaigns?.length ?? 0,
        activeCampaigns: campaigns?.filter((c) => c.status === "active").length ?? 0,
      },
      recentActivity: formattedActivities,
    });
  } catch (err) {
    console.error("[API] Dashboard stats error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}