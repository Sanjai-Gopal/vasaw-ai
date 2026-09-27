"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  Plus,
  Sparkles,
  Download,
  Upload,
  Layers,
  Activity,
  CheckCircle2,
  Zap,
  RotateCcw,
  Maximize2,
  Minimize2,
  StickyNote,
  Save,
  Check,
  Tag,
  ExternalLink,
  KeyRound,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  FlowWorkflow,
  FlowNode,
  FlowConnection,
  NodeTypeDefinition,
  ExecutionLog,
  CanvasStickyNote,
} from "@/lib/types/automation-flow";
import {
  DEFAULT_FLOW_WORKFLOWS,
  NODE_TYPE_REGISTRY,
  simulateNodeExecution,
} from "@/lib/data/automation-registry";
import { FlowCanvas } from "@/components/automation/flow-canvas";
import { N8nNodeModal } from "@/components/automation/n8n-node-modal";
import { N8nNodeCreatorDrawer } from "@/components/automation/n8n-node-creator-drawer";
import { TemplateLibraryModal } from "@/components/automation/template-library-modal";
import { ExecutionConsole } from "@/components/automation/execution-console";
import { ExecutionsTableView } from "@/components/automation/executions-table-view";

export default function AutomationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // All workflows in state
  const [workflows, setWorkflows] = React.useState<FlowWorkflow[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vasaw_automation_workflows");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_FLOW_WORKFLOWS;
  });

  // Current active workflow ID (support query param e.g. ?workflowId=...)
  const [activeWorkflowId, setActiveWorkflowId] = React.useState<string>(() => {
    return searchParams.get("workflowId") || workflows[0]?.id || "wf-autonomous-email";
  });

  // Sync if query param changes
  React.useEffect(() => {
    const qId = searchParams.get("workflowId");
    if (qId && workflows.some((w) => w.id === qId)) {
      setActiveWorkflowId(qId);
    }
  }, [searchParams, workflows]);

  // Active workflow object
  const currentWorkflow =
    workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  // View mode: Visual n8n Canvas vs Executions Table
  const [viewMode, setViewMode] = React.useState<"canvas" | "executions">("canvas");

  // Selected node for selection outline
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  // 3-Pane Node Configuration Editor Modal state
  const [configNodeId, setConfigNodeId] = React.useState<string | null>(null);

  // Node Creator Drawer state
  const [isCreatorDrawerOpen, setIsCreatorDrawerOpen] = React.useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  // Save workflow feedback state
  const [isSavedRecently, setIsSavedRecently] = React.useState(false);

  // Execution state
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [executionLogs, setExecutionLogs] = React.useState<ExecutionLog[]>([]);
  const [totalDurationMs, setTotalDurationMs] = React.useState(0);
  const [completedNodesCount, setCompletedNodesCount] = React.useState(0);

  // Persist workflows to localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vasaw_automation_workflows", JSON.stringify(workflows));
    }
  }, [workflows]);

  // Update current workflow helper
  const updateCurrentWorkflow = React.useCallback(
    (updater: (prev: FlowWorkflow) => FlowWorkflow) => {
      setWorkflows((prev) =>
        prev.map((wf) => (wf.id === activeWorkflowId ? updater(wf) : wf))
      );
    },
    [activeWorkflowId]
  );

  // Toggle workflow active status
  const handleToggleActive = () => {
    updateCurrentWorkflow((wf) => ({ ...wf, active: !wf.active }));
  };

  // Inline rename workflow
  const handleRenameWorkflow = (newName: string) => {
    updateCurrentWorkflow((wf) => ({ ...wf, name: newName }));
  };

  // Save workflow manually
  const handleSaveWorkflow = () => {
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  // Global Keyboard Shortcuts (Ctrl+S to save, Ctrl+Enter to test, Tab for palette)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveWorkflow();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunWorkflow();
      }
      if (e.key === "Tab" && !configNodeId && !isCreatorDrawerOpen) {
        e.preventDefault();
        setIsCreatorDrawerOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Node position change
  const handleUpdateNodePosition = React.useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      updateCurrentWorkflow((wf) => ({
        ...wf,
        nodes: wf.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
      }));
    },
    [updateCurrentWorkflow]
  );

  // Add new node from drawer
  const handleAddNodeType = (nodeType: NodeTypeDefinition) => {
    const newNodeId = `node-${Date.now()}`;
    const xPos = 220 + Math.floor(Math.random() * 80);
    const yPos = 180 + Math.floor(Math.random() * 80);

    const newNode: FlowNode = {
      id: newNodeId,
      type: nodeType.type,
      name: nodeType.name,
      position: { x: xPos, y: yPos },
      parameters: { ...nodeType.defaultData.parameters },
      status: "idle",
      outputData: nodeType.defaultData.defaultOutput,
    };

    updateCurrentWorkflow((wf) => ({
      ...wf,
      nodes: [...wf.nodes, newNode],
    }));

    setSelectedNodeId(newNodeId);
    setConfigNodeId(newNodeId);
  };

  // Delete node
  const handleDeleteNode = React.useCallback(
    (nodeId: string) => {
      updateCurrentWorkflow((wf) => ({
        ...wf,
        nodes: wf.nodes.filter((n) => n.id !== nodeId),
        connections: wf.connections.filter(
          (c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId
        ),
      }));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      if (configNodeId === nodeId) setConfigNodeId(null);
    },
    [selectedNodeId, configNodeId, updateCurrentWorkflow]
  );

  // Duplicate node
  const handleDuplicateNode = React.useCallback(
    (nodeId: string) => {
      const target = currentWorkflow?.nodes.find((n) => n.id === nodeId);
      if (!target) return;

      const newNodeId = `node-${Date.now()}`;
      const duplicateNode: FlowNode = {
        ...target,
        id: newNodeId,
        name: `${target.name} (Copy)`,
        position: { x: target.position.x + 40, y: target.position.y + 40 },
        status: "idle",
      };

      updateCurrentWorkflow((wf) => ({
        ...wf,
        nodes: [...wf.nodes, duplicateNode],
      }));

      setSelectedNodeId(newNodeId);
    },
    [currentWorkflow, updateCurrentWorkflow]
  );

  // Connections
  const handleAddConnection = React.useCallback(
    (connection: FlowConnection) => {
      updateCurrentWorkflow((wf) => ({
        ...wf,
        connections: [...wf.connections, connection],
      }));
    },
    [updateCurrentWorkflow]
  );

  const handleDeleteConnection = React.useCallback(
    (connectionId: string) => {
      updateCurrentWorkflow((wf) => ({
        ...wf,
        connections: wf.connections.filter((c) => c.id !== connectionId),
      }));
    },
    [updateCurrentWorkflow]
  );

  // Parameters and properties
  const handleUpdateNodeParameters = React.useCallback(
    (nodeId: string, parameters: Record<string, any>) => {
      updateCurrentWorkflow((wf) => ({
        ...wf,
        nodes: wf.nodes.map((n) => (n.id === nodeId ? { ...n, parameters } : n)),
      }));
    },
    [updateCurrentWorkflow]
  );

  const handleUpdateNodeName = React.useCallback(
    (nodeId: string, name: string) => {
      updateCurrentWorkflow((wf) => ({
        ...wf,
        nodes: wf.nodes.map((n) => (n.id === nodeId ? { ...n, name } : n)),
      }));
    },
    [updateCurrentWorkflow]
  );

  const handleToggleDisable = React.useCallback(
    (nodeId: string) => {
      updateCurrentWorkflow((wf) => ({
        ...wf,
        nodes: wf.nodes.map((n) =>
          n.id === nodeId ? { ...n, disabled: !n.disabled } : n
        ),
      }));
    },
    [updateCurrentWorkflow]
  );

  // Sticky Notes Handlers
  const handleAddStickyNote = () => {
    const newNote: CanvasStickyNote = {
      id: `note-${Date.now()}`,
      text: "Document workflow logic or notes here...",
      position: { x: 240, y: 160 },
      width: 250,
      height: 160,
      color: "yellow",
    };
    updateCurrentWorkflow((wf) => ({
      ...wf,
      stickyNotes: [...(wf.stickyNotes || []), newNote],
    }));
  };

  const handleUpdateStickyNote = (noteId: string, updates: Partial<CanvasStickyNote>) => {
    updateCurrentWorkflow((wf) => ({
      ...wf,
      stickyNotes: (wf.stickyNotes || []).map((n) => (n.id === noteId ? { ...n, ...updates } : n)),
    }));
  };

  const handleDeleteStickyNote = (noteId: string) => {
    updateCurrentWorkflow((wf) => ({
      ...wf,
      stickyNotes: (wf.stickyNotes || []).filter((n) => n.id !== noteId),
    }));
  };

  // Run single node step
  const handleRunSingleStep = React.useCallback(
    (nodeId: string) => {
      const node = currentWorkflow?.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      updateCurrentWorkflow((wf) => ({
        ...wf,
        nodes: wf.nodes.map((n) =>
          n.id === nodeId ? { ...n, status: "running" } : n
        ),
      }));

      window.setTimeout(async () => {
        const { outputData, executionTimeMs, logs } = simulateNodeExecution(node);

        if (node.type === "action_resend_email") {
          try {
            const emailRes = await fetch("/api/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: node.parameters.to || "founder@kovaibakery.com",
                from: node.parameters.from,
                subject: node.parameters.subject,
                html: node.parameters.bodyHtml,
                apiKey: node.parameters.apiKey,
                businessName: "Kovai Artisanal Bakery",
              }),
            });
            const emailData = await emailRes.json();
            if (emailData.ok) {
              logs.push({
                id: `log-step-em-${Date.now()}`,
                nodeId: node.id,
                nodeName: node.name,
                timestamp: new Date().toISOString(),
                level: "success",
                message: `Automated email dispatched via ${emailData.provider} to ${emailData.to}! Message ID: ${emailData.messageId}`,
                durationMs: 140,
              });
              outputData.deliveryReceipt = emailData;
            }
          } catch {
            // fallback
          }
        }

        updateCurrentWorkflow((wf) => ({
          ...wf,
          nodes: wf.nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  status: "success",
                  outputData,
                  executionTimeMs,
                  lastRunAt: new Date().toISOString(),
                }
              : n
          ),
        }));

        setExecutionLogs((prev) => [...prev, ...logs]);
      }, 500);
    },
    [currentWorkflow, updateCurrentWorkflow]
  );

  // Full Workflow Sequential Execution Runner
  const handleRunWorkflow = async () => {
    if (isExecuting || !currentWorkflow || currentWorkflow.nodes.length === 0) return;

    setIsExecuting(true);
    setExecutionLogs([]);
    setTotalDurationMs(0);
    setCompletedNodesCount(0);

    const initialLog: ExecutionLog = {
      id: `log-init-${Date.now()}`,
      nodeId: "flow",
      nodeName: currentWorkflow.name,
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Starting autonomous execution of ${currentWorkflow.nodes.length} nodes...`,
    };
    setExecutionLogs([initialLog]);

    // Reset nodes to idle
    updateCurrentWorkflow((wf) => ({
      ...wf,
      nodes: wf.nodes.map((n) => ({ ...n, status: "idle" })),
    }));

    let accumulatedTime = 0;
    let currentPayload: Record<string, any> = {};

    for (let i = 0; i < currentWorkflow.nodes.length; i++) {
      const node = currentWorkflow.nodes[i];
      if (node.disabled) continue;

      updateCurrentWorkflow((wf) => ({
        ...wf,
        nodes: wf.nodes.map((n) => (n.id === node.id ? { ...n, status: "running" } : n)),
      }));

      const stepDuration = Math.floor(Math.random() * 180) + 180;
      await new Promise((res) => setTimeout(res, stepDuration));

      const { outputData, executionTimeMs, logs } = simulateNodeExecution(
        node,
        currentPayload
      );

      if (node.type === "action_resend_email") {
        try {
          const emailRes = await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: node.parameters.to || "founder@kovaibakery.com",
              from: node.parameters.from,
              subject: node.parameters.subject,
              html: node.parameters.bodyHtml,
              apiKey: node.parameters.apiKey,
              businessName: currentPayload?.lead?.businessName || "Kovai Artisanal Bakery",
            }),
          });
          const emailData = await emailRes.json();
          if (emailData.ok) {
            logs.push({
              id: `log-em-${Date.now()}`,
              nodeId: node.id,
              nodeName: node.name,
              timestamp: new Date().toISOString(),
              level: "success",
              message: `Automated email dispatched via ${emailData.provider} to ${emailData.to}! Message ID: ${emailData.messageId}`,
              durationMs: 140,
            });
            outputData.deliveryReceipt = emailData;
          }
        } catch {
          // fallback
        }
      }

      currentPayload = outputData;
      accumulatedTime += executionTimeMs;

      updateCurrentWorkflow((wf) => ({
        ...wf,
        nodes: wf.nodes.map((n) =>
          n.id === node.id
            ? {
                ...n,
                status: "success",
                outputData,
                inputData: currentPayload,
                executionTimeMs,
                itemsCount: (n.itemsCount || 1) + 1,
                lastRunAt: new Date().toISOString(),
              }
            : n
        ),
      }));

      setExecutionLogs((prev) => [...prev, ...logs]);
      setCompletedNodesCount(i + 1);
      setTotalDurationMs(accumulatedTime);
    }

    const finishLog: ExecutionLog = {
      id: `log-finish-${Date.now()}`,
      nodeId: "flow",
      nodeName: currentWorkflow.name,
      timestamp: new Date().toISOString(),
      level: "success",
      message: `Workflow completed successfully in ${accumulatedTime}ms across all active nodes.`,
      durationMs: accumulatedTime,
    };
    setExecutionLogs((prev) => [...prev, finishLog]);

    updateCurrentWorkflow((wf) => ({
      ...wf,
      runsCount: wf.runsCount + 1,
      lastExecution: {
        id: `exec-${Date.now()}`,
        status: "success",
        startedAt: new Date().toISOString(),
        durationMs: accumulatedTime,
        stepsCompleted: wf.nodes.length,
      },
    }));

    setIsExecuting(false);
  };

  // Export Workflow to JSON
  const handleExportWorkflowJson = () => {
    const exportData = {
      name: currentWorkflow.name,
      nodes: currentWorkflow.nodes,
      connections: currentWorkflow.connections,
      stickyNotes: currentWorkflow.stickyNotes || [],
      active: currentWorkflow.active,
      settings: {
        executionOrder: "v1",
        timezone: "Asia/Kolkata",
      },
      meta: {
        generator: "n8n Studio Clone v1.78.2",
        exportedAt: new Date().toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentWorkflow.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Workflow
  const handleImportWorkflowJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.nodes && Array.isArray(json.nodes)) {
          const newWf: FlowWorkflow = {
            id: `wf-imported-${Date.now()}`,
            name: json.name || "Imported n8n Workflow",
            description: "Custom imported workflow schema.",
            category: "ops",
            active: Boolean(json.active),
            runsCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: json.nodes,
            connections: json.connections || [],
            stickyNotes: json.stickyNotes || [],
          };

          setWorkflows((prev) => [newWf, ...prev]);
          setActiveWorkflowId(newWf.id);
        }
      } catch (err) {
        alert("Failed to parse workflow JSON file. Please ensure it is valid JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSelectTemplate = (template: FlowWorkflow) => {
    const instantiated: FlowWorkflow = {
      ...template,
      id: `wf-${Date.now()}`,
      name: `${template.name} (Instance)`,
      runsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkflows((prev) => [instantiated, ...prev]);
    setActiveWorkflowId(instantiated.id);
  };

  const configNode =
    currentWorkflow?.nodes.find((n) => n.id === configNodeId) || null;

  // Find upstream connected node for input data preview in modal
  const upstreamConnection = currentWorkflow?.connections.find(
    (c) => c.toNodeId === configNodeId
  );
  const upstreamNode = upstreamConnection
    ? currentWorkflow?.nodes.find((n) => n.id === upstreamConnection.fromNodeId)
    : null;

  return (
    <div
      className={cn(
        "space-y-4 font-sans text-slate-100",
        isFullScreen ? "fixed inset-0 z-50 bg-[#131418] p-4 overflow-hidden" : ""
      )}
    >
      {/* Studio Top Navigation & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        {/* Left: Workflow Selector, Title & Active Switch */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff6d5a] text-white flex items-center justify-center font-bold shadow-lg shadow-[#ff6d5a]/25">
              <Zap className="w-5 h-5" />
            </div>

            <div>
              {/* Workflow Name (Inline Editable) */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentWorkflow.name}
                  onChange={(e) => handleRenameWorkflow(e.target.value)}
                  className="font-bold text-lg text-white tracking-tight bg-transparent hover:bg-slate-900 px-2 py-0.5 -ml-2 rounded-lg border border-transparent focus:border-slate-700 outline-none transition-colors"
                />
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-[#ff6d5a]/40 bg-[#ff6d5a]/10 text-[#ff6d5a]"
                >
                  n8n Canvas
                </Badge>
              </div>

              {/* Workflow Selector Dropdown & Active Toggle */}
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <select
                  value={activeWorkflowId}
                  onChange={(e) => {
                    setActiveWorkflowId(e.target.value);
                    setSelectedNodeId(null);
                    setConfigNodeId(null);
                  }}
                  className="bg-slate-900 border border-slate-800 text-slate-300 rounded-md px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-[#ff6d5a] cursor-pointer"
                >
                  {workflows.map((wf) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name} ({wf.nodes.length} nodes)
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={currentWorkflow.active}
                    onCheckedChange={handleToggleActive}
                  />
                  <span className={cn(currentWorkflow.active ? "text-emerald-400 font-bold" : "text-slate-500")}>
                    {currentWorkflow.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions, View Switcher & Execute Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle: Canvas vs Executions */}
          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode("canvas")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors",
                viewMode === "canvas"
                  ? "bg-[#ff6d5a] text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Canvas Flow</span>
            </button>
            <button
              onClick={() => setViewMode("executions")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors",
                viewMode === "executions"
                  ? "bg-[#ff6d5a] text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Executions ({currentWorkflow.runsCount})</span>
            </button>
          </div>

          {/* Add Node Button (Triggers Drawer) */}
          <Button
            size="sm"
            onClick={() => setIsCreatorDrawerOpen(true)}
            className="h-9 px-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#ff6d5a]" />
            <span>Add Node (Tab)</span>
          </Button>

          {/* Add Sticky Note Button */}
          <Button
            size="sm"
            onClick={handleAddStickyNote}
            className="h-9 px-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            title="Add floating sticky note"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sticky</span>
          </Button>

          {/* Save Workflow Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveWorkflow}
            className="h-9 px-3 rounded-xl border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
            title="Save changes (Ctrl+S)"
          >
            {isSavedRecently ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </Button>

          {/* Templates Library Button */}
          <Button
            size="sm"
            onClick={() => setIsTemplateModalOpen(true)}
            className="h-9 px-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Templates</span>
          </Button>

          {/* Export JSON Button */}
          <Button
            size="sm"
            onClick={handleExportWorkflowJson}
            className="h-9 px-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors hidden sm:flex items-center gap-1.5"
            title="Export workflow schema to JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </Button>

          {/* Import JSON */}
          <label className="h-9 px-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportWorkflowJson}
              className="hidden"
            />
          </label>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Primary Action: Test Workflow (Iconic n8n Coral Button) */}
          <Button
            size="sm"
            onClick={handleRunWorkflow}
            disabled={isExecuting || !currentWorkflow.active}
            className="h-9 px-4 rounded-xl bg-[#ff6d5a] hover:bg-[#ea4b35] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#ff6d5a]/25 transition-all active:scale-95"
          >
            {isExecuting ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing Flow...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test workflow (⌘↵)</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Studio Work Area */}
      {viewMode === "canvas" ? (
        <div className="relative w-full">
          {/* Interactive Infinite Bézier Canvas */}
          <FlowCanvas
            nodes={currentWorkflow.nodes}
            connections={currentWorkflow.connections}
            stickyNotes={currentWorkflow.stickyNotes}
            selectedNodeId={selectedNodeId}
            isExecuting={isExecuting}
            onSelectNode={setSelectedNodeId}
            onOpenConfig={(nodeId) => setConfigNodeId(nodeId)}
            onUpdateNodePosition={handleUpdateNodePosition}
            onAddConnection={handleAddConnection}
            onDeleteConnection={handleDeleteConnection}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
            onRunStep={handleRunSingleStep}
            onQuickAddNode={(typeKey) => {
              const def = NODE_TYPE_REGISTRY[typeKey];
              if (def) handleAddNodeType(def);
            }}
            onOpenPalette={() => setIsCreatorDrawerOpen(true)}
            onAddStickyNote={handleAddStickyNote}
            onUpdateStickyNote={handleUpdateStickyNote}
            onDeleteStickyNote={handleDeleteStickyNote}
          />

          {/* Execution Telemetry Console (Collapsible Bottom Drawer) */}
          <ExecutionConsole
            logs={executionLogs}
            isExecuting={isExecuting}
            totalDurationMs={totalDurationMs}
            completedNodesCount={completedNodesCount}
            totalNodesCount={currentWorkflow.nodes.length}
            onClearLogs={() => setExecutionLogs([])}
          />

          {/* The Iconic n8n 3-Pane Node Configuration Editor */}
          <N8nNodeModal
            node={configNode}
            upstreamNode={upstreamNode}
            isOpen={Boolean(configNodeId)}
            onClose={() => setConfigNodeId(null)}
            onUpdateParameters={handleUpdateNodeParameters}
            onUpdateName={handleUpdateNodeName}
            onToggleDisable={handleToggleDisable}
            onDeleteNode={handleDeleteNode}
            onRunStep={handleRunSingleStep}
          />
        </div>
      ) : (
        /* Executions & Runs Table View */
        <ExecutionsTableView
          workflow={currentWorkflow}
          onRunWorkflow={handleRunWorkflow}
          isExecuting={isExecuting}
        />
      )}

      {/* Slide-out Node Creator Drawer (Press Tab or '+' button) */}
      <N8nNodeCreatorDrawer
        isOpen={isCreatorDrawerOpen}
        onClose={() => setIsCreatorDrawerOpen(false)}
        onSelectNodeType={handleAddNodeType}
      />

      {/* Template Library Modal */}
      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
