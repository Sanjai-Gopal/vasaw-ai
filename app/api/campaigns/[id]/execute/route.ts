import { NextRequest, NextResponse } from "next/server";
import { executeCampaign } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { locations, categories, maxPages, maxItems, concurrency } = body;
    
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: "locations array is required" },
        { status: 400 }
      );
    }
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: "categories array is required" },
        { status: 400 }
      );
    }
    
    const result = await executeCampaign(id, locations, categories, {
      maxPages,
      maxItems,
      concurrency,
    });
    
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[API] Campaign execute error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}