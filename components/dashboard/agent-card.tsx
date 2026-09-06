"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, AlertTriangle, Pause } from "lucide-react";
import type { Agent, AgentStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { agentStatusMeta } from "@/lib/status";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusIcon: Record<AgentStatus, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  online: CheckCircle2,
  running: Loader2,
  idle: Circle,
  error: AlertTriangle,
  paused: Pause,
  offline: Circle,
};

const statusColor: Record<AgentStatus, string> = {
  healthy: "text-emerald-500",
  online: "text-emerald-500",
  running: "text-blue-600",
  idle: "text-slate-400",
  error: "text-rose-500",
  paused: "text-amber-500",
  offline: "text-slate-300",
};

export function AgentCard({ agent, index = 0 }: { agent: Agent; index?: number }) {
  const meta = agentStatusMeta[agent.status];
  const Icon = statusIcon[agent.status];
  const successRate =
    agent.totalRuns > 0 ? Math.round((agent.successRuns / agent.totalRuns) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift">
        {/* Top subtle hairline accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 opacity-60" />

        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br shadow-xs",
                  agent.status === "error"
                    ? "from-rose-50 to-rose-100/50 border-rose-200"
                    : agent.status === "running"
                      ? "from-blue-50 to-cyan-50 border-blue-200"
                      : "from-slate-50 to-slate-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    statusColor[agent.status],
                    agent.status === "running" && "animate-spin"
                  )}
                />
              </div>
              <div>
                <p className="font-display text-base font-bold tracking-tight text-slate-950">{agent.name}</p>
                <p className="font-sans text-xs text-slate-500">
                  Last active {formatRelative(agent.lastRun)}
                </p>
              </div>
            </div>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>

          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600 font-sans">
            {agent.description}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-wider text-slate-400">TOTAL</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-slate-800">{agent.totalRuns}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-wider text-slate-400">SUCCESS</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-emerald-600">
                {agent.successRuns}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-wider text-slate-400">FAILED</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-rose-500">{agent.failedRuns}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs font-sans">
              <span className="font-medium text-slate-500">Reliability SLA</span>
              <span className="font-mono font-bold text-slate-800">{successRate}%</span>
            </div>
            <Progress
              value={successRate}
              indicatorClassName={
                successRate >= 90
                  ? "bg-emerald-500"
                  : successRate >= 75
                    ? "bg-amber-500"
                    : "bg-rose-500"
              }
            />
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recent Activity
          </p>
          <div className="space-y-2">
            {agent.recentActivity.slice(0, 2).map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    a.status === "success"
                      ? "bg-emerald-500"
                      : a.status === "error"
                        ? "bg-rose-500"
                        : "bg-blue-500"
                  )}
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-700">{a.title}</p>
                  <p className="font-mono text-[10px] text-slate-400">
                    {formatRelative(a.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}