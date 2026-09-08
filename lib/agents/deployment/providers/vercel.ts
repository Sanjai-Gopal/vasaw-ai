import { DeploymentProvider, DeployRequest, DeploymentResult } from "../types";
import { validateBuildResult, validateProjectDirectory, collectAndScanProjectFiles } from "../validator";
import { sanitizeDeployName } from "./base";

const VERCEL_API = "https://api.vercel.com";

export interface VercelConfig {
  token?: string;
  teamId?: string;
  projectId?: string;
  apiBaseUrl?: string;
  pollIntervalMs?: number;
  maxWaitMs?: number;
}

export interface VercelApiProject {
  id: string;
  name: string;
  framework?: string;
}

export interface VercelApiDeployment {
  id: string;
  url: string;
  readyState: "READY" | "BUILDING" | "ERROR" | "CANCELED" | "QUEUED" | "INITIALIZING";
  createdAt?: number;
}

export class VercelDeploymentProvider implements DeploymentProvider {
  readonly id = "vercel" as const;
  private config: VercelConfig;

  constructor(config?: VercelConfig) {
    this.config = {
      token: config?.token ?? process.env.VERCEL_TOKEN,
      teamId: config?.teamId ?? process.env.VERCEL_TEAM_ID,
      projectId: config?.projectId ?? process.env.VERCEL_PROJECT_ID,
      apiBaseUrl: config?.apiBaseUrl ?? VERCEL_API,
      pollIntervalMs: config?.pollIntervalMs ?? 2000,
      maxWaitMs: config?.maxWaitMs ?? 120000,
    };
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.config.token || "";
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  private sanitizeErrorMessage(message: string): string {
    let sanitized = message;
    if (this.config.token && this.config.token.length > 5) {
      sanitized = sanitized.replaceAll(this.config.token, "[REDACTED]");
    }
    return sanitized
      .replace(/(vcp_[a-zA-Z0-9_\-]+)/gi, "[REDACTED_VERCEL_TOKEN]")
      .replace(/(ghp_[a-zA-Z0-9_\-]+|github_pat_[a-zA-Z0-9_\-]+)/gi, "[REDACTED_GITHUB_TOKEN]")
      .replace(/(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+)/g, "[REDACTED_SUPABASE_KEY]")
      .replace(/(sk-[a-zA-Z0-9_\-]{20,})/gi, "[REDACTED_API_KEY]")
      .replace(/(Bearer\s+)[a-zA-Z0-9._\-]+/gi, "$1[REDACTED_TOKEN]");
  }

  async deploy(request: DeployRequest): Promise<DeploymentResult> {
    const createdAt = new Date().toISOString();
    const websiteId = request.websiteId || request.buildResult?.websiteId || "website";
    const leadId = request.leadId || request.buildResult?.leadId;
    const businessName = request.businessName || request.buildResult?.businessName || "Business";

    const deployName = sanitizeDeployName(businessName, websiteId);
    const initialDeploymentId = `vercel-dep-${deployName}-${Date.now().toString(36)}`;

    // 1. Check for token
    if (!this.config.token || this.config.token.trim() === "") {
      return {
        success: false,
        deploymentId: initialDeploymentId,
        websiteId,
        leadId,
        businessName,
        provider: "vercel",
        status: "FAILED",
        environment: request.environment || "production",
        createdAt,
        completedAt: new Date().toISOString(),
        error: "VERCEL_TOKEN not configured",
      };
    }

    // 2. Validate build result if provided
    if (request.buildResult) {
      const buildValidation = validateBuildResult(request.buildResult);
      if (!buildValidation.valid) {
        return {
          success: false,
          deploymentId: initialDeploymentId,
          websiteId,
          leadId,
          businessName,
          provider: "vercel",
          status: "FAILED",
          environment: request.environment || "production",
          createdAt,
          completedAt: new Date().toISOString(),
          error: buildValidation.errors.join("; "),
        };
      }
    }

    // 3. Resolve and validate project directory
    const projectDir = request.projectDir || request.buildResult?.artifact?.projectDir;
    if (!projectDir) {
      return {
        success: false,
        deploymentId: initialDeploymentId,
        websiteId,
        leadId,
        businessName,
        provider: "vercel",
        status: "FAILED",
        environment: request.environment || "production",
        createdAt,
        completedAt: new Date().toISOString(),
        error: "Missing project directory for deployment",
      };
    }

    const dirValidation = validateProjectDirectory(projectDir);
    if (!dirValidation.valid) {
      return {
        success: false,
        deploymentId: initialDeploymentId,
        websiteId,
        leadId,
        businessName,
        provider: "vercel",
        status: "FAILED",
        environment: request.environment || "production",
        createdAt,
        completedAt: new Date().toISOString(),
        error: dirValidation.errors.join("; "),
      };
    }

    // 4. Scan and collect files (checking for secret leakage)
    const scanResult = collectAndScanProjectFiles(projectDir);
    if (!scanResult.valid) {
      return {
        success: false,
        deploymentId: initialDeploymentId,
        websiteId,
        leadId,
        businessName,
        provider: "vercel",
        status: "FAILED",
        environment: request.environment || "production",
        createdAt,
        completedAt: new Date().toISOString(),
        error: scanResult.errors.join("; "),
      };
    }

    try {
      // 5. Create or retrieve Vercel Project
      const project = await this.ensureProject(deployName);

      // 6. Create deployment on Vercel
      const deployment = await this.createVercelDeployment(project.id, scanResult.files, request.environment);

      // 7. Poll until deployment is ready or failed
      const readyDeployment = await this.pollDeployment(deployment.id);

      if (readyDeployment.readyState === "READY") {
        const liveUrl = readyDeployment.url.startsWith("http")
          ? readyDeployment.url
          : `https://${readyDeployment.url}`;

        let verified = false;
        try {
          const verifyRes = await fetch(liveUrl, { method: "GET" });
          if (verifyRes.ok) {
            verified = true;
          }
        } catch {
          // Verification check is non-blocking for edge propagation
          verified = false;
        }

        return {
          success: true,
          deploymentId: readyDeployment.id,
          websiteId,
          leadId,
          businessName,
          provider: "vercel",
          status: "READY",
          url: liveUrl,
          environment: request.environment || "production",
          createdAt,
          completedAt: new Date().toISOString(),
          error: null,
          metadata: {
            vercelProjectId: project.id,
            vercelDeploymentId: readyDeployment.id,
            filesCount: scanResult.files.length,
            verified,
          },
        };
      }

      return {
        success: false,
        deploymentId: readyDeployment.id || initialDeploymentId,
        websiteId,
        leadId,
        businessName,
        provider: "vercel",
        status: "FAILED",
        environment: request.environment || "production",
        createdAt,
        completedAt: new Date().toISOString(),
        error: `Vercel deployment finished with status: ${readyDeployment.readyState}`,
      };
    } catch (err) {
      const rawError = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        deploymentId: initialDeploymentId,
        websiteId,
        leadId,
        businessName,
        provider: "vercel",
        status: "FAILED",
        environment: request.environment || "production",
        createdAt,
        completedAt: new Date().toISOString(),
        error: this.sanitizeErrorMessage(rawError),
      };
    }
  }

