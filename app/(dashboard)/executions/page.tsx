"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Clock,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Eye,
  FileCode,
  Zap,
  RotateCcw,
  Layers,
  Database,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "success" | "error" | "running";
  triggerSource: string;
  startedAt: string;
  durationMs: number;
  stepsTotal: number;
  stepsCompleted: number;
  itemsProcessed: number;
  errorSnippet?: string;
  logs: Array<{
    nodeName: string;
    level: "info" | "success" | "error";
    message: string;
    durationMs: number;
  }>;
}

const INITIAL_EXECUTIONS: ExecutionRecord[] = [
  {
    id: "exec-9924",
    workflowId: "wf-autonomous-email",
    workflowName: "Autonomous Cold Email Outreach Pipeline",
    status: "success",
    triggerSource: "Scheduled Cron (Weekdays 9:00 AM)",
    startedAt: "3 mins ago",
    durationMs: 1420,
    stepsTotal: 7,
    stepsCompleted: 7,
    itemsProcessed: 10,
    logs: [
      { nodeName: "Google Maps Discovery Ingest", level: "success", message: "Discovered 10 verified bakery listings in Coimbatore", durationMs: 420 },
      { nodeName: "Supabase Lead Storage", level: "success", message: "Upserted 10 lead records with idempotency key", durationMs: 180 },
      { nodeName: "Gemini 2.5 Opportunity Scorer", level: "success", message: "Generated acquisition scores: 8/10 above threshold", durationMs: 380 },
      { nodeName: "Synthetic Next.js Builder", level: "success", message: "Compiled 6 bespoke landing page components", durationMs: 240 },
      { nodeName: "Vercel Production Deploy", level: "success", message: "Edge deployment live at kovai-bakery.vasaw.site", durationMs: 310 },
      { nodeName: "Automatic Email Dispatcher", level: "success", message: "Email preview dispatched via Resend to founder@kovaibakery.com", durationMs: 140 },
      { nodeName: "Slack Telemetry Alert", level: "success", message: "Outreach telemetry posted to #vasaw-email-outreach", durationMs: 90 },
    ],
  },
  {
    id: "exec-9923",
    workflowId: "wf-inbound-webhook",
    workflowName: "Inbound Webhook Instant Enrichment",
    status: "success",
    triggerSource: "HTTP POST /api/v1/webhook/leads",
    startedAt: "18 mins ago",
    durationMs: 640,
    stepsTotal: 5,
    stepsCompleted: 5,
    itemsProcessed: 1,
    logs: [
      { nodeName: "Inbound Webhook Trigger", level: "success", message: "Received JSON payload for 'The Residency Towers'", durationMs: 15 },
      { nodeName: "Supabase Lead Save", level: "success", message: "Created lead record #lead-8149", durationMs: 120 },
      { nodeName: "Gemini AI Fast Qualifier", level: "success", message: "Assigned high-priority tier (score: 94)", durationMs: 280 },
      { nodeName: "Slack SDR Channel Alert", level: "success", message: "Dispatched VIP notification to #hot-leads", durationMs: 110 },
      { nodeName: "WhatsApp Welcome Dispatch", level: "success", message: "Template message queued", durationMs: 115 },
    ],
  },
  {
    id: "exec-9922",
    workflowId: "wf-high-value-filter",
    workflowName: "VIP Filter & Vercel Preview Deploy",
    status: "success",
    triggerSource: "Manual Run (Sanjai Gopal)",
    startedAt: "42 mins ago",
    durationMs: 1180,
    stepsTotal: 6,
    stepsCompleted: 6,
    itemsProcessed: 4,
    logs: [
      { nodeName: "Apify Google Maps Ingest", level: "success", message: "Extracted 4 luxury cafes in RS Puram", durationMs: 390 },
      { nodeName: "Database Upsert", level: "success", message: "Records updated in Supabase leads", durationMs: 160 },
      { nodeName: "If High Rating (>4.5)", level: "success", message: "Branch condition TRUE: 4 items passed", durationMs: 40 },
      { nodeName: "Instant Vercel Deploy", level: "success", message: "Synthesized Next.js site deployed", durationMs: 480 },
      { nodeName: "Slack SDR Channel Alert", level: "success", message: "Team notified", durationMs: 110 },
    ],
  },
  {
    id: "exec-9921",
    workflowId: "wf-autonomous-email",
    workflowName: "Autonomous Cold Email Outreach Pipeline",
    status: "error",
    triggerSource: "Scheduled Cron (Weekdays 9:00 AM)",
    startedAt: "Yesterday, 9:00 AM",
    durationMs: 720,
    stepsTotal: 7,
    stepsCompleted: 3,
    itemsProcessed: 10,
    errorSnippet: "RateLimitError: Upstream provider quota exceeded on AI scoring endpoint. Auto-retry scheduled.",
    logs: [
      { nodeName: "Google Maps Discovery Ingest", level: "success", message: "Extracted 10 leads successfully", durationMs: 410 },
      { nodeName: "Supabase Lead Storage", level: "success", message: "Saved to PostgreSQL database", durationMs: 170 },
      { nodeName: "Gemini 2.5 Opportunity Scorer", level: "error", message: "RateLimitError: Quota limit hit. Retry scheduled in 60s.", durationMs: 140 },
    ],
  },
  {
    id: "exec-9920",
    workflowId: "wf-nightly-inactive",
    workflowName: "Nightly Inactivity Re-engagement",
    status: "success",
    triggerSource: "Scheduled Cron (Daily 8:00 PM)",
    startedAt: "Yesterday, 8:00 PM",
    durationMs: 980,
    stepsTotal: 4,
    stepsCompleted: 4,
    itemsProcessed: 18,
    logs: [
      { nodeName: "Weekdays 8:00 PM Cron", level: "success", message: "Trigger fired on schedule", durationMs: 10 },
      { nodeName: "Query 4-Day Inactive Leads", level: "success", message: "Fetched 18 candidate leads without response", durationMs: 240 },
      { nodeName: "Contextual Re-angle Synthesizer", level: "success", message: "Synthesized 18 individualized follow-up hooks", durationMs: 480 },
      { nodeName: "WhatsApp Follow-up Dispatch", level: "success", message: "Queued batch messages across WhatsApp gateway", durationMs: 250 },
    ],
  },
];

