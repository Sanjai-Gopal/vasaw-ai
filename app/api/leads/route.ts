import { NextResponse } from "next/server";
import { getLeads } from "@/lib/data/leads";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = await getLeads();
    return NextResponse.json({ ok: true, leads });
  } catch (err) {
    console.error("[API] Leads error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}