import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runDeploymentAgent } from "@/lib/agents/deployment";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = getSupabaseAdmin();
    
    const { data: website } = await admin
      .from("websites")
      .select("*")
      .eq("id", id)
      .single();
    
    if (!website) {
      return NextResponse.json(
        { ok: false, error: "Website not found" },
        { status: 404 }
      );
    }
    
    if (website.status !== "built" && website.status !== "quality_passed") {
      return NextResponse.json(
        { ok: false, error: `Website must be built first (current: ${website.status})` },
        { status: 400 }
      );
    }
    
    const result = await runDeploymentAgent(id);
    
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[API] Website deploy error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}