export default function ExecutionsPage() {
  const [executions, setExecutions] = React.useState<ExecutionRecord[]>(INITIAL_EXECUTIONS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "success" | "error">("all");
  const [selectedExecution, setSelectedExecution] = React.useState<ExecutionRecord | null>(null);

  const filteredExecutions = executions.filter((exec) => {
    const matchesSearch =
      exec.workflowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exec.triggerSource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "success" && exec.status === "success") ||
      (statusFilter === "error" && exec.status === "error");
    return matchesSearch && matchesStatus;
  });

  const successCount = executions.filter((e) => e.status === "success").length;
  const successRate = Math.round((successCount / executions.length) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ff6d5a]/15 text-[#ff6d5a] flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Executions History
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Inspect step-by-step logs, payloads, and node timings across all runs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="bg-[#ff6d5a] hover:bg-[#ea4b35] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm shadow-[#ff6d5a]/25">
            <Link href="/automation">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              <span>Open Studio Canvas</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-mono text-slate-400 uppercase font-bold">Total Runs</p>
          <p className="text-2xl font-black text-slate-900 mt-1">4,812</p>
          <span className="text-[10px] text-emerald-600 font-mono font-medium">+142 past 24h</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-mono text-slate-400 uppercase font-bold">Success Rate</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{successRate}%</p>
          <span className="text-[10px] text-slate-400 font-mono font-medium">99.8% SLA Target</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-mono text-slate-400 uppercase font-bold">Avg Duration</p>
          <p className="text-2xl font-black text-slate-900 mt-1">890ms</p>
          <span className="text-[10px] text-slate-400 font-mono font-medium">Fast Node Execution</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-mono text-slate-400 uppercase font-bold">Active Workflows</p>
          <p className="text-2xl font-black text-[#ff6d5a] mt-1">5 Running</p>
          <span className="text-[10px] text-slate-400 font-mono font-medium">Continuous Telemetry</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search executions, workflows, triggers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-9 pr-4 text-xs font-sans rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ff6d5a] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(["all", "success", "error"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                statusFilter === st
                  ? "bg-[#ff6d5a]/15 text-[#ea4b35] font-bold"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {st} ({executions.filter((e) => st === "all" || (st === "success" ? e.status === "success" : e.status === "error")).length})
            </button>
          ))}
        </div>
      </div>

      {/* Executions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Workflow Name</th>
                <th className="py-3 px-4 font-bold">Trigger Source</th>
                <th className="py-3 px-4 font-bold">Started</th>
                <th className="py-3 px-4 font-bold">Duration</th>
                <th className="py-3 px-4 font-bold">Steps / Items</th>
                <th className="py-3 px-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredExecutions.map((exec) => (
                <tr
                  key={exec.id}
                  onClick={() => setSelectedExecution(exec)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {exec.status === "success" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono text-[10px] font-bold border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-500" />
                        Error
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 max-w-[240px]">
                    <p className="font-bold text-slate-900 group-hover:text-[#ea4b35] transition-colors truncate">
                      {exec.workflowName}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">{exec.id}</p>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                      {exec.triggerSource}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {exec.startedAt}
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px] whitespace-nowrap">
                    {exec.durationMs}ms
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                    <span className="font-bold text-slate-800">
                      {exec.stepsCompleted}/{exec.stepsTotal} nodes
                    </span>
                    <span className="text-slate-400 ml-1.5">
                      ({exec.itemsProcessed} {exec.itemsProcessed === 1 ? "item" : "items"})
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedExecution(exec)}
                        className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Logs
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] border-slate-200 hover:border-[#ff6d5a] hover:text-[#ea4b35]"
                      >
                        <Link href={`/automation?workflowId=${exec.workflowId}`}>
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Canvas
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Details Drawer Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900">
                      {selectedExecution.workflowName}
                    </h3>
                    <Badge
                      className={cn(
                        "text-[10px] font-mono uppercase",
                        selectedExecution.status === "success"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      )}
                    >
                      {selectedExecution.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Execution ID: {selectedExecution.id} • Started {selectedExecution.startedAt} • Took {selectedExecution.durationMs}ms
                  </p>
                </div>
                <button
                  onClick={() => setSelectedExecution(null)}
                  className="text-slate-400 hover:text-slate-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              {selectedExecution.errorSnippet && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-mono">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Execution Error:</span>
                  </div>
                  {selectedExecution.errorSnippet}
                </div>
              )}

              {/* Node By Node Telemetry Timeline */}
              <div className="mt-5 space-y-2.5 overflow-y-auto max-h-[45vh] pr-1">
                <p className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                  Executed Steps ({selectedExecution.logs.length})
                </p>

                <div className="space-y-2">
                  {selectedExecution.logs.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200/90 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{step.nodeName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{step.message}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {step.durationMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button asChild size="sm" className="bg-[#ff6d5a] hover:bg-[#ea4b35] text-white font-bold text-xs h-8.5 px-4 rounded-xl">
                <Link href={`/automation?workflowId=${selectedExecution.workflowId}`}>
                  <Layers className="w-3.5 h-3.5 mr-1.5" />
                  <span>Inspect on Live Canvas</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedExecution(null)}
                className="h-8.5 text-xs border-slate-200"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