  private async ensureProject(projectName: string): Promise<VercelApiProject> {
    const teamParam = this.config.teamId ? `?teamId=${encodeURIComponent(this.config.teamId)}` : "";
    const baseUrl = this.config.apiBaseUrl || VERCEL_API;

    // Check if project already exists
    const checkRes = await fetch(`${baseUrl}/v9/projects/${encodeURIComponent(projectName)}${teamParam}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (checkRes.ok) {
      const existing = await checkRes.json() as VercelApiProject;
      return existing;
    }

    // Create project
    const createRes = await fetch(`${baseUrl}/v9/projects${teamParam}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        name: projectName,
        framework: "nextjs",
      }),
    });

    if (!createRes.ok) {
      const text = await createRes.text().catch(() => "");
      throw new Error(`Failed to create Vercel project (${createRes.status}): ${text}`);
    }

    return await createRes.json() as VercelApiProject;
  }

  private async createVercelDeployment(
    projectId: string,
    files: Array<{ path: string; content: string }>,
    target: "production" | "preview" = "production"
  ): Promise<VercelApiDeployment> {
    const teamParam = this.config.teamId ? `?teamId=${encodeURIComponent(this.config.teamId)}` : "";
    const baseUrl = this.config.apiBaseUrl || VERCEL_API;

    // Format files for Vercel deployment payload
    const formattedFiles = files.map((f) => ({
      file: f.path,
      data: f.content,
      encoding: "utf-8",
    }));

    const payload = {
      name: projectId,
      project: projectId,
      target,
      files: formattedFiles,
      projectSettings: {
        framework: "nextjs",
      },
    };

    const res = await fetch(`${baseUrl}/v13/deployments${teamParam}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Failed to create Vercel deployment (${res.status}): ${text}`);
    }

    return await res.json() as VercelApiDeployment;
  }

  private async pollDeployment(deploymentId: string): Promise<VercelApiDeployment> {
    const teamParam = this.config.teamId ? `?teamId=${encodeURIComponent(this.config.teamId)}` : "";
    const baseUrl = this.config.apiBaseUrl || VERCEL_API;
    const pollInterval = this.config.pollIntervalMs || 2000;
    const maxWait = this.config.maxWaitMs || 120000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const res = await fetch(`${baseUrl}/v13/deployments/${encodeURIComponent(deploymentId)}${teamParam}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to check Vercel deployment status (${res.status}): ${text}`);
      }

      const deployment = await res.json() as VercelApiDeployment;

      if (
        deployment.readyState === "READY" ||
        deployment.readyState === "ERROR" ||
        deployment.readyState === "CANCELED"
      ) {
        return deployment;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Vercel deployment timed out after ${maxWait}ms`);
  }

  async getStatus(deploymentId: string): Promise<DeploymentResult> {
    const teamParam = this.config.teamId ? `?teamId=${encodeURIComponent(this.config.teamId)}` : "";
    const baseUrl = this.config.apiBaseUrl || VERCEL_API;

    try {
      const res = await fetch(`${baseUrl}/v13/deployments/${encodeURIComponent(deploymentId)}${teamParam}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!res.ok) {
        return {
          success: false,
          deploymentId,
          websiteId: "unknown",
          provider: "vercel",
          status: "FAILED",
          environment: "production",
          createdAt: new Date().toISOString(),
          error: `Deployment not found (${res.status})`,
        };
      }

      const dep = await res.json() as VercelApiDeployment;
      const statusMap: Record<string, DeploymentResult["status"]> = {
        READY: "READY",
        BUILDING: "BUILDING",
        INITIALIZING: "BUILDING",
        QUEUED: "PENDING",
        ERROR: "FAILED",
        CANCELED: "CANCELED",
      };

      return {
        success: dep.readyState === "READY",
        deploymentId: dep.id,
        websiteId: "unknown",
        provider: "vercel",
        status: statusMap[dep.readyState] || "PENDING",
        url: dep.url ? `https://${dep.url}` : undefined,
        environment: "production",
        createdAt: new Date().toISOString(),
        completedAt: dep.readyState === "READY" ? new Date().toISOString() : undefined,
      };
    } catch (err) {
      return {
        success: false,
        deploymentId,
        websiteId: "unknown",
        provider: "vercel",
        status: "FAILED",
        environment: "production",
        createdAt: new Date().toISOString(),
        error: this.sanitizeErrorMessage(err instanceof Error ? err.message : String(err)),
      };
    }
  }

  async delete(deploymentId: string): Promise<boolean> {
    const teamParam = this.config.teamId ? `?teamId=${encodeURIComponent(this.config.teamId)}` : "";
    const baseUrl = this.config.apiBaseUrl || VERCEL_API;

    try {
      const res = await fetch(`${baseUrl}/v13/deployments/${encodeURIComponent(deploymentId)}${teamParam}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
