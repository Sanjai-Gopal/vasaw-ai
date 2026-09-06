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

const accentTopGradients: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "from-blue-600 to-indigo-500",
  success: "from-emerald-500 to-teal-400",
  warning: "from-amber-500 to-orange-400",
  info: "from-cyan-500 to-blue-500",
  destructive: "from-rose-500 to-pink-500",
};

const accentIconBg: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-blue-50 text-blue-600 border-blue-200",
  success: "bg-emerald-50 text-emerald-600 border-emerald-200",
  warning: "bg-amber-50 text-amber-600 border-amber-200",
  info: "bg-cyan-50 text-cyan-600 border-cyan-200",
  destructive: "bg-rose-50 text-rose-600 border-rose-200",
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <div className="relative p-4.5 rounded-2xl bg-white border border-slate-200/80 hover-lift shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden group">
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-90",
            accentTopGradients[accent]
          )}
        />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-500 tracking-tight">{title}</p>
            <p className="mt-2 text-[28px] font-mono font-bold text-slate-950 tracking-[-0.035em] leading-none">
              {value}
            </p>
            {delta !== undefined && (
              <div
                className={cn(
                  "mt-2.5 inline-flex items-center gap-1 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded",
                  positive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    : "bg-rose-50 text-rose-700 border border-rose-200/60"
                )}
              >
                {positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{positive ? "+" : ""}{delta}%</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal ml-0.5">{hint ?? "vs last week"}</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "rounded-xl border p-2.5 shadow-xs transition-transform group-hover:scale-105",
              accentIconBg[accent]
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}