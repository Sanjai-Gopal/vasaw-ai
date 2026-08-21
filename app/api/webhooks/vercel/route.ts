import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = getSupabaseAdmin();
    
    // Vercel webhook payload
    const { type, payload } = body;
    
    await admin.from("activities").insert({
      actor: "vercel-webhook",
      type: "deployment",
      status: "info",
      title: `Vercel webhook: ${type}`,
      description: JSON.stringify(payload).slice(0, 500),
    });
    
    // Handle deployment events
    if (type === "deployment.created" || type === "deployment.ready") {
      const deploymentUrl = payload?.url;
      const projectName = payload?.projectName;
      
      // Find and update deployment record
      if (deploymentUrl && projectName) {
        const { data: deployments } = await admin
          .from("deployments")
          .select("id")
          .ilike("live_url", `%${projectName}%`)
          .limit(1);
        
        if (deployments && deployments.length > 0) {
          await admin
            .from("deployments")
            .update({
              status: type === "deployment.ready" ? "deployed" : "building",
              live_url: deploymentUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", deployments[0].id);
        }
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] Vercel webhook error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}