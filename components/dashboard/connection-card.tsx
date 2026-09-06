"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Database,
  Brain,
  GitBranch,
  Triangle,
  MessageCircle,
  FileSpreadsheet,
  Plug,
  PlugZap,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import type { Connection } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

const connectionIcon: Record<Connection["id"], LucideIcon> = {
  apify: Bot,
  supabase: Database,
  openai: Brain,
  github: GitBranch,
  vercel: Triangle,
  whatsapp: MessageCircle,
  google_sheets: FileSpreadsheet,
};

const statusMeta = {
  connected: { label: "Connected", variant: "success" as const, dot: "bg-emerald-500" },
  not_connected: { label: "Not connected", variant: "muted" as const, dot: "bg-slate-400" },
  connecting: { label: "Connecting…", variant: "info" as const, dot: "bg-blue-500" },
  error: { label: "Needs attention", variant: "destructive" as const, dot: "bg-rose-500" },
};

export function ConnectionCard({
  connection,
  index = 0,
  onAction,
}: {
  connection: Connection;
  index?: number;
  onAction?: () => void;
}) {
  const Icon = connectionIcon[connection.id] || Plug;
  const meta = statusMeta[connection.status];
  const connected = connection.status === "connected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 shadow-xs">
              <Icon className="h-5 w-5 text-slate-700" />
            </div>
            <Badge variant={meta.variant}>
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
              {connection.status === "connecting" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
              {meta.label}
            </Badge>
          </div>

          <p className="mt-3.5 font-display text-base font-bold tracking-tight text-slate-950">{connection.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 font-sans">
            {connection.description}
          </p>

          <div className="mt-4 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            {connection.config.map((c) => (
              <div key={c.key} className="flex items-center justify-between text-xs">
                <span className="font-sans text-slate-500">{c.key}</span>
                <span className="font-mono font-bold text-slate-800">{c.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs">
              <span className="font-sans text-slate-500">Tier / Plan</span>
              <span className="font-mono font-bold text-slate-800">{connection.plan}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="font-mono text-[11px] text-slate-400">
            {connected
              ? `Synced ${connection.lastSync ? formatRelative(connection.lastSync) : "—"}`
              : "No sync recorded"}
          </p>
          <Button
            variant={connected ? "outline" : "default"}
            size="sm"
            className="gap-1.5 font-sans text-xs"
            disabled={connection.status === "connecting"}
            onClick={onAction}
          >
            {connected ? <PlugZap className="h-3.5 w-3.5" /> : <Plug className="h-3.5 w-3.5" />}
            {connected ? "Configure" : connection.status === "error" ? "Reconnect" : "Connect"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}