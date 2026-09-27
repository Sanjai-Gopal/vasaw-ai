"use client";

import * as React from "react";
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionLog } from "@/lib/types/automation-flow";

interface ExecutionConsoleProps {
  logs: ExecutionLog[];
  isExecuting: boolean;
  totalDurationMs: number;
  completedNodesCount: number;
  totalNodesCount: number;
  onClearLogs: () => void;
}

export function ExecutionConsole({
  logs,
  isExecuting,
  totalDurationMs,
  completedNodesCount,
  totalNodesCount,
  onClearLogs,
}: ExecutionConsoleProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const logEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isExpanded) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isExpanded]);

  if (logs.length === 0 && !isExecuting) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 transition-all duration-200 shadow-2xl flex flex-col font-mono",
        isExpanded ? "h-64" : "h-10"
      )}
    >
      {/* Console Top Header Bar */}
      <div className="h-10 px-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>Telemetry &amp; Execution Console</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Live Execution Status Indicator */}
          {isExecuting ? (
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>
                Running: {completedNodesCount} / {totalNodesCount} nodes
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Execution Complete ({totalDurationMs}ms)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-[11px] flex items-center gap-1"
              title="Clear Console Output"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Console Log Stream Body */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-[11px] bg-slate-950 font-mono">
          {logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 py-0.5 hover:bg-slate-900/60 px-2 rounded transition-colors"
              >
                <span className="text-slate-500 shrink-0 text-[10px]">{timeStr}</span>

                <span
                  className={cn(
                    "font-bold uppercase text-[9px] px-1.5 py-0.2 rounded shrink-0",
                    log.level === "success"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : log.level === "error"
                      ? "bg-rose-950 text-rose-400 border border-rose-800"
                      : log.level === "warn"
                      ? "bg-amber-950 text-amber-400 border border-amber-800"
                      : "bg-blue-950 text-blue-400 border border-blue-800"
                  )}
                >
                  {log.level}
                </span>

                <span className="text-slate-400 font-semibold shrink-0">[{log.nodeName}]</span>

                <span className="text-slate-200 flex-1 break-all">{log.message}</span>

                {log.durationMs && (
                  <span className="text-slate-500 text-[10px] shrink-0">
                    +{log.durationMs}ms
                  </span>
                )}
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}
