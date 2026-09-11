"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Play,
  RefreshCw,
  RotateCcw,
  Timer,
  XCircle,
  ArrowRight,
  Search,
  CheckCircle2,
  Globe,
  Rocket,
  Send,
  Zap,
  Calendar,
  Layers,
  Activity,
  Filter,
  Download,
  Plus,
  MoreVertical,
  ChevronDown,
  Sparkles,
  Sliders,
  Database,
  Building2,
  Mail,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { jobs as initialJobs } from "@/lib/data/automation";
import { formatDateTime, cn } from "@/lib/utils";
import type { ScheduledJob, JobRun } from "@/lib/types";

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  category: "outreach" | "enrichment" | "crm";
  runsCount: number;
  active: boolean;
  steps: string[];
  icon: React.ElementType;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  jobId?: string;
}

const DEFAULT_WORKFLOWS: WorkflowItem[] = [
  {
    id: "wf-1",
    name: "High-Fit Prospect Fast-Track",
    description: "When a lead score exceeds 90% and company headcount is 250+, automatically draft a hyper-tailored email and notify assigned SDR via Slack.",
    category: "enrichment",
    runsCount: 4812,
    active: true,
    steps: ["Trigger: Fit > 90%", "Enrich LinkedIn & GitHub", "Generate Personalized Draft", "Slack Notification"],
    icon: Sparkles,
    iconBg: "bg-blue-50 dark:bg-blue-950/60",
    iconBorder: "border-blue-100 dark:border-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    jobId: "J-602",
  },
  {
    id: "wf-2",
    name: "Multi-CRM Bi-directional Sync",
    description: "Instantly sync conversation stages, SDR notes, and qualification tags directly into your core CRM accounts with deduplication checks.",
    category: "crm",
    runsCount: 12650,
    active: true,
    steps: ["Trigger: Message Replied", "Parse Sentiment & Next Steps", "Update HubSpot Deal Stage"],
    icon: Database,
    iconBg: "bg-purple-50 dark:bg-purple-950/60",
    iconBorder: "border-purple-100 dark:border-purple-900/50",
    iconColor: "text-purple-600 dark:text-purple-400",
    jobId: "J-603",
  },
  {
    id: "wf-3",
    name: "Smart Inactivity Re-engagement",
    description: "If an initial touch receives no engagement after 4 business days, cross-reference latest company press releases or hiring signals to trigger a fresh conversational angle.",
    category: "outreach",
    runsCount: 3124,
    active: true,
    steps: ["Trigger: 4 Days Inactive", "Scan News & Open Roles", "Contextual Follow-up"],
    icon: Mail,
    iconBg: "bg-amber-50 dark:bg-amber-950/60",
    iconBorder: "border-amber-100 dark:border-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    jobId: "J-606",
  },
  {
    id: "wf-4",
    name: "Webhook Signal Ingestion",
    description: "Direct API endpoint ingestion for event signals from Segment, Clearbit, and custom product telemetry events.",
    category: "enrichment",
    runsCount: 3594,
    active: false,
    steps: ["POST /api/v1/telemetry", "Filter Intent Events", "Assign Pipeline"],
    icon: Layers,
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconBorder: "border-slate-200 dark:border-slate-700",
    iconColor: "text-slate-600 dark:text-slate-300",
    jobId: "J-601",
  },
];

