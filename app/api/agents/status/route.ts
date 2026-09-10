import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { agents as defaultAgents } from "@/lib/data/agents";
import type { Agent, AgentId, ActivityItem, AgentRun } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    
    const { data: agentRuns, error } = await admin
      .from("agent_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    
    if (error) {
      console.warn("[API] Agent runs query error (fallback to defaults):", error.message);
      return NextResponse.json({ ok: true, agents: defaultAgents });
    }
    
    // Map of runs aggregated by agent ID
    const aggregated: Record<string, {
      totalRuns: number;
      successRuns: number;
      failedRuns: number;
      avgDurationMs: number;
      lastRun?: string;
      status: Agent["status"];
      recentActivity: ActivityItem[];
      runs: AgentRun[];
    }> = {};

    for (const run of agentRuns ?? []) {
      const aId = run.agent_id as string;
      if (!aggregated[aId]) {
        aggregated[aId] = {
          totalRuns: 0,
          successRuns: 0,
          failedRuns: 0,
          avgDurationMs: 0,
          lastRun: undefined,
          status: "idle",
          recentActivity: [],
          runs: [],
        };
      }
      const agg = aggregated[aId];
      agg.totalRuns++;
      if (run.success) agg.successRuns++;
      else agg.failedRuns++;
      
      const dur = typeof run.duration_ms === "number" ? run.duration_ms : 0;
      agg.avgDurationMs = Math.round(
        (agg.avgDurationMs * (agg.totalRuns - 1) + dur) / agg.totalRuns
      );

      if (!agg.lastRun || new Date(run.created_at) > new Date(agg.lastRun)) {
        agg.lastRun = run.created_at;
      }
      
      if (agg.status !== "running") {
        agg.status = run.status === "running" ? "running" : run.success ? "healthy" : "error";
      }

      if (agg.runs.length < 10) {
        agg.runs.push({
          id: run.id,
          timestamp: run.created_at,
          status: run.status === "running" ? "running" : run.success ? "success" : "failed",
          durationMs: dur,
          detail: run.error || run.step || "Execution finished",
        });
      }

      if (agg.recentActivity.length < 5) {
        agg.recentActivity.push({
          id: `act-${run.id}`,
          timestamp: run.created_at,
          actor: aId,
          type: "agent",
          status: run.success ? "success" : "error",
          title: `Run ${run.success ? "succeeded" : "failed"}`,
          description: run.error || undefined,
        });
      }
    }

    const mergedAgents: Agent[] = defaultAgents.map((def) => {
      const agg = aggregated[def.id];
      if (!agg) {
        return def;
      }
      return {
        ...def,
        status: agg.status,
        lastRun: agg.lastRun || def.lastRun,
        totalRuns: agg.totalRuns,
        successRuns: agg.successRuns,
        failedRuns: agg.failedRuns,
        avgDurationMs: agg.avgDurationMs,
        recentActivity: agg.recentActivity,
        runs: agg.runs,
      };
    });

    return NextResponse.json({ ok: true, agents: mergedAgents });
  } catch (err) {
    console.warn("[API] Agents status notice (using defaults):", err);
    return NextResponse.json({ ok: true, agents: defaultAgents });
  }
}