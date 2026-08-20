import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await healthCheck();
    return NextResponse.json({ ok: true, providers: results });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
