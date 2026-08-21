import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = getSupabaseAdmin();
    
    // Apify webhook payload
    const { event, resource, data } = body;
    
    // Log the webhook
    await admin.from("activities").insert({
      actor: "apify-webhook",
      type: "system",
      status: "info",
      title: `Apify webhook: ${event}`,
      description: JSON.stringify({ resource, data: typeof data === 'object' ? JSON.stringify(data).slice(0, 500) : data }),
    });
    
    // Handle different event types
    if (event === "ACTOR.RUN.SUCCEEDED") {
      // Could trigger storage agent here
      console.log("[Webhook] Apify run succeeded:", data?.runId);
    } else if (event === "ACTOR.RUN.FAILED") {
      console.error("[Webhook] Apify run failed:", data?.runId, data?.error);
    }
    
    return NextResponse.json({ ok: true, received: true });
  } catch (err) {
    console.error("[API] Apify webhook error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}