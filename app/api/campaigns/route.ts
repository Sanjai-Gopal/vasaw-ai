import { NextResponse } from "next/server";
import { getCampaigns } from "@/lib/data/campaigns";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campaigns = await getCampaigns();
    return NextResponse.json({ ok: true, campaigns });
  } catch (err) {
    console.error("[API] Campaigns error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      name,
      category = "Restaurant",
      leadTarget = 50,
      automationMode = "semi-automatic",
    } = body;

    const rawLocation = typeof body.location === "string" ? body.location.trim() : "";
    const location = !rawLocation || ["worldwide", "global", "worldwide (global)", "all"].includes(rawLocation.toLowerCase())
      ? "Worldwide (Global)"
      : rawLocation;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { ok: false, error: "Campaign name is required" },
        { status: 400 }
      );
    }

    const generatedId = crypto.randomUUID();
    const now = new Date().toISOString();

    let createdCampaign: Campaign = {
      id: generatedId,
      name,
      category,
      location,
      leadTarget: Number(leadTarget) || 50,
      status: "active",
      progress: 0,
      leadsCollected: 0,
      leadsQualified: 0,
      websitesBuilt: 0,
      websitesDeployed: 0,
      messagesSent: 0,
      minimumRating: typeof body.minimumRating === "number" ? body.minimumRating : 4.0,
      minimumReviews: typeof body.minimumReviews === "number" ? body.minimumReviews : 20,
      websiteOpportunityRequirement: typeof body.websiteOpportunityRequirement === "boolean" ? body.websiteOpportunityRequirement : true,
      socialPresenceRequirement: typeof body.socialPresenceRequirement === "boolean" ? body.socialPresenceRequirement : false,
      automationMode,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.from("campaigns").insert({
        id: generatedId,
        name: createdCampaign.name,
        category: createdCampaign.category,
        location: createdCampaign.location,
        lead_target: createdCampaign.leadTarget,
        status: createdCampaign.status,
        progress: createdCampaign.progress,
        leads_collected: createdCampaign.leadsCollected,
        leads_qualified: createdCampaign.leadsQualified,
        websites_built: createdCampaign.websitesBuilt,
        websites_deployed: createdCampaign.websitesDeployed,
        messages_sent: createdCampaign.messagesSent,
        minimum_rating: createdCampaign.minimumRating,
        minimum_reviews: createdCampaign.minimumReviews,
        website_opportunity_requirement: createdCampaign.websiteOpportunityRequirement,
        social_presence_requirement: createdCampaign.socialPresenceRequirement,
        automation_mode: createdCampaign.automationMode,
      }).select().single();

      if (!error && data) {
        const { mapCampaignFromDb } = await import("@/lib/data/campaigns");
        createdCampaign = mapCampaignFromDb(data);
      }
    } catch (dbErr) {
      console.warn("[API] Campaigns non-blocking DB insert notice:", dbErr);
    }

    return NextResponse.json({ ok: true, campaign: createdCampaign });
  } catch (err) {
    console.error("[API] Create Campaign error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to create campaign" },
      { status: 500 }
    );
  }
}