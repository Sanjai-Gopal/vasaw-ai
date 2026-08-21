import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = getSupabaseAdmin();
    
    const { data: lead, error } = await admin
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !lead) {
      return NextResponse.json(
        { ok: false, error: "Lead not found" },
        { status: 404 }
      );
    }
    
    // Also fetch related website, messages, etc.
    const { data: website } = await admin
      .from("websites")
      .select("*")
      .eq("lead_id", id)
      .single();
    
    const { data: messages } = await admin
      .from("messages")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });
    
    const { data: activities } = await admin
      .from("activities")
      .select("*")
      .eq("lead_id", id)
      .order("timestamp", { ascending: false })
      .limit(20);
    
    return NextResponse.json({
      ok: true,
      lead,
      website,
      messages: messages ?? [],
      activities: activities ?? [],
    });
  } catch (err) {
    console.error("[API] Lead get error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const admin = getSupabaseAdmin();
    
    const { status, ...updates } = body;
    
    const { data: lead, error } = await admin
      .from("leads")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    
    if (error || !lead) {
      return NextResponse.json(
        { ok: false, error: "Lead not found" },
        { status: 404 }
      );
    }
    
    if (status) {
      await admin.from("activities").insert({
        lead_id: id,
        actor: "api",
        type: "lead",
        status: "info",
        title: `Status updated to ${status}`,
        description: JSON.stringify(updates),
      });
    }
    
    return NextResponse.json({ ok: true, lead });
  } catch (err) {
    console.error("[API] Lead patch error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}