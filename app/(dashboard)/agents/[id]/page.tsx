import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  AlertTriangle,
  Pause,
  Play,
  RotateCcw,
  FileText,
  Activity,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { agents } from "@/lib/data/agents";
import { agentStatusMeta } from "@/lib/status";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/types";

const statusIcon: Record<AgentStatus, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  online: CheckCircle2,
  running: Loader2,
  idle: Circle,
  error: AlertTriangle,
  paused: Pause,
  offline: Circle,
};

function RunStatusBadge({ status }: { status: "success" | "failed" | "running" }) {
  return (
    <Badge variant={status === "success" ? "success" : status === "failed" ? "destructive" : "info"}>
      {status === "success" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : status === "failed" ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {status}
    </Badge>
  );
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = agents.find((a) => a.id === id);
  if (!agent) notFound();

  const meta = agentStatusMeta[agent.status];
  const Icon = statusIcon[agent.status];
  const successRate = agent.totalRuns > 0
    ? Math.round((agent.successRuns / agent.totalRuns) * 100)
    : 0;
  const avgDurationSec = Math.round(agent.avgDurationMs / 1000);
  const recentRuns = agent.runs.slice(0, 10);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to agents
        </Link>
      </div>

      <PageHeader
        title={agent.name}
        description={agent.description}
      >
        <Badge variant={meta.variant}>
          <Icon className={cn("h-3 w-3", agent.status === "running" && "animate-spin")} />
          {meta.label}
        </Badge>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Total runs</p>
          <p className="mt-1 text-3xl font-bold">{agent.totalRuns}</p>
          <p className="mt-1 text-xs text-muted-foreground">All-time executions</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Successful</p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">{agent.successRuns}</p>
          <p className="mt-1 text-xs text-muted-foreground">{successRate}% success rate</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Failed</p>
          <p className="mt-1 text-3xl font-bold text-rose-400">{agent.failedRuns}</p>
          <p className="mt-1 text-xs text-muted-foreground">{agent.totalRuns > 0 ? Math.round((agent.failedRuns / agent.totalRuns) * 100) : 0}% failure rate</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Avg execution</p>
          <p className="mt-1 text-3xl font-bold">{avgDurationSec}s</p>
          <p className="mt-1 text-xs text-muted-foreground">Average run duration</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base">Success rate</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Progress
              value={successRate}
              indicatorClassName={
                successRate >= 90 ? "bg-emerald-500" : successRate >= 75 ? "bg-amber-500" : "bg-rose-500"
              }
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {agent.successRuns} succeeded out of {agent.totalRuns} runs
            </p>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base">Last run</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm font-medium">{formatDateTime(agent.lastRun)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelative(agent.lastRun)}
            </p>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base">Controls</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-1.5">
                <Play className="h-3.5 w-3.5" />
                Start
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pause className="h-3.5 w-3.5" />
                Pause
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                View Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Run history</CardTitle>
            <CardDescription>Recent agent executions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <RunStatusBadge status={run.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(run.timestamp)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {run.status === "running" ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Running
                        </span>
                      ) : (
                        `${(run.durationMs / 1000).toFixed(1)}s`
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {run.detail}
                    </TableCell>
                  </TableRow>
                ))}
                {recentRuns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No runs recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capabilities</CardTitle>
            <CardDescription>What this agent handles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {agent.id === "scraping" && (
              <>
                <InfoItem icon={<Activity className="h-4 w-4" />} title="Google Maps scraping" description="Extract business listings via Apify actors" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="Batch processing" description="Process multiple locations and categories simultaneously" />
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="Data normalization" description="Standardize phone, address, category and rating fields" />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="Rate limit handling" description="Automatic retry with backoff on API throttling" />
              </>
            )}
            {agent.id === "checking" && (
              <>
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="Website detection" description="Check if business already has a website" />
                <InfoItem icon={<Activity className="h-4 w-4" />} title="AI scoring" description="Compute opportunity score using GPT-4o" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="Deduplication" description="Merge duplicate business listings" />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="Priority classification" description="Assign high/medium/low priority to each lead" />
              </>
            )}
            {agent.id === "storage" && (
              <>
                <InfoItem icon={<Activity className="h-4 w-4" />} title="Supabase persistence" description="Write leads, campaigns and records to Postgres" />
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="Conflict resolution" description="Handle duplicates and update existing records" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="Activity logging" description="Track all agent actions and state changes" />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="Sync scheduling" description="Keep local and remote data in sync" />
              </>
            )}
            {agent.id === "website-building" && (
              <>
                <InfoItem icon={<Activity className="h-4 w-4" />} title="Template selection" description="Choose from restaurant, salon, clinic templates" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="AI content generation" description="Generate headlines, descriptions and CTAs" />
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="Brand customization" description="Apply business colors, logo and branding" />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="Build verification" description="Validate output before marking as ready" />
              </>
            )}
            {agent.id === "deployment" && (
              <>
                <InfoItem icon={<Activity className="h-4 w-4" />} title="GitHub push" description="Create repos and push generated website code" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="Vercel deployment" description="Deploy to production with custom domains" />
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="Build verification" description="Confirm deployment succeeded before marking live" />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="Rollback support" description="Revert to previous deployment on failure" />
              </>
            )}
            {agent.id === "whatsapp" && (
              <>
                <InfoItem icon={<Activity className="h-4 w-4" />} title="Message drafting" description="Generate personalized outreach messages" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="Delivery tracking" description="Monitor sent, delivered and read status" />
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="Reply classification" description="Categorize replies as interested, price request, etc." />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="Human approval" description="Require manual review before sending messages" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
          <CardDescription>Latest events from this agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agent.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <span
                  className={cn(
                    "mt-1 h-2 w-2 shrink-0 rounded-full",
                    activity.status === "success"
                      ? "bg-emerald-400"
                      : activity.status === "error"
                        ? "bg-rose-400"
                        : activity.status === "pending"
                          ? "bg-amber-400"
                          : "bg-sky-400"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelative(activity.timestamp)}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{activity.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
