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
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
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
    >
      {status === "success" ? (
        <RefreshCw className="h-3 w-3" />
      ) : status === "failed" ? (
        <XCircle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {status}
    </Badge>
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
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-muted-foreground transition-transform hover:text-foreground"
              aria-label="Toggle history"
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
              />
            </button>
            <div className="min-w-0">
              <p className="font-medium">{job.name}</p>
              <p className="truncate text-xs text-muted-foreground">{job.description}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            {job.cron}
          </span>
        </TableCell>
        <TableCell>
          {job.lastRun ? (
            <div>
              <p className="text-xs">{formatDateTime(job.lastRun)}</p>
              {job.lastStatus && <RunBadge status={job.lastStatus} />}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Never</span>
          )}
        </TableCell>
        <TableCell>
          <p className="text-xs">{formatDateTime(job.nextRun)}</p>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Switch
              checked={job.active}
              onCheckedChange={(checked) => onToggle(job.id, checked)}
            />
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              disabled={!job.active || running}
              onClick={runNow}
            >
              <Play className="h-3.5 w-3.5" />
              {running ? "Running…" : "Run now"}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="bg-muted/20 pb-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Run history
              </p>
              <div className="space-y-2">
                {job.runHistory.length === 0 && (
                  <p className="text-xs text-muted-foreground">No runs recorded yet.</p>
                )}
                {job.runHistory.map((run) => (
                  <div
                    key={run.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-xs"
                  >
                    <RunBadge status={run.status} />
                    <span className="text-muted-foreground">{formatDateTime(run.timestamp)}</span>
                    <span className="font-mono text-muted-foreground">
                      {run.durationMs.toLocaleString()} ms
                    </span>
                    {run.detail && <span className="text-muted-foreground">{run.detail}</span>}
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Automation"
        description={`${activeCount} of ${jobs.length} scheduled jobs active`}
      >
        <Button variant="outline" className="gap-1.5">
          <RotateCcw className="h-4 w-4" />
          Refresh status
        </Button>
      </PageHeader>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last execution</TableHead>
                <TableHead>Next execution</TableHead>
                <TableHead className="text-right">Controls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} onToggle={toggleJob} />
              ))}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </div>
  );
}