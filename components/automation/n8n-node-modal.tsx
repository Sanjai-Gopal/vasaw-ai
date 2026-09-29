"use client";

import * as React from "react";
import {
  X,
  Play,
  Copy,
  Check,
  Code,
  Sliders,
  Database,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Power,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Send,
  Braces,
  Table,
  KeyRound,
  ExternalLink,
  HelpCircle,
  Plus,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { FlowNode, NodeTypeDefinition, WorkflowCredential } from "@/lib/types/automation-flow";
import { NODE_TYPE_REGISTRY } from "@/lib/data/automation-registry";

interface N8nNodeModalProps {
  node: FlowNode | null;
  upstreamNode?: FlowNode | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateParameters: (nodeId: string, params: Record<string, any>) => void;
  onUpdateName: (nodeId: string, name: string) => void;
  onToggleDisable: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onRunStep: (nodeId: string) => void;
}

export function N8nNodeModal({
  node,
  upstreamNode,
  isOpen,
  onClose,
  onUpdateParameters,
  onUpdateName,
  onToggleDisable,
  onDeleteNode,
  onRunStep,
}: N8nNodeModalProps) {
  const [activeTab, setActiveTab] = React.useState<"parameters" | "settings">("parameters");
  const [inputViewMode, setInputViewMode] = React.useState<"json" | "table">("json");
  const [outputViewMode, setOutputViewMode] = React.useState<"json" | "table">("json");
  const [copiedInput, setCopiedInput] = React.useState(false);
  const [copiedOutput, setCopiedOutput] = React.useState(false);

  // Expression mode toggles per parameter
  const [expressionModes, setExpressionModes] = React.useState<Record<string, boolean>>({});

  const [liveOutput, setLiveOutput] = React.useState<Record<string, any> | null>(null);

  // Input search
  const [inputSearch, setInputSearch] = React.useState("");

  // Stored credentials
  const [credentials, setCredentials] = React.useState<WorkflowCredential[]>([]);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vasaw_n8n_credentials");
      if (saved) {
        try {
          setCredentials(JSON.parse(saved));
        } catch {
          // fallback
        }
      }
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (node?.outputData) {
      setLiveOutput(node.outputData);
    }
  }, [node?.outputData, node?.id]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !node) return null;

  const def: NodeTypeDefinition = NODE_TYPE_REGISTRY[node.type] || {
    type: node.type,
    name: node.name,
    category: "integration",
    description: "Custom node step",
    iconName: "Layers",
    badgeText: "Node",
    colorScheme: {
      bg: "bg-slate-500/10",
      border: "border-slate-500/30",
      text: "text-slate-400",
      accent: "#94a3b8",
      glow: "rgba(148, 163, 184, 0.2)",
      headerBg: "bg-slate-500/15",
    },
    inputs: [],
    outputs: [],
    parameters: [],
    defaultData: { parameters: {}, defaultOutput: {} },
  };

  const inputPayload = upstreamNode?.outputData || def.defaultData.defaultOutput || {};
  const currentOutput = liveOutput || node.outputData || def.defaultData.defaultOutput;

  // The page owns the single local simulation, so opening this editor cannot duplicate a run.
  const handlePreviewStep = () => {
    if (!node.disabled && node.status !== "running") onRunStep(node.id);
  };

  const handleCopyText = (text: string, isOutput = false) => {
    navigator.clipboard.writeText(text);
    if (isOutput) {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 1500);
    } else {
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 1500);
    }
  };

  const toggleExpressionMode = (paramId: string) => {
    setExpressionModes((prev) => ({
      ...prev,
      [paramId]: !prev[paramId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-[96vw] h-[92vh] bg-[#1a1c22] border border-[#2d313c] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Top Header Bar */}
        <div className="h-14 border-b border-[#2d313c] px-4 sm:px-6 flex items-center justify-between bg-[#15161b] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 text-white"
              style={{ backgroundColor: def.colorScheme.accent }}
            >
              <Zap className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={node.name}
                onChange={(e) => onUpdateName(node.id, e.target.value)}
                className="font-bold text-sm text-white bg-transparent hover:bg-[#252831] px-2 py-0.5 rounded border border-transparent focus:border-slate-600 outline-none transition-colors truncate"
              />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                {def.badgeText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
              {node.status === "success" && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {node.executionTimeMs ? `${node.executionTimeMs}ms · preview` : "Preview complete"}
                </span>
              )}
              {node.status === "error" && (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Failed
                </span>
              )}
            </div>

            {/* Local sample preview button */}
            <Button
              size="sm"
              onClick={handlePreviewStep}
              disabled={node.disabled || node.status === "running"}
              title="Preview with local sample data; no service is contacted"
              className="h-8 px-3.5 rounded-xl bg-[#ff6d5a] hover:bg-[#ea4b35] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#ff6d5a]/25 active:scale-95"
            >
              {node.status === "running" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Previewing…</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Preview step</span>
                </>
              )}
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3-Pane Body Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* PANE 1: INPUT DATA (Left - 3.5 cols) */}
          <div className="lg:col-span-3 border-r border-[#2d313c] flex flex-col bg-[#16171d] overflow-hidden">
            <div className="h-10 border-b border-[#2d313c] px-3.5 flex items-center justify-between bg-[#191a21]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                  Sample input
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {Object.keys(inputPayload).length} keys
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setInputViewMode("json")}
                  className={cn(
                    "p-1 rounded text-[10px] font-mono font-bold uppercase transition-colors",
                    inputViewMode === "json" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                  )}
                  title="JSON View"
                >
                  <Braces className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setInputViewMode("table")}
                  className={cn(
                    "p-1 rounded text-[10px] font-mono font-bold uppercase transition-colors",
                    inputViewMode === "table" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                  )}
                  title="Table View"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleCopyText(JSON.stringify(inputPayload, null, 2), false)}
                  className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                  title="Copy Input JSON"
                >
                  {copiedInput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="border-b border-blue-900/40 bg-blue-950/20 px-3 py-2 text-[10px] text-blue-200/70">
              Connected preview data or the node&apos;s local example
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs">
              {inputViewMode === "json" ? (
                <pre className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap select-text">
                  {JSON.stringify(inputPayload, null, 2)}
                </pre>
              ) : (
                <div className="space-y-1">
                  {Object.entries(inputPayload).map(([k, v]) => (
                    <div key={k} className="p-2 rounded bg-slate-900/60 border border-slate-800/80 text-[11px]">
                      <span className="text-[#ff6d5a] font-bold">{k}: </span>
                      <span className="text-slate-300">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PANE 2: PARAMETERS & EXPRESSIONS (Center - 5.5 cols) */}
          <div className="lg:col-span-5 border-r border-[#2d313c] flex flex-col bg-[#1a1c22] overflow-hidden">
            <div className="h-10 border-b border-[#2d313c] px-4 flex items-center justify-between bg-[#191a21]">
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setActiveTab("parameters")}
                  className={cn(
                    "font-bold transition-colors py-2 border-b-2",
                    activeTab === "parameters"
                      ? "border-[#ff6d5a] text-white"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  Parameters
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={cn(
                    "font-bold transition-colors py-2 border-b-2",
                    activeTab === "settings"
                      ? "border-[#ff6d5a] text-white"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  Settings
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                Expression Mode: {"{{ $json.field }}"}
              </span>
            </div>

            {/* Parameter Controls List */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5">
              {activeTab === "parameters" ? (
                <>
                  {/* Credential Selector */}
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#ff6d5a]" />
                        <span>Credential to connect with</span>
                      </label>
                      <a
                        href="/credentials"
                        target="_blank"
                        className="text-[10px] font-mono text-[#ff6d5a] hover:underline flex items-center gap-1"
                      >
                        Manage
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <select
                      value={node.parameters.credentialId || "default"}
                      onChange={(e) =>
                        onUpdateParameters(node.id, {
                          ...node.parameters,
                          credentialId: e.target.value,
                        })
                      }
                      className="w-full h-8.5 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200 focus:outline-none focus:border-[#ff6d5a]"
                    >
                      <option value="default">Default Provider Key (Environment)</option>
                      {credentials.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Node Parameters */}
                  {def.parameters.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-mono">
                      No additional parameters required for this node.
                    </div>
                  ) : (
                    def.parameters.map((param) => {
                      const isExpr = expressionModes[param.id] || false;
                      const currentValue = node.parameters[param.name] ?? param.defaultValue ?? "";

                      return (
                        <div key={param.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <label className="font-bold text-slate-200">{param.label}</label>

                            {/* Expression Mode Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleExpressionMode(param.id)}
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors border",
                                isExpr
                                  ? "bg-[#ff6d5a]/20 border-[#ff6d5a] text-[#ff6d5a]"
                                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                              )}
                              title="Toggle fixed value vs JavaScript expression"
                            >
                              {isExpr ? "Expression [fx]" : "Fixed"}
                            </button>
                          </div>

                          {param.description && (
                            <p className="text-[11px] text-slate-400 leading-tight">
                              {param.description}
                            </p>
                          )}

                          {isExpr ? (
                            <div className="relative">
                              <input
                                type="text"
                                value={currentValue}
                                onChange={(e) =>
                                  onUpdateParameters(node.id, {
                                    ...node.parameters,
                                    [param.name]: e.target.value,
                                  })
                                }
                                placeholder="{{ $json.fieldName }}"
                                className="w-full h-8.5 rounded-lg border border-[#ff6d5a]/60 bg-slate-950 px-3 font-mono text-xs text-[#ff6d5a] focus:outline-none focus:ring-1 focus:ring-[#ff6d5a]"
                              />
                            </div>
                          ) : param.type === "select" ? (
                            <select
                              value={currentValue}
                              onChange={(e) =>
                                onUpdateParameters(node.id, {
                                  ...node.parameters,
                                  [param.name]: e.target.value,
                                })
                              }
                              className="w-full h-8.5 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200 focus:outline-none focus:border-[#ff6d5a]"
                            >
                              {param.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : param.type === "boolean" ? (
                            <div className="flex items-center gap-3 pt-1">
                              <Switch
                                checked={Boolean(currentValue)}
                                onCheckedChange={(val) =>
                                  onUpdateParameters(node.id, {
                                    ...node.parameters,
                                    [param.name]: val,
                                  })
                                }
                              />
                              <span className="text-xs text-slate-300 font-mono">
                                {currentValue ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          ) : param.type === "textarea" ? (
                            <textarea
                              rows={4}
                              value={currentValue}
                              onChange={(e) =>
                                onUpdateParameters(node.id, {
                                  ...node.parameters,
                                  [param.name]: e.target.value,
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#ff6d5a]"
                            />
                          ) : (
                            <input
                              type={param.type === "number" ? "number" : "text"}
                              value={currentValue}
                              onChange={(e) =>
                                onUpdateParameters(node.id, {
                                  ...node.parameters,
                                  [param.name]:
                                    param.type === "number"
                                      ? Number(e.target.value)
                                      : e.target.value,
                                })
                              }
                              className="w-full h-8.5 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200 focus:outline-none focus:border-[#ff6d5a]"
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              ) : (
                /* Settings Tab */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">Disable Node</p>
                        <p className="text-[10px] text-slate-400">
                          Pass-through items without executing this step
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(node.disabled)}
                        onCheckedChange={() => onToggleDisable(node.id)}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-rose-300">Delete Node</p>
                      <p className="text-[10px] text-rose-400/80">
                        Remove from workflow and sever connections
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        onDeleteNode(node.id);
                        onClose();
                      }}
                      className="h-8 text-xs font-bold"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PANE 3: OUTPUT DATA (Right - 3.5 cols) */}
          <div className="lg:col-span-4 flex flex-col bg-[#16171d] overflow-hidden">
            <div className="h-10 border-b border-[#2d313c] px-3.5 flex items-center justify-between bg-[#191a21]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                  Sample output
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
                  {Object.keys(currentOutput).length} keys
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOutputViewMode("json")}
                  className={cn(
                    "p-1 rounded text-[10px] font-mono font-bold uppercase transition-colors",
                    outputViewMode === "json" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                  )}
                  title="JSON View"
                >
                  <Braces className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOutputViewMode("table")}
                  className={cn(
                    "p-1 rounded text-[10px] font-mono font-bold uppercase transition-colors",
                    outputViewMode === "table" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                  )}
                  title="Table View"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleCopyText(JSON.stringify(currentOutput, null, 2), true)}
                  className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                  title="Copy Output JSON"
                >
                  {copiedOutput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="border-b border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-[10px] text-emerald-300/80">
              Local mock data · no integration request is sent
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs">
              {outputViewMode === "json" ? (
                <pre className="text-emerald-300/90 text-[11px] leading-relaxed whitespace-pre-wrap select-text">
                  {JSON.stringify(currentOutput, null, 2)}
                </pre>
              ) : (
                <div className="space-y-1">
                  {Object.entries(currentOutput).map(([k, v]) => (
                    <div key={k} className="p-2 rounded bg-slate-900/60 border border-slate-800/80 text-[11px]">
                      <span className="text-emerald-400 font-bold">{k}: </span>
                      <span className="text-slate-300">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
