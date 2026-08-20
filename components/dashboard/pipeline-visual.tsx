"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, Loader2, AlertTriangle } from "lucide-react";
import type { PipelineStage } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const statusConfig = {
  healthy: { icon: CheckCircle2, className: "text-emerald-400", label: "Healthy" },
  running: { icon: Loader2, className: "text-primary", label: "Running", spin: true },
  idle: { icon: Circle, className: "text-muted-foreground", label: "Idle" },
  error: { icon: AlertTriangle, className: "text-rose-400", label: "Attention" },
  paused: { icon: Circle, className: "text-amber-400", label: "Paused" },
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
            <Card className="h-full p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <StatusIcon
                  className={cn(
                    "h-4 w-4",
                    cfg.className,
                    "spin" in cfg && cfg.spin && "animate-spin"
                  )}
                />
              </div>
              <p className="mt-3 text-sm font-semibold">{stage.label}</p>
              {showLabels && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {stage.agentName}
                </p>
              )}
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${stage.completed}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {stage.completed}% processed
              </p>
            </Card>
            {index < stages.length - 1 && (
              <ArrowRight className="absolute -right-3.5 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/60 xl:block" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}