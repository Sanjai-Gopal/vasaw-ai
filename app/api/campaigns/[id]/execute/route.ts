import { NextRequest, NextResponse } from "next/server";
import { executeCampaign } from "@/lib/agents/orchestrator";
import { getCampaignById, mapCampaignFromDb } from "@/lib/data/campaigns";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLiveMode, validateModeCredentials } from "@/lib/config/modes";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Resolve campaign from database
    const existing = await getCampaignById(id);
    const locations = Array.isArray(body.locations) && body.locations.length > 0
      ? body.locations
      : [existing?.location || "RS Puram"];
    const categories = Array.isArray(body.categories) && body.categories.length > 0
      ? body.categories
      : [existing?.category || "Restaurant"];

    const existingCount = existing?.leadsCollected || 0;
    const leadTarget = existing?.leadTarget || 50;
    const remainingTarget = Math.max(0, leadTarget - existingCount);

    // Read CAMPAIGN_BATCH_SIZE from environment variable or fallback to 10
    const envBatchSize = parseInt(process.env.CAMPAIGN_BATCH_SIZE || "10", 10);
    const defaultBatchSize = Number.isInteger(envBatchSize) && envBatchSize > 0 ? envBatchSize : 10;

    // Requested batch cannot exceed remaining target
    const requestedBatch = typeof body.maxItems === "number" && body.maxItems > 0
      ? Math.min(body.maxItems, remainingTarget)
      : Math.min(defaultBatchSize, remainingTarget);

    const mode = body.mode || (isLiveMode() ? "real" : "mock");

    // In live mode, validate required credentials before starting
    if (mode === "real" || mode === "live") {
      const validation = validateModeCredentials("live");
      if (!validation.valid) {
        return NextResponse.json(
          {
            ok: false,
            error: `Cannot execute in LIVE mode: Missing required credentials: ${validation.missingRequired.join(", ")}. Please configure them in .env.local or switch APP_INTEGRATION_MODE=mock.`,
            missingCredentials: validation.missingRequired,
          },
          { status: 400 }
        );
      }
    }

    // If campaign target is already reached and not forcing execution, return completed status immediately
    if (remainingTarget <= 0 && !body.force) {
      const completedCampaign = existing
        ? { ...existing, status: "completed" as const, progress: 100 }
        : null;

      return NextResponse.json({
        ok: true,
        campaign: completedCampaign,
        message: `Campaign target of ${leadTarget} already reached.`,
        batchStats: {
          requested: 0,
          processed: 0,
          remaining: 0,
          isComplete: true,
          isExhausted: false,
        },
      });
    }

    // Determine offset and fetch existing lead external IDs for deduplication
    const offset = typeof body.offset === "number" && body.offset >= 0 ? body.offset : existingCount;
    let existingLeadIds: string[] = [];
    try {
      const admin = getSupabaseAdmin();
      const { data: dbLeads } = await admin
        .from("leads")
        .select("source_record_id")
        .eq("campaign_id", id);
      if (dbLeads) {
        existingLeadIds = dbLeads.map((l) => l.source_record_id).filter(Boolean);
      }
    } catch {
      // Non-blocking in mock/offline mode
    }

    const result = await executeCampaign(id, locations, categories, {
      maxPages: body.maxPages,
      maxItems: requestedBatch,
      offset,
      excludeExternalIds: existingLeadIds,
      concurrency: body.concurrency,
      mode,
      skipOutreach: body.skipOutreach,
    });

    // Recalculate and persist updated campaign stats
    const scrapedInBatch = result.stats?.scraped || 0;
    const newCollected = existingCount + scrapedInBatch;
    const newQualified = (existing?.leadsQualified || 0) + (result.stats?.qualified || 0);
    const newBuilt = (existing?.websitesBuilt || 0) + (result.stats?.websitesBuilt || 0);
    const newDeployed = (existing?.websitesDeployed || 0) + (result.stats?.websitesDeployed || 0);
    const newSent = (existing?.messagesSent || 0) + (result.stats?.messagesSent || 0);
    const target = leadTarget;
    const progress = Math.min(100, Math.round((newCollected / target) * 100));

    const isTargetReached = newCollected >= target;
    const isExhausted = scrapedInBatch < requestedBatch; // Scraper found fewer leads than requested
    const nextStatus: Campaign["status"] = isTargetReached || (isExhausted && newCollected > 0) ? "completed" : "active";

    let updatedCampaign: Campaign | null = existing
      ? {
          ...existing,
          status: nextStatus,
          leadsCollected: newCollected,
          leadsQualified: newQualified,
          websitesBuilt: newBuilt,
          websitesDeployed: newDeployed,
          messagesSent: newSent,
          progress,
          updatedAt: new Date().toISOString(),
        }
      : null;

    try {
      const admin = getSupabaseAdmin();
      const { data: dbData } = await admin
        .from("campaigns")
        .update({
          status: nextStatus,
          leads_collected: newCollected,
          leads_qualified: newQualified,
          websites_built: newBuilt,
          websites_deployed: newDeployed,
          messages_sent: newSent,
          progress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (dbData) {
        updatedCampaign = mapCampaignFromDb(dbData);
      }
    } catch (dbErr) {
      console.warn("[API] Campaign DB stats update notice:", dbErr);
    }

    let message = `Batch completed: ${scrapedInBatch} leads processed. Campaign progress: ${newCollected}/${target}.`;
    if (isTargetReached) {
      message = `Campaign completed: ${newCollected}/${target} leads collected!`;
    } else if (isExhausted) {
      message = `Target partially fulfilled: ${newCollected}/${target} unique leads found.`;
    }

    return NextResponse.json({
      ok: true,
      campaign: updatedCampaign,
      result,
      batchStats: {
        requested: requestedBatch,
        processed: scrapedInBatch,
        remaining: Math.max(0, target - newCollected),
        isComplete: nextStatus === "completed",
        isExhausted,
      },
      message,
    });
  } catch (err) {
    console.error("[API] Campaign execute error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}