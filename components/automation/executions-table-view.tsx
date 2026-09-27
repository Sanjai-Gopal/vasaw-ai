"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Filter,
  Play,
  RefreshCw,
  Search,
  XCircle,
  Zap,
  ArrowRight,
  Database,
  Globe,
  Sliders,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FlowWorkflow } from "@/lib/types/automation-flow";

interface ExecutionsTableViewProps {
  workflow: FlowWorkflow;
  onRunWorkflow: () => void;
  isExecuting: boolean;
}

interface MockRunRecord {
  id: string;
  triggerSource: string;
  status: "success" | "running" | "error";
  startedAt: string;
  durationMs: number;
  stepsCount: number;
  itemsProcessed: number;
}

const MOCK_RUNS: MockRunRecord[] = [
  {
    id: "run-98214",
    triggerSource: "Apify Google Maps Lead Ingest",
    status: "success",
    startedAt: "2 mins ago",
    durationMs: 1420,
    stepsCount: 7,
    itemsProcessed: 10,
  },
  {
    id: "run-98213",
    triggerSource: "Inbound Webhook (/api/v1/webhook/leads)",
    status: "success",
    startedAt: "18 mins ago",
    durationMs: 840,
    stepsCount: 5,
    itemsProcessed: 1,
  },
  {
    id: "run-98212",
    triggerSource: "Scheduled Cron (0 9 * * 1-5)",
    status: "success",
    startedAt: "2 hours ago",
    durationMs: 980,
    stepsCount: 4,
    itemsProcessed: 25,
  },
  {
    id: "run-98211",
    triggerSource: "Manual Studio Trigger (Sanjai)",
    status: "success",
    startedAt: "4 hours ago",
    durationMs: 1310,
    stepsCount: 7,
    itemsProcessed: 1,
  },
  {
    id: "run-98210",
    triggerSource: "Supabase DB Row Insert (leads)",
    status: "success",
    startedAt: "Yesterday at 6:42 PM",
    durationMs: 650,
    stepsCount: 3,
    itemsProcessed: 1,
  },
];

export function ExecutionsTableView({
  workflow,
  onRunWorkflow,
  isExecuting,
}: ExecutionsTableViewProps) {
  const [filter, setFilter] = React.useState<"all" | "success" | "error">("all");
  const [selectedRun, setSelectedRun] = React.useState<MockRunRecord | null>(MOCK_RUNS[0]);

  const filteredRuns = MOCK_RUNS.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Runs</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {workflow.runsCount.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">+18% this wk</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">99.8%</span>
            <span className="text-xs text-slate-400">0.2% rate limit fallback</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Pipeline Latency</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">1.24s</span>
            <span className="text-xs text-slate-400">across 7 node hops</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Production Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">Active</span>
            <span className="text-xs text-slate-400">Automatic triggering</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-white">Execution History</h3>
            <span className="text-xs text-slate-400">
              Telemetry logs for &ldquo;{workflow.name}&rdquo;
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors",
                  filter === "all" ? "bg-slate-800 text-white font-semibold" : "text-slate-400"
                )}
              >
                All Runs
              </button>
              <button
                onClick={() => setFilter("success")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors",
                  filter === "success" ? "bg-slate-800 text-white font-semibold" : "text-slate-400"
                )}
              >
                Success
              </button>
            </div>

            <Button
              size="sm"
              onClick={onRunWorkflow}
              disabled={isExecuting}
              className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isExecuting ? (
                <RefreshCw className="w-3 h-3 animate-spin mr-1.5" />
              ) : (
                <Play className="w-3 h-3 fill-current mr-1.5" />
              )}
              <span>{isExecuting ? "Running..." : "Trigger Manual Run"}</span>
            </Button>
          </div>
        </div>

        {/* Table List */}
        <div className="divide-y divide-slate-800/80">
          {filteredRuns.map((run) => (
            <div
              key={run.id}
              onClick={() => setSelectedRun(run)}
              className={cn(
                "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 cursor-pointer transition-colors",
                selectedRun?.id === run.id && "bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{run.id}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-emerald-800 text-emerald-400 bg-emerald-950/40"
                    >
                      {run.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{run.triggerSource}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs font-mono text-slate-400">
                <div>
                  <span className="text-slate-200 font-semibold">{run.stepsCount}</span> steps
                </div>
                <div>
                  <span className="text-slate-200 font-semibold">{run.itemsProcessed}</span> items
                </div>
                <div>
                  <span className="text-slate-200 font-semibold">{run.durationMs}ms</span>
                </div>
                <div className="text-slate-500">{run.startedAt}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
