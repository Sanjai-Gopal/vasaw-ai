import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = getSupabaseAdmin();
    
    // GitHub webhook payload
    const { action, repository, commit, ref } = body;
    
    await admin.from("activities").insert({
      actor: "github-webhook",
      type: "deployment",
      status: "info",
      title: `GitHub webhook: ${action}`,
      description: `Repo: ${repository?.full_name}, Ref: ${ref}, Commit: ${commit?.sha?.slice(0, 7)}`,
    });
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] GitHub webhook error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}