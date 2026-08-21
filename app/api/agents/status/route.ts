import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    
    const { data: agentRuns, error } = await admin
      .from("agent_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    // Aggregate by agent
    const agentMap: Record<string, {
      id: string;
      name: string;
      totalRuns: number;
      successRuns: number;
      failedRuns: number;
      avgDurationMs: number;
      lastRun: string;
      status: string;
    }> = {};
    
    for (const run of agentRuns ?? []) {
      if (!agentMap[run.agent_id]) {
        agentMap[run.agent_id] = {
          id: run.agent_id,
          name: run.agent_id,
          totalRuns: 0,
          successRuns: 0,
          failedRuns: 0,
          avgDurationMs: 0,
          lastRun: run.created_at,
          status: "idle",
        };
      }
      const agent = agentMap[run.agent_id];
      agent.totalRuns++;
      if (run.success) agent.successRuns++;
      else agent.failedRuns++;
      agent.avgDurationMs = Math.round(
        (agent.avgDurationMs * (agent.totalRuns - 1) + run.duration_ms) / agent.totalRuns
      );
      if (new Date(run.created_at) > new Date(agent.lastRun)) {
        agent.lastRun = run.created_at;
      }
      agent.status = run.status === "running" ? "running" : 
        run.success ? "healthy" : "error";
    }
    
    return NextResponse.json({ ok: true, agents: Object.values(agentMap) });
  } catch (err) {
    console.error("[API] Agents status error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}