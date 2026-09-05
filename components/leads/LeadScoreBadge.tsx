"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LeadScoreBadge({ score, priority }: { score?: number | null; priority?: string | null }) {
  const num = typeof score === "number" ? score : 0;
  let color = "bg-muted text-muted-foreground border-border";

  if (num >= 80) {
    color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (num >= 50) {
    color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  } else if (num > 0) {
    color = "bg-rose-500/10 text-rose-400 border-rose-500/20";
  }

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className={cn("text-xs font-semibold tabular-nums", color)}>
        {num}
      </Badge>
      {priority && (
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {priority}
        </span>
      )}
    </div>
  );
}
