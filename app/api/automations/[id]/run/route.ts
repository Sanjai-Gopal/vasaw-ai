import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = getSupabaseAdmin();
    
    const { data: automation } = await admin
      .from("automations")
      .select("*")
      .eq("id", id)
      .single();
    
    if (!automation) {
      return NextResponse.json(
        { ok: false, error: "Automation not found" },
        { status: 404 }
      );
    }
    
    // Create automation run
    const { data: run, error: runError } = await admin
      .from("automation_runs")
      .insert({
        automation_id: id,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (runError || !run) throw new Error("Failed to create automation run");
    
    // In real implementation, execute the automation based on type
    // For now, just mark as complete
    await admin
      .from("automation_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_ms: 1000,
        success: true,
      })
      .eq("id", run.id);
    
    return NextResponse.json({ ok: true, run });
  } catch (err) {
    console.error("[API] Automation run error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}