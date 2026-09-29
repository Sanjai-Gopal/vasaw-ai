export type NodeCategory = "trigger" | "ai" | "integration" | "logic";

export type NodeExecutionStatus = "idle" | "running" | "success" | "preview" | "error" | "skipped";

export interface NodePort {
  id: string;
  name: string;
  type: "main" | "branch" | "error";
  label?: string;
  description?: string;
}

export interface NodeParameterField {
  id: string;
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "boolean" | "code" | "json";
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: any;
  description?: string;
  required?: boolean;
}

export interface NodeTypeDefinition {
  type: string;
  name: string;
  category: NodeCategory;
  description: string;
  iconName: string;
  badgeText: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    glow: string;
    headerBg: string;
  };
  inputs: NodePort[];
  outputs: NodePort[];
  parameters: NodeParameterField[];
  defaultData: {
    parameters: Record<string, any>;
    defaultOutput: Record<string, any>;
  };
}

export interface FlowNode {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  parameters: Record<string, any>;
  status: NodeExecutionStatus;
  executionTimeMs?: number;
  itemsCount?: number;
  lastRunAt?: string;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  errorMessage?: string;
  disabled?: boolean;
}

export interface FlowConnection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  animated?: boolean;
  activePulse?: boolean;
}

export interface ExecutionLog {
  id: string;
  nodeId: string;
  nodeName: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  dataSnippet?: string;
  durationMs?: number;
}

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  triggerSource: "Manual dry run" | "Webhook dry run";
  status: "success" | "error";
  startedAt: string;
  durationMs: number;
  stepsCount: number;
  mode: "local_mock" | "server_dry_run";
  steps?: WorkflowExecutionStepRecord[];
}

export interface WorkflowExecutionStepRecord {
  id: string;
  nodeId: string;
  nodeName: string;
  status: "running" | "success" | "preview" | "skipped" | "error" | "cancelled";
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  message?: string;
  error?: string;
  outputData?: Record<string, unknown>;
}

export interface CanvasStickyNote {
  id: string;
  text: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  color: "yellow" | "blue" | "green" | "pink" | "purple" | "slate";
}

export interface WorkflowCredential {
  id: string;
  name: string;
  type: "apify" | "supabase" | "openai" | "gemini" | "groq" | "resend" | "vercel" | "github" | "webhook_bearer" | "custom_http";
  description: string;
  isConfigured: boolean;
  maskedKey?: string;
  lastTestedAt?: string;
  status: "connected" | "warning" | "unconfigured";
  createdAt: string;
}

export interface WorkflowVariable {
  id: string;
  key: string;
  value: string;
  type: "string" | "number" | "secret" | "boolean";
  description?: string;
}

export interface FlowWorkflow {
  id: string;
  name: string;
  description: string;
  category: "acquisition" | "enrichment" | "outreach" | "crm" | "ops";
  active: boolean;
  tags?: string[];
  nodes: FlowNode[];
  connections: FlowConnection[];
  stickyNotes?: CanvasStickyNote[];
  createdAt: string;
  updatedAt: string;
  executionMode?: "dry_run" | "live";
  runsCount: number;
  lastExecution?: {
    id: string;
    status: "success" | "error" | "running";
    startedAt: string;
    durationMs: number;
    stepsCompleted: number;
  };
}

