"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  scraped: { label: "Scraped", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  checking: { label: "Checking", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  qualified: { label: "Qualified", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  website_building: { label: "Building Site", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  website_deployed: { label: "Site Deployed", className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  contacted: { label: "Contacted", className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  replied: { label: "Replied", className: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  interested: { label: "Interested", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  won: { label: "Won", className: "bg-amber-400/20 text-amber-300 border-amber-400/30" },
};

export function LeadStatusBadge({ status }: { status?: string }) {
  const normalized = status ? status.toLowerCase() : "new";
  const config = statusStyles[normalized] || { label: status || "Unknown", className: "bg-muted text-muted-foreground" };

  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium capitalize", config.className)}>
      {config.label}
    </Badge>
  );
}
