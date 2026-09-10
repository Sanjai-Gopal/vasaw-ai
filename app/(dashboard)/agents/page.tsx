"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  RefreshCw,
  Cpu,
  Zap,
  Activity,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgentCard } from "@/components/dashboard/agent-card";
import { PipelineVisual } from "@/components/dashboard/pipeline-visual";
import { Button } from "@/components/ui/button";
import { agents as initialAgents } from "@/lib/data/agents";
import { cn } from "@/lib/utils";
import type { Agent, ActivityItem, PipelineStage } from "@/lib/types";

export default function AgentsPage() {
  const [agents, setAgents] = React.useState<Agent[]>(initialAgents);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [pipeline, setPipeline] = React.useState<PipelineStage[]>([]);
  const [loadingPipeline, setLoadingPipeline] = React.useState(true);
  const [loadingAgents, setLoadingAgents] = React.useState(true);

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
            location: "Coimbatore",
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
                phone: "+919876543210",
                address: "Coimbatore",
                city: "Coimbatore",
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
              phone: "+919876543210",
              address: "Coimbatore",
              city: "Coimbatore",
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
          locations: ["Coimbatore"],
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
  const healthyCount = agents.filter((a) => a.status === "healthy" || a.status === "online").length;
  const totalRunsAll = agents.reduce((acc, a) => acc + (a.totalRuns || 0), 0);
  const totalSuccessAll = agents.reduce((acc, a) => acc + (a.successRuns || 0), 0);
  const fleetSuccessRate = totalRunsAll > 0 ? Math.round((totalSuccessAll / totalRunsAll) * 100) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <PageHeader
        title="Autonomous Fleet"
        description="Six specialized micro-agents orchestrated in real-time across scraping, AST synthesis, Edge deployment, and messaging."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 font-sans text-xs"
            onClick={() => fetchAgentsStatus()}
            disabled={loadingAgents}
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-slate-500", loadingAgents && "animate-spin")} />
            Sync Telemetry
          </Button>
          <Button
            className="gap-1.5 font-sans text-xs bg-slate-900 text-white hover:bg-slate-800"
            onClick={runAllAgents}
            disabled={anyRunning}
          >
            <Play className={cn("h-3.5 w-3.5", anyRunning && "animate-spin")} />
            Run All Fleet Agents
          </Button>
        </div>
      </PageHeader>

      {/* Porcelain Summary Telemetry Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Fleet Units", value: `${healthyCount}/6`, sub: "Operational nodes online", color: "text-emerald-600", accent: "from-emerald-400 to-teal-500" },
          { label: "Total Executions", value: totalRunsAll.toLocaleString(), sub: "Cumulative task runs", color: "text-slate-950", accent: "from-slate-600 to-slate-800" },
          { label: "Fleet Success SLA", value: fleetSuccessRate !== null ? `${fleetSuccessRate}%` : "No data yet", sub: "Error-free task completion", color: "text-blue-600", accent: "from-blue-500 to-indigo-500" },
          { label: "Heartbeat Interval", value: "250ms", sub: "Distributed state sync", color: "text-purple-600", accent: "from-purple-400 to-indigo-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover-lift"
          >
            <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-70", s.accent)} />
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={cn("mt-1.5 font-display text-3xl font-extrabold tracking-tight", s.color)}>{s.value}</p>
            <p className="mt-1 font-sans text-xs text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Autonomous Pipeline Stage Diagram */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-950 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-600" />
              Autonomous Orchestration Pipeline
            </h3>
            <p className="font-sans text-xs text-slate-500">
              The continuous kinetic flow VASAW AI executes for every prospective business target
            </p>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            DAG GRAPH: 6 SYNCHRONIZED NODES
          </span>
        </div>

        {loadingPipeline ? (
          <div className="h-36 animate-pulse rounded-2xl bg-slate-100/70 border border-slate-200" />
        ) : (
          <PipelineVisual stages={pipeline} />
        )}
      </div>

      {/* Agent Fleet Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-950">Specialized Fleet Workers</h2>
          <p className="font-sans text-xs text-slate-500">
            Autonomous agent units equipped with specialized tools, AST parsers, and external APIs.
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-slate-500">
          {agents.filter((a) => a.status === "healthy").length} Ready · {agents.filter((a) => a.status === "running").length} Running
        </span>
      </div>

      {/* Agent Fleet Cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent, index) => (
          <div key={agent.id} className="flex flex-col gap-3">
            <Link href={`/agents/${agent.id}`} className="block group">
              <AgentCard agent={agent} index={index} />
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-sans text-xs rounded-xl bg-white hover:bg-slate-50 border-slate-200"
              onClick={() => runNow(agent.id)}
              disabled={anyRunning && runningId !== agent.id}
            >
              {runningId === agent.id ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
              ) : (
                <Play className="h-3.5 w-3.5 text-slate-600" />
              )}
              Execute {agent.name.split(" ")[0]} Unit
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}