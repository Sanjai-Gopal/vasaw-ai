"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, Loader2, AlertTriangle } from "lucide-react";
import type { PipelineStage } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusConfig = {
  healthy: { icon: CheckCircle2, className: "text-emerald-500", label: "Healthy" },
  online: { icon: CheckCircle2, className: "text-emerald-500", label: "Online" },
  running: { icon: Loader2, className: "text-primary", label: "Running", spin: true },
  idle: { icon: Circle, className: "text-slate-400", label: "Idle" },
  error: { icon: AlertTriangle, className: "text-rose-500", label: "Attention" },
  paused: { icon: Circle, className: "text-amber-500", label: "Paused" },
  offline: { icon: Circle, className: "text-slate-300", label: "Offline" },
} as const;

export function PipelineVisual({
  stages,
  showLabels = true,
}: {
  stages: PipelineStage[];
  showLabels?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {stages.map((stage, index) => {
        const cfg = statusConfig[stage.status];
        const StatusIcon = cfg.icon;
        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            className="relative"
          >
            <div className="h-full rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400">
                  STAGE {String(index + 1).padStart(2, "0")}
                </span>
                <StatusIcon
                  className={cn(
                    "h-4 w-4",
                    cfg.className,
                    "spin" in cfg && cfg.spin && "animate-spin"
                  )}
                />
              </div>
              <p className="mt-3 font-display text-sm font-bold text-slate-950">{stage.label}</p>
              {showLabels && (
                <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                  {stage.agentName}
                </p>
              )}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 transition-all duration-500"
                  style={{ width: `${stage.completed}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-400">
                <span>PROGRESS</span>
                <span className="font-bold text-slate-700">{stage.completed}%</span>
              </div>
            </div>
            {index < stages.length - 1 && (
              <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 xl:block">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xs">
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}