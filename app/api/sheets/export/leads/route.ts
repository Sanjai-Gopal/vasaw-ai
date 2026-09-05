import { NextResponse } from "next/server";
import { getLeads } from "@/lib/data/leads";
import { getGoogleSheetsProvider } from "@/lib/integrations/google-sheets";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { spreadsheetId, mode = "mock" } = body;

    const leads = await getLeads();
    const provider = getGoogleSheetsProvider(mode);
    const result = await provider.exportLeads(leads, spreadsheetId);

    return NextResponse.json({
      ok: result.success,
      ...result,
    });
  } catch (err) {
    console.error("[API] Sheets export leads error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to export leads" },
      { status: 500 }
    );
  }
}
