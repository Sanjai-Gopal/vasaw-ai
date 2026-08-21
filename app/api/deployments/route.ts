import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    
    const admin = getSupabaseAdmin();
    
    let query = admin.from("deployments").select("*").limit(limit);
    
    if (campaignId) {
      const { data: leads } = await admin
        .from("leads")
        .select("id")
        .eq("campaign_id", campaignId);
      const leadIds = leads?.map((l) => l.id) ?? [];
      if (leadIds.length > 0) {
        query = query.in("lead_id", leadIds);
      } else {
        return NextResponse.json({ ok: true, deployments: [] });
      }
    }
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data: deployments, error } = await query.order("created_at", { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json({ ok: true, deployments: deployments ?? [] });
  } catch (err) {
    console.error("[API] Deployments list error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}