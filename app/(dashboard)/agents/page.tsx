"use client";

import * as React from "react";
import { Play, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgentCard } from "@/components/dashboard/agent-card";
import { PipelineVisual } from "@/components/dashboard/pipeline-visual";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { agents as initialAgents } from "@/lib/data/agents";
import { getPipeline } from "@/lib/data";
import type { Agent, ActivityItem } from "@/lib/types";

export default function AgentsPage() {
  const [agents, setAgents] = React.useState<Agent[]>(initialAgents);
  const [runningId, setRunningId] = React.useState<string | null>(null);

  const pipeline = getPipeline();

  const runNow = (id: string) => {
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
    window.setTimeout(() => {
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
                    description: "Run finished successfully.",
                  } satisfies ActivityItem,
                  ...a.recentActivity,
                ].slice(0, 3),
              }
            : a
        )
      );
      setRunningId(null);
    }, 2500);
  };

  const anyRunning = agents.some((a) => a.status === "running");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Agents"
        description="Six specialized agents working together to grow your pipeline"
      >
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => agents.forEach((a) => a.id !== runningId && runNow(a.id))}
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
        <PipelineVisual stages={pipeline} />
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
            <AgentCard agent={agent} index={index} />
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