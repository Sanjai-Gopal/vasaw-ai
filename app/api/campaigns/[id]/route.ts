import { NextRequest, NextResponse } from "next/server";
import { getCampaignById, mapCampaignFromDb } from "@/lib/data/campaigns";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await getCampaignById(id);

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, campaign });
  } catch (err) {
    console.error("[API] Get campaign error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch campaign" },
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

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) updatePayload.status = body.status;
    if (body.name) updatePayload.name = body.name;
    if (typeof body.leadTarget === "number") updatePayload.lead_target = body.leadTarget;
    if (typeof body.progress === "number") updatePayload.progress = body.progress;
    if (typeof body.leadsCollected === "number") updatePayload.leads_collected = body.leadsCollected;
    if (typeof body.leadsQualified === "number") updatePayload.leads_qualified = body.leadsQualified;
    if (typeof body.websitesBuilt === "number") updatePayload.websites_built = body.websitesBuilt;
    if (typeof body.websitesDeployed === "number") updatePayload.websites_deployed = body.websitesDeployed;
    if (typeof body.messagesSent === "number") updatePayload.messages_sent = body.messagesSent;

    const { data, error } = await admin
      .from("campaigns")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      // In fallback / offline mode, return updated in-memory representation
      const current = await getCampaignById(id);
      if (!current) {
        return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
      }
      const updated = {
        ...current,
        ...body,
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ ok: true, campaign: updated });
    }

    return NextResponse.json({ ok: true, campaign: mapCampaignFromDb(data) });
  } catch (err) {
    console.error("[API] Update campaign error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to update campaign" },
      { status: 500 }
    );
  }
}
