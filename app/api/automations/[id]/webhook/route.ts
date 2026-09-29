import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { executePersistedRun } from "@/lib/automation/run-service";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isWebhookWorkflow, readJsonBody, verifyWebhookSecret } from "@/lib/automation/persistence";
import { WorkflowValidationError, parseWorkflowDefinition } from "@/lib/automation/runtime";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const secret = request.headers.get("x-automation-secret") ?? "";
    if (!secret) return NextResponse.json({ ok: false, error: "Missing webhook secret." }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: automation, error } = await admin.from("automations")
      .select("id, owner_user_id, organization_id, active, workflow_data, webhook_secret_hash")
      .eq("id", id).maybeSingle();
    if (error || !automation?.workflow_data || !automation.webhook_secret_hash || !automation.owner_user_id) {
      return NextResponse.json({ ok: false, error: "Webhook not found." }, { status: 404 });
    }
    if (!verifyWebhookSecret(secret, automation.webhook_secret_hash)) {
      return NextResponse.json({ ok: false, error: "Invalid webhook secret." }, { status: 401 });
    }
    if (!automation.active) return NextResponse.json({ ok: false, error: "This workflow is paused." }, { status: 409 });

    const workflow = parseWorkflowDefinition(automation.workflow_data);
    if (!isWebhookWorkflow(workflow)) {
      return NextResponse.json({ ok: false, error: "This workflow has no enabled webhook trigger." }, { status: 409 });
    }
    const input = await readJsonBody(request);
    const payloadEventId = typeof input.eventId === "string" ? input.eventId
      : typeof input.id === "string" ? input.id
      : "";
    const bodyHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const suppliedKey = request.headers.get("x-idempotency-key")?.trim();
    const idempotencyKey = (suppliedKey || payloadEventId || `${bodyHash}-${randomUUID()}`).slice(0, 128);
    if (suppliedKey || payloadEventId) {
      const { data: prior, error: lookupError } = await admin.from("automation_runs")
        .select("*").eq("automation_id", id).eq("idempotency_key", idempotencyKey).maybeSingle();
      if (lookupError) throw new Error("Could not check webhook idempotency.");
      if (prior) {
        const { data: steps } = await admin.from("automation_run_steps")
          .select("*").eq("run_id", prior.id).order("step_index", { ascending: true });
        return NextResponse.json({ ok: true, run: prior, steps: steps ?? [], reused: true });
      }
    }

    const result = await executePersistedRun({
      admin,
      user: {
        id: automation.owner_user_id,
        email: null,
        organizationId: automation.organization_id ?? undefined,
      },
      automation: { ...automation, id, workflow_data: workflow },
      input,
      triggerSource: "webhook",
      mode: "dry_run",
      idempotencyKey,
    });
    const { data: steps } = await admin.from("automation_run_steps")
      .select("*").eq("run_id", result.run.id).order("step_index", { ascending: true });
    return NextResponse.json({ ok: true, run: result.run, steps: steps ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook execution failed.";
    const runId = typeof error === "object" && error && "runId" in error ? String(error.runId) : undefined;
    const status = error instanceof WorkflowValidationError || /Request body/i.test(message)
      ? 400
      : runId ? 422 : 503;
    return NextResponse.json({ ok: false, error: message, ...(runId ? { runId } : {}) }, { status });
  }
}
