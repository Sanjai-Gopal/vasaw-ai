"use client";

import * as React from "react";
import Link from "next/link";
import { Play, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgentCard } from "@/components/dashboard/agent-card";
import { PipelineVisual } from "@/components/dashboard/pipeline-visual";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { agents as initialAgents } from "@/lib/data/agents";
import type { Agent, ActivityItem, PipelineStage } from "@/lib/types";

export default function AgentsPage() {
  const [agents, setAgents] = React.useState<Agent[]>(initialAgents);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [pipeline, setPipeline] = React.useState<PipelineStage[]>([]);
  const [loadingPipeline, setLoadingPipeline] = React.useState(true);

  React.useEffect(() => {
    async function fetchPipeline() {
      try {
        const { getPipeline } = await import("@/lib/data");
        const stages = await getPipeline();
        setPipeline(stages);
      } catch (err) {
        console.error("Failed to fetch pipeline:", err);
      } finally {
        setLoadingPipeline(false);
      }
    }
    fetchPipeline();
  }, []);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Agents"
        description="Six specialized agents working together to grow your pipeline"
      >
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={runAllAgents}
          disabled={anyRunning}
        >
          <RefreshCw className={`h-4 w-4 ${anyRunning ? "animate-spin" : ""}`} />
          Run all agents
        </Button>
      </PageHeader>

      <Card className="mb-6 p-5">
        <CardHeader className="p-0 pb-4">
          <CardTitle>Future pipeline</CardTitle>
          <CardDescription>
            The complete automation flow VASAW AI will run for every lead
          </CardDescription>
        </CardHeader>
        {loadingPipeline ? (
          <div className="h-32 animate-pulse bg-muted rounded-lg" />
        ) : (
          <PipelineVisual stages={pipeline} />
        )}
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Agent fleet</h2>
        <p className="text-xs text-muted-foreground">
          {agents.filter((a) => a.status === "healthy").length} healthy ·{" "}
          {agents.filter((a) => a.status === "running").length} running
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent, index) => (
          <div key={agent.id} className="flex flex-col gap-3">
            <Link href={`/agents/${agent.id}`} className="block">
              <AgentCard agent={agent} index={index} />
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => runNow(agent.id)}
              disabled={anyRunning && runningId !== agent.id}
            >
              <Play className="h-3.5 w-3.5" />
              Run now
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}