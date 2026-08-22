import { NextResponse } from "next/server";
import { getConnections } from "@/lib/data/activities";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const connections = await getConnections();
    return NextResponse.json({ ok: true, connections });
  } catch (err) {
    console.error("[API] Connections error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}