export default function AutomationPage() {
  const [jobs, setJobs] = React.useState<ScheduledJob[]>(initialJobs);
  const [workflows, setWorkflows] = React.useState<WorkflowItem[]>(DEFAULT_WORKFLOWS);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [runningJobId, setRunningJobId] = React.useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newWorkflowName, setNewWorkflowName] = React.useState("");
  const [newWorkflowCategory, setNewWorkflowCategory] = React.useState<"outreach" | "enrichment" | "crm">("outreach");

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    );
  };

  const runWorkflowNow = (id: string, jobId?: string) => {
    if (runningJobId) return;
    setRunningJobId(id);
    window.setTimeout(() => {
      setRunningJobId(null);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, runsCount: w.runsCount + 1 } : w))
      );
    }, 1500);
  };

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;

    const newWf: WorkflowItem = {
      id: `wf-${Date.now()}`,
      name: newWorkflowName,
      description: "Custom automated sequence trigger created via Control Center.",
      category: newWorkflowCategory,
      runsCount: 0,
      active: true,
      steps: ["Trigger: Custom Event", "Filter Criteria", "Execute Action"],
      icon: Sparkles,
      iconBg: "bg-blue-50 dark:bg-blue-950/60",
      iconBorder: "border-blue-100 dark:border-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
    };

    setWorkflows([newWf, ...workflows]);
    setNewWorkflowName("");
    setShowCreateModal(false);
  };

  const handleUseTemplate = (title: string, category: "outreach" | "enrichment" | "crm", steps: string[]) => {
    const templateWf: WorkflowItem = {
      id: `wf-template-${Date.now()}`,
      name: title,
      description: `Pre-built operational recipe deployed directly from template library.`,
      category,
      runsCount: 1,
      active: true,
      steps,
      icon: category === "crm" ? Database : category === "outreach" ? Mail : Sparkles,
      iconBg: category === "crm" ? "bg-purple-50 dark:bg-purple-950/60" : "bg-blue-50 dark:bg-blue-950/60",
      iconBorder: "border-slate-200 dark:border-slate-800",
      iconColor: category === "crm" ? "text-purple-600" : "text-blue-600",
    };
    setWorkflows([templateWf, ...workflows]);
  };

  const filteredWorkflows = workflows.filter((w) => {
    if (activeTab === "all") return true;
    if (activeTab === "outreach") return w.category === "outreach";
    if (activeTab === "enrichment") return w.category === "enrichment";
    if (activeTab === "crm") return w.category === "crm";
    return true;
  });

  const activeCount = workflows.filter((w) => w.active).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
      {/* Page Header with Subtitle & Actions matching Stitch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Automation Workflows
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Multi-step autonomous triggers, audience routing, and sync rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 shadow-2xs"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUseTemplate("Instant Lead Verification", "enrichment", ["Trigger: Inbound", "Verify Mailbox", "Score Lead"])}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Import Template</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Workflow</span>
          </Button>
        </div>
      </div>

      {/* Top 3 Metric Summary Cards matching Stitch */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Active Workflows</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              of {workflows.length} configured
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {workflows.length - activeCount} paused for seasonal adjustments
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Executions (This Month)</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              24,180
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              +14%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Triggered across email, CRM, and LinkedIn
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Hours Saved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              168 hrs
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Estimated $12,400 team bandwidth reclaimed
          </p>
        </div>
      </div>

      {/* Main Interactive Workflows List Section matching Stitch */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {/* Filter Tabs & Actions */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-full">
            {[
              { id: "all", label: "All Workflows", count: workflows.length },
              { id: "outreach", label: "Outreach & Follow-ups", count: workflows.filter((w) => w.category === "outreach").length },
              { id: "enrichment", label: "Enrichment & Scoring", count: workflows.filter((w) => w.category === "enrichment").length },
              { id: "crm", label: "CRM Sync", count: workflows.filter((w) => w.category === "crm").length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Last run <span className="font-medium text-slate-700 dark:text-slate-300">4 minutes ago</span>
          </div>
        </div>

        {/* Workflow Cards Stack */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredWorkflows.map((workflow) => {
            const Icon = workflow.icon;
            const isRunning = runningJobId === workflow.id;
            const isExpanded = expandedId === workflow.id;

            return (
              <div
                key={workflow.id}
                className={cn(
                  "p-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors",
                  !workflow.active && "opacity-75"
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-medium mt-0.5 border shadow-2xs",
                        workflow.iconBg,
                        workflow.iconBorder,
                        workflow.iconColor
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                          {workflow.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5",
                            workflow.active
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-200 dark:border-emerald-900"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}
                        >
                          {workflow.active ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                        {workflow.description}
                      </p>

                      {/* Multi-Step Pipeline Preview */}
                      <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-600 dark:text-slate-400">
                        {workflow.steps.map((step, idx) => (
                          <React.Fragment key={idx}>
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {step}
                            </span>
                            {idx < workflow.steps.length - 1 && (
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {workflow.runsCount.toLocaleString()} runs
                      </div>
                      <div className="text-[11px] text-slate-400">Autonomous execution</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runWorkflowNow(workflow.id, workflow.jobId)}
                        disabled={!workflow.active || isRunning}
                        className="h-8 px-2.5 rounded-lg text-xs gap-1 border-slate-200 dark:border-slate-800"
                      >
                        {isRunning ? (
                          <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                        ) : (
                          <Play className="h-3 w-3 text-slate-600" />
                        )}
                        <span>{isRunning ? "Triggering..." : "Run"}</span>
                      </Button>

                      {/* Toggle switch */}
                      <Switch
                        checked={workflow.active}
                        onCheckedChange={() => toggleWorkflow(workflow.id)}
                      />

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : workflow.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Toggle Execution History"
                      >
                        <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Execution History Log */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Recent Telemetry Log
                          </span>
                          <span className="font-mono text-[11px] text-emerald-600">SLA: 100% Success</span>
                        </div>
                        <div className="space-y-1.5 text-xs font-mono">
                          <div className="flex items-center justify-between py-1 px-2.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <span className="text-slate-600 dark:text-slate-400">Trigger evaluated: condition match (Fit 94%)</span>
                            <span className="text-slate-400" suppressHydrationWarning>4 mins ago · 142ms</span>
                          </div>
                          <div className="flex items-center justify-between py-1 px-2.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <span className="text-slate-600 dark:text-slate-400">Payload generated and verified against guardrails</span>
                            <span className="text-slate-400" suppressHydrationWarning>18 mins ago · 380ms</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {filteredWorkflows.length} of {workflows.length} automations</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800 dark:text-slate-200">Page 1 of 1</span>
          </div>
        </div>
      </div>

      {/* Recommended Workflow Templates Section matching Stitch */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Recommended Workflow Templates
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pre-built revenue triggers ready to deploy in one click.
            </p>
          </div>
          <button
            onClick={() => handleUseTemplate("Account Tier Escalation", "crm", ["Trigger: High Usage", "Assign Exec Sponsor", "Schedule Review"])}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Explore all templates →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Template 1 */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-sm font-medium mb-3">
                <Building2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Executive Job Change Alerts
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Triggers when a champion or buyer from your existing client list transitions to a new company.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">Outreach & Follow-up</span>
              <button
                onClick={() => handleUseTemplate("Executive Job Change Alerts", "outreach", ["Trigger: Role Change Detected", "Enrich New Org Stack", "Dispatch Congratulatory Pitch"])}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Template 2 */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-sm font-medium mb-3">
                <Globe className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Conference & Event Geofence
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enriches prospective leads who attend key tech summits with custom localized opening lines.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">Enrichment & Scoring</span>
              <button
                onClick={() => handleUseTemplate("Conference & Event Geofence", "enrichment", ["Trigger: Summit Attendee Signal", "Cross-ref Title", "Draft Localized Opener"])}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Template 3 */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-sm font-medium mb-3">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Zero-Bounce Verification
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pre-flight MX record and inbox ping verification before any outreach payload is dispatched.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">Safety & Guardrail</span>
              <button
                onClick={() => handleUseTemplate("Zero-Bounce Verification", "enrichment", ["Trigger: Pre-flight Dispatch", "Check MX Records", "Validate Deliverability"])}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Workflow Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                      Create Automation Workflow
                    </h3>
                    <p className="text-xs text-slate-500">Autonomous multi-step trigger recipe</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateWorkflow} className="py-4 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Workflow Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Inbound Fast Track"
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category Type
                  </label>
                  <select
                    value={newWorkflowCategory}
                    onChange={(e) => setNewWorkflowCategory(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="enrichment">Enrichment & Scoring</option>
                    <option value="outreach">Outreach & Follow-ups</option>
                    <option value="crm">CRM Sync</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Deploy Workflow
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
