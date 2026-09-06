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
  Cpu,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
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
    <Badge
      variant={status === "success" ? "success" : status === "failed" ? "destructive" : "info"}
      className="font-mono text-[10px] gap-1"
    >
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
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Autonomous Fleet
        </Link>
      </div>

      <PageHeader
        title={agent.name}
        description={agent.description}
      >
        <Badge variant={meta.variant} className="py-1 px-3">
          <Icon className={cn("h-3.5 w-3.5 mr-1", agent.status === "running" && "animate-spin")} />
          {meta.label}
        </Badge>
      </PageHeader>

      {/* Porcelain Summary Telemetry Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Executions", value: agent.totalRuns.toLocaleString(), sub: "All-time runs", color: "text-slate-950", accent: "from-blue-500 to-indigo-500" },
          { label: "Successful Runs", value: agent.successRuns.toLocaleString(), sub: `${successRate}% success SLA`, color: "text-emerald-600", accent: "from-emerald-400 to-teal-500" },
          { label: "Exceptions / Failures", value: agent.failedRuns.toLocaleString(), sub: `${agent.totalRuns > 0 ? Math.round((agent.failedRuns / agent.totalRuns) * 100) : 0}% failure rate`, color: "text-rose-600", accent: "from-rose-400 to-pink-500" },
          { label: "Avg Run Duration", value: `${avgDurationSec}s`, sub: "Execution latency", color: "text-purple-600", accent: "from-purple-400 to-indigo-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift"
          >
            <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-70", s.accent)} />
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={cn("mt-1.5 font-display text-3xl font-extrabold tracking-tight", s.color)}>{s.value}</p>
            <p className="mt-1 font-sans text-xs text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md">
          <h3 className="font-display text-base font-bold text-slate-950 mb-3">Success Rate SLA</h3>
          <Progress
            value={successRate}
            indicatorClassName={
              successRate >= 90 ? "bg-emerald-500" : successRate >= 75 ? "bg-amber-500" : "bg-rose-500"
            }
          />
          <p className="mt-3 font-mono text-xs text-slate-500">
            {agent.successRuns} succeeded out of {agent.totalRuns} total task runs
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md">
          <h3 className="font-display text-base font-bold text-slate-950 mb-2">Last Active Pulse</h3>
          <p className="font-mono text-sm font-bold text-slate-800">{formatDateTime(agent.lastRun)}</p>
          <p className="mt-1 font-sans text-xs text-slate-400">
            {formatRelative(agent.lastRun)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md flex flex-col justify-between">
          <h3 className="font-display text-base font-bold text-slate-950 mb-2">Manual Dispatch</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-1.5 font-sans text-xs bg-slate-900 text-white rounded-xl hover:bg-slate-800">
              <Play className="h-3.5 w-3.5" />
              Start Run
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 font-sans text-xs rounded-xl bg-white border-slate-200">
              <Pause className="h-3.5 w-3.5 text-slate-500" />
              Pause
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 font-sans text-xs rounded-xl bg-white border-slate-200">
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              Retry
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Run History Table */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-slate-950">Execution Telemetry History</h3>
            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">LAST 10 RUNS</span>
          </div>
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-display font-bold text-xs text-slate-700">Status</TableHead>
                <TableHead className="font-display font-bold text-xs text-slate-700">Timestamp</TableHead>
                <TableHead className="font-display font-bold text-xs text-slate-700">Duration</TableHead>
                <TableHead className="font-display font-bold text-xs text-slate-700">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRuns.map((run) => (
                <TableRow key={run.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell>
                    <RunStatusBadge status={run.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {formatDateTime(run.timestamp)}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-700">
                    {run.status === "running" ? (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Running
                      </span>
                    ) : (
                      `${(run.durationMs / 1000).toFixed(1)}s`
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-sans text-xs text-slate-500">
                    {run.detail}
                  </TableCell>
                </TableRow>
              ))}
              {recentRuns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center font-sans text-xs text-slate-400">
                    No runs recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Capabilities Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md">
          <h3 className="font-display text-base font-bold text-slate-950 mb-1">Agent Micro-Capabilities</h3>
          <p className="font-sans text-xs text-slate-500 mb-5">Native tool definitions and pipeline hooks for {agent.name}</p>
          <div className="space-y-4">
            {agent.id === "scraping" && (
              <>
                <InfoItem icon={<Activity className="h-4 w-4" />} title="Google Maps Scraping" description="Extracts business listings, reviews, ratings via Apify cloud actors" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="Batch Parallelism" description="Processes multiple geographical areas and categories concurrently" />
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="Data Normalization" description="Cleans phone numbers, coordinates, and address strings" />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="Rate-limit Protection" description="Automated exponential backoff with request proxy rotation" />
              </>
            )}
            {agent.id === "checking" && (
              <>
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="Website Presence Detection" description="Resolves DNS, HTTP headers and active domains" />
                <InfoItem icon={<Activity className="h-4 w-4" />} title="AI Scoring Engine" description="Calculates opportunity gap score using GPT-4o / Claude 3.5 Sonnet" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="Lead Deduplication" description="Deduplicates against active CRM records in PostgreSQL" />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="Priority Routing" description="Flags high-conversion businesses for immediate website synthesis" />
              </>
            )}
            {agent.id === "storage" && (
              <>
                <InfoItem icon={<Activity className="h-4 w-4" />} title="Postgres & Supabase Storage" description="Atomic writes with row-level security and foreign key integrity" />
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="Conflict Resolution" description="Graceful upserts with version tracking" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="Telemetry Event Sourcing" description="Persists every micro-action into immutable event streams" />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="Bi-directional Sync" description="Maintains sync state with Google Sheets and external CRM" />
              </>
            )}
            {agent.id === "website-building" && (
              <>
                <InfoItem icon={<Activity className="h-4 w-4" />} title="Dynamic Template Selection" description="Chooses from Restaurant, Clinic, Spa, or Corporate architectures" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="AI Copy & Asset Synthesis" description="Drafts localized value propositions and business CTAs" />
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="Brand Color Matching" description="Infers primary and secondary color palettes from category" />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="AST Compilation Check" description="Validates TypeScript AST before initiating Vercel build" />
              </>
            )}
            {agent.id === "deployment" && (
              <>
                <InfoItem icon={<Activity className="h-4 w-4" />} title="GitHub Repo Management" description="Provisions private Git repositories with continuous deployment" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="Vercel Edge Deployment" description="Deploys static and server-rendered Next.js edge builds" />
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="SSL & Edge Verification" description="Verifies HTTPS certificate and 200 HTTP response codes" />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="Automated Rollback" description="Restores previous working build on uncaught exceptions" />
              </>
            )}
            {agent.id === "whatsapp" && (
              <>
                <InfoItem icon={<Activity className="h-4 w-4" />} title="Meta Cloud API Outreach" description="Dispatches verified WhatsApp template messages with live links" />
                <InfoItem icon={<Zap className="h-4 w-4" />} title="Delivery Webhook Tracking" description="Tracks Sent, Delivered, and Read receipts in real-time" />
                <InfoItem icon={<CheckCircle2 className="h-4 w-4" />} title="LLM Reply Intent Classification" description="Categorizes inbound replies into High Intent, Pricing, or Rejection" />
                <InfoItem icon={<Clock className="h-4 w-4" />} title="Human-in-the-loop Guardrails" description="Optional review stage before outbound message dispatch" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md">
        <h3 className="font-display text-base font-bold text-slate-950 mb-1">Live Event Telemetry</h3>
        <p className="font-sans text-xs text-slate-500 mb-4">Chronological log of agent actions and state mutations</p>
        <div className="space-y-3">
          {agent.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  activity.status === "success"
                    ? "bg-emerald-500"
                    : activity.status === "error"
                      ? "bg-rose-500"
                      : activity.status === "pending"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-xs font-bold text-slate-950">{activity.title}</p>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {formatRelative(activity.timestamp)}
                  </span>
                </div>
                {activity.description && (
                  <p className="mt-0.5 font-sans text-xs text-slate-600 leading-relaxed">{activity.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
        {icon}
      </div>
      <div>
        <p className="font-display text-xs font-bold text-slate-950">{title}</p>
        <p className="font-sans text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}
