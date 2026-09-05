import { NextResponse } from "next/server";
import { getMessages } from "@/lib/data/messages";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const messages = await getMessages();
    return NextResponse.json({ ok: true, messages });
  } catch (err) {
    console.error("[API] Messages error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}