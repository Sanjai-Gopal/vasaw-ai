import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, getAuthContext } from "@/lib/supabase/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createWebhookSecret, getOwnedAutomation, isWebhookWorkflow, normalizeWorkflowForStorage, readJsonBody, workflowFromRow } from "@/lib/automation/persistence";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  const json = (body: unknown, status = 200) => applyAuthCookies(NextResponse.json(body, { status }), auth.cookies);
  if (!auth.user) return json({ ok: false, error: "Sign in before saving a workflow." }, 401);

  try {
    const { id } = await params;
    const admin = getSupabaseAdmin();
    const existing = await getOwnedAutomation(admin, id, auth.user);
    if (!existing?.workflow_data) return json({ ok: false, error: "Workflow not found." }, 404);

    const bodyRecord = await readJsonBody(request);
    const workflow = normalizeWorkflowForStorage(bodyRecord.workflow ?? bodyRecord);
    const webhookRequired = isWebhookWorkflow(workflow);
    const update: Record<string, unknown> = {
      name: workflow.name.trim().slice(0, 120),
      description: workflow.description.slice(0, 2000),
      active: workflow.active,
      workflow_data: workflow,
      updated_at: new Date().toISOString(),
      version: Number(existing.version ?? 1) + 1,
    };
    let webhookSecret: string | undefined;
    if (webhookRequired && !existing.webhook_secret_hash) {
      const secret = createWebhookSecret();
      update.webhook_secret_hash = secret.hash;
      webhookSecret = secret.secret;
    }
    const { data: row, error } = await admin.from("automations").update(update).eq("id", id).select("*").single();
    if (error || !row) throw error ?? new Error("Workflow was not saved.");
    return json({
      ok: true,
      workflow: workflowFromRow(row as unknown as Record<string, unknown>),
      ...(webhookSecret ? { webhookSecret } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow could not be saved.";
    const status = /workflow|connection|node|credential|request body|duplicate/i.test(message) ? 400 : 503;
    return json({ ok: false, error: message }, status);
  }
}
