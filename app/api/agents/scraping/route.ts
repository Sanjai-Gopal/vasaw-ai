import { NextRequest, NextResponse } from "next/server";
import { runScrapingAgent, validateRequest } from "@/lib/agents/scraping/index";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const result = await runScrapingAgent(validation.request!);

    const statusCode = result.success ? 200 : 502;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error("[API] Scraping agent error:", error);
    return NextResponse.json(
      {
        success: false,
        agent: "scraping",
        mode: "mock",
        count: 0,
        leads: [],
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}