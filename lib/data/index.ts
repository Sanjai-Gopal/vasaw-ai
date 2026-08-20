import type { DashboardStats, PipelineStage, Notification } from "@/lib/types";
import { agents } from "@/lib/data/agents";
import { leads } from "@/lib/data/leads";
import { websites, deployments } from "@/lib/data/websites";
import { messages } from "@/lib/data/messages";

const daysAgo = (days: number, hour = 10, minute = 30) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const minutesAgo = (minutes: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
};

export function getDashboardStats(): DashboardStats {
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

export function getPipeline(): PipelineStage[] {
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

export function getNotifications(): Notification[] {
  return [
    {
      id: "n1",
      title: "Website deployed",
      description: "annapurna-restaurant.vercel.app is now live.",
      timestamp: minutesAgo(8),
      read: false,
      type: "deployment",
    },
    {
      id: "n2",
      title: "34 businesses qualified",
      description: "Checking Agent qualified the latest batch from Saibaba Colony.",
      timestamp: minutesAgo(12),
      read: false,
      type: "lead",
    },
    {
      id: "n3",
      title: "Website build in progress",
      description: "Trendz Unisex Salon — 64% complete.",
      timestamp: minutesAgo(35),
      read: true,
      type: "website",
    },
    {
      id: "n4",
      title: "Reply received",
      description: "Kovai Iron Gym replied — interested in pricing.",
      timestamp: minutesAgo(45),
      read: true,
      type: "message",
    },
    {
      id: "n5",
      title: "Agent health warning",
      description: "WhatsApp Agent session expired — needs reconnection.",
      timestamp: daysAgo(1, 16),
      read: true,
      type: "agent",
    },
  ];
}
