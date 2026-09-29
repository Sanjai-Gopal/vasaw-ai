"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Play,
  Plus,
  Sparkles,
  Download,
  Upload,
  Layers,
  Activity,
  Zap,
  RotateCcw,
  Maximize2,
  Minimize2,
  StickyNote,
  Save,
  Check,
  ShieldCheck,
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
  WorkflowExecutionRecord,
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

const WORKFLOWS_STORAGE_KEY = "vasaw_automation_workflows";
const EXECUTION_HISTORY_STORAGE_KEY = "vasaw_automation_execution_history";

function createFreshDefaultWorkflows(): FlowWorkflow[] {
  return DEFAULT_FLOW_WORKFLOWS.map((workflow) => ({
    ...workflow,
    runsCount: 0,
    lastExecution: undefined,
    nodes: workflow.nodes.map((node) => ({
      ...node,
      status: "idle",
      executionTimeMs: undefined,
      lastRunAt: undefined,
      inputData: undefined,
      outputData: undefined,
      errorMessage: undefined,
    })),
  }));
}

function readSavedWorkflows(): FlowWorkflow[] {
  if (typeof window === "undefined") return createFreshDefaultWorkflows();

  try {
    const raw = window.localStorage.getItem(WORKFLOWS_STORAGE_KEY);
    if (!raw) return createFreshDefaultWorkflows();

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return createFreshDefaultWorkflows();

    const workflows = parsed.filter(
      (workflow): workflow is FlowWorkflow =>
        Boolean(workflow) &&
        typeof workflow === "object" &&
        typeof workflow.id === "string" &&
        typeof workflow.name === "string" &&
        Array.isArray(workflow.nodes) &&
        Array.isArray(workflow.connections)
    );

    return workflows.length > 0 ? workflows : createFreshDefaultWorkflows();
  } catch {
    return createFreshDefaultWorkflows();
  }
}

function isWorkflowExecutionRecord(value: unknown): value is WorkflowExecutionRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<WorkflowExecutionRecord>;

  return (
    typeof record.id === "string" &&
    typeof record.workflowId === "string" &&
    (record.triggerSource === "Manual dry run" || record.triggerSource === "Webhook dry run") &&
    (record.status === "success" || record.status === "error") &&
    typeof record.startedAt === "string" &&
    !Number.isNaN(Date.parse(record.startedAt)) &&
    typeof record.durationMs === "number" &&
    typeof record.stepsCount === "number" &&
    (record.mode === "local_mock" || record.mode === "server_dry_run")
  );
}

function isPersistedWorkflowId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function mapPersistedRun(run: Record<string, unknown>, workflowId: string): WorkflowExecutionRecord | null {
  const startedAt = typeof run.started_at === "string" ? run.started_at : String(run.created_at ?? "");
  if (!startedAt || Number.isNaN(Date.parse(startedAt))) return null;
  return {
    id: String(run.id),
    workflowId,
    triggerSource: run.trigger_source === "webhook" ? "Webhook dry run" : "Manual dry run",
    status: run.status === "failed" || run.status === "cancelled" ? "error" : "success",
    startedAt,
    durationMs: typeof run.duration_ms === "number" ? run.duration_ms : 0,
    stepsCount: typeof run.steps_count === "number" ? run.steps_count : 0,
    mode: "server_dry_run",
  };
}

function readExecutionHistory(): Record<string, WorkflowExecutionRecord[]> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(EXECUTION_HISTORY_STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([workflowId, records]) => {
        if (!Array.isArray(records)) return [];
        const validRecords = records.filter(isWorkflowExecutionRecord).slice(0, 50);
        return validRecords.length > 0 ? [[workflowId, validRecords]] : [];
      })
    );
  } catch {
    return {};
  }
}

