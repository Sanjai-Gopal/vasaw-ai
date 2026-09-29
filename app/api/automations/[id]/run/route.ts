import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { executePersistedRun } from "@/lib/automation/run-service";
import { getOwnedAutomation, readJsonBody } from "@/lib/automation/persistence";
import { WorkflowValidationError, parseWorkflowDefinition } from "@/lib/automation/runtime";
import { applyAuthCookies, getAuthContext } from "@/lib/supabase/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  const json = (body: unknown, status = 200) => applyAuthCookies(NextResponse.json(body, { status }), auth.cookies);
  if (!auth.user) return json({ ok: false, error: "Sign in to view run details." }, 401);
  try {
    const { id } = await params;
    const admin = getSupabaseAdmin();
    const automation = await getOwnedAutomation(admin, id, auth.user);
    if (!automation) return json({ ok: false, error: "Workflow not found." }, 404);
    const runId = request.nextUrl.searchParams.get("runId");
    if (!runId) return json({ ok: false, error: "Provide a runId." }, 400);
    const { data: run, error } = await admin.from("automation_runs").select("*")
      .eq("automation_id", id).eq("id", runId).maybeSingle();
    if (error || !run) return json({ ok: false, error: "Run not found." }, 404);
    const { data: steps, error: stepsError } = await admin.from("automation_run_steps").select("*")
      .eq("run_id", runId).order("step_index", { ascending: true });
    if (stepsError) throw new Error("Could not load run step details.");
    return json({ ok: true, run, steps: steps ?? [] });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Run details unavailable." }, 503);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  const json = (body: unknown, status = 200) => applyAuthCookies(NextResponse.json(body, { status }), auth.cookies);
  if (!auth.user) return json({ ok: false, error: "Sign in before running a workflow." }, 401);

  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    if (body.mode !== undefined && body.mode !== "dry_run") {
      return json({ ok: false, error: "Only dry runs are enabled. Live provider execution is not configured." }, 409);
    }
    const input = body.input === undefined ? {} : body.input;
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return json({ ok: false, error: "Run input must be a JSON object." }, 400);
    }

    const admin = getSupabaseAdmin();
    const automation = await getOwnedAutomation(admin, id, auth.user);
    if (!automation?.workflow_data) return json({ ok: false, error: "Workflow not found." }, 404);
    parseWorkflowDefinition(automation.workflow_data);

    const suppliedKey = request.headers.get("idempotency-key")?.trim();
    const idempotencyKey = (suppliedKey || randomUUID()).slice(0, 128);
    if (suppliedKey) {
      const { data: prior, error } = await admin.from("automation_runs")
        .select("*").eq("automation_id", id).eq("idempotency_key", idempotencyKey).maybeSingle();
      if (error) throw new Error("Could not check the run idempotency key.");
      if (prior) {
        const { data: priorSteps } = await admin.from("automation_run_steps")
          .select("*").eq("run_id", prior.id).order("step_index", { ascending: true });
        return json({ ok: true, run: prior, steps: priorSteps ?? [], reused: true });
      }
    }

    const result = await executePersistedRun({
      admin,
      user: auth.user,
      automation,
      input: input as Record<string, unknown>,
      triggerSource: "manual",
      mode: "dry_run",
      idempotencyKey,
    });
    const { data: steps } = await admin.from("automation_run_steps")
      .select("*").eq("run_id", result.run.id).order("step_index", { ascending: true });
    return json({ ok: true, run: result.run, steps: steps ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow run failed.";
    const runId = typeof error === "object" && error && "runId" in error ? String(error.runId) : undefined;
    const status = error instanceof WorkflowValidationError || /Request body|Run input/i.test(message)
      ? 400
      : /already has a run in progress/i.test(message)
      ? 409
      : runId
      ? 422
      : 503;
    if (runId) {
      try {
        const { id } = await params;
        const admin = getSupabaseAdmin();
        const { data: run } = await admin.from("automation_runs").select("*")
          .eq("id", runId).eq("automation_id", id).maybeSingle();
        const { data: steps } = await admin.from("automation_run_steps").select("*")
          .eq("run_id", runId).order("step_index", { ascending: true });
        return json({ ok: false, error: message, run, steps: steps ?? [] }, status);
      } catch {
        // Preserve the original run error if diagnostics cannot be loaded.
      }
    }
    return json({ ok: false, error: message, ...(runId ? { runId } : {}) }, status);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  const json = (body: unknown, status = 200) => applyAuthCookies(NextResponse.json(body, { status }), auth.cookies);
  if (!auth.user) return json({ ok: false, error: "Sign in before cancelling a workflow run." }, 401);
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const runId = typeof body.runId === "string" ? body.runId : "";
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 128) : "";
    if (body.action !== "cancel" || (!runId && !idempotencyKey)) {
      return json({ ok: false, error: "Provide action=cancel and a run ID or idempotency key." }, 400);
    }
    const admin = getSupabaseAdmin();
    const automation = await getOwnedAutomation(admin, id, auth.user);
    if (!automation) return json({ ok: false, error: "Workflow not found." }, 404);
    let query = admin.from("automation_runs").update({ cancel_requested_at: new Date().toISOString() })
      .eq("automation_id", id).eq("status", "running");
    query = runId ? query.eq("id", runId) : query.eq("idempotency_key", idempotencyKey);
    const { data, error } = await query.select("id, status").maybeSingle();
    if (error) throw new Error("Could not request run cancellation.");
    if (!data) return json({ ok: false, error: "No running workflow run matched that ID." }, 404);
    return json({ ok: true, run: data, message: "Cancellation will take effect before the next step." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cancellation request failed.";
    return json({ ok: false, error: message }, 400);
  }
}
