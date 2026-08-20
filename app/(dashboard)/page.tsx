"use client";

import Link from "next/link";
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
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PipelineVisual } from "@/components/dashboard/pipeline-visual";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { LeadsAreaChart, CategoryPieChart } from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { agents } from "@/lib/data/agents";
import { recentActivity } from "@/lib/data/activities";
import { getDashboardStats, getPipeline } from "@/lib/data";
import { agentStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/types";

const agentIcon: Record<AgentStatus, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  running: Loader2,
  idle: Circle,
  error: AlertTriangle,
  paused: Pause,
};

const agentColor: Record<AgentStatus, string> = {
  healthy: "text-emerald-400",
  running: "text-primary",
  idle: "text-muted-foreground",
  error: "text-rose-400",
  paused: "text-amber-400",
};

export default function DashboardPage() {
  const stats = getDashboardStats();
  const pipeline = getPipeline();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Good morning, Gogul"
        description="Here's what VASAW AI did while you were away."
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
          delta={18}
          icon={Users}
          accent="primary"
        />
        <StatCard
          index={1}
          title="Qualified leads"
          value={String(stats.qualifiedLeads)}
          delta={12}
          icon={Star}
          accent="success"
        />
        <StatCard
          index={2}
          title="Websites generated"
          value={String(stats.websitesGenerated)}
          delta={8}
          icon={Globe}
          accent="info"
        />
        <StatCard
          index={3}
          title="Websites deployed"
          value={String(stats.websitesDeployed)}
          delta={6}
          icon={Rocket}
          accent="warning"
        />
        <StatCard
          index={4}
          title="Messages sent"
          value={String(stats.messagesSent)}
          delta={9}
          icon={MessageSquare}
          accent="destructive"
        />
        <StatCard
          index={5}
          title="Interested leads"
          value={String(stats.interestedLeads)}
          delta={11}
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
          <PipelineVisual stages={pipeline} />
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
            <ActivityFeed items={recentActivity} limit={8} />
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
  );
}