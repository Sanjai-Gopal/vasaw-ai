import { NextResponse } from "next/server";
import { getMessages } from "@/lib/data/messages";
import { getGoogleSheetsProvider } from "@/lib/integrations/google-sheets";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { spreadsheetId, mode = "mock" } = body;

    const messages = await getMessages();
    const provider = getGoogleSheetsProvider(mode);
    const result = await provider.exportMessages(messages, spreadsheetId);

    return NextResponse.json({
      ok: result.success,
      ...result,
    });
  } catch (err) {
    console.error("[API] Sheets export messages error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to export messages" },
      { status: 500 }
    );
  }
}
