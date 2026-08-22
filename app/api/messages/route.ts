import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) throw error;

    return NextResponse.json({ ok: true, messages: data ?? [] });
  } catch (err) {
    console.error("[API] Messages error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}