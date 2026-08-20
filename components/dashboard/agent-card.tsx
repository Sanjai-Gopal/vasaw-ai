"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, AlertTriangle, Pause } from "lucide-react";
import type { Agent, AgentStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
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
  healthy: "text-emerald-400",
  online: "text-emerald-400",
  running: "text-primary",
  idle: "text-muted-foreground",
  error: "text-rose-400",
  paused: "text-amber-400",
  offline: "text-zinc-500",
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
      <Card className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-gradient-to-br",
                agent.status === "error"
                  ? "from-rose-500/20 to-rose-500/5"
                  : "from-violet-500/20 to-cyan-500/5"
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
              <p className="font-semibold">{agent.name}</p>
              <p className="text-xs text-muted-foreground">
                Last run {formatRelative(agent.lastRun)}
              </p>
            </div>
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>

        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {agent.description}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Total runs</p>
            <p className="mt-0.5 text-sm font-semibold">{agent.totalRuns}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Success</p>
            <p className="mt-0.5 text-sm font-semibold text-emerald-400">
              {agent.successRuns}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Failed</p>
            <p className="mt-0.5 text-sm font-semibold text-rose-400">{agent.failedRuns}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Success rate</span>
            <span className="font-medium">{successRate}%</span>
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

        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Recent activity
          </p>
          <div className="space-y-2">
            {agent.recentActivity.slice(0, 2).map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    a.status === "success"
                      ? "bg-emerald-400"
                      : a.status === "error"
                        ? "bg-rose-400"
                        : "bg-sky-400"
                  )}
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatRelative(a.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}