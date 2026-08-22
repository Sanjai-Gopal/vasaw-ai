import type { DashboardStats, PipelineStage, Notification } from "@/lib/types";
import { agents } from "@/lib/data/agents";
import { getLeads, getLeadsByStatus, getLeadById } from "@/lib/data/leads";
import { getWebsites, getWebsitesByStatus, getDeployments, getDeploymentsByLead, getWebsiteById, getWebsitesByLead } from "@/lib/data/websites";
import { getRecentActivity, getConnections } from "@/lib/data/activities";
import { getMessages, getMessagesByLead } from "@/lib/data/messages";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export { getLeads, getLeadById, getLeadsByStatus };
export { getWebsites, getWebsiteById, getWebsitesByStatus, getWebsitesByLead, getDeployments, getDeploymentsByLead };
export { getMessages, getMessagesByLead };
export { getRecentActivity, getConnections };

export async function getDashboardStats(): Promise<DashboardStats> {
  const [leads, websites, deployments, messages] = await Promise.all([
    getLeads(),
    getWebsites(),
    getDeployments(),
    getMessages(),
  ]);

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(
    (l) => l.status !== "new" && l.status !== "rejected"
  ).length;
  const websitesGenerated = websites.filter((w) => w.status !== "queued").length;
  const websitesDeployed = websites.filter((w) => w.status === "deployed").length;
  const messagesSent = messages.filter((m) => m.status !== "prepared" && m.status !== "failed").length;
  const interestedLeads = leads.filter((l) => l.status === "interested" || l.status === "website_building" || l.status === "website_deployed" || l.status === "won").length;

  const byDate: Record<string, number> = {};
  for (const lead of leads) {
    const date = new Date(lead.createdAt).toLocaleDateString("en-IN", {
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
  for (const lead of leads) {
    catCount[lead.category] = (catCount[lead.category] ?? 0) + 1;
  }
  const categoryDistribution = Object.entries(catCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    totalLeads,
    qualifiedLeads,
    websitesGenerated,
    websitesDeployed,
    messagesSent,
    interestedLeads,
    weeklyLeads,
    categoryDistribution,
  };
}

export async function getPipeline(): Promise<PipelineStage[]> {
  const [leads, websites, deployments, messages] = await Promise.all([
    getLeads(),
    getWebsites(),
    getDeployments(),
    getMessages(),
  ]);

  const order: Array<{ id: PipelineStage["id"]; label: string }> = [
    { id: "scraping", label: "Scraping" },
    { id: "checking", label: "Checking" },
    { id: "storage", label: "Storage" },
    { id: "website-building", label: "Website Building" },
    { id: "deployment", label: "Deployment" },
    { id: "whatsapp", label: "WhatsApp" },
  ];

  return order.map((stage, index) => {
    const agent = agents.find((a) => a.id === stage.id)!;
    const completed = Math.min(
      100,
      Math.round(
        (index === 0 ? leads.length : index === 1 ? leads.filter((l) => l.status !== "new").length : index === 2 ? leads.length : index === 3 ? websites.filter((w) => w.status === "built" || w.status === "deployed").length : index === 4 ? deployments.filter((d) => d.status === "deployed").length : messages.filter((m) => m.status !== "prepared").length) /
          Math.max(1, leads.length) *
          100
      )
    );
    return {
      id: stage.id,
      label: stage.label,
      agentName: agent.name,
      description: agent.description,
      status: agent.status,
      completed,
    };
  });
}

export async function getNotifications(): Promise<Notification[]> {
  const activities = await getRecentActivity(10);
  return activities.map((a, i) => ({
    id: a.id,
    title: a.title,
    description: a.description ?? "",
    timestamp: a.timestamp,
    read: i > 2,
    type: a.type,
  }));
}

async function getMessageStatuses(): Promise<Array<{ status: string }>> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("messages")
    .select("status")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return [];
  }

  return data ?? [];
}