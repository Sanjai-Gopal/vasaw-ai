import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthenticatedUser } from "@/lib/supabase/auth";
import type { WorkflowRunMode } from "./runtime";
import { redactSensitiveData } from "./persistence";
import { executeWorkflow } from "./runtime";

export async function executePersistedRun(args: {
  admin: SupabaseClient;
  user: AuthenticatedUser;
  automation: Record<string, unknown>;
  input: Record<string, unknown>;
  triggerSource: "manual" | "webhook";
  mode: WorkflowRunMode;
  idempotencyKey: string;
}) {
  const { admin, user, automation, input, triggerSource, mode, idempotencyKey } = args;
  const startedAt = new Date().toISOString();
  const { data: started, error: insertError } = await admin.rpc("start_automation_run", {
    p_automation_id: automation.id,
    p_owner_user_id: user.id,
    p_organization_id: user.organizationId ?? null,
    p_trigger_source: triggerSource,
    p_execution_mode: mode,
    p_input_data: redactSensitiveData(input),
    p_idempotency_key: idempotencyKey,
  });
  if (insertError || !started || typeof started !== "object" || !("id" in started)) {
    if (insertError?.code === "55P03") throw new Error("This workflow already has a run in progress.");
    throw new Error("Could not create a workflow run. Apply the automation runtime migration and try again.");
  }
  const startInfo = started as { id: string; reused?: boolean };
  const { data: run, error: loadError } = await admin.from("automation_runs").select("*").eq("id", startInfo.id).single();
  if (loadError || !run) throw new Error("Could not load the workflow run record.");
  if (startInfo.reused) {
    const { data: existingSteps } = await admin.from("automation_run_steps").select("*")
      .eq("run_id", run.id).order("step_index", { ascending: true });
    return { run, steps: existingSteps ?? [], reused: true };
  }

  const stepRows = new Map<string, string>();
  try {
    const execution = await executeWorkflow(automation.workflow_data, {
      mode,
      input,
      isCancelled: async () => {
        const { data, error } = await admin.from("automation_runs")
          .select("cancel_requested_at").eq("id", run.id).maybeSingle();
        if (error) throw new Error("Could not check the run cancellation state.");
        return Boolean(data?.cancel_requested_at);
      },
      onStepStart: async (node, index, nodeInput, nodeStartedAt) => {
        const { data, error } = await admin.from("automation_run_steps").insert({
          run_id: run.id,
          automation_id: automation.id,
          owner_user_id: user.id,
          organization_id: user.organizationId ?? null,
          node_id: node.id,
          node_type: node.type,
          node_name: node.name,
          step_index: index,
          status: "running",
          started_at: nodeStartedAt,
          input_data: redactSensitiveData(nodeInput),
        }).select("id").single();
        if (error || !data) throw new Error("Could not write a workflow step log.");
        stepRows.set(node.id, data.id);
      },
      onStep: async (step) => {
        const stepId = stepRows.get(step.node.id);
        if (!stepId) throw new Error("Workflow step log was not initialized.");
        const { error } = await admin.from("automation_run_steps").update({
          status: step.status,
          completed_at: step.completedAt,
          duration_ms: step.durationMs,
          message: step.message,
          input_data: redactSensitiveData(step.input),
          output_data: redactSensitiveData(step.output),
          error: null,
        }).eq("id", stepId);
        if (error) throw new Error("Could not update a workflow step log.");
      },
      onStepError: async (node, _index, _nodeInput, _nodeStartedAt, nodeError) => {
        const stepId = stepRows.get(node.id);
        if (!stepId) return;
        await admin.from("automation_run_steps").update({
          status: "error",
          completed_at: new Date().toISOString(),
          message: nodeError.message.slice(0, 2000),
          error: nodeError.message.slice(0, 2000),
        }).eq("id", stepId);
      },
    });
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - Date.parse(startedAt);
    const { data: updated, error } = await admin.from("automation_runs").update({
      status: execution.status,
      completed_at: completedAt,
      duration_ms: durationMs,
      steps_count: execution.steps.length,
      success: true,
      output_data: redactSensitiveData(execution.output),
      detail: `${execution.steps.length} steps recorded in ${mode} mode.`,
    }).eq("id", run.id).select("*").single();
    if (error || !updated) throw new Error("Could not finalize the workflow run record.");
    const { error: automationError } = await admin.from("automations").update({
      last_run: completedAt,
      last_status: execution.status,
      updated_at: completedAt,
    }).eq("id", automation.id);
    if (automationError) console.warn("[Automation] Could not update workflow summary:", automationError.message);
    return { run: updated, steps: execution.steps };
  } catch (error) {
    const cancelled = error instanceof Error && error.name === "WorkflowCancelledError";
    const message = error instanceof Error ? error.message : "Workflow execution failed.";
    const { error: updateError } = await admin.from("automation_runs").update({
      status: cancelled ? "cancelled" : "failed",
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - Date.parse(startedAt),
      success: false,
      error: message.slice(0, 2000),
    }).eq("id", run.id);
    if (updateError) console.error("[Automation] Failed to finalize run status:", updateError.message);
    await admin.from("automations").update({
      last_run: new Date().toISOString(),
      last_status: cancelled ? "cancelled" : "failed",
      updated_at: new Date().toISOString(),
    }).eq("id", automation.id);
    throw Object.assign(new Error(message), { runId: run.id, cancelled });
  }
}
