"use client";

import * as React from "react";
import {
  Zap,
  Clock,
  Compass,
  Database,
  FileText,
  PlayCircle,
  Sparkles,
  Edit3,
  Layout,
  GitMerge,
  Search,
  GitBranch,
  Globe,
  MessageSquare,
  Mail,
  Send,
  Terminal,
  GitFork,
  Code,
  Filter,
  Timer,
  Play,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlowNode, NodeTypeDefinition } from "@/lib/types/automation-flow";
import { NODE_TYPE_REGISTRY } from "@/lib/data/automation-registry";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Clock,
  Compass,
  Database,
  FileText,
  PlayCircle,
  Sparkles,
  Edit3,
  Layout,
  GitMerge,
  Search,
  GitBranch,
  Globe,
  MessageSquare,
  Mail,
  Send,
  Terminal,
  GitFork,
  Code,
  Filter,
  Timer,
  Layers,
};

interface FlowNodeCardProps {
  node: FlowNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onOpenConfig?: (nodeId: string) => void;
  onRunStep: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onStartConnection: (nodeId: string, portId: string, e: React.MouseEvent) => void;
  onEndConnection: (nodeId: string, portId: string, e: React.MouseEvent) => void;
  isConnecting?: boolean;
}

export const FlowNodeCard = React.memo(function FlowNodeCard({
  node,
  isSelected,
  onSelect,
  onOpenConfig,
  onRunStep,
  onDelete,
  onDuplicate,
  onStartConnection,
  onEndConnection,
  isConnecting,
}: FlowNodeCardProps) {
  const def: NodeTypeDefinition = NODE_TYPE_REGISTRY[node.type] || {
    type: node.type,
    name: node.name,
    category: "integration",
    description: "",
    iconName: "Layers",
    badgeText: "Custom",
    colorScheme: {
      bg: "bg-slate-500/10",
      border: "border-slate-500/30",
      text: "text-slate-400",
      accent: "#94a3b8",
      glow: "rgba(148, 163, 184, 0.2)",
      headerBg: "bg-slate-500/15",
    },
    inputs: [{ id: "in", name: "In", type: "main" }],
    outputs: [{ id: "out", name: "Out", type: "main" }],
    parameters: [],
    defaultData: { parameters: {}, defaultOutput: {} },
  };

  const IconComponent = ICON_MAP[def.iconName] || Layers;

  const isRunning = node.status === "running";
  const isSuccess = node.status === "success";
  const isPreview = node.status === "preview";
  const isError = node.status === "error";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpenConfig?.(node.id);
      }}
      className={cn(
        "group relative select-none rounded-2xl border transition-all duration-150 cursor-pointer shadow-lg",
        "w-[270px] bg-[#1e2027]/95 backdrop-blur-md",
        isSelected
          ? "ring-2 ring-[#ff6d5a] border-[#ff6d5a] shadow-[#ff6d5a]/20 shadow-xl"
          : "border-[#2e323e] hover:border-[#3e4354] shadow-black/40 hover:shadow-xl",
        isRunning && "ring-2 ring-amber-400 border-amber-400 animate-pulse",
        node.disabled && "opacity-50 grayscale"
      )}
      style={{
        boxShadow: isSelected
          ? `0 0 24px ${def.colorScheme.glow || "rgba(255, 109, 90, 0.25)"}, 0 10px 25px -5px rgba(0, 0, 0, 0.5)`
          : undefined,
      }}
    >
      {/* Category Accent Top Strip */}
      <div
        className="h-1.5 w-full rounded-t-2xl transition-all"
        style={{ backgroundColor: def.colorScheme.accent }}
      />


      {/* Input Port Handles (Left Side) */}
      {def.inputs.map((inputPort) => (
        <div
          key={inputPort.id}
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 flex items-center group/port"
          onClick={(e) => {
            e.stopPropagation();
            onEndConnection(node.id, inputPort.id, e);
          }}
          title={`Input: ${inputPort.label || inputPort.name}`}
        >
          <div
            className={cn(
              "w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center transition-transform hover:scale-125",
              isConnecting
                ? "bg-blue-500 ring-4 ring-blue-500/40 animate-pulse scale-110"
                : "bg-slate-700 hover:bg-blue-400"
            )}
          >
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
      ))}

      {/* Output Port Handles (Right Side) */}
      {def.outputs.map((outputPort, idx) => {
        const isBranch = outputPort.type === "branch";
        const isTrueBranch = outputPort.id === "true";
        const isFalseBranch = outputPort.id === "false";

        // Distribute multiple ports vertically
        const topPosition =
          def.outputs.length === 1
            ? "top-1/2 -translate-y-1/2"
            : idx === 0
            ? "top-1/3 -translate-y-1/2"
            : "top-2/3 -translate-y-1/2";

        const portBg = isTrueBranch
          ? "bg-emerald-500 hover:bg-emerald-400"
          : isFalseBranch
          ? "bg-rose-500 hover:bg-rose-400"
          : "bg-slate-700 hover:bg-blue-400";

        return (
          <div
            key={outputPort.id}
            className={cn(
              "absolute -right-3.5 flex items-center group/outport cursor-crosshair",
              topPosition
            )}
            onClick={(e) => {
              e.stopPropagation();
              onStartConnection(node.id, outputPort.id, e);
            }}
            title={`Connect from ${outputPort.label || outputPort.name}`}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center transition-transform hover:scale-125 shadow-sm",
                portBg
              )}
            >
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>

            {/* Label badge for branching outputs */}
            {isBranch && (
              <span
                className={cn(
                  "absolute right-7 font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border pointer-events-none",
                  isTrueBranch
                    ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                    : "bg-rose-950/80 border-rose-800 text-rose-300"
                )}
              >
                {outputPort.name}
              </span>
            )}
          </div>
        );
      })}

      {/* Main Node Content Body */}
      <div className="p-4 space-y-3">
        {/* Node Header: Icon, Name & Type Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-inner transition-transform group-hover:scale-105",
                def.colorScheme.bg,
                def.colorScheme.border
              )}
            >
              <IconComponent
                className="w-4 h-4"
                style={{ color: def.colorScheme.accent }}
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-semibold text-white tracking-tight truncate leading-snug">
                {node.name}
              </h4>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                {def.badgeText}
              </p>
            </div>
          </div>

          {/* Quick Step Runner Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRunStep(node.id);
            }}
            disabled={isRunning}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Preview this step with local sample data"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current opacity-70 hover:opacity-100" />
            )}
          </button>
        </div>

        {/* Node Parameter Highlights */}
        <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2 text-[11px] font-mono text-slate-300 space-y-1">
          {Object.entries(node.parameters)
            .slice(0, 2)
            .map(([key, val]) => (
              <div key={key} className="flex items-center justify-between truncate gap-2">
                <span className="text-slate-500 truncate text-[10px]">{key}:</span>
                <span className="text-slate-200 truncate font-medium text-[10px]">
                  {typeof val === "boolean"
                    ? val
                      ? "true"
                      : "false"
                    : typeof val === "object"
                    ? "{...}"
                    : String(val)}
                </span>
              </div>
            ))}
        </div>

        {/* Node Execution Status Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            {isRunning && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                <span className="text-amber-400 font-semibold">Running...</span>
              </>
            )}
            {isSuccess && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">
                  {node.executionTimeMs ? `${node.executionTimeMs}ms · preview` : "Preview complete"}
                </span>
              </>
            )}
            {isPreview && (
              <>
                <CheckCircle2 className="w-3 h-3 text-amber-300" />
                <span className="text-amber-300 font-semibold">Preview only · no action</span>
              </>
            )}
            {isError && (
              <>
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400 font-semibold">Failed</span>
              </>
            )}
            {node.status === "skipped" && (
              <span className="text-slate-500">Skipped</span>
            )}
            {node.status === "idle" && (
              <span className="text-slate-500">Standby</span>
            )}
          </div>

          {node.itemsCount !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
              {node.itemsCount} {node.itemsCount === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </div>

      {/* Floating Action Menu on Node Hover */}
      <div className="absolute -top-3.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-md">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(node.id);
          }}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          title="Duplicate Node"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400"
          title="Delete Node"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});
