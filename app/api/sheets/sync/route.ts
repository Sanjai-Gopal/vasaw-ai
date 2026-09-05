import { NextResponse } from "next/server";
import { getGoogleSheetsProvider } from "@/lib/integrations/google-sheets";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      spreadsheetId,
      includeLeads = true,
      includeWebsites = true,
      includeMessages = true,
      includeCampaigns = true,
      mode = "mock",
    } = body;

    const provider = getGoogleSheetsProvider(mode);
    const result = await provider.syncAll({
      spreadsheetId,
      includeLeads,
      includeWebsites,
      includeMessages,
      includeCampaigns,
      mode,
    });

    return NextResponse.json({
      ok: result.success,
      ...result,
    });
  } catch (err) {
    console.error("[API] Sheets sync error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to sync with Google Sheets" },
      { status: 500 }
    );
  }
}
