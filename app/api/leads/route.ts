import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "100");
    
    const admin = getSupabaseAdmin();
    
    let query = admin.from("leads").select("*").limit(limit);
    
    if (campaignId) {
      query = query.eq("campaign_id", campaignId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data: leads, error } = await query.order("created_at", { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json({ ok: true, leads: leads ?? [] });
  } catch (err) {
    console.error("[API] Leads list error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}