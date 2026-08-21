import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = getSupabaseAdmin();
    
    // WhatsApp webhook payload
    const { entry } = body;
    
    await admin.from("activities").insert({
      actor: "whatsapp-webhook",
      type: "message",
      status: "info",
      title: "WhatsApp webhook received",
      description: JSON.stringify(entry).slice(0, 500),
    });
    
    // Process WhatsApp messages
    // This is a placeholder - real implementation would:
    // 1. Verify webhook signature
    // 2. Parse messages
    // 3. Classify replies
    // 4. Update lead status
    // 5. Trigger follow-up
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] WhatsApp webhook error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  
  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}