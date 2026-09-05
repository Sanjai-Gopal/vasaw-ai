import { NextRequest, NextResponse } from "next/server";
import { runDeploymentAgent, validateDeploymentRequest } from "@/lib/agents/deployment";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateDeploymentRequest(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          agent: "deployment",
          mode: "mock",
          error: validation.errors.join("; "),
        },
        { status: 400 }
      );
    }

    const result = await runDeploymentAgent(validation.data);
    const statusCode = result.success ? 200 : 502;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error("[API] Deployment agent error:", error);
    return NextResponse.json(
      {
        success: false,
        agent: "deployment",
        mode: "mock",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
