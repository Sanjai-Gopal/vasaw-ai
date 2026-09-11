"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RefreshCw,
  Cpu,
  Zap,
  Activity,
  Shield,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Sliders,
  FileText,
  MoreVertical,
  Search,
  CheckCircle2,
  Globe,
  Rocket,
  Send,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PipelineVisual } from "@/components/dashboard/pipeline-visual";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { agents as initialAgents } from "@/lib/data/agents";
import { cn } from "@/lib/utils";
import type { Agent, ActivityItem, PipelineStage } from "@/lib/types";

interface AgentMeta {
  category: "Enrichment" | "Outreach" | "Research";
  baseModel: string;
  throughput: string;
  successRate: string;
  currentTask: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
}

const AGENT_METADATA: Record<string, AgentMeta> = {
  scraping: {
    category: "Enrichment",
    baseModel: "Claude 3.5 Sonnet",
    throughput: "42 records/min",
    successRate: "99.4%",
    currentTask: "B2B SaaS Director dataset (Row 1,482/3,000)",
    iconBg: "bg-blue-50 dark:bg-blue-950/50",
    iconBorder: "border-blue-100 dark:border-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  checking: {
    category: "Research",
    baseModel: "Gemini 2.5 Flash",
    throughput: "68 records/min",
    successRate: "98.8%",
    currentTask: "Website presence & DNS qualification verification",
    iconBg: "bg-cyan-50 dark:bg-cyan-950/50",
    iconBorder: "border-cyan-100 dark:border-cyan-900/50",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  storage: {
    category: "Enrichment",
    baseModel: "GPT-4o Mini",
    throughput: "120 records/min",
    successRate: "99.9%",
    currentTask: "Supabase deduplication & lead account normalization",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    iconBorder: "border-emerald-100 dark:border-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  "website-building": {
    category: "Research",
    baseModel: "Gemini 1.5 Pro",
    throughput: "18 sites/min",
    successRate: "99.2%",
    currentTask: "Synthesizing Next.js hero sections with custom copy",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/50",
    iconBorder: "border-indigo-100 dark:border-indigo-900/50",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  deployment: {
    category: "Research",
    baseModel: "Vercel Edge Engine",
    throughput: "24 builds/min",
    successRate: "99.6%",
    currentTask: "Provisioning preview domain and CDN cache validation",
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    iconBorder: "border-amber-100 dark:border-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  whatsapp: {
    category: "Outreach",
    baseModel: "GPT-4o",
    throughput: "35 msgs/min",
    successRate: "97.2%",
    currentTask: "Drafting personalized cold outreach (Enterprise tier)",
    iconBg: "bg-purple-50 dark:bg-purple-950/50",
    iconBorder: "border-purple-100 dark:border-purple-900/50",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
};

export default function AgentsPage() {
  const [agents, setAgents] = React.useState<Agent[]>(initialAgents);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [pipeline, setPipeline] = React.useState<PipelineStage[]>([]);
  const [loadingPipeline, setLoadingPipeline] = React.useState(true);
  const [loadingAgents, setLoadingAgents] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [sortBy, setSortBy] = React.useState<"throughput" | "success" | "name">("throughput");
  const [pausedAgents, setPausedAgents] = React.useState<Record<string, boolean>>({});
  const [showDag, setShowDag] = React.useState(false);
  const [configModalAgent, setConfigModalAgent] = React.useState<Agent | null>(null);

  const fetchAgentsStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/agents/status");
      const data = await res.json();
      if (data.ok && Array.isArray(data.agents)) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.warn("Failed to fetch agent telemetry:", err);
    } finally {
      setLoadingAgents(false);
    }
  }, []);

  React.useEffect(() => {
    async function fetchPipeline() {
      try {
        const res = await fetch("/api/pipeline");
        const data = await res.json();
        if (data.ok && Array.isArray(data.pipeline)) {
          setPipeline(data.pipeline);
        }
      } catch (err) {
        console.warn("Failed to fetch pipeline:", err);
      } finally {
        setLoadingPipeline(false);
      }
    }
    fetchPipeline();
    fetchAgentsStatus();
  }, [fetchAgentsStatus]);

  const togglePause = (id: string) => {
    setPausedAgents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const runNow = async (id: string) => {
    if (runningId) return;
    setRunningId(id);
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "running",
              lastRun: new Date().toISOString(),
              recentActivity: [
                {
                  id: `run-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  actor: a.name,
                  type: "agent",
                  status: "pending",
                  title: "Manual run started",
                  description: "Triggered from the control center.",
                } satisfies ActivityItem,
                ...a.recentActivity,
              ].slice(0, 3),
            }
          : a
      )
    );

    try {
      if (id === "scraping") {
        await fetch("/api/agents/scraping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: "dashboard-test",
            category: "restaurant",
            location: "Worldwide (Global)",
            limit: 3,
            mode: "mock",
          }),
        });
      } else if (id === "checking") {
        await fetch("/api/agents/qualification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leads: [
              {
                id: "lead-dash-1",
                businessName: "Saravana Bhavan",
                category: "restaurant",
                phone: "+442079460991",
                address: "London, UK",
                city: "London",
                rating: 4.5,
                reviewCount: 120,
                website: null,
                scrapedAt: new Date().toISOString(),
              },
            ],
            mode: "mock",
          }),
        });
      } else if (id === "website-building") {
        await fetch("/api/agents/website", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead: {
              id: "lead-dash-1",
              businessName: "Saravana Bhavan",
              category: "restaurant",
              phone: "+442079460991",
              address: "London, UK",
              city: "London",
              rating: 4.5,
              reviewCount: 120,
              website: null,
              scrapedAt: new Date().toISOString(),
            },
            mode: "mock",
          }),
        });
      } else if (id === "deployment") {
        await fetch("/api/agents/deployment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            websiteId: "dash-web-01",
            businessName: "Saravana Bhavan",
            mode: "mock",
          }),
        });
      } else if (id === "whatsapp") {
        await fetch("/api/agents/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: "+919876543210",
            businessName: "Saravana Bhavan",
            message: {
              type: "text",
              body: "Hello Saravana Bhavan, your preview is ready!",
            },
            mode: "mock",
          }),
        });
      }

      setAgents((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "healthy",
                totalRuns: a.totalRuns + 1,
                successRuns: a.successRuns + 1,
                recentActivity: [
                  {
                    id: `done-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    actor: a.name,
                    type: "agent",
                    status: "success",
                    title: "Manual run completed",
                    description: "Run finished successfully via Agent API.",
                  } satisfies ActivityItem,
                  ...a.recentActivity,
                ].slice(0, 3),
              }
            : a
        )
      );
    } catch (err: unknown) {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "error",
                failedRuns: a.failedRuns + 1,
                recentActivity: [
                  {
                    id: `err-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    actor: a.name,
                    type: "agent",
                    status: "error",
                    title: "Manual run failed",
                    description: err instanceof Error ? err.message : "API execution error",
                  } satisfies ActivityItem,
                  ...a.recentActivity,
                ].slice(0, 3),
              }
            : a
        )
      );
    } finally {
      setRunningId(null);
    }
  };

  const runAllAgents = async () => {
    if (runningId || anyRunning) return;
    setRunningId("orchestrator");
    try {
      await fetch("/api/agents/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          campaignId: "dashboard-full-run",
          locations: ["Worldwide (Global)"],
          categories: ["restaurant"],
          maxItems: 2,
          mode: "mock",
        }),
      });
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          status: "healthy",
          totalRuns: a.totalRuns + 1,
          successRuns: a.successRuns + 1,
        }))
      );
    } catch {
      // Non-blocking
    } finally {
      setRunningId(null);
    }
  };

  const anyRunning = agents.some((a) => a.status === "running") || runningId !== null;

  // Filter and Sort logic
  const filteredAgents = agents.filter((agent) => {
    const meta = AGENT_METADATA[agent.id] || { category: "Research" };
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.baseModel.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "inactive") return pausedAgents[agent.id] || agent.status === "idle";
    return meta.category.toLowerCase() === activeTab.toLowerCase();
  });

  const getAgentIcon = (id: string) => {
    switch (id) {
      case "scraping":
        return <Search className="h-5 w-5" />;
      case "checking":
        return <CheckCircle2 className="h-5 w-5" />;
      case "storage":
        return <Database className="h-5 w-5" />;
      case "website-building":
        return <Globe className="h-5 w-5" />;
      case "deployment":
        return <Rocket className="h-5 w-5" />;
      case "whatsapp":
        return <Send className="h-5 w-5" />;
      default:
        return <Cpu className="h-5 w-5" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 mb-2 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Agents & Fleets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Specialized micro-agents orchestrating automated discovery, AST synthesis, edge deployment, and sequence outreach.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 font-sans text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => fetchAgentsStatus()}
            disabled={loadingAgents}
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-slate-500", loadingAgents && "animate-spin")} />
            Sync Telemetry
          </Button>
          <Button
            className="gap-1.5 font-sans text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            onClick={runAllAgents}
            disabled={anyRunning}
          >
            <Play className={cn("h-3.5 w-3.5", anyRunning && "animate-spin")} />
            Run Fleet Cycle
          </Button>
        </div>
      </div>

      {/* Filter and Categorization Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          {[
            { id: "all", label: "All Agents", count: agents.length },
            { id: "enrichment", label: "Enrichment", count: agents.filter(a => AGENT_METADATA[a.id]?.category === "Enrichment").length },
            { id: "outreach", label: "Outreach", count: agents.filter(a => AGENT_METADATA[a.id]?.category === "Outreach").length },
            { id: "research", label: "Research", count: agents.filter(a => AGENT_METADATA[a.id]?.category === "Research").length },
            { id: "inactive", label: "Inactive", count: Object.values(pausedAgents).filter(Boolean).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5",
                activeTab === tab.id
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Quick Search & Sort (Responsive) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search agents, model tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDag((prev) => !prev)}
            className="text-xs font-sans border-slate-200 dark:border-slate-800 gap-1.5"
          >
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            {showDag ? "Hide DAG" : "Show DAG"}
          </Button>
        </div>
      </div>

      {/* Expandable DAG Orchestration Section */}
      <AnimatePresence>
        {showDag && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-600" />
                    Autonomous Orchestration Pipeline
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    The continuous kinetic DAG flow VASAW AI executes for every prospective business target
                  </p>
                </div>
                <span className="font-mono text-[11px] text-slate-400">6 SYNCHRONIZED NODES</span>
              </div>
              {loadingPipeline ? (
                <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/50" />
              ) : (
                <PipelineVisual stages={pipeline} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: 2-Column Spacious High-End Cards matching Stitch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredAgents.map((agent) => {
          const meta = AGENT_METADATA[agent.id] || {
            category: "Research",
            baseModel: "Gemini 2.5 Flash",
            throughput: "40 records/min",
            successRate: "99.0%",
            currentTask: "Analyzing lead infrastructure and web stack",
            iconBg: "bg-slate-100 dark:bg-slate-800",
            iconBorder: "border-slate-200 dark:border-slate-700",
            iconColor: "text-slate-700 dark:text-slate-300",
          };
          const isPaused = pausedAgents[agent.id];
          const isRunning = runningId === agent.id || agent.status === "running";

          return (
            <div
              key={agent.id}
              className={cn(
                "rounded-xl border p-5 transition-all duration-200 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700",
                isPaused
                  ? "border-dashed border-slate-200 dark:border-slate-800 opacity-75"
                  : "border-slate-200 dark:border-slate-800"
              )}
            >
              <div>
                {/* Top Row: Icon + Name + Description + More */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs",
                        meta.iconBg,
                        meta.iconBorder,
                        meta.iconColor
                      )}
                    >
                      {getAgentIcon(agent.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {agent.name}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium",
                            isRunning
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-900"
                              : isPaused
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-900"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isRunning ? "bg-amber-500 animate-ping" : isPaused ? "bg-slate-400" : "bg-emerald-500"
                            )}
                          />
                          {isRunning ? "Running" : isPaused ? "Paused" : "Active"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/agents/${agent.id}`}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="View Agent Deep Dive"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>

                {/* Specs & Telemetry: 3-column clean bar */}
                <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100 dark:border-slate-800/80 mb-4 bg-slate-50/60 dark:bg-slate-950/40 rounded-lg px-3.5">
                  <div>
                    <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Base Model
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                      {meta.baseModel}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Throughput
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                      {meta.throughput}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Success Rate
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                      {meta.successRate}
                    </div>
                  </div>
                </div>

                {/* Current task snippet */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <RefreshCw className={cn("h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400", isRunning && "animate-spin")} />
                  <span className="truncate">
                    Current task:{" "}
                    <strong className="text-slate-800 dark:text-slate-200 font-medium font-sans">
                      {isRunning ? "Executing active pipeline step..." : meta.currentTask}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Quick Controls Footer (Responsive) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setConfigModalAgent(agent)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Sliders className="h-3.5 w-3.5 text-slate-400" />
                    Configure
                  </button>
                  <button
                    onClick={() => togglePause(agent.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    {isPaused ? <Play className="h-3.5 w-3.5 text-slate-500" /> : <Pause className="h-3.5 w-3.5 text-slate-500" />}
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    Logs
                  </Link>
                </div>

                <Button
                  size="sm"
                  onClick={() => runNow(agent.id)}
                  disabled={anyRunning && runningId !== agent.id}
                  className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
                >
                  {isRunning ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  {isRunning ? "Running..." : `Run ${agent.shortName}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Fleet Performance & Guardrails Summary */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Fleet Performance & Guardrails Summary
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time autonomous pipeline integrity and synthesis telemetry
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchAgentsStatus()}
            className="text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
          >
            Audit Telemetry Log
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        {/* 3 Key Metric Columns matching Stitch */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Metric 1: Latency */}
          <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">Average Latency</span>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">18ms</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Zero throttling across distributed cluster</p>
          </div>

          {/* Metric 2: Token Cost */}
          <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">Token Cost Optimization</span>
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">32% reduced</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Saved $412.80 in compute this cycle</p>
          </div>

          {/* Metric 3: Error Rate */}
          <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">Autonomous Error Rate</span>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">0.02%</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">1 self-healed exception in 5,200 orchestrations</p>
          </div>
        </div>
      </div>

      {/* Agent Configure Modal */}
      <AnimatePresence>
        {configModalAgent && (
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
                    <Sliders className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                      Configure {configModalAgent.name}
                    </h3>
                    <p className="text-xs text-slate-500">Autonomous runtime parameters</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfigModalAgent(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="py-4 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Primary LLM Model Engine
                  </label>
                  <select className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs">
                    <option>Claude 3.5 Sonnet (Recommended)</option>
                    <option>Gemini 2.5 Flash (Ultra Fast)</option>
                    <option>GPT-4o (High Reasoning)</option>
                    <option>Mistral Large</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Concurrency Limit (Records / Min)
                  </label>
                  <input
                    type="number"
                    defaultValue={40}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Self-Healing Retry Threshold
                  </label>
                  <input
                    type="number"
                    defaultValue={3}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfigModalAgent(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => setConfigModalAgent(null)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}