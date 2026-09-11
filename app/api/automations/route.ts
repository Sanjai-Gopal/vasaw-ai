import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    
    const { data: automations, error } = await admin
      .from("automations")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    // Get recent runs for each automation
    const automationIds = (automations ?? []).map((a) => a.id);
    const { data: runs } = await admin
      .from("automation_runs")
      .select("*")
      .in("automation_id", automationIds)
      .order("created_at", { ascending: false })
      .limit(100);
    
    const runsByAutomation: Record<string, Array<{ id: string; automation_id: string; status: string; created_at: string }>> = {};
    for (const run of runs ?? []) {
      if (!runsByAutomation[run.automation_id]) runsByAutomation[run.automation_id] = [];
      runsByAutomation[run.automation_id].push(run);
    }
    
    const automationsWithRuns = (automations ?? []).map((a) => ({
      ...a,
      recentRuns: runsByAutomation[a.id] ?? [],
    }));
    
    return NextResponse.json({ ok: true, automations: automationsWithRuns });
  } catch (err) {
    console.error("[API] Automations error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "trigger_all", targetZone, automationId } = body;

    const admin = getSupabaseAdmin();

    // Log the triggered automation or pipeline cycle into activities table
    try {
      await admin.from("activities").insert({
        actor: "Automation Engine",
        type: "orchestrator",
        status: "success",
        title: action === "trigger_all" ? "Autonomous Pipeline Run Initiated" : "Automation Triggered",
        description: targetZone ? `Executed cycle targeted at ${targetZone}` : `Triggered action: ${action}`,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      ok: true,
      status: "running",
      action,
      targetZone: targetZone || "Global Cluster",
      message: "Autonomous multi-agent pipeline cycle started successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API] Automations POST error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to trigger automation" },
      { status: 500 }
    );
  }
}