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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { FlowNode, NodeTypeDefinition } from "@/lib/types/automation-flow";
import { NODE_TYPE_REGISTRY } from "@/lib/data/automation-registry";

interface NodeInspectorDrawerProps {
  node: FlowNode | null;
  onClose: () => void;
  onUpdateParameters: (nodeId: string, params: Record<string, any>) => void;
  onUpdateName: (nodeId: string, name: string) => void;
  onToggleDisable: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onRunStep: (nodeId: string) => void;
}

export function NodeInspectorDrawer({
  node,
  onClose,
  onUpdateParameters,
  onUpdateName,
  onToggleDisable,
  onDeleteNode,
  onRunStep,
}: NodeInspectorDrawerProps) {
  const [activeTab, setActiveTab] = React.useState<"params" | "input" | "output">("params");
  const [copied, setCopied] = React.useState(false);

  // Email test sending state
  const [testEmailTo, setTestEmailTo] = React.useState(node?.parameters?.to || "founder@kovaibakery.com");
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [emailSendResult, setEmailSendResult] = React.useState<{ ok: boolean; message: string; messageId?: string } | null>(null);

  React.useEffect(() => {
    if (node?.parameters?.to) {
      setTestEmailTo(node.parameters.to);
    }
  }, [node?.id, node?.parameters?.to]);

  if (!node) return null;

  const def: NodeTypeDefinition = NODE_TYPE_REGISTRY[node.type] || {
    type: node.type,
    name: node.name,
    category: "integration",
    description: "Custom node configuration",
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

  const handleParamChange = (key: string, value: any) => {
    onUpdateParameters(node.id, {
      ...node.parameters,
      [key]: value,
    });
  };

  const handleCopyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSendRealEmail = async () => {
    if (!testEmailTo || !testEmailTo.includes("@")) {
      setEmailSendResult({ ok: false, message: "Please enter a valid recipient email address." });
      return;
    }

    setIsSendingEmail(true);
    setEmailSendResult(null);

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmailTo,
          from: node.parameters.from,
          subject: node.parameters.subject,
          html: node.parameters.bodyHtml,
          apiKey: node.parameters.apiKey,
          businessName: "Kovai Artisanal Bakery",
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setEmailSendResult({
          ok: true,
          message: `Email dispatched successfully via ${data.provider}! Message ID: ${data.messageId}`,
          messageId: data.messageId,
        });

        // Update node parameters and output
        onUpdateParameters(node.id, {
          ...node.parameters,
          lastDeliveredAt: data.deliveredAt,
          lastMessageId: data.messageId,
        });
      } else {
        setEmailSendResult({
          ok: false,
          message: data.error || "Failed to dispatch email",
        });
      }
    } catch (err) {
      setEmailSendResult({
        ok: false,
        message: err instanceof Error ? err.message : "Error sending email",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const outputPayload = node.outputData || def.defaultData.defaultOutput;
  const inputPayload = node.inputData || {
    message: "No upstream input payload captured yet. Run workflow to stream data.",
  };

  const isRunning = node.status === "running";

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col text-slate-200">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border",
              def.colorScheme.bg,
              def.colorScheme.border
            )}
          >
            <Sparkles className="w-5 h-5" style={{ color: def.colorScheme.accent }} />
          </div>
          <div>
            <input
              type="text"
              value={node.name}
              onChange={(e) => onUpdateName(node.id, e.target.value)}
              className="bg-transparent font-bold text-base text-white tracking-tight hover:bg-slate-800/60 focus:bg-slate-800 px-2 py-0.5 -ml-2 rounded-lg border border-transparent focus:border-slate-700 outline-none transition-colors"
            />
            <p className="text-xs text-slate-400 mt-0.5">{def.description}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Switcher: Parameters / Input Data / Output Data */}
      <div className="flex items-center px-5 border-b border-slate-800 bg-slate-950/40">
        <button
          onClick={() => setActiveTab("params")}
          className={cn(
            "flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all",
            activeTab === "params"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Parameters</span>
        </button>

        <button
          onClick={() => setActiveTab("input")}
          className={cn(
            "flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all",
            activeTab === "input"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Input Data</span>
        </button>

        <button
          onClick={() => setActiveTab("output")}
          className={cn(
            "flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all",
            activeTab === "output"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Output Data</span>
          {node.itemsCount !== undefined && (
            <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
              {node.itemsCount}
            </span>
          )}
        </button>
      </div>

      {/* Drawer Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* PARAMETERS TAB */}
        {activeTab === "params" && (
          <div className="space-y-5">
            {/* Real Automated Email Live Test Box */}
            {node.type === "action_resend_email" && (
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">Live Email Dispatch Test</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-800">
                    Resend API / Supabase
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Send an automated outreach email right now to verify deliverability, template tags, and layout.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="Enter recipient email..."
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    className="flex-1 h-8 px-3 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendRealEmail}
                    disabled={isSendingEmail}
                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {isSendingEmail ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isSendingEmail ? "Sending..." : "Send Email"}</span>
                  </Button>
                </div>

                {emailSendResult && (
                  <div
                    className={cn(
                      "p-3 rounded-lg text-xs font-mono flex items-start gap-2.5 border",
                      emailSendResult.ok
                        ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                        : "bg-rose-950/60 border-rose-800 text-rose-300"
                    )}
                  >
                    {emailSendResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold">{emailSendResult.message}</p>
                      {emailSendResult.messageId && (
                        <p className="text-[10px] text-slate-400">
                          Recipient: {testEmailTo} &bull; Persisted to Supabase messages &amp; activities.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {def.parameters.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                No configurable parameters required for this node.
              </div>
            ) : (
              def.parameters.map((field) => {
                const currentValue =
                  node.parameters[field.id] !== undefined
                    ? node.parameters[field.id]
                    : field.defaultValue;

                return (
                  <div key={field.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        {field.label}
                      </label>
                      {field.required && (
                        <span className="text-[10px] text-rose-400 font-mono">*required</span>
                      )}
                    </div>

                    {field.description && (
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {field.description}
                      </p>
                    )}

                    {/* Field input rendering */}
                    {field.type === "text" && (
                      <input
                        type="text"
                        value={currentValue || ""}
                        placeholder={field.placeholder}
                        onChange={(e) => handleParamChange(field.id, e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    )}

                    {field.type === "number" && (
                      <input
                        type="number"
                        value={currentValue ?? 0}
                        onChange={(e) => handleParamChange(field.id, Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    )}

                    {field.type === "select" && (
                      <select
                        value={currentValue}
                        onChange={(e) => handleParamChange(field.id, e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === "textarea" && (
                      <textarea
                        rows={4}
                        value={currentValue || ""}
                        onChange={(e) => handleParamChange(field.id, e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-white focus:outline-none focus:border-blue-500 transition-colors resize-y leading-relaxed"
                      />
                    )}

                    {field.type === "code" && (
                      <textarea
                        rows={6}
                        value={currentValue || ""}
                        onChange={(e) => handleParamChange(field.id, e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors resize-y leading-relaxed"
                      />
                    )}

                    {field.type === "boolean" && (
                      <div className="flex items-center gap-3 pt-1">
                        <Switch
                          checked={Boolean(currentValue)}
                          onCheckedChange={(checked) => handleParamChange(field.id, checked)}
                        />
                        <span className="text-xs text-slate-400">
                          {currentValue ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* INPUT DATA TAB */}
        {activeTab === "input" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Payload from Previous Step</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyJson(inputPayload)}
                className="h-7 px-2 text-xs border-slate-800 bg-slate-950 text-slate-300"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 overflow-x-auto max-h-[440px] leading-relaxed">
              {JSON.stringify(inputPayload, null, 2)}
            </pre>
          </div>
        )}

        {/* OUTPUT DATA TAB */}
        {activeTab === "output" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Generated Execution Data</span>
                {node.status === "success" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyJson(outputPayload)}
                className="h-7 px-2 text-xs border-slate-800 bg-slate-950 text-slate-300"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[440px] leading-relaxed">
              {JSON.stringify(outputPayload, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleDisable(node.id)}
            className="h-9 text-xs border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            title="Toggle Node Active/Disabled"
          >
            <Power className="w-3.5 h-3.5 mr-1" />
            <span>{node.disabled ? "Enable" : "Disable"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteNode(node.id)}
            className="h-9 text-xs border-slate-800 bg-slate-900 text-rose-400 hover:bg-rose-950/50"
            title="Delete this node from flow"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Delete</span>
          </Button>
        </div>

        <Button
          onClick={() => onRunStep(node.id)}
          disabled={isRunning}
          className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg shadow-blue-600/30"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Step...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test this Step</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
