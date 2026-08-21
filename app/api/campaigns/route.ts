import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    
    const { data: campaigns, error } = await admin
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json({ ok: true, campaigns: campaigns ?? [] });
  } catch (err) {
    console.error("[API] Campaigns list error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}