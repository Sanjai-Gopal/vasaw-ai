import { NextResponse } from "next/server";
import { getCampaigns } from "@/lib/data/campaigns";
import { getGoogleSheetsProvider } from "@/lib/integrations/google-sheets";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { spreadsheetId, mode = "mock" } = body;

    const campaigns = await getCampaigns();
    const provider = getGoogleSheetsProvider(mode);
    const result = await provider.exportCampaigns(campaigns, spreadsheetId);

    return NextResponse.json({
      ok: result.success,
      ...result,
    });
  } catch (err) {
    console.error("[API] Sheets export campaigns error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to export campaigns" },
      { status: 500 }
    );
  }
}
