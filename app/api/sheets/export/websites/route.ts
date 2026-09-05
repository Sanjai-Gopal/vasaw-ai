import { NextResponse } from "next/server";
import { getWebsites } from "@/lib/data/websites";
import { getGoogleSheetsProvider } from "@/lib/integrations/google-sheets";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { spreadsheetId, mode = "mock" } = body;

    const websites = await getWebsites();
    const provider = getGoogleSheetsProvider(mode);
    const result = await provider.exportWebsites(websites, spreadsheetId);

    return NextResponse.json({
      ok: result.success,
      ...result,
    });
  } catch (err) {
    console.error("[API] Sheets export websites error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to export websites" },
      { status: 500 }
    );
  }
}
