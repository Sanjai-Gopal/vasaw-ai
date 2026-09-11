import { NextRequest, NextResponse } from "next/server";
import { runWebsiteAgent, validateRequest } from "@/lib/agents/website";

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

    const result = await runWebsiteAgent(validation.request!);

    const statusCode = result.success ? 200 : 502;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error("[API] Website agent error:", error);
    return NextResponse.json(
      {
        success: false,
        agent: "website-building",
        mode: "mock",
        count: 0,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
