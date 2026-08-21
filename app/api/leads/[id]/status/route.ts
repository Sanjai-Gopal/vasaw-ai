import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { transitionLead } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    if (!status) {
      return NextResponse.json(
        { ok: false, error: "status is required" },
        { status: 400 }
      );
    }
    
    await transitionLead(id, status, "api");
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] Lead status error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}