import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, getAuthContext } from "@/lib/supabase/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  createWebhookSecret,
  isWebhookWorkflow,
  normalizeWorkflowForStorage,
  readJsonBody,
  workflowFromRow,
} from "@/lib/automation/persistence";

export const dynamic = "force-dynamic";

function response(authCookies: Parameters<typeof applyAuthCookies>[1], body: unknown, status = 200) {
  return applyAuthCookies(NextResponse.json(body, { status }), authCookies);
}

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth.user) return response(auth.cookies, { ok: false, error: "Sign in to view saved workflows." }, 401);

  try {
    const admin = getSupabaseAdmin();
    let query = admin.from("automations").select("*").not("workflow_data", "is", null);
    query = auth.user.organizationId
      ? query.or(`owner_user_id.eq.${auth.user.id},organization_id.eq.${auth.user.organizationId}`)
      : query.eq("owner_user_id", auth.user.id);
    const { data: rows, error } = await query.order("updated_at", { ascending: false });
    if (error) throw error;

    const ids = (rows ?? []).map((row) => row.id);
    let runs: Array<Record<string, unknown>> = [];
    if (ids.length) {
      const { data, error: runsError } = await admin
        .from("automation_runs")
        .select("id, automation_id, status, trigger_source, execution_mode, started_at, completed_at, duration_ms, steps_count, success, error, created_at")
        .in("automation_id", ids)
        .order("created_at", { ascending: false })
        .limit(250);
      if (runsError) throw runsError;
      runs = (data ?? []) as Array<Record<string, unknown>>;
    }

    const runsByAutomation = new Map<string, Array<Record<string, unknown>>>();
    for (const run of runs) {
      const id = String(run.automation_id);
      runsByAutomation.set(id, [...(runsByAutomation.get(id) ?? []), run]);
    }
    const workflows = (rows ?? []).map((row) => ({
      ...workflowFromRow(row as unknown as Record<string, unknown>),
      recentRuns: runsByAutomation.get(row.id) ?? [],
    }));
    return response(auth.cookies, { ok: true, workflows });
  } catch (error) {
    console.error("[API] Saved workflows could not be loaded:", error instanceof Error ? error.message : "unknown error");
    return response(auth.cookies, { ok: false, error: "Saved workflows are unavailable. Apply the automation runtime migration and try again." }, 503);
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth.user) return response(auth.cookies, { ok: false, error: "Sign in before saving a workflow." }, 401);

  try {
    const body = await readJsonBody(request);
    if (body.action) {
      return response(auth.cookies, {
        ok: false,
        error: "The legacy all-agents pipeline trigger is not backed by an executable workflow. Save a workflow and run its dry run instead.",
      }, 409);
    }
    const workflow = normalizeWorkflowForStorage(body.workflow ?? body);
    const admin = getSupabaseAdmin();
    const insert: Record<string, unknown> = {
      owner_user_id: auth.user.id,
      organization_id: auth.user.organizationId ?? null,
      name: workflow.name.trim().slice(0, 120),
      description: workflow.description.slice(0, 2000),
      type: "workflow",
      active: workflow.active,
      workflow_data: workflow,
      execution_mode: "dry_run",
      updated_at: new Date().toISOString(),
    };
    let webhookSecret: string | undefined;
    if (isWebhookWorkflow(workflow)) {
      const secret = createWebhookSecret();
      insert.webhook_secret_hash = secret.hash;
      webhookSecret = secret.secret;
    }
    const { data: row, error } = await admin.from("automations").insert(insert).select("*").single();
    if (error || !row) throw error ?? new Error("Workflow was not saved.");
    return response(auth.cookies, {
      ok: true,
      workflow: workflowFromRow(row as unknown as Record<string, unknown>),
      ...(webhookSecret ? { webhookSecret } : {}),
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow could not be saved.";
    const status = /workflow|connection|node|credential|request body|duplicate/i.test(message) ? 400 : 503;
    return response(auth.cookies, { ok: false, error: message }, status);
  }
}
