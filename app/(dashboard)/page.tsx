"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Star,
  Globe,
  Rocket,
  MessageSquare,
  Heart,
  ArrowRight,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Loader2,
  Pause,
  LayoutGrid,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PipelineVisual } from "@/components/dashboard/pipeline-visual";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { LeadsAreaChart, CategoryPieChart } from "@/components/dashboard/charts";
import { CommandCenterView } from "@/components/dashboard/command-center-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { agents } from "@/lib/data/agents";
import { agentStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { PipelineStage, ActivityItem as ActivityItemType, AgentStatus } from "@/lib/types";

interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  websitesGenerated: number;
  websitesDeployed: number;
  messagesSent: number;
  interestedLeads: number;
  weeklyLeads: Array<{ label: string; leads: number }>;
  categoryDistribution: Array<{ name: string; value: number }>;
  pipeline: PipelineStage[];
  campaigns: number;
  activeCampaigns: number;
}

interface ActivityItemLocal {
  id: string;
  timestamp: string;
  actor: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning, Sanjai";
  if (hour < 17) return "Good afternoon, Sanjai";
  return "Good evening, Sanjai";
}

const agentIcon: Record<AgentStatus, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  online: CheckCircle2,
  running: Loader2,
  idle: Circle,
  error: AlertTriangle,
  paused: Pause,
  offline: Circle,
};

const agentColor: Record<AgentStatus, string> = {
  healthy: "text-emerald-400",
  online: "text-emerald-400",
  running: "text-primary",
  idle: "text-muted-foreground",
  error: "text-rose-400",
  paused: "text-amber-400",
  offline: "text-zinc-500",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItemLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"command" | "overview">("command");

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      const data = await response.json();
      if (data.ok) {
        setStats(data.stats);
        setActivities(data.recentActivity);
      } else {
        setError(data.error || "Failed to fetch dashboard data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-8">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse bg-slate-100 rounded-xl border border-slate-200" />
            ))}
          </div>
          <div className="h-44 animate-pulse bg-slate-100 rounded-xl border border-slate-200 mt-6" />
          <div className="grid gap-4 lg:grid-cols-12 mt-6">
            <div className="h-64 animate-pulse bg-slate-100 rounded-xl border border-slate-200 lg:col-span-7" />
            <div className="h-64 animate-pulse bg-slate-100 rounded-xl border border-slate-200 lg:col-span-5" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Failed to load dashboard</h2>
          <p className="text-muted-foreground mt-2">{error || "Unknown error"}</p>
          <p className="text-xs text-muted-foreground mt-4">
            Run the Supabase GRANT migration and ingestion pipeline first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* View Switcher Bar */}
      <div className="mx-auto max-w-[1520px] px-4 sm:px-8 pt-4 flex items-center justify-between">
        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100/90 border border-slate-200/80 text-[11.5px] font-medium font-sans">
          <button
            onClick={() => setViewMode("command")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md transition-all",
              viewMode === "command"
                ? "bg-white text-blue-700 shadow-xs font-semibold border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Elevated Command Center</span>
          </button>
          <button
            onClick={() => setViewMode("overview")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md transition-all",
              viewMode === "overview"
                ? "bg-white text-blue-700 shadow-xs font-semibold border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Analytics &amp; Grid</span>
          </button>
        </div>
      </div>

      {viewMode === "command" ? (
        <CommandCenterView stats={stats} activities={activities} onRefresh={fetchData} />
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <PageHeader
            title={getGreeting()}
            description="Here's what VASAW AI is working on today."
          >
            <Button variant="outline" asChild className="gap-1.5">
              <Link href="/agents">
                View agents
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/campaigns">Create campaign</Link>
            </Button>
          </PageHeader>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              index={0}
              title="Total leads"
              value={String(stats.totalLeads)}
              delta={stats.totalLeads > 0 ? 100 : 0}
              icon={Users}
              accent="primary"
            />
            <StatCard
              index={1}
              title="Qualified leads"
              value={String(stats.qualifiedLeads)}
              delta={stats.qualifiedLeads > 0 ? 100 : 0}
              icon={Star}
              accent="success"
            />
            <StatCard
              index={2}
              title="Websites generated"
              value={String(stats.websitesGenerated)}
              delta={stats.websitesGenerated > 0 ? 100 : 0}
              icon={Globe}
              accent="info"
            />
            <StatCard
              index={3}
              title="Websites deployed"
              value={String(stats.websitesDeployed)}
              delta={stats.websitesDeployed > 0 ? 100 : 0}
              icon={Rocket}
              accent="warning"
            />
            <StatCard
              index={4}
              title="Messages sent"
              value={String(stats.messagesSent)}
              delta={stats.messagesSent > 0 ? 100 : 0}
              icon={MessageSquare}
              accent="destructive"
            />
            <StatCard
              index={5}
              title="Interested leads"
              value={String(stats.interestedLeads)}
              delta={stats.interestedLeads > 0 ? 100 : 0}
              icon={Heart}
              accent="success"
            />
          </div>

          <div className="mt-6">
            <Card className="p-5">
              <CardHeader className="p-0 pb-4">
                <CardTitle>Automation pipeline</CardTitle>
                <CardDescription>
                  Scraping → Checking → Storage → Website Building → Deployment → WhatsApp
                </CardDescription>
              </CardHeader>
              <PipelineVisual stages={stats.pipeline} />
            </Card>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <CardHeader className="p-0 pb-4">
                <CardTitle>Leads acquired</CardTitle>
                <CardDescription>New leads collected over the last 7 batches</CardDescription>
              </CardHeader>
              <LeadsAreaChart data={stats.weeklyLeads} />
            </Card>

            <Card className="p-5">
              <CardHeader className="p-0 pb-4">
                <CardTitle>By category</CardTitle>
                <CardDescription>Current lead distribution</CardDescription>
              </CardHeader>
              <CategoryPieChart data={stats.categoryDistribution} />
              <div className="mt-2 space-y-1.5">
                {stats.categoryDistribution.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: [
                            "#8b5cf6",
                            "#22d3ee",
                            "#34d399",
                            "#fbbf24",
                          ][i % 4],
                        }}
                      />
                      {c.name}
                    </span>
                    <span className="font-medium">{c.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Live feed from your agents</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityFeed items={activities as ActivityItemType[]} limit={8} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Agent health</CardTitle>
                <CardDescription>Status of all six agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {agents.map((agent) => {
                    const meta = agentStatusMeta[agent.status];
                    const Icon = agentIcon[agent.status];
                    return (
                      <Link
                        key={agent.id}
                        href="/agents"
                        className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              agentColor[agent.status],
                              agent.status === "running" && "animate-spin"
                            )}
                          />
                          <div>
                            <p className="text-sm font-medium">{agent.shortName} Agent</p>
                            <p className="text-[11px] text-muted-foreground">
                              {agent.successRuns} runs succeeded
                            </p>
                          </div>
                        </div>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </Link>
                    );
                  })}
                </div>
                <Link
                  href="/agents"
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Bot className="h-3.5 w-3.5" />
                  Manage all agents
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}