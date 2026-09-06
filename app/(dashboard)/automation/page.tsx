"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Clock,
  Play,
  RefreshCw,
  RotateCcw,
  Timer,
  XCircle,
  ArrowRight,
  Search,
  CheckCircle2,
  Globe,
  Rocket,
  Send,
  Zap,
  Calendar,
  Layers,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { jobs as initialJobs } from "@/lib/data/automation";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ScheduledJob, JobRun } from "@/lib/types";

function RunBadge({ status }: { status: JobRun["status"] }) {
  return (
    <Badge
      variant={
        status === "success"
          ? "success"
          : status === "failed"
            ? "destructive"
            : "muted"
      }
      className="font-mono text-[10px] gap-1"
    >
      {status === "success" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : status === "failed" ? (
        <XCircle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {status}
    </Badge>
  );
}

const workflowSteps = [
  {
    label: "Daily Lead Scraping",
    description: "Extract new businesses from Google Maps",
    icon: Search,
    trigger: "cron",
    triggerLabel: "Daily 06:00 AM",
    color: "text-blue-600",
    bg: "bg-blue-50/50",
  },
  {
    label: "Lead Qualification",
    description: "Score & filter leads with zero website",
    icon: CheckCircle2,
    trigger: "event",
    triggerLabel: "On new leads",
    color: "text-cyan-600",
    bg: "bg-cyan-50/50",
  },
  {
    label: "Website AST Generation",
    description: "Synthesize personalized Next.js edge sites",
    icon: Globe,
    trigger: "cron",
    triggerLabel: "Daily 09:00 AM",
    color: "text-indigo-600",
    bg: "bg-indigo-50/50",
  },
  {
    label: "Vercel Production Deploy",
    description: "Provision isolated production previews",
    icon: Rocket,
    trigger: "event",
    triggerLabel: "After build",
    color: "text-amber-600",
    bg: "bg-amber-50/50",
  },
  {
    label: "WhatsApp Pitch Sequence",
    description: "Dispatch preview link with AI copy",
    icon: Send,
    trigger: "cron",
    triggerLabel: "Daily 05:00 PM",
    color: "text-emerald-600",
    bg: "bg-emerald-50/50",
  },
];

function WorkflowDiagram({ jobs }: { jobs: ScheduledJob[] }) {
  const activeCount = jobs.filter((j) => j.active).length;
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-950 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Autonomous Cron & Event Engine
          </h3>
          <p className="font-sans text-xs text-slate-500">
            Automated lead lifecycle progression · {activeCount} of {jobs.length} scheduled jobs active
          </p>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          EXECUTION MODE: HYBRID CRON + EVENT TRIGGER
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon;
          const isCron = step.trigger === "cron";
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              className="min-w-0"
            >
              <div className={cn("h-full rounded-2xl border border-slate-200/80 p-4 transition-all duration-200 hover-lift bg-white shadow-xs flex flex-col justify-between", step.bg)}>
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-xs", step.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-xs font-bold text-slate-950 leading-tight truncate">{step.label}</p>
                      <p className="font-sans text-[11px] text-slate-500 truncate">{step.description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px]">
                  <Badge variant={isCron ? "outline" : "info"} className="gap-1 py-0 px-2">
                    {isCron ? <Calendar className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                    {isCron ? "CRON" : "EVENT"}
                  </Badge>
                  <span className="text-slate-500 font-semibold truncate">{step.triggerLabel}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function JobRow({
  job,
  onToggle,
}: {
  job: ScheduledJob;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [running, setRunning] = React.useState(false);

  const runNow = () => {
    if (running || !job.active) return;
    setRunning(true);
    window.setTimeout(() => setRunning(false), 1800);
  };

  return (
    <React.Fragment>
      <TableRow className="hover:bg-slate-50/80 transition-colors">
        <TableCell>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-slate-400 transition-transform hover:text-slate-800"
              aria-label="Toggle history"
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
              />
            </button>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-slate-950">{job.name}</p>
              <p className="truncate font-sans text-xs text-slate-500">{job.description}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
            <Timer className="h-3.5 w-3.5 text-blue-600" />
            {job.cron}
          </span>
        </TableCell>
        <TableCell>
          {job.lastRun ? (
            <div className="space-y-1">
              <p className="font-mono text-xs text-slate-700" suppressHydrationWarning>{formatDateTime(job.lastRun)}</p>
              {job.lastStatus && <RunBadge status={job.lastStatus} />}
            </div>
          ) : (
            <span className="font-mono text-xs text-slate-400">Never executed</span>
          )}
        </TableCell>
        <TableCell>
          <p className="font-mono text-xs text-slate-700" suppressHydrationWarning>{formatDateTime(job.nextRun)}</p>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-3">
            <Switch
              checked={job.active}
              onCheckedChange={(checked) => onToggle(job.id, checked)}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-sans text-xs rounded-xl"
              disabled={!job.active || running}
              onClick={runNow}
            >
              {running ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
              ) : (
                <Play className="h-3.5 w-3.5 text-slate-600" />
              )}
              {running ? "Running…" : "Run now"}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent bg-slate-50/60">
          <TableCell colSpan={5} className="p-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Execution History & Latency Log
              </p>
              <div className="space-y-2">
                {job.runHistory.length === 0 && (
                  <p className="font-sans text-xs text-slate-400">No runs recorded yet.</p>
                )}
                {job.runHistory.map((run) => (
                  <div
                    key={run.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <RunBadge status={run.status} />
                      <span className="text-slate-600" suppressHydrationWarning>{formatDateTime(run.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-600">
                        {run.durationMs.toLocaleString()} ms
                      </span>
                      {run.detail && <span className="text-slate-500 font-sans">{run.detail}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

export default function AutomationPage() {
  const [jobs, setJobs] = React.useState<ScheduledJob[]>(initialJobs);

  const toggleJob = (id: string, active: boolean) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, active, nextRun: active ? j.nextRun : "—" } : j
      )
    );
  };

  const activeCount = jobs.filter((j) => j.active).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <PageHeader
        title="Automation Schedules"
        description="Autonomous background cron schedules, event triggers, and pipeline execution policies."
      >
        <Button variant="outline" className="gap-1.5 font-sans text-xs">
          <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
          Refresh Engine State
        </Button>
      </PageHeader>

      {/* Porcelain Summary Telemetry Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Cron Daemons", value: `${activeCount}/${jobs.length}`, sub: "Scheduled background workers", color: "text-emerald-600", accent: "from-emerald-400 to-teal-500" },
          { label: "Mean Latency", value: "842ms", sub: "Average execution duration", color: "text-blue-600", accent: "from-blue-500 to-indigo-500" },
          { label: "Next Scheduled Run", value: "06:00 AM", sub: "Daily scraping batch", color: "text-slate-950", accent: "from-slate-600 to-slate-800" },
          { label: "Cron Health SLA", value: "100%", sub: "Zero missed triggers", color: "text-purple-600", accent: "from-purple-400 to-indigo-500" },
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

      <WorkflowDiagram jobs={jobs} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-950">Scheduled Task Fleet</h3>
              <p className="font-sans text-xs text-slate-500">
                Configure execution intervals, toggle active states, and monitor granular execution telemetry
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-[11px] text-blue-600 border-blue-200 bg-blue-50">
              Vercel Cron & Edge Sync
            </Badge>
          </div>

          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-display font-bold text-xs text-slate-700">Automation Job</TableHead>
                <TableHead className="font-display font-bold text-xs text-slate-700">Schedule (Cron)</TableHead>
                <TableHead className="font-display font-bold text-xs text-slate-700">Last Execution</TableHead>
                <TableHead className="font-display font-bold text-xs text-slate-700">Next Scheduled Run</TableHead>
                <TableHead className="font-display font-bold text-xs text-slate-700 text-right">Controls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} onToggle={toggleJob} />
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}
