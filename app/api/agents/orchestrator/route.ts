import { NextRequest, NextResponse } from "next/server";
import {
  executeWorkflow,
  resumeWorkflow,
  cancelWorkflow,
  getWorkflowStatus,
  OrchestratorApiRequest,
  OrchestratorApiResponse,
} from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";

/**
 * POST /api/agents/orchestrator
 * Unified API endpoint for starting, resuming, cancelling, and inspecting 6-agent workflows.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as OrchestratorApiRequest | null;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          agent: "orchestrator",
          action: "start",
          error: "Invalid JSON body",
        } satisfies OrchestratorApiResponse,
        { status: 400 }
      );
    }

    const action = body.action || "start";

    // 1. Status Check
    if (action === "status") {
      if (!body.workflowId) {
        return NextResponse.json(
          {
            success: false,
            agent: "orchestrator",
            action: "status",
            error: "Missing required 'workflowId' parameter",
          } satisfies OrchestratorApiResponse,
          { status: 400 }
        );
      }

      const status = getWorkflowStatus(body.workflowId);
      if (!status) {
        return NextResponse.json(
          {
            success: false,
            agent: "orchestrator",
            action: "status",
            workflowId: body.workflowId,
            error: `Workflow '${body.workflowId}' not found`,
          } satisfies OrchestratorApiResponse,
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        agent: "orchestrator",
        action: "status",
        workflowId: body.workflowId,
        status: status.status,
        result: status,
      } satisfies OrchestratorApiResponse);
    }

    // 2. Cancellation
    if (action === "cancel") {
      if (!body.workflowId) {
        return NextResponse.json(
          {
            success: false,
            agent: "orchestrator",
            action: "cancel",
            error: "Missing required 'workflowId' parameter",
          } satisfies OrchestratorApiResponse,
          { status: 400 }
        );
      }

      cancelWorkflow(body.workflowId);
      return NextResponse.json({
        success: true,
        agent: "orchestrator",
        action: "cancel",
        workflowId: body.workflowId,
        status: "CANCELLED",
      } satisfies OrchestratorApiResponse);
    }

    // 3. Resume
    if (action === "resume") {
      if (!body.workflowId) {
        return NextResponse.json(
          {
            success: false,
            agent: "orchestrator",
            action: "resume",
            error: "Missing required 'workflowId' parameter",
          } satisfies OrchestratorApiResponse,
          { status: 400 }
        );
      }

      const result = await resumeWorkflow(body.workflowId, body);
      return NextResponse.json({
        success: result.success,
        agent: "orchestrator",
        action: "resume",
        workflowId: result.workflowId,
        status: result.status,
        result,
      } satisfies OrchestratorApiResponse);
    }

    // 4. Start (Default)
    if (!body.campaignId) {
      return NextResponse.json(
        {
          success: false,
          agent: "orchestrator",
          action: "start",
          error: "Missing required 'campaignId'",
        } satisfies OrchestratorApiResponse,
        { status: 400 }
      );
    }

    if (!body.locations || !Array.isArray(body.locations) || body.locations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          agent: "orchestrator",
          action: "start",
          error: "Missing required 'locations' array",
        } satisfies OrchestratorApiResponse,
        { status: 400 }
      );
    }

    if (!body.categories || !Array.isArray(body.categories) || body.categories.length === 0) {
      return NextResponse.json(
        {
          success: false,
          agent: "orchestrator",
          action: "start",
          error: "Missing required 'categories' array",
        } satisfies OrchestratorApiResponse,
        { status: 400 }
      );
    }

    const result = await executeWorkflow({
      campaignId: body.campaignId,
      locations: body.locations,
      categories: body.categories,
      maxItems: body.maxItems,
      mode: body.mode,
      concurrency: body.concurrency,
      dryRun: body.dryRun,
      skipOutreach: body.skipOutreach,
      workflowId: body.workflowId,
    });

    return NextResponse.json({
      success: result.success,
      agent: "orchestrator",
      action: "start",
      workflowId: result.workflowId,
      status: result.status,
      result,
    } satisfies OrchestratorApiResponse);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        agent: "orchestrator",
        action: "start",
        error: err instanceof Error ? err.message : "Internal server error",
      } satisfies OrchestratorApiResponse,
      { status: 500 }
    );
  }
}
