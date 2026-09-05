import { NextResponse } from "next/server";
import { getWebsites } from "@/lib/data/websites";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const websites = await getWebsites();
    return NextResponse.json({ ok: true, websites });
  } catch (err) {
    console.error("[API] Websites error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}