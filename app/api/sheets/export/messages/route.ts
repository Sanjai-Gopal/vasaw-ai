import { NextResponse } from "next/server";
import { getMessages } from "@/lib/data/messages";
import { getGoogleSheetsProvider } from "@/lib/integrations/google-sheets";
import { generateMessagesCsv } from "@/lib/integrations/google-sheets/csv";

export const dynamic = "force-dynamic";

async function handleExportMessages(spreadsheetId?: string, mode: "mock" | "real" = "mock", format?: string) {
  const messages = await getMessages();
  const provider = getGoogleSheetsProvider(mode);
  const result = await provider.exportMessages(messages, spreadsheetId);

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: result.error || "Failed to export messages" },
      { status: 400 }
    );
  }

  if (format === "json") {
    return NextResponse.json({
      ok: true,
      ...result,
    });
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `vasaw-outreach-logs-${dateStr}.csv`;
  const csvContent = generateMessagesCsv(messages);

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Rows-Written": String(result.rowsWritten),
      "X-Sheet-Name": result.sheetName,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { spreadsheetId, mode = "mock", format } = body;
    return await handleExportMessages(spreadsheetId, mode, format);
  } catch (err) {
    console.error("[API] Sheets export messages error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to export messages" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spreadsheetId = searchParams.get("spreadsheetId") || undefined;
    const mode = (searchParams.get("mode") as "mock" | "real") || "mock";
    const format = searchParams.get("format") || undefined;
    return await handleExportMessages(spreadsheetId, mode, format);
  } catch (err) {
    console.error("[API] Sheets export messages GET error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to export messages" },
      { status: 500 }
    );
  }
}
