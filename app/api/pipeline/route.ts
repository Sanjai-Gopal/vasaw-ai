import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { agents as defaultAgents } from "@/lib/data/agents";
import type { PipelineStage, AgentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const defaultPipeline: PipelineStage[] = [
  {
    id: "scraping",
    label: "Scraping",
    agentName: "Scraping Agent",
    description: "Discovers businesses on Google Maps and extracts contact & profile data.",
    status: "idle",
    completed: 0,
  },
  {
    id: "checking",
    label: "Checking",
    agentName: "Checking Agent",
    description: "Validates website presence and qualifies potential client leads.",
    status: "idle",
    completed: 0,
  },
  {
    id: "storage",
    label: "Storage",
    agentName: "Storage Agent",
    description: "Normalizes and persists records into database tables.",
    status: "idle",
    completed: 0,
  },
  {
    id: "website-building",
    label: "Website Building",
    agentName: "Website Building Agent",
    description: "Generates tailored single-page websites per qualified lead.",
    status: "idle",
    completed: 0,
  },
  {
    id: "deployment",
    label: "Deployment",
    agentName: "Deployment Agent",
    description: "Pushes generated sites to GitHub and deploys to production.",
    status: "idle",
    completed: 0,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    agentName: "WhatsApp Agent",
    description: "Drafts and dispatches personalized WhatsApp outreach messages.",
    status: "idle",
    completed: 0,
  },
];

export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    const [
      { data: leads },
      { data: websites },
      { data: deployments },
      { data: messages },
      { data: agentRuns },
    ] = await Promise.all([
      admin.from("leads").select("id, status"),
      admin.from("websites").select("id, status"),
      admin.from("deployments").select("id, status"),
      admin.from("messages").select("id, status"),
      admin.from("agent_runs").select("agent_id, status, success").order("created_at", { ascending: false }).limit(50),
    ]);

    const totalLeads = leads?.length ?? 0;
    const qualifiedLeads = leads?.filter((l) => l.status === "qualified" || l.status === "interested" || l.status === "website_building" || l.status === "website_deployed").length ?? 0;
    const websitesGenerated = websites?.filter((w) => w.status !== "queued").length ?? 0;
    const websitesDeployed = websites?.filter((w) => w.status === "deployed").length ?? 0;
    const messagesSent = messages?.filter((m) => m.status !== "prepared" && m.status !== "failed").length ?? 0;

    const getAgentStatus = (agentId: string, hasCompletedWork: boolean): AgentStatus => {
      const runs = (agentRuns ?? []).filter((r) => r.agent_id === agentId);
      if (runs.some((r) => r.status === "running")) return "running";
      if (runs.length > 0) return runs[0].success ? "healthy" : "error";
      return hasCompletedWork ? "healthy" : "idle";
    };

    const stages: PipelineStage[] = [
      {
        id: "scraping",
        label: "Scraping",
        agentName: "Scraping Agent",
        description: defaultAgents.find((a) => a.id === "scraping")?.description ?? "Discovers businesses on Google Maps.",
        status: getAgentStatus("scraping", totalLeads > 0),
        completed: totalLeads > 0 ? Math.min(100, Math.round((leads?.filter((l) => l.status !== "new").length ?? 0) / totalLeads * 100)) : 0,
      },
      {
        id: "checking",
        label: "Checking",
        agentName: "Checking Agent",
        description: defaultAgents.find((a) => a.id === "checking")?.description ?? "Validates website presence and qualifies leads.",
        status: getAgentStatus("checking", qualifiedLeads > 0),
        completed: totalLeads > 0 ? Math.min(100, Math.round((leads?.filter((l) => l.status === "qualified" || l.status === "rejected").length ?? 0) / totalLeads * 100)) : 0,
      },
      {
        id: "storage",
        label: "Storage",
        agentName: "Storage Agent",
        description: defaultAgents.find((a) => a.id === "storage")?.description ?? "Persists leads and campaigns.",
        status: getAgentStatus("storage", totalLeads > 0),
        completed: totalLeads > 0 ? 100 : 0,
      },
      {
        id: "website-building",
        label: "Website Building",
        agentName: "Website Building Agent",
        description: defaultAgents.find((a) => a.id === "website-building")?.description ?? "Synthesizes websites with AI.",
        status: getAgentStatus("website-building", websitesGenerated > 0),
        completed: websitesGenerated > 0 ? Math.min(100, Math.round((websites?.filter((w) => w.status === "built" || w.status === "deployed").length ?? 0) / Math.max(1, qualifiedLeads) * 100)) : 0,
      },
      {
        id: "deployment",
        label: "Deployment",
        agentName: "Deployment Agent",
        description: defaultAgents.find((a) => a.id === "deployment")?.description ?? "Deploys websites to Vercel/GitHub.",
        status: getAgentStatus("deployment", websitesDeployed > 0),
        completed: websitesDeployed > 0 ? Math.min(100, Math.round((deployments?.filter((d) => d.status === "deployed").length ?? 0) / Math.max(1, websitesGenerated) * 100)) : 0,
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        agentName: "WhatsApp Agent",
        description: defaultAgents.find((a) => a.id === "whatsapp")?.description ?? "Sends outreach messages.",
        status: getAgentStatus("whatsapp", messagesSent > 0),
        completed: messagesSent > 0 ? 100 : 0,
      },
    ];

    return NextResponse.json({ ok: true, pipeline: stages });
  } catch (err) {
    console.warn("[API] Pipeline status query fallback to default:", err);
    return NextResponse.json({ ok: true, pipeline: defaultPipeline });
  }
}
