"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Globe,
  MessageSquare,
  Rocket,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ActivityItem } from "@/lib/types";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

const typeIcon: Record<ActivityItem["type"], LucideIcon> = {
  lead: Users,
  campaign: Target,
  website: Globe,
  deployment: Rocket,
  message: MessageSquare,
  agent: Bot,
  system: Bot,
};

const statusDot: Record<ActivityItem["status"], string> = {
  success: "bg-emerald-400",
  error: "bg-rose-400",
  info: "bg-sky-400",
  pending: "bg-amber-400",
};

export function ActivityFeed({
  items,
  limit,
}: {
  items: ActivityItem[];
  limit?: number;
}) {
  const list = limit ? items.slice(0, limit) : items;
  return (
    <div className="space-y-0.5">
      {list.map((item, index) => {
        const Icon = typeIcon[item.type];
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className="flex gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/40"
          >
            <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-background",
                  statusDot[item.status]
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{item.title}</p>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatRelative(item.timestamp)}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {item.description ?? item.actor}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}