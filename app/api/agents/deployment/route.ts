import { NextRequest, NextResponse } from "next/server";
import { runDeploymentAgent, validateDeploymentRequest } from "@/lib/agents/deployment";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

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
    const rawError = error instanceof Error ? error.message : "Internal server error";
    const sanitizedError = rawError
      .replace(/(vcp_[a-zA-Z0-9_\-]+)/gi, "[REDACTED_VERCEL_TOKEN]")
      .replace(/(ghp_[a-zA-Z0-9_\-]+|github_pat_[a-zA-Z0-9_\-]+)/gi, "[REDACTED_GITHUB_TOKEN]")
      .replace(/(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+)/g, "[REDACTED_SUPABASE_KEY]")
      .replace(/(sk-[a-zA-Z0-9_\-]{20,})/gi, "[REDACTED_API_KEY]")
      .replace(/(Bearer\s+)[a-zA-Z0-9._\-]+/gi, "$1[REDACTED_TOKEN]");

    return NextResponse.json(
      {
        success: false,
        agent: "deployment",
        mode: "mock",
        error: sanitizedError,
      },
      { status: 500 }
    );
  }
}
