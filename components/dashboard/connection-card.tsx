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
import { Card } from "@/components/ui/card";
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
  connected: { label: "Connected", variant: "success" as const, dot: "bg-emerald-400" },
  not_connected: { label: "Not connected", variant: "muted" as const, dot: "bg-zinc-500" },
  connecting: { label: "Connecting…", variant: "info" as const, dot: "bg-sky-400" },
  error: { label: "Needs attention", variant: "destructive" as const, dot: "bg-rose-400" },
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
  const Icon = connectionIcon[connection.id];
  const meta = statusMeta[connection.status];
  const connected = connection.status === "connected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <Badge variant={meta.variant}>
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {connection.status === "connecting" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            {meta.label}
          </Badge>
        </div>

        <p className="mt-3 font-semibold">{connection.name}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {connection.description}
        </p>

        <div className="mt-3 space-y-1.5 rounded-lg border border-border bg-muted/40 p-3">
          {connection.config.map((c) => (
            <div key={c.key} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{c.key}</span>
              <span className="font-mono font-medium">{c.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium">{connection.plan}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            {connected
              ? `Last sync ${connection.lastSync ? formatRelative(connection.lastSync) : "—"}`
              : "No sync recorded yet"}
          </p>
          <Button
            variant={connected ? "outline" : "default"}
            size="sm"
            className="gap-1.5"
            disabled={connection.status === "connecting"}
            onClick={onAction}
          >
            {connected ? <PlugZap className="h-4 w-4" /> : <Plug className="h-4 w-4" />}
            {connected ? "Configure" : connection.status === "error" ? "Reconnect" : "Connect"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}