export default function AutomationPage() {
  const searchParams = useSearchParams();

  // All workflows in state
  const [workflows, setWorkflows] = React.useState<FlowWorkflow[]>(createFreshDefaultWorkflows);
  const [executionHistory, setExecutionHistory] = React.useState<
    Record<string, WorkflowExecutionRecord[]>
  >({});
  const [isBrowserStateLoaded, setIsBrowserStateLoaded] = React.useState(false);

  // Current active workflow ID (support query param e.g. ?workflowId=...)
  const [activeWorkflowId, setActiveWorkflowId] = React.useState<string>(() => {
    return searchParams.get("workflowId") || workflows[0]?.id || "wf-autonomous-email";
  });

  // Follow a workflow ID supplied by navigation without changing state during render.
  React.useEffect(() => {
    const qId = searchParams.get("workflowId");
    if (!qId || !workflows.some((workflow) => workflow.id === qId) || qId === activeWorkflowId) return;
    const frame = window.requestAnimationFrame(() => setActiveWorkflowId(qId));
    return () => window.cancelAnimationFrame(frame);
  }, [searchParams, workflows, activeWorkflowId]);

  // Active workflow object
  const currentWorkflow =
    workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const savedHistory = readExecutionHistory();
      const localWorkflows = readSavedWorkflows();
      let nextWorkflows = localWorkflows;
      const nextHistory = savedHistory;
      try {
        const response = await fetch("/api/automations", { cache: "no-store" });
        const result = await response.json();
        if (response.ok && Array.isArray(result.workflows) && result.workflows.length > 0) {
          const remoteWorkflows = result.workflows as Array<FlowWorkflow & { recentRuns?: Array<Record<string, unknown>> }>;
          const remoteIds = new Set(remoteWorkflows.map((workflow) => workflow.id));
          const localDrafts = localWorkflows.filter((workflow) => !isPersistedWorkflowId(workflow.id) && !remoteIds.has(workflow.id));
          nextWorkflows = [
            ...remoteWorkflows.map((workflow) => {
              const runs = (workflow.recentRuns ?? []).flatMap((run) => {
                const mapped = mapPersistedRun(run, workflow.id);
                return mapped ? [mapped] : [];
              });
              nextHistory[workflow.id] = runs;
              const latestRun = runs[0];
              return {
                ...workflow,
                runsCount: runs.length,
                lastExecution: latestRun ? {
                  id: latestRun.id,
                  status: latestRun.status,
                  startedAt: latestRun.startedAt,
                  durationMs: latestRun.durationMs,
                  stepsCompleted: latestRun.stepsCount,
                } : undefined,
              };
            }),
            ...localDrafts,
          ];
        }
      } catch {
        // Local drafts remain available if the server or database is not configured yet.
      }
      if (cancelled) return;
      setWorkflows(nextWorkflows);
      setExecutionHistory(nextHistory);
      setActiveWorkflowId((currentId) =>
        nextWorkflows.some((workflow) => workflow.id === currentId)
          ? currentId
          : nextWorkflows[0]?.id || ""
      );
      setIsBrowserStateLoaded(true);
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  // View mode: visual workflow canvas or local dry-run history
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
  const [saveError, setSaveError] = React.useState("");
  const [newWebhookSecret, setNewWebhookSecret] = React.useState<{ workflowId: string; secret: string } | null>(null);

  // Execution state
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [activeRunKey, setActiveRunKey] = React.useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = React.useState<ExecutionLog[]>([]);
  const [totalDurationMs, setTotalDurationMs] = React.useState(0);
  const [completedNodesCount, setCompletedNodesCount] = React.useState(0);

  // Persist workflows to localStorage after the saved browser state is loaded.
  React.useEffect(() => {
    if (isBrowserStateLoaded && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
      } catch {
        // Manual save reports storage errors; background persistence stays quiet.
      }
    }
  }, [workflows, isBrowserStateLoaded]);

  React.useEffect(() => {
    if (!isBrowserStateLoaded) return;
    try {
      window.localStorage.setItem(
        EXECUTION_HISTORY_STORAGE_KEY,
        JSON.stringify(executionHistory)
      );
    } catch {
      // The editor remains usable when browser storage is unavailable.
    }
  }, [executionHistory, isBrowserStateLoaded]);

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

  const saveWorkflowToServer = React.useCallback(async (workflow: FlowWorkflow) => {
    const persisted = isPersistedWorkflowId(workflow.id);
    const response = await fetch(persisted ? `/api/automations/${workflow.id}` : "/api/automations", {
      method: persisted ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workflow }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.workflow) throw new Error(result.error || "Workflow could not be saved to the database.");
    const saved = result.workflow as FlowWorkflow;
    setWorkflows((previous) => previous.map((item) => item.id === workflow.id ? saved : item));
    setActiveWorkflowId(saved.id);
    if (typeof result.webhookSecret === "string") {
      setNewWebhookSecret({ workflowId: saved.id, secret: result.webhookSecret });
    }
    return saved;
  }, []);

  // Save workflow manually to the persistent server store.
  const handleSaveWorkflow = React.useCallback(async () => {
    if (!isBrowserStateLoaded || !currentWorkflow) return;
    setSaveError("");
    try {
      const saved = await saveWorkflowToServer(currentWorkflow);
      window.localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(
        workflows.map((item) => item.id === currentWorkflow.id ? saved : item)
      ));
      setIsSavedRecently(true);
      window.setTimeout(() => setIsSavedRecently(false), 2200);
    } catch (error) {
      setIsSavedRecently(false);
      setSaveError(error instanceof Error ? error.message : "Workflow could not be saved.");
    }
  }, [isBrowserStateLoaded, currentWorkflow, workflows, saveWorkflowToServer]);

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
    (nodeId: string, parameters: Record<string, unknown>) => {
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
      if (isExecuting) return;
      const node = currentWorkflow?.nodes.find((n) => n.id === nodeId);
      if (!node || node.disabled || node.status === "running") return;
      const inputPayload = Object.assign(
        {},
        ...(currentWorkflow?.connections
          .filter((connection) => connection.toNodeId === nodeId)
          .map((connection) =>
            currentWorkflow.nodes.find((upstream) => upstream.id === connection.fromNodeId)?.outputData || {}
          ) || [])
      );

      updateCurrentWorkflow((wf) => ({
        ...wf,
        nodes: wf.nodes.map((n) =>
          n.id === nodeId ? { ...n, status: "running" } : n
        ),
      }));

      window.setTimeout(() => {
        try {
          const result = simulateNodeExecution(node, inputPayload);
          const resultMeta = result.outputData._meta;
          const outputData = {
            ...result.outputData,
            _meta: {
              ...(resultMeta && typeof resultMeta === "object" ? resultMeta : {}),
              mode: "local_mock",
            },
          };
          updateCurrentWorkflow((wf) => ({
            ...wf,
            nodes: wf.nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    status: "success",
                    outputData,
                    executionTimeMs: result.executionTimeMs,
                    lastRunAt: new Date().toISOString(),
                  }
                : n
            ),
          }));

          setExecutionLogs((prev) => [...prev, ...result.logs]);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Node preview failed.";
          updateCurrentWorkflow((wf) => ({
            ...wf,
            nodes: wf.nodes.map((n) =>
              n.id === nodeId ? { ...n, status: "error", errorMessage: message } : n
            ),
          }));
          setExecutionLogs((prev) => [
            ...prev,
            {
              id: `log-step-error-${Date.now()}`,
              nodeId: node.id,
              nodeName: node.name,
              timestamp: new Date().toISOString(),
              level: "error",
              message,
            },
          ]);
        }
      }, 260);
    },
    [currentWorkflow, isExecuting, updateCurrentWorkflow]
  );

  // Runs are persisted on the server; dry-run adapters never contact providers.
  const handleRunWorkflow = React.useCallback(async () => {
    if (isExecuting || !currentWorkflow || currentWorkflow.nodes.length === 0) return;
    setIsExecuting(true);
    setSaveError("");
    setExecutionLogs([]);
    setTotalDurationMs(0);
    setCompletedNodesCount(0);
    const startedAt = new Date().toISOString();
    try {
      const workflow = await saveWorkflowToServer(currentWorkflow);
      const idempotencyKey = window.crypto.randomUUID();
      setActiveRunKey(idempotencyKey);
      const response = await fetch(`/api/automations/${workflow.id}/run`, {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify({ mode: "dry_run", input: {} }),
      });
      const result = await response.json().catch(() => ({}));
      const run = result.run as Record<string, unknown> | undefined;
      const steps = Array.isArray(result.steps) ? result.steps as Array<Record<string, unknown>> : [];
      if (!response.ok && !run) throw new Error(result.error || "Workflow run could not be completed.");

      const mappedSteps = steps.map((step) => {
        const nodeId = String(step.node_id ?? "");
        const status = String(step.status ?? "");
        const output = step.output_data && typeof step.output_data === "object" ? step.output_data as Record<string, unknown> : {};
        const input = step.input_data && typeof step.input_data === "object" ? step.input_data as Record<string, unknown> : {};
        const message = typeof step.message === "string" ? step.message : status;
        return { nodeId, status, output, input, message, durationMs: Number(step.duration_ms ?? 0), error: typeof step.error === "string" ? step.error : undefined };
      });
      setWorkflows((previous) => previous.map((saved) => saved.id !== workflow.id ? saved : ({
        ...saved,
        nodes: saved.nodes.map((node) => {
          const step = mappedSteps.find((item) => item.nodeId === node.id);
          if (!step) return node;
          return {
            ...node,
            status: step.status === "preview" ? "preview" : step.status === "error" ? "error" : step.status === "skipped" ? "skipped" : "success",
            inputData: step.input,
            outputData: step.output,
            executionTimeMs: step.durationMs,
            lastRunAt: typeof run?.completed_at === "string" ? run.completed_at : new Date().toISOString(),
            errorMessage: step.error,
          };
        }),
      })));

      const runStartedAt = typeof run?.started_at === "string" ? run.started_at : startedAt;
      const record: WorkflowExecutionRecord = {
        id: String(run?.id ?? `local-${Date.now()}`),
        workflowId: workflow.id,
        triggerSource: "Manual dry run",
        status: run?.status === "failed" || run?.status === "cancelled" ? "error" : "success",
        startedAt: runStartedAt,
        durationMs: Number(run?.duration_ms ?? 0),
        stepsCount: Number(run?.steps_count ?? steps.length),
        mode: "server_dry_run",
      };
      setExecutionHistory((previous) => ({
        ...previous,
        [workflow.id]: [record, ...(previous[workflow.id] || []).filter((item) => item.id !== record.id)].slice(0, 50),
      }));
      setTotalDurationMs(record.durationMs);
      setCompletedNodesCount(mappedSteps.filter((step) => step.status === "success" || step.status === "preview").length);
      setExecutionLogs(mappedSteps.map((step, index) => ({
        id: `log-${record.id}-${index}`,
        nodeId: step.nodeId,
        nodeName: String(steps[index]?.node_name ?? "Workflow step"),
        timestamp: String(steps[index]?.completed_at ?? steps[index]?.started_at ?? new Date().toISOString()),
        level: step.status === "error" ? "error" : step.status === "success" ? "success" : "info",
        message: step.error || step.message,
        durationMs: step.durationMs,
        dataSnippet: JSON.stringify(step.output).slice(0, 180),
      })));
      setWorkflows((previous) => previous.map((item) => item.id === workflow.id ? {
        ...item,
        runsCount: (executionHistory[workflow.id]?.length || 0) + 1,
        lastExecution: {
          id: record.id,
          status: record.status,
          startedAt: record.startedAt,
          durationMs: record.durationMs,
          stepsCompleted: record.stepsCount,
        },
      } : item));
      if (!response.ok) setSaveError(result.error || "The workflow run failed; see its saved step log.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workflow run failed.";
      setSaveError(message);
      setExecutionLogs([{
        id: `log-error-${Date.now()}`,
        nodeId: "flow",
        nodeName: currentWorkflow.name,
        timestamp: new Date().toISOString(),
        level: "error",
        message,
      }]);
    } finally {
      setActiveRunKey(null);
      setIsExecuting(false);
    }
  }, [currentWorkflow, executionHistory, isExecuting, saveWorkflowToServer]);

  const handleCancelRun = React.useCallback(async () => {
    if (!currentWorkflow || !activeRunKey || !isPersistedWorkflowId(currentWorkflow.id)) return;
    try {
      const response = await fetch(`/api/automations/${currentWorkflow.id}/run`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "cancel", idempotencyKey: activeRunKey }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Cancellation could not be requested.");
      setSaveError("Cancellation requested. The run will stop before its next step.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Cancellation could not be requested.");
    }
  }, [activeRunKey, currentWorkflow]);

  // Keep keyboard shortcuts from stealing Tab navigation or text-field input.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditingText = Boolean(
        target &&
          (target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      );

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveWorkflow();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isEditingText) {
        e.preventDefault();
        void handleRunWorkflow();
      }
      if (
        e.altKey &&
        e.key.toLowerCase() === "n" &&
        !isEditingText &&
        !configNodeId &&
        !isCreatorDrawerOpen
      ) {
        e.preventDefault();
        setIsCreatorDrawerOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRunWorkflow, handleSaveWorkflow, configNodeId, isCreatorDrawerOpen]);

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
        generator: "VASAW AI Automation Studio",
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
      } catch {
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
  const workflowRuns = currentWorkflow
    ? executionHistory[currentWorkflow.id] || []
    : [];
  const enabledNodeCount = currentWorkflow.nodes.filter((node) => !node.disabled).length;
  const connectionCount = currentWorkflow.connections.length;

  return (
    <div
      className={cn(
        "space-y-4 font-sans text-slate-100",
        isFullScreen ? "fixed inset-0 z-50 bg-[#131418] p-4 overflow-hidden" : ""
      )}
    >
      {!isFullScreen && (
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#ff6d5a]/15 via-slate-950 to-slate-950 px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-[#ff6d5a]/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Safe dry-run
                </Badge>
                <span className="text-xs text-slate-500">Automation Studio</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Build workflows visually.</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">Connect workflow steps, save them to your account, then inspect persisted run and node logs. Provider actions stay preview-only.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
              <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
                <div className="text-xl font-semibold text-white">{enabledNodeCount}</div>
                <div className="text-[11px] text-slate-500">Enabled steps</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
                <div className="text-xl font-semibold text-white">{connectionCount}</div>
                <div className="text-[11px] text-slate-500">Connections</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
                <div className="text-xl font-semibold text-white">{workflowRuns.length}</div>
                <div className="text-[11px] text-slate-500">Saved dry runs</div>
              </div>
            </div>
          </div>
          <p className="relative mt-4 border-t border-white/5 pt-3 text-xs text-slate-500">Branches use the run input. Email, databases, Slack, AI providers, and deployment services are never contacted by dry runs.</p>
        </section>
      )}

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
                  VASAW Flow
                </Badge>
              </div>

              {/* Workflow Selector Dropdown & Active Toggle */}
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <select
                  value={activeWorkflowId}
                  aria-label="Choose workflow"
                  disabled={isExecuting}
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
                    aria-label="Enable this workflow's webhook trigger"
                    title="Webhook requests are accepted only after this workflow is saved and enabled. Cron scheduling is not active."
                  />
                  <span className={cn(currentWorkflow.active ? "text-emerald-400 font-bold" : "text-slate-500")}>
                    {currentWorkflow.active ? "Enabled · webhook ready" : "Disabled"}
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
              aria-pressed={viewMode === "canvas"}
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
              aria-pressed={viewMode === "executions"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors",
                viewMode === "executions"
                  ? "bg-[#ff6d5a] text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dry runs ({workflowRuns.length})</span>
            </button>
          </div>

          {/* Add Node Button (Triggers Drawer) */}
          <Button
            size="sm"
            onClick={() => setIsCreatorDrawerOpen(true)}
            title="Add a node (Alt+N)"
            className="h-9 px-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#ff6d5a]" />
            <span>Add node <kbd className="ml-1 hidden rounded border border-slate-700 px-1 py-0.5 text-[10px] text-slate-500 sm:inline">Alt+N</kbd></span>
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
            title="Save this workflow to your account (Ctrl+S)"
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
            disabled={isExecuting || enabledNodeCount === 0}
            title="Run a persisted server dry run; no external services are called"
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
                <span>Run dry run <kbd className="ml-1 hidden rounded border border-white/20 px-1 py-0.5 text-[10px] font-medium sm:inline">Ctrl/⌘+↵</kbd></span>
              </>
            )}
          </Button>
          {isExecuting && activeRunKey && (
            <Button size="sm" variant="outline" onClick={handleCancelRun} className="h-9 border-rose-500/40 bg-rose-950/30 text-rose-200 hover:bg-rose-900/40">
              Cancel run
            </Button>
          )}
        </div>
      </div>

      {saveError && (
        <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {saveError}
        </div>
      )}

      {newWebhookSecret?.workflowId === currentWorkflow.id && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100">
          <div className="font-semibold">Copy your webhook secret now</div>
          <p className="mt-1 text-xs text-amber-100/70">It is stored as a hash and cannot be shown again. Send it in the <code>x-automation-secret</code> header.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 break-all rounded-md bg-black/30 p-2 text-xs">{newWebhookSecret.secret}</code>
            <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(newWebhookSecret.secret)}>
              Copy secret
            </Button>
          </div>
          <div className="mt-2 break-all font-mono text-[11px] text-amber-100/70">{typeof window !== "undefined" ? `${window.location.origin}/api/automations/${newWebhookSecret.workflowId}/webhook` : ""}</div>
          <button type="button" onClick={() => setNewWebhookSecret(null)} className="mt-2 text-xs underline">Dismiss</button>
        </section>
      )}

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
            totalNodesCount={enabledNodeCount}
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
          runs={workflowRuns}
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
