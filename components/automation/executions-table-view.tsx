"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Play,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FlowWorkflow, WorkflowExecutionRecord, WorkflowExecutionStepRecord } from "@/lib/types/automation-flow";

interface ExecutionsTableViewProps {
  workflow: FlowWorkflow;
  runs: WorkflowExecutionRecord[];
  onRunWorkflow: () => void;
  isExecuting: boolean;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown time"
    : date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export function ExecutionsTableView({
  workflow,
  runs,
  onRunWorkflow,
  isExecuting,
}: ExecutionsTableViewProps) {
  const [filter, setFilter] = React.useState<"all" | "success" | "error">("all");
  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null);
  const [stepDetail, setStepDetail] = React.useState<{ runId: string; steps: WorkflowExecutionStepRecord[] } | null>(null);

  const successCount = runs.filter((run) => run.status === "success").length;
  const errorCount = runs.length - successCount;
  const averageDuration = runs.length
    ? Math.round(runs.reduce((total, run) => total + run.durationMs, 0) / runs.length)
    : null;
  const filteredRuns = runs.filter((run) => filter === "all" || run.status === filter);
  const selectedRun =
    filteredRuns.find((run) => run.id === selectedRunId) || filteredRuns[0] || null;

  const selectedRunKey = selectedRun?.id;
  const selectedRunMode = selectedRun?.mode;
  const selectedSteps = stepDetail?.runId === selectedRunKey ? stepDetail.steps : [];
  const stepsLoading = Boolean(selectedRunKey && selectedRunMode === "server_dry_run" && stepDetail?.runId !== selectedRunKey);

  React.useEffect(() => {
    let cancelled = false;
    if (!selectedRunKey || selectedRunMode !== "server_dry_run") return;
    fetch(`/api/automations/${workflow.id}/run?runId=${encodeURIComponent(selectedRunKey)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Run steps could not be loaded.");
        const steps = Array.isArray(result.steps) ? result.steps as Array<Record<string, unknown>> : [];
        if (!cancelled) setStepDetail({ runId: selectedRunKey, steps: steps.map((step) => ({
          id: String(step.id),
          nodeId: String(step.node_id),
          nodeName: String(step.node_name),
          status: String(step.status) as WorkflowExecutionStepRecord["status"],
          startedAt: String(step.started_at),
          completedAt: typeof step.completed_at === "string" ? step.completed_at : undefined,
          durationMs: typeof step.duration_ms === "number" ? step.duration_ms : undefined,
          message: typeof step.message === "string" ? step.message : undefined,
          error: typeof step.error === "string" ? step.error : undefined,
        })) });
      })
      .catch(() => { if (!cancelled) setStepDetail({ runId: selectedRunKey, steps: [] }); });
    return () => { cancelled = true; };
  }, [selectedRunKey, selectedRunMode, workflow.id]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Run history</h2>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <ShieldCheck className="mr-1 h-3 w-3" /> Server dry runs
            </Badge>
          </div>
          <p className="text-sm text-slate-400">Persisted execution records for “{workflow.name}”.</p>
        </div>
        <Button
          size="sm"
          onClick={onRunWorkflow}
          disabled={isExecuting || workflow.nodes.every((node) => node.disabled)}
          title="Simulate with local sample data; no integrations are called"
          className="h-9 bg-[#ff6d5a] text-white hover:bg-[#ea4b35]"
        >
          <Play className="mr-2 h-3.5 w-3.5 fill-current" />
          {isExecuting ? "Previewing…" : "Run dry run"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Local dry runs" value={runs.length.toString()} icon={<Activity className="h-4 w-4 text-blue-400" />} />
        <MetricCard label="Completed" value={successCount.toString()} detail={errorCount ? `${errorCount} with errors` : "No errors recorded"} icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} />
        <MetricCard label="Average preview time" value={averageDuration === null ? "—" : `${averageDuration} ms`} detail={runs.length ? "Across saved dry runs" : "Appears after the first dry run"} icon={<Clock3 className="h-4 w-4 text-purple-400" />} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Run log</h3>
            <p className="mt-0.5 text-xs text-slate-500">Only simulations started from this editor appear here.</p>
          </div>
          <div className="inline-flex w-fit rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs" aria-label="Filter dry runs">
            {(["all", "success", "error"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  "rounded-md px-3 py-1.5 capitalize transition-colors",
                  filter === value ? "bg-slate-800 font-semibold text-white" : "text-slate-400 hover:text-white"
                )}
              >
                {value === "all" ? `All (${runs.length})` : value === "success" ? `Completed (${successCount})` : `Errors (${errorCount})`}
              </button>
            ))}
          </div>
        </div>

        {filteredRuns.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-400">
              <Activity className="h-5 w-5" />
            </div>
            <h4 className="font-medium text-white">{runs.length ? "No runs match this filter" : "No dry runs yet"}</h4>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {runs.length
                ? "Choose another filter to view the saved previews."
                : "Run a local preview to inspect sample outputs and create the first history entry."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredRuns.map((run) => {
              const succeeded = run.status === "success";
              const selected = selectedRun?.id === run.id;
              return (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => setSelectedRunId(run.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between",
                    selected && "bg-slate-800/50"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                      succeeded ? "border-emerald-800 bg-emerald-950/60 text-emerald-400" : "border-rose-800 bg-rose-950/60 text-rose-400"
                    )}>
                      {succeeded ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-white">{run.id}</span>
                        <Badge variant="outline" className={cn(
                          "text-[10px] capitalize",
                          succeeded ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : "border-rose-800 bg-rose-950/40 text-rose-300"
                        )}>{succeeded ? "completed" : "error"}</Badge>
                      <span className="text-[10px] text-slate-500">Server dry run</span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-400">{run.triggerSource}</span>
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-5 gap-y-1 pl-12 text-xs text-slate-400 sm:pl-0">
                    <span><strong className="text-slate-200">{run.stepsCount}</strong> steps</span>
                    <span><strong className="text-slate-200">{run.durationMs} ms</strong></span>
                    <span>{formatDate(run.startedAt)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selectedRun && (
          <div className="border-t border-slate-800 bg-slate-950/60 p-4">
            <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-400">Run <span className="font-mono text-slate-200">{selectedRun.id}</span></span>
              <span className="text-slate-500">No provider calls · {selectedRun.stepsCount} steps recorded</span>
            </div>
            {stepsLoading ? (
              <p className="mt-3 text-xs text-slate-500">Loading saved step details…</p>
            ) : selectedSteps.length > 0 ? (
              <ol className="mt-3 divide-y divide-slate-800 rounded-lg border border-slate-800">
                {selectedSteps.map((step) => (
                  <li key={step.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-200">{step.nodeName}</span>
                        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">{step.status}</Badge>
                        {step.durationMs !== undefined && <span className="text-[10px] text-slate-500">{step.durationMs} ms</span>}
                      </div>
                      <p className="mt-1 break-words text-xs text-slate-400">{step.error || step.message || "Step recorded."}</p>
                    </div>
                    <time className="shrink-0 text-[10px] text-slate-500">{formatDate(step.startedAt)}</time>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-xs text-slate-500">No step detail is available for this run.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between text-xs font-medium text-slate-400">
        <span>{label}</span>{icon}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</div>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}
