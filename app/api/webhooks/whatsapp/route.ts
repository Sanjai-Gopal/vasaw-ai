import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  verifyWebhookChallenge,
  verifyMetaSignature,
  parseWhatsAppWebhookPayload,
  handleWebhookEventStorage,
} from "@/lib/agents/whatsapp";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/whatsapp
 * Receives incoming Meta WhatsApp status and message webhook notifications.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // 1. Verify signature if WHATSAPP_APP_SECRET is configured
    if (!verifyMetaSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 2. Parse events
    const events = parseWhatsAppWebhookPayload(body);
    const results = await Promise.all(
      events.filter((e) => e.processed).map((e) => handleWebhookEventStorage(e))
    );

    // 3. Log webhook activity to database
    try {
      const admin = getSupabaseAdmin();
      await admin.from("activities").insert({
        actor: "whatsapp-webhook",
        type: "message",
        status: "info",
        title: "WhatsApp webhook processed",
        description: `Processed ${events.length} event(s)`,
      });
    } catch {
      // Activity logging is non-blocking
    }

    return NextResponse.json({
      ok: true,
      processed: events.length,
      results,
    });
  } catch (err) {
    console.error("[API] WhatsApp webhook error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/whatsapp
 * Meta WhatsApp webhook challenge verification endpoint.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const result = verifyWebhookChallenge(searchParams);

  if (result.status === 200) {
    return new NextResponse(result.body as string, { status: 200 });
  }

  return NextResponse.json(result.body, { status: result.status });
}