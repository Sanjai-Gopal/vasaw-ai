import { NextResponse } from "next/server";
import { getLeads } from "@/lib/data/leads";
import { getGoogleSheetsProvider } from "@/lib/integrations/google-sheets";
import { generateLeadsCsv } from "@/lib/integrations/google-sheets/csv";

export const dynamic = "force-dynamic";

async function handleExportLeads(spreadsheetId?: string, mode: "mock" | "real" = "mock", format?: string) {
  const leads = await getLeads();
  const provider = getGoogleSheetsProvider(mode);
  const result = await provider.exportLeads(leads, spreadsheetId);

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: result.error || "Failed to export leads" },
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
  const filename = `vasaw-leads-${dateStr}.csv`;
  const csvContent = generateLeadsCsv(leads);

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
    return await handleExportLeads(spreadsheetId, mode, format);
  } catch (err) {
    console.error("[API] Sheets export leads error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to export leads" },
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
    return await handleExportLeads(spreadsheetId, mode, format);
  } catch (err) {
    console.error("[API] Sheets export leads GET error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to export leads" },
      { status: 500 }
    );
  }
}
