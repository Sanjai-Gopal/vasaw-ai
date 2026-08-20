"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "info" | "destructive";
  index?: number;
}

const accentMap: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "from-violet-500/20 to-violet-500/5 text-violet-400",
  success: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
  warning: "from-amber-500/20 to-amber-500/5 text-amber-400",
  info: "from-sky-500/20 to-sky-500/5 text-sky-400",
  destructive: "from-rose-500/20 to-rose-500/5 text-rose-400",
};

export function StatCard({
  title,
  value,
  delta,
  icon: Icon,
  hint,
  accent = "primary",
  index = 0,
}: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Card className="group relative overflow-hidden p-5">
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
          )}
        />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            {delta !== undefined && (
              <p
                className={cn(
                  "mt-2 flex items-center gap-1 text-xs font-medium",
                  positive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {positive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {positive ? "+" : ""}
                {delta}% {hint ?? "vs last week"}
              </p>
            )}
          </div>
          <div
            className={cn(
              "rounded-xl bg-gradient-to-br p-2.5",
              accentMap[accent]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}