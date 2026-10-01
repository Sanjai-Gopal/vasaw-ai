import { NextRequest, NextResponse } from "next/server";
import { placeEdesyCall, getEdesyCall, isEdesyConfigured } from "@/lib/voice/edesy";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!isEdesyConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Edesy API key not configured. Set EDESY_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { agentId, phoneNumber, metadata, callbackUrl } = body;

    if (!agentId || !phoneNumber) {
      return NextResponse.json(
        { ok: false, error: "agentId and phoneNumber are required" },
        { status: 400 }
      );
    }

    const result = await placeEdesyCall({ agentId, phoneNumber, metadata, callbackUrl });

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error, code: result.code },
        { status: 502 }
      );
    }

    const admin = getSupabaseAdmin();
    await admin.from("voice_calls").insert({
      conversation_id: result.data!.conversationId,
      agent_id: agentId,
      phone_number: phoneNumber,
      status: "initiated",
      metadata: metadata,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    console.error("[API] /api/voice/call error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!isEdesyConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Edesy API key not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: "conversationId query parameter required" },
        { status: 400 }
      );
    }

    const result = await getEdesyCall(conversationId);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    console.error("[API] /api/voice/call GET error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}