import { NextResponse } from "next/server";
import { getWebsites } from "@/lib/data/websites";
import { getGoogleSheetsProvider } from "@/lib/integrations/google-sheets";
import { generateWebsitesCsv } from "@/lib/integrations/google-sheets/csv";

export const dynamic = "force-dynamic";

async function handleExportWebsites(spreadsheetId?: string, mode: "mock" | "real" = "mock", format?: string) {
  const websites = await getWebsites();
  const provider = getGoogleSheetsProvider(mode);
  const result = await provider.exportWebsites(websites, spreadsheetId);

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: result.error || "Failed to export websites" },
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
  const filename = `vasaw-websites-${dateStr}.csv`;
  const csvContent = generateWebsitesCsv(websites);

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
    return await handleExportWebsites(spreadsheetId, mode, format);
  } catch (err) {
    console.error("[API] Sheets export websites error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to export websites" },
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
    return await handleExportWebsites(spreadsheetId, mode, format);
  } catch (err) {
    console.error("[API] Sheets export websites GET error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to export websites" },
      { status: 500 }
    );
  }
}
