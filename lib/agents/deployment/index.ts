import {
  DeployRequest,
  DeploymentResult,
  DeploymentResponse,
  DeploymentProviderType,
} from "./types";
import { getDeploymentProvider } from "./providers/base";
import {
  getDeployment,
  getDeployments,
  saveDeployment,
  getWebsite,
  saveWebsite,
  updateLeadStatus,
  recordAgentRun,
} from "@/lib/agents/storage";

export * from "./types";
export * from "./validator";
export * from "./providers/base";
export * from "./providers/mock";
export * from "./providers/vercel";

export function validateDeploymentRequest(body: unknown): {
  valid: boolean;
  errors: string[];
  data?: DeployRequest;
} {
  const errors: string[] = [];

  if (!body || typeof body !== "object") {
    return { valid: false, errors: ["Request body must be a JSON object"] };
  }

  const req = body as Record<string, unknown>;

  const websiteId = typeof req.websiteId === "string" ? req.websiteId.trim() : undefined;
  const projectDir = typeof req.projectDir === "string" ? req.projectDir.trim() : undefined;
  const buildResult = req.buildResult && typeof req.buildResult === "object" ? req.buildResult : undefined;

  if (!websiteId && !buildResult && !projectDir) {
    errors.push("Request must include at least one of: websiteId, buildResult, or projectDir");
  }

  const mode: DeploymentProviderType = req.mode === "vercel" ? "vercel" : "mock";
  const environment = req.environment === "preview" ? "preview" : "production";
  const forceRedeploy = req.forceRedeploy === true;

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      websiteId,
      projectDir,
      buildResult: buildResult as DeployRequest["buildResult"],
      businessName: typeof req.businessName === "string" ? req.businessName : undefined,
      leadId: typeof req.leadId === "string" ? req.leadId : undefined,
      mode,
      forceRedeploy,
      environment,
    },
  };
}

export async function deployWebsite(input: string | DeployRequest): Promise<DeploymentResult> {
  const request: DeployRequest = typeof input === "string" ? { websiteId: input } : input;
  const startTime = Date.now();
  const mode = request.mode === "vercel" ? "vercel" : "mock";

  // 1. Idempotency check: if already deployed and !forceRedeploy, return existing deployment
  if (request.websiteId && !request.forceRedeploy) {
    try {
      const existingDeployments = await getDeployments({
        websiteId: request.websiteId,
        status: "deployed",
        limit: 1,
      });

      if (existingDeployments.length > 0 && existingDeployments[0].liveUrl) {
        const existing = existingDeployments[0];
        return {
          success: true,
          deploymentId: existing.id,
          websiteId: existing.websiteId,
          leadId: existing.leadId,
          businessName: existing.businessName,
          provider: existing.provider as DeploymentProviderType,
          status: "READY",
          url: existing.liveUrl,
          environment: existing.environment,
          createdAt: existing.createdAt,
          completedAt: existing.deployedAt || existing.createdAt,
          error: null,
          metadata: {
            idempotentReused: true,
          },
        };
      }
    } catch {
      // If storage lookup fails, continue with fresh deployment
    }
  }

  // 2. Fetch website record from storage if websiteId is given but projectDir/buildResult missing
  const projectDir = request.projectDir || request.buildResult?.artifact?.projectDir;
  let businessName = request.businessName || request.buildResult?.businessName;
  let leadId = request.leadId || request.buildResult?.leadId;

  if (request.websiteId && (!projectDir || !businessName)) {
    try {
      const website = await getWebsite(request.websiteId);
      if (website) {
        businessName = businessName || website.businessName;
        leadId = leadId || website.leadId;
      }
    } catch {
      // Continue with provided request info
    }
  }

  // 3. Delegate to selected provider
  const provider = getDeploymentProvider(mode);
  const deployResult = await provider.deploy({
    ...request,
    projectDir,
    businessName,
    leadId,
    mode,
  });

  const durationSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));

  // 4. Storage Integration: Persist deployment record and update website & lead statuses
  try {
    if (deployResult.success) {
      if (request.websiteId && leadId && businessName) {
        await saveDeployment({
          websiteId: request.websiteId,
          leadId,
          businessName,
          status: "deployed",
          provider: mode,
          environment: deployResult.environment,
          liveUrl: deployResult.url,
          durationSec,
          deployedAt: deployResult.completedAt,
        });

        // Update website in storage
        await saveWebsite({
          id: request.websiteId,
          leadId,
          businessName,
          category: request.buildResult?.template || "generic",
          location: "",
          template: request.buildResult?.template || "generic",
          status: "deployed",
          liveUrl: deployResult.url,
        });

        // Update lead status to website_deployed
        await updateLeadStatus({
          leadId,
          status: "website_deployed",
        });
      }

      await recordAgentRun({
        agentId: "deployment",
        status: "success",
        success: true,
        durationMs: Date.now() - startTime,
        metadata: {
          websiteId: request.websiteId,
          deploymentId: deployResult.deploymentId,
          mode,
          url: deployResult.url,
        },
      });
    } else {
      if (request.websiteId && leadId && businessName) {
        await saveDeployment({
          websiteId: request.websiteId,
          leadId,
          businessName,
          status: "failed",
          provider: mode,
          environment: deployResult.environment,
          durationSec,
        }).catch(() => {});

        await saveWebsite({
          id: request.websiteId,
          leadId,
          businessName,
          category: request.buildResult?.template || "generic",
          location: "",
          template: request.buildResult?.template || "generic",
          status: "failed",
        }).catch(() => {});
      }

      await recordAgentRun({
        agentId: "deployment",
        status: "failed",
        success: false,
        error: deployResult.error || "Deployment failed",
        durationMs: Date.now() - startTime,
        metadata: {
          websiteId: request.websiteId,
          mode,
        },
      });
    }
  } catch (err) {
    console.warn("[DeploymentAgent] Storage integration error:", err instanceof Error ? err.message : String(err));
  }

  return deployResult;
}

export async function runDeploymentAgent(input: string | DeployRequest): Promise<DeploymentResponse> {
  const result = await deployWebsite(input);
  return {
    success: result.success,
    agent: "deployment",
    mode: result.provider,
    result,
    error: result.error || undefined,
  };
}

export async function createDeploymentJob(websiteId: string): Promise<string> {
  const { createJob } = await import("@/lib/queue/job-queue");
  const job = await createJob("deploy_website", { metadata: { websiteId } });
  return job.id;
}

export async function getDeploymentStatus(deploymentId: string): Promise<{
  status: string;
  liveUrl?: string;
  error?: string;
}> {
  try {
    const deployment = await getDeployment(deploymentId);
    if (!deployment) {
      return { status: "not_found" };
    }
    return {
      status: deployment.status,
      liveUrl: deployment.liveUrl,
    };
  } catch {
    return { status: "not_found" };
  }
}
