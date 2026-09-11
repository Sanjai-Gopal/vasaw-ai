import { NextRequest, NextResponse } from "next/server";
import { runQualificationAgent, validateRequest } from "@/lib/agents/qualification";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const result = await runQualificationAgent(validation.request!);

    const statusCode = result.success ? 200 : 502;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error("[API] Qualification agent error:", error);
    return NextResponse.json(
      {
        success: false,
        agent: "qualification",
        mode: "mock",
        count: 0,
        results: [],